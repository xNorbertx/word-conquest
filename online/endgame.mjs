import Engine from '../server/engine.mjs';

// Presentation only: reconcile the full saved receipts against the saved state.
// Never re-score a spelling (jokers and versioned letter values are in receipts).
export function endgameSummary(game,actor,config,moves){
  const seat=game?.players?.indexOf(actor)+1;
  if(!seat||game.status!=='completed'||!['1','2','draw'].includes(game.result))return null;
  const score=Engine.scoreBreakdown(game.state,config)[seat-1];
  let words=0,bonus=0,best=null;
  const unique=new Map();
  for(const move of moves||[])if(Number.isSafeInteger(move.revision)&&move.revision<=game.revision)unique.set(move.revision,move);
  for(const {recap:r} of [...unique.values()].sort((a,b)=>b.revision-a.revision)){
    if(r?.player!==seat||r.action!=='word')continue;
    const s=r.score;
    if(!s||![s.letters,s.lengthBonus,s.wordPoints].every(n=>Number.isSafeInteger(n)&&n>=0)||s.letters+s.lengthBonus!==s.wordPoints||typeof r.word!=='string'||!r.word.length)return null;
    words+=s.letters;bonus+=s.lengthBonus;
    if(!best||s.wordPoints>best.points)best={word:r.word,letters:s.letters,bonus:s.lengthBonus,points:s.wordPoints};
  }
  if(words+bonus!==score.words)return null;
  const legacy=config.scoringMode!=='defended-final';
  // Legacy land totals already include held castles. Separate those values,
  // preserving the original rules instead of inventing a modern final bonus.
  const heldCastles=legacy?game.state.tiles.filter(t=>t.owner===seat&&t.castle).reduce((n,t)=>n+(t.q===0&&t.r===0?config.centerCastlePoints??config.castlePoints:config.castlePoints),0):0;
  const castles=(score.income||0)+heldCastles,territory=score.territory-heldCastles;
  if(words+bonus+castles+territory!==score.total)return null;
  return {words,bonus,castles,territory,total:score.total,best,legacy};
}

// Once per account/game on this installation. Storage is optional; memory still
// prevents duplicates if storage is unavailable. No names/emails are persisted.
export function createEndgameStore(storage,{namespace='',limit=300}={}){
  const key='wc-result-seen:v1:'+namespace,memory=new Map(),summaries=new Map();
  function read(){try{const raw=storage?.getItem(key);if(raw?.length<100000){const data=JSON.parse(raw);for(const [k,v] of Object.entries(data||{}))if(Number.isSafeInteger(v)&&v>=0)memory.set(k,Math.max(memory.get(k)??-1,v));}}catch{}}
  const id=(actor,game)=>actor+'/'+game.id;
  const stamp=game=>game.rules_version+'/'+game.revision;
  return {
    claim(actor,game){
      if(!actor||game?.status!=='completed'||!game.players?.includes(actor)||!Number.isSafeInteger(game.revision))return false;
      read();const k=id(actor,game),seen=memory.get(k)??-1;
      memory.delete(k);memory.set(k,Math.max(seen,game.revision));
      while(memory.size>limit)memory.delete(memory.keys().next().value);
      try{storage?.setItem(key,JSON.stringify(Object.fromEntries(memory)));}catch{}
      return game.revision>seen;
    },
    get(actor,game){const value=summaries.get(id(actor,game));return value?.stamp===stamp(game)?value.summary:null;},
    save(actor,game,summary){const k=id(actor,game);summaries.delete(k);summaries.set(k,{stamp:stamp(game),summary});while(summaries.size>12)summaries.delete(summaries.keys().next().value);},
    clear(){summaries.clear();}
  };
}
