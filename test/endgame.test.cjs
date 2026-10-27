const {test,before}=require('node:test'),assert=require('node:assert/strict');
let summary,storeFor,domain;
before(async()=>{({endgameSummary:summary,createEndgameStore:storeFor}=await import('../online/endgame.mjs'));domain=await import('../server/domain.mjs');});
const move=(revision,player,word,letters,bonus)=>({revision,recap:{action:'word',player,word,score:{letters,lengthBonus:bonus,wordPoints:letters+bonus}}});
function fixture(version='autumn-v5'){
 const config=domain.configFor(version),state=domain.Engine.newGame(config,()=>.4);
 state.over=true;state.wordPoints=[32,12];if(config.castleIncome)state.castleIncome=[23,17];if(config.scoringMode==='defended-final')state.finalTerritory=[29,23];
 const game={id:'g',players:['a','b'],names:['A','B'],revision:5,status:'completed',result:'1',rules_version:version,state};
 return {config,game,moves:[move(5,1,'CONQUEST',14,5),move(4,2,'GARDENS',9,3),move(3,1,'JOKERS',12,1)]};
}
test('result splits words and length, uses saved castle/final totals and the correct player',()=>{
 const {game,config,moves}=fixture();assert.deepEqual(summary(game,'a',config,moves),{words:26,bonus:6,castles:23,territory:29,total:84,best:{word:'CONQUEST',letters:14,bonus:5,points:19},legacy:false});
 const b=summary(game,'b',config,moves);assert.equal(b.words,9);assert.equal(b.bonus,3);assert.equal(b.castles,17);assert.equal(b.territory,23);assert.equal(b.total,52);assert.equal(b.best.word,'GARDENS');
});
test('saved joker scores and language spelling are not re-scored using letter faces',()=>{
 for(const version of ['autumn-v5','autumn-sv-v4','autumn-nl-v1']){const {game,config}=fixture(version);game.state.wordPoints=[0,0];const s=summary(game,'a',config,[move(1,1,'ÅÄÖ',0,0)]);assert.equal(s.words,0);assert.equal(s.best.word,'ÅÄÖ');assert.equal(s.best.points,0);}
});
test('incomplete/inconsistent receipts are rejected rather than showing partial totals as complete',()=>{
 const {game,config,moves}=fixture();assert.equal(summary(game,'a',config,moves.slice(0,2)),null);moves[0].recap.score.wordPoints=900;assert.equal(summary(game,'a',config,moves),null);
});
test('duplicate receipts and another revision do not inflate scores or best word',()=>{
 const {game,config,moves}=fixture();const s=summary(game,'a',config,[...moves,moves[0],move(6,1,'FAKE',900,0)]);assert.equal(s.total,84);assert.equal(s.words,26);
});
test('legacy categories reconcile using their original castle and land values',()=>{
 for(const version of ['autumn-v1','autumn-v3','autumn-v4','autumn-sv-v3']){const {game,config,moves}=fixture(version);for(const t of game.state.tiles)if(t.castle)t.owner=1;const s=summary(game,'a',config,moves);assert(s.legacy);assert.equal(s.words+s.bonus+s.castles+s.territory,domain.Engine.scores(game.state,config)[0]);assert(s.castles>=(game.state.castleIncome?.[0]||0));}
});
test('resignation/draw result follows saved outcome, zero-word games have no invented best word',()=>{
 const {game,config}=fixture();game.state.wordPoints=[0,0];for(const result of ['1','2','draw']){game.result=result;const s=summary(game,'a',config,[{revision:5,recap:{action:'resign',player:2}}]);assert.equal(s.best,null);assert.equal(s.words,0);assert.equal(s.territory,29);}
});
test('nonparticipants and unfinished/closed/cancelled games do not become wins',()=>{
 const {game,config,moves}=fixture();assert.equal(summary(game,'c',config,moves),null);for(const status of ['active','abandoned','cancelled','declined','invited'])assert.equal(summary({...game,status},'a',config,moves),null);
});
test('result summary reconciles real completed games for both seats and all current languages',()=>{
 for(const version of ['autumn-v5','autumn-sv-v4','autumn-nl-v1']){
  const config={...domain.configFor(version),minimumWordLength:1,dictionaryEnabled:false,letterBudget:4};let state=domain.Engine.newGame(config,()=>.4),moves=[],rev=0;
  while(!state.over){const seat=state.player,tile=state.tiles.find(t=>t.owner===seat&&t.letter!=='?'),turn=domain.Engine.submit(state,[tile.id],config,null,{},()=>.4);assert(!turn.error);state=turn.state;const log=state.log[0];moves.unshift({revision:++rev,recap:{action:'word',player:seat,word:log.word,score:log.scoring,income:log.income}});}
  const game={id:'g',players:['a','b'],revision:rev,status:'completed',result:'1',state,rules_version:version};
  for(const actor of game.players){const s=summary(game,actor,config,moves);assert(s);assert.equal(s.total,domain.Engine.scores(state,config)[game.players.indexOf(actor)]);}
 }
});
const memoryStorage=()=>{const data=new Map();return{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
test('celebration survives re-entry, a new controller and account switching',()=>{
 const storage=memoryStorage(),a=storeFor(storage),{game}=fixture();assert.equal(a.claim('a',game),true);assert.equal(a.claim('a',game),false);assert.equal(storeFor(storage).claim('a',game),false);assert.equal(a.claim('b',game),true);assert.equal(a.claim('a',{...game,id:'other'}),true);assert.equal(a.claim('c',game),false);assert.equal(a.claim('a',{...game,status:'abandoned'}),false);
});
test('storage failure keeps once-only motion in memory; summary cache isolates game revisions and accounts',()=>{
 const store=storeFor({getItem(){throw Error('private');},setItem(){throw Error('full');}}),{game,config,moves}=fixture();assert(store.claim('a',game));assert(!store.claim('a',game));const s=summary(game,'a',config,moves);store.save('a',game,s);assert.equal(store.get('a',game),s);assert.equal(store.get('b',game),null);assert.equal(store.get('a',{...game,revision:6}),null);store.clear();assert.equal(store.get('a',game),null);assert(!store.claim('a',game));
});
