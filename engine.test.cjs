const assert = require('node:assert/strict');
const E = require('./engine.js'), C = {...require('./config.js'),endCondition:'turns'};
function seeded(seed) { return ()=>{ seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296; }; }
for(let n=0;n<100;n++) {
  const s=E.newGame(C,seeded(n));
  assert.equal(s.tiles.length,69);
  assert.equal(s.tiles.filter(t=>t.letter==='?').length,6);
  assert.equal(s.tiles.filter(t=>!t.owner && t.letter==='?').length,4);
  assert.equal(s.tiles.filter(t=>t.castle).length,5);
  assert.equal(s.tiles.filter(t=>t.castle && t.r<0).length,2);
  assert.equal(s.tiles.filter(t=>t.castle && t.r>0).length,2);
  assert.equal(s.tiles.filter(t=>t.castle && t.q===0 && t.r===0).length,1);
  assert.deepEqual(E.scores(s,C),[3,3]);
  for(const tile of s.tiles) {
    const mirror=s.tiles.find(t=>t.q===-tile.q && t.r===tile.r);
    assert.equal(tile.castle,mirror.castle);
    assert.equal(mirror.owner,tile.owner?3-tile.owner:0);
    assert.ok(s.tiles.filter(t=>E.adjacent(t,tile)).length>=4,'No tile has fewer than four neighbors');
  }
  const counts=batch=>Object.fromEntries(['vowels','flexible','ordinary','rare'].map(type=>[type,batch.filter(t=>E.letterType(t.letter,C)===type).length]));
  for(const band of ['base','near','outer']) {
    const left=s.tiles.filter(t=>t.q<0 && E.openingBand(t,s.tiles)===band);
    const right=s.tiles.filter(t=>t.q>0 && E.openingBand(t,s.tiles)===band);
    assert.deepEqual(counts(left),counts(right),'Both sides must have equal category budgets in each band');
    assert.equal(left.filter(t=>t.letter==='?').length,right.filter(t=>t.letter==='?').length);
    if(band!=='outer')assert.equal(counts(left).rare,0,'No awkward letters in the opening area');
    else assert.ok(counts(left).rare<=1);
  }
  assert.ok(s.tiles.filter(t=>t.q<0 && t.letter!=='?').some(t=>t.letter!==s.tiles.find(a=>a.q===-t.q && a.r===t.r).letter),'Letters must not form a mirrored puzzle');
  const jokerDistances=p=>s.tiles.filter(t=>t.letter==='?' && Math.sign(t.q)===(p===1?-1:1)).map(t=>Math.min(...s.tiles.filter(a=>a.owner===p).map(a=>E.distance(a,t)))).sort();
  assert.deepEqual(jokerDistances(1),jokerDistances(2),'Jokers should be equally reachable');
  for(const p of [1,2]) {
    assert.equal(s.tiles.filter(t=>t.owner===p && t.letter==='?').length,1);
    const owned=s.tiles.filter(t=>t.owner===p), seen=new Set([owned[0]]);
    for(let i=0;i<owned.length;i++) owned.forEach(t=>{if([...seen].some(a=>E.adjacent(a,t)))seen.add(t);});
    assert.equal(seen.size,3);
    assert.ok(owned.some(t=>'AEIOU'.includes(t.letter)));
    assert.ok(owned.some(t=>t.letter!=='?' && !'AEIOU'.includes(t.letter)));
  }
}
assert.equal(E.generateBoard({...C,cornerCut:0}).length,81);
assert.equal(E.generateBoard({...C,boardRadius:3}).length,37);
assert.equal(E.generateBoard({...C,jokerCount:0}).filter(t=>t.letter==='?').length,0);
const center={q:0,r:0};
for(const q of [-1,0,1]) for(const r of [-1,0,1]) assert.equal(E.adjacent(center,{q,r}),q!==0 || r!==0);
assert.equal(E.adjacent(center,{q:2,r:1}),false);
const tiles=[
  {id:'a',q:0,r:0,owner:1,letter:'C'},
  {id:'b',q:1,r:0,owner:0,letter:'A',castle:true},
  {id:'c',q:2,r:0,owner:2,letter:'T'},
  {id:'d',q:3,r:0,owner:2,letter:'S'},
];
const s={tiles,player:1,turns:[0,0],log:[],over:false};
assert.match(E.validatePath(s,['b','c','d'],C),/Start/);
assert.match(E.validatePath(s,['a','c','b'],C),/adjacent/);
assert.match(E.validatePath(s,['a','b','a'],C),/once/);
assert.match(E.validatePath(s,['a','b'],C),/at least/);
assert.equal(E.validatePath(s,['a','b','c','d'],C),null);
assert.match(E.validatePath(s,['a','b','c','d'],{...C,maxEnemyTilesPerWord:1}),/enemy/);
const battle={...s,tiles:[0,1,2,3,4].map(q=>({id:String(q),q,r:0,owner:q?2:1,letter:'ABCDE'[q],castle:q===2}))};
const assault=E.submit(battle,['0','1','2','3'],C);
assert.equal(assault.state.log[0].enemy,3);
assert.equal(assault.state.log[0].castles,1);
assert.deepEqual(E.scores(assault.state,C),[14,1]);
assert.match(E.submit(battle,['0','1','2','3','4'],C).error,/enemy/);
assert.match(E.validatePath(s,['a','b','c'],{...C,dictionaryEnabled:true}),/unavailable/);
assert.match(E.validatePath(s,['a','b','c'],{...C,dictionaryEnabled:true},true,new Set(['dog'])),/not in/);
assert.equal(E.validatePath(s,['a','b','c'],{...C,dictionaryEnabled:true},true,new Set(['cat'])),null);
const result=E.submit(s,['a','b','c'],C);
assert.deepEqual(result.captured,['b','c']);
assert.deepEqual(E.scores(result.state,C),[9,1]);
assert.equal(result.state.player,2);
assert.deepEqual(result.state.turns,[1,0]);
assert.equal(s.tiles[1].owner,0);
assert.equal(s.tiles.map(t=>t.letter).join(''),'CATS','Submission must not mutate old letters');
assert.equal(result.state.log[0].word,'CAT','Log records the submitted word, not refreshed letters');
for(const id of ['a','b','c'])assert.notEqual(result.state.tiles.find(t=>t.id===id).letter,s.tiles.find(t=>t.id===id).letter);
assert.equal(result.state.tiles[3].letter,'S','Unused letters stay put');
assert.equal(E.submit(s,['a','b','c'],{...C,refreshUsedLetters:false}).state.tiles[1].letter,'A');
const invalid=E.submit(s,['a','b'],C,null,{},()=>{throw new Error('Invalid moves must not draw letters');});
assert.ok(invalid.error);
const jokerState={...s,tiles:tiles.map(t=>t.id==='b'?{...t,letter:'?'}:t)};
for(const choice of ['', 'AB', '1', 'a']) assert.match(E.submit(jokerState,['a','b','c'],C,null,{b:choice}).error,/joker/);
const jokerResult=E.submit(jokerState,['a','b','c'],{...C,dictionaryEnabled:true},new Set(['cat']),{b:'A'});
assert.equal(jokerResult.state.log[0].word,'CAT');
assert.equal(jokerResult.state.tiles[1].letter,'?');
assert.deepEqual(E.scores(jokerResult.state,C),[8,1]);
assert.match(E.submit(jokerState,['a','b','c'],{...C,dictionaryEnabled:true},new Set(['cat']),{b:'O'}).error,/dictionary/);
assert.equal(E.submit(jokerState,['a','b','c'],C,null,{b:'O'}).state.log[0].word,'COT');
const twoJokers={...jokerState,tiles:jokerState.tiles.map(t=>t.id==='a'?{...t,letter:'?'}:t)};
assert.equal(E.submit(twoJokers,['a','b','c'],C,null,{a:'H',b:'I'}).state.log[0].word,'HIT');
assert.match(E.submit(twoJokers,['a','b','c'],C,null,{a:'H'}).error,/joker/);
const diagonal={...s,tiles:tiles.map((t,i)=>({...t,q:i,r:i}))};
assert.equal(E.submit(diagonal,['a','b','c'],C).state.log[0].word,'CAT');
const last={...s,player:2,turns:[12,11]};
const end=E.submit(last,['c','b','a'],C).state;
assert.equal(end.over,true);
assert.deepEqual(end.turns,[12,12]);
assert.match(E.submit(end,['c','b','a'],C).error,/ended/);
const refreshState=E.newGame(C,seeded(42)), before=JSON.stringify(refreshState);
const refreshed=E.refreshTurn(refreshState,C,seeded(43));
assert.equal(JSON.stringify(refreshState),before);
assert.deepEqual(E.scores(refreshed.state,C),[3,3]);
assert.equal(refreshed.state.player,2);
assert.deepEqual(refreshed.state.turns,[1,0]);
assert.equal(refreshed.state.log[0].type,'refresh');
assert.equal(refreshed.refreshed.length,2);
for(const tile of refreshState.tiles) {
  const after=refreshed.state.tiles.find(t=>t.id===tile.id);
  assert.equal(after.owner,tile.owner);
  assert.equal(after.castle,tile.castle);
  if(tile.owner===1 && tile.letter!=='?')assert.notEqual(after.letter,tile.letter);
  else assert.equal(after.letter,tile.letter);
}
assert.ok(E.refreshTurn(refreshState,{...C,allowRefreshTurn:false}).error);
assert.ok(E.refreshTurn(end,C).error);
const lastRefresh=E.refreshTurn({...refreshState,player:2,turns:[12,11]},C);
assert.equal(lastRefresh.state.over,true);
assert.deepEqual(lastRefresh.state.turns,[12,12]);
const wiped={...s,tiles:s.tiles.map(t=>({...t,owner:2}))};
assert.equal(E.canReenter(wiped,C),true);
assert.equal(E.submit(wiped,['a','b','c'],C).state.tiles.filter(t=>t.owner===1).length,3);
assert.match(E.submit(wiped,['a','b','c','d'],C).error,/enemy/);
assert.match(E.submit(wiped,['a','b','c'],{...C,allowReentry:false}).error,/Start/);
assert.ok(E.refreshTurn(wiped,C).error);
for(let n=0;n<100;n++) {
  const batch=E.refreshLetters(s.tiles,['a','b','c'],C,seeded(n)).tiles.slice(0,3);
  assert.ok(batch.some(t=>'AEIOU'.includes(t.letter)));
  assert.ok(batch.some(t=>!'AEIOU'.includes(t.letter)));
  assert.ok(batch.some(t=>C.letterBalance.flexible.includes(t.letter)));
  assert.ok(batch.every(t=>!C.letterBalance.rare.includes(t.letter)));
}
for(const size of [0,1,2,5,9,10,20,40]) {
  const source=Array.from({length:size},(_,i)=>({id:String(i),q:i%8,r:Math.floor(i/8),letter:'A',owner:1}));
  const first=JSON.stringify(source);
  const batch=E.refreshLetters(source,source.map(t=>t.id),C,seeded(size)).tiles;
  assert.equal(JSON.stringify(source),first);
  assert.ok(batch.every(t=>t.letter!=='A'));
  const rare=batch.filter(t=>C.letterBalance.rare.includes(t.letter)).length;
  assert.ok(rare<=(size<C.letterBalance.rareMinBatch?0:Math.min(1,Math.floor(size*C.letterBalance.rareMaxShare))));
}
let game=E.newGame(C,seeded(9));
function findPath(game,path=[]) {
  if(path.length===3)return path;
  for(const tile of game.tiles) {
    const next=[...path,tile.id];
    if(!E.validatePath(game,next,C,false)){const found=findPath(game,next);if(found)return found;}
  }
}
for(let turn=0;turn<24;turn++) {
  const path=findPath(game); assert.ok(path,'A legal move exists');
  const jokerLetters=Object.fromEntries(path.map(id=>[id,'A']));
  game=E.submit(game,path,C,null,jokerLetters).state;
  assert.equal(game.over,turn===23);
}
assert.deepEqual(game.turns,[12,12]);
console.log('Passed: 100 independently lettered boards with matching regional category budgets and joker reach, constrained refreshes, capture/scoring, dictionary validation, and a complete 24-turn game.');
