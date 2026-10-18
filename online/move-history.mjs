const amount=n=>Number.isSafeInteger(n)?n:0;
const actions={refresh:'Letters refreshed',resign:'Resigned',offer_draw:'Draw offered',accept_draw:'Draw accepted',abandon:'Game closed'};

// Each row belongs to its recipient. Defended castles are earned by the OTHER
// player, so never add them to the word author's total.
export function moveHistoryRows(move){
  const r=move.recap||{},player=r.player,rows=[];
  if(![1,2].includes(player))return rows;
  const income=p=>amount(r.income?.[p-1]);
  const base={revision:move.revision,at:r.at,player,word:amount(r.score?.letters),bonus:amount(r.score?.lengthBonus),castles:income(player)};
  rows.push({...base,label:r.word||actions[r.action]||'Game update',total:base.word+base.bonus+base.castles,kind:'move'});
  const other=3-player;
  if(income(other))rows.push({revision:move.revision,at:r.at,player:other,label:r.incomeTiming==='defended'?'Castle defence':'Castle income',word:0,bonus:0,castles:income(other),total:income(other),kind:'income'});
  for(const p of [player,other]){
    const land=amount(r.finalTerritory?.[p-1]);
    if(land)rows.push({revision:move.revision,at:r.at,player:p,label:'Final territory',word:0,bonus:0,castles:0,total:land,kind:'territory'});
    // Historical rules scored land immediately (including losses). Keep those
    // old receipts truthful without bringing their tile-change recap back.
    const legacy=p===player?amount(r.score?.territoryGain):-amount(r.score?.enemyLoss);
    if(legacy)rows.push({revision:move.revision,at:r.at,player:p,label:'Territory',word:0,bonus:0,castles:0,total:legacy,kind:'territory'});
  }
  return rows;
}

// Session memory only, scoped to both account and game. One in-flight fetch per
// game, immutable revision deduplication, bounded games, and no background retry loop.
export function createMoveHistoryCache(fetchPage,{maxGames=6}={}){
  const entries=new Map();let epoch=0;
  const key=(actor,id)=>actor+'/'+id;
  const sorted=e=>[...e.moves.values()].sort((a,b)=>b.revision-a.revision);
  const snapshot=e=>({moves:sorted(e),needsTop:e.topRevision<e.revision,hasMore:e.hasMore,loading:!!e.pending,attempted:e.attemptedRevision>=e.revision});
  function entry(actor,id){const k=key(actor,id),e=entries.get(k);if(e){entries.delete(k);entries.set(k,e);}return e;}
  function merge(e,moves){for(const m of moves||[])if(Number.isSafeInteger(m.revision)&&m.revision<=e.revision&&m.recap)e.moves.set(m.revision,m);}
  function seed(actor,game,moves=[]){
    if(!actor||!game?.id)return;
    const k=key(actor,game.id);let e=entry(actor,game.id);
    if(!e){e={actor,id:game.id,revision:game.revision,topRevision:-1,attemptedRevision:-1,moves:new Map(),cursor:null,hasMore:true,pending:null};entries.set(k,e);}
    e.revision=Math.max(e.revision,game.revision);merge(e,moves);
    while(entries.size>maxGames)entries.delete(entries.keys().next().value);
    return snapshot(e);
  }
  async function load(actor,id,{older=false}={}){
    const e=entry(actor,id);if(!e)return null;
    if(e.pending){const waitingForTop=e.pendingTop;await e.pending;if(entries.get(key(actor,id))!==e)return null;return e.topRevision<e.revision||older&&waitingForTop?load(actor,id,{older}):snapshot(e);}
    const top=e.topRevision<e.revision;if(!top&&(!older||!e.hasMore))return snapshot(e);
    const revision=e.revision,before=top?revision+1:e.cursor,started=epoch;
    if(top)e.attemptedRevision=revision;
    const request=(async()=>{
      const page=await fetchPage({action:'game_history',gameId:id,beforeRevision:before,supportsCompactHistory:true});
      if(started!==epoch||entries.get(key(actor,id))!==e)return;
      merge(e,page.history);
      const overlaps=top&&e.topRevision>=0&&page.nextBefore<=e.topRevision;
      if(!overlaps||!page.hasMore){e.cursor=page.nextBefore;e.hasMore=page.hasMore;}
      if(top)e.topRevision=revision;
    })();
    e.pending=request;e.pendingTop=top;
    try{await request;}finally{if(e.pending===request)e.pending=null;}
    if(started!==epoch||entries.get(key(actor,id))!==e)return null;
    // A new live receipt arriving during a fetch remains visible. Bring the
    // coverage forward once, without duplicating any request or row.
    if(e.topRevision<e.revision)return load(actor,id);
    return snapshot(e);
  }
  return{seed,load,read:(actor,id)=>{const e=entry(actor,id);return e?snapshot(e):null;},reset(){epoch++;entries.clear();}};
}
