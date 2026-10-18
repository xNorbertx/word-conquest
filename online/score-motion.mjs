import Engine from '../server/engine.mjs';

const pair=value=>Array.isArray(value)&&value.length===2&&value.every(Number.isSafeInteger);
const sum=sources=>sources.reduce((n,s)=>n+s.amount,0);
// This is a presentation plan for an authoritative receipt, never a scoring input.
export function scoreMotionPlan(game,move,config){
  const r=move?.recap;
  if(!r||move.revision!==game.revision||!(config.scoringMode==='defended-final'?['word','refresh','resign','accept_draw']:['word','refresh']).includes(r.action)||![1,2].includes(r.player)||
    !pair(r.totalsBefore)||!pair(r.totalsAfter)||!game.state?.tiles?.length)return null;
  if(!Engine.scores(game.state,config).every((n,i)=>n===r.totalsAfter[i]))return null;
  const changes=new Map((r.changed||[]).map(c=>[c.id,c]));
  const beforeTiles=game.state.tiles.map(t=>{const b={...t,...changes.get(t.id)?.before};return{...b,value:Engine.letterValue(b.letter,config)};});
  const before=new Map(beforeTiles.map(t=>[t.id,t])),after=game.state.tiles;
  const events=[],actor=r.player,enemy=3-actor;
  const value=t=>t.castle?(t.q===0&&t.r===0?config.centerCastlePoints??config.castlePoints:config.castlePoints):config.normalTerritoryPoints;
  const add=(kind,player,sources,expected)=>{
    if(!Number.isSafeInteger(expected)||sum(sources)!==expected)throw Error('Receipt does not reconcile');
    if(expected)events.push({kind,player,amount:expected,sources:sources.filter(s=>s.amount!==0)});
  };
  try{
    if(r.action==='word'){
      if(!r.score||!r.path?.length||r.path.some(id=>!before.has(id)))return null;
      const letters=r.path.map(id=>({id,amount:Engine.letterValue(before.get(id).letter,config)}));
      if(sum(letters)!==r.score.letters)return null;
      add('word',actor,[...letters,{bonus:true,amount:r.score.lengthBonus}],r.score.wordPoints);
    }
    if(config.scoringMode==='defended-final'){
      if(!pair(r.income)||r.income[actor-1]!==0)return null;
      const played=['word','refresh'].includes(r.action);
      add('castles',enemy,played?after.filter(t=>t.castle&&t.owner===enemy).map(t=>({id:t.id,amount:t.q===0&&t.r===0?config.castleIncome.center:config.castleIncome.side})):[],r.income[enemy-1]);
      if(r.finalTerritory!=null){
        if(!game.state.over||!pair(r.finalTerritory)||!r.finalTerritory.every((n,i)=>n===game.state.finalTerritory?.[i]))return null;
        for(const player of [actor,enemy])add('final-territory',player,after.filter(t=>t.owner===player).map(t=>({id:t.id,amount:config.finalTerritoryPoints})),r.finalTerritory[player-1]);
      }
    }else if(r.roundComplete&&config.castleIncome){
      if(!pair(r.income))return null;
      for(const player of [actor,enemy])add('castles',player,after.filter(t=>t.castle&&t.owner===player).map(t=>({id:t.id,amount:t.q===0&&t.r===0?config.castleIncome.center:config.castleIncome.side})),r.income[player-1]);
    }
    if(r.action==='word'&&config.scoringMode!=='defended-final'){
      const gained=r.path.map(id=>before.get(id)).filter(t=>t.owner!==actor);
      add('territory',actor,gained.map(t=>({id:t.id,amount:value(t)})),r.score.territoryGain);
      add('loss',enemy,gained.filter(t=>t.owner===enemy).map(t=>({id:t.id,amount:-value(t)})),-r.score.enemyLoss);
    }
    const totals=[...r.totalsBefore];for(const e of events)totals[e.player-1]+=e.amount;
    if(!totals.every((n,i)=>n===r.totalsAfter[i])||!events.length)return null;
    const castleCaptures=r.action==='word'?after.filter(t=>t.castle&&r.path.includes(t.id)&&t.owner===actor&&before.get(t.id).owner!==actor).map(t=>t.id):[];
    return {gameId:game.id,revision:game.revision,action:r.action,player:actor,word:r.word||'',path:r.path||[],round:r.round,castleCaptures,
      beforeTiles,afterTiles:after,totalsBefore:r.totalsBefore,totalsAfter:r.totalsAfter,events};
  }catch{return null;}
}

// Claim before playback: leaving, backgrounding, or a duplicate receipt never replays
// points automatically. A deliberate replay remains available from the last move.
export function createScoreLedger(storage){
  const memory=new Map();
  return {claim({userId,game,move,previousRevision=null}){
    if(!userId||!Number.isSafeInteger(game.revision))return false;
    const key=`wc-score-seen:${userId}:${game.id}`;
    let seen=memory.get(key)??null;
    try{const raw=storage.getItem(key),saved=raw===null?null:Number(raw);if(Number.isSafeInteger(saved))seen=Math.max(seen??-1,saved);}catch{}
    const observed=Math.max(seen??-1,previousRevision??-1),latest=Math.max(observed,game.revision);
    memory.set(key,latest);try{storage.setItem(key,String(latest));}catch{}
    if(game.revision<=observed||move?.revision!==game.revision)return false;
    // Do not surprise someone signing in on a new phone with their own old move.
    return observed>=0||game.players[move.recap?.player-1]!==userId;
  }};
}
