const {test,before}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const words=new Set(require('../server/versions/dictionary-v1.json')),meta=require('../server/versions/dictionary-v1.meta.json');
let d,m;before(async()=>{d=await import('../server/domain.mjs');m=await import('../online/score-motion.mjs');});
const A=crypto.randomUUID(),B=crypto.randomUUID();
function fixture({actor=1,version='autumn-v3',round=true,final=false,joker=false,castleOwners={},pathIds}={}){
  const config=d.configFor(version),state=d.Engine.newGame(config,()=>.3);
  state.player=actor;state.startingPlayer=3-actor;state.turns=actor===1?[5,round?6:5]:[round?6:5,5];
  state.wordPoints=[35,30];if(config.castleIncome)state.castleIncome=[8,12];
  state.tiles.forEach(t=>{if(t.castle)t.owner=0;});state.tiles.find(t=>t.castle&&t.q<0).owner=3-actor;
  const path=[...'GARDENS'].map((letter,i)=>{const id=pathIds?.[i]??`${i-3},0`;Object.assign(state.tiles.find(t=>t.id===id),{letter: joker&&i===1?'?':letter,owner:i===0?actor:i<3?3-actor:0});return id;});
  for(const [id,owner]of Object.entries(castleOwners))state.tiles.find(t=>t.id===id).owner=owner;
  if(final)state.lettersUsed=119;
  const game={id:crypto.randomUUID(),players:[A,B],names:['Norbert','Mara'],revision:12,status:'active',rules_version:version,dictionary_version:meta.version,state};
  const command={action:'word',revision:12,operationId:crypto.randomUUID(),path,jokers:joker?{'-2,0':'A'}:{}};
  const result=d.applyCommand(game,game.players[actor-1],command,words,meta.version,()=>.4);
  return {before:game,game:result.next,move:{revision:13,recap:result.recap},config};
}
test('board plan reconciles word, both castle owners, territory and loss for either acting seat',()=>{
  for(const actor of [1,2]){const f=fixture({actor}),plan=m.scoreMotionPlan(f.game,f.move,f.config);
    assert.ok(plan);assert.deepEqual(plan.events.map(e=>e.kind),['word','castles','castles','territory','loss']);
    assert.deepEqual(plan.events.map(e=>e.player),[actor,actor,3-actor,actor,3-actor]);
    assert.equal(plan.events[0].amount,19);assert.equal(plan.events[1].amount,4);assert.equal(plan.events[2].amount,2);
    const totals=[...plan.totalsBefore];for(const e of plan.events){assert.equal(e.sources.reduce((s,x)=>s+x.amount,0),e.amount);totals[e.player-1]+=e.amount;}
    assert.deepEqual(totals,plan.totalsAfter);assert.deepEqual(plan.totalsAfter,d.Engine.scores(f.game.state,f.config));
    assert.equal(plan.beforeTiles.find(t=>t.id==='0,0').letter,'D');assert.notEqual(f.game.state.tiles.find(t=>t.id==='0,0').letter,'D');
  }
});
test('incomplete rounds omit income; legacy games keep their original territory values',()=>{
  for(const opts of [{round:false},{version:'autumn-v1'}]){const f=fixture(opts),plan=m.scoreMotionPlan(f.game,f.move,f.config);assert.ok(plan);assert.ok(!plan.events.some(e=>e.kind==='castles'));}
});
test('joker contributes no letter point and long-word bonus is a separate source',()=>{
  const f=fixture({joker:true}),plan=m.scoreMotionPlan(f.game,f.move,f.config),word=plan.events[0];
  assert.equal(word.amount,18);assert.equal(word.sources.find(s=>s.bonus).amount,10);assert.equal(word.sources.find(s=>s.id==='-2,0').amount,0);assert.deepEqual(word.sources.filter(s=>s.id).map(s=>s.id),plan.path);
  assert.equal(plan.beforeTiles.find(t=>t.id==='-2,0').value,0);
});
test('final reply animates the final earned income and exact finished totals',()=>{
  const f=fixture({final:true});assert.equal(f.game.status,'completed');const p=m.scoreMotionPlan(f.game,f.move,f.config);assert.ok(p.events.some(e=>e.kind==='castles'));assert.deepEqual(p.totalsAfter,f.move.recap.totalsAfter);
});
test('refresh can pay both castle owners without inventing a word or territory',()=>{
  const f=fixture();const before=f.before;before.state.tiles.find(t=>t.id==='0,0').owner=1;
  const {next,recap}=d.applyCommand(before,A,{action:'refresh',revision:12,operationId:crypto.randomUUID()},words,meta.version,()=>.5);
  const p=m.scoreMotionPlan(next,{revision:13,recap},f.config);assert.ok(p);assert.deepEqual(p.events.map(e=>e.kind),['castles','castles']);assert.equal(p.word,'');assert.deepEqual(p.castleCaptures,[]);
});
test('castle animation identifies neutral captures and steals, never already-owned castles',()=>{
  for(const version of ['autumn-v1','autumn-v2','autumn-v3'])for(const actor of [1,2])for(const owner of [0,1,2]){
    const f=fixture({actor,version,round:false,castleOwners:{'0,0':owner}}),plan=m.scoreMotionPlan(f.game,f.move,f.config);
    assert.ok(plan);assert.deepEqual(plan.castleCaptures,owner===actor?[]:['0,0']);
    assert.deepEqual(plan.totalsAfter,d.Engine.scores(f.game.state,f.config));
  }
});
test('one accepted word can animate a side and centre capture together, including the final reply',()=>{
  for(const actor of [1,2]){
    const f=fixture({actor,final:true,pathIds:['-3,-3','-2,-3','-1,-2','0,-1','0,0','1,0','2,0'],castleOwners:{'-2,-3':3-actor,'0,0':0}});
    const plan=m.scoreMotionPlan(f.game,f.move,f.config);assert.ok(plan);
    assert.deepEqual(plan.castleCaptures,['-2,-3','0,0']);assert.equal(f.game.status,'completed');
    assert.equal(plan.castleCaptures.includes('2,-3'),false);
  }
});
test('stale, missing, non-scoring, or inconsistent receipts skip presentation instead of inventing totals',()=>{
  const f=fixture();assert.equal(m.scoreMotionPlan(f.game,{...f.move,revision:12},f.config),null);
  for(const change of [{totalsAfter:[999,999]},{totalsBefore:[999,999]},{score:{...f.move.recap.score,wordPoints:999}},{income:[999,0]},{action:'resign'},{path:['missing']}]){
    assert.equal(m.scoreMotionPlan(f.game,{...f.move,recap:{...f.move.recap,...change}},f.config),null);
  }
  assert.equal(m.scoreMotionPlan(f.game,null,f.config),null);
});
const storage=()=>{const s=new Map();return{getItem:k=>s.get(k)??null,setItem:(k,v)=>s.set(k,v)};};
test('ledger claims own accepted moves once across duplicates, reloads and interruption',()=>{
  const f=fixture(),s=storage(),args={userId:A,game:f.game,move:f.move,previousRevision:12};
  assert.equal(m.createScoreLedger(s).claim(args),true);
  assert.equal(m.createScoreLedger(s).claim(args),false);
  assert.equal(m.createScoreLedger(s).claim({...args,previousRevision:null}),false);
});
test('unseen opponent moves animate on returning; fresh-device old own moves do not',()=>{
  const f=fixture(),s=storage();assert.equal(m.createScoreLedger(s).claim({userId:B,game:f.game,move:f.move}),true);
  assert.equal(m.createScoreLedger(s).claim({userId:A,game:f.game,move:f.move}),false);
  // Another player's observation must not suppress this player's new move.
  const fresh=storage();m.createScoreLedger(fresh).claim({userId:B,game:f.game,move:f.move});
  assert.equal(m.createScoreLedger(fresh).claim({userId:A,game:f.game,move:f.move,previousRevision:12}),true);
});
test('ledger skips old revisions and falls back to memory if local storage is unavailable',()=>{
  const f=fixture(),s={getItem(){throw Error('Unavailable');},setItem(){throw Error('Unavailable');}},ledger=m.createScoreLedger(s);
  assert.equal(ledger.claim({userId:B,game:f.game,move:f.move}),true);assert.equal(ledger.claim({userId:B,game:f.game,move:f.move}),false);
  assert.equal(ledger.claim({userId:B,game:{...f.game,revision:12},move:{...f.move,revision:12}}),false);
});

test('an all-joker zero-point word still gets an ordered capture presentation',()=>{
 const config=d.configFor('autumn-v5'),state=d.Engine.newGame(config,()=>.2);state.player=1;state.tiles.forEach(t=>{if(t.castle)t.owner=0;});
 const path=['-1,1','0,1','1,1'];path.forEach((id,i)=>Object.assign(state.tiles.find(t=>t.id===id),{letter:'?',owner:i===0?1:0}));
 const game={id:crypto.randomUUID(),players:[A,B],revision:2,status:'active',rules_version:'autumn-v5',dictionary_version:meta.version,state};
 const result=d.applyCommand(game,A,{action:'word',path,jokers:Object.fromEntries(path.map((id,i)=>[id,'CAT'[i]])),revision:2,operationId:crypto.randomUUID()},words,meta.version,()=>.3);
 const plan=m.scoreMotionPlan(result.next,{revision:3,recap:result.recap},config);assert.ok(plan);assert.equal(plan.events[0].amount,0);assert.deepEqual(plan.events[0].sources.map(s=>s.id),path);assert.deepEqual(plan.totalsAfter,plan.totalsBefore);
});
