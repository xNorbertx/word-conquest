const assert = require('node:assert/strict');
const E = require('./engine.js'), C = require('./config.js');
for(let n=0;n<100;n++) {
  const s=E.newGame(C);
  assert.equal(s.tiles.length,49);
  assert.equal(s.tiles.filter(t=>t.letter==='?').length,5);
  assert.equal(s.tiles.filter(t=>!t.owner && t.letter==='?').length,3);
  assert.equal(s.tiles.filter(t=>t.castle).length,3);
  assert.deepEqual(E.scores(s,C),[3,3]);
  for(const p of [1,2]) {
    assert.equal(s.tiles.filter(t=>t.owner===p && t.letter==='?').length,1);
    const owned=s.tiles.filter(t=>t.owner===p), seen=new Set([owned[0]]);
    for(let i=0;i<owned.length;i++) owned.forEach(t=>{if([...seen].some(a=>E.adjacent(a,t)))seen.add(t);});
    assert.equal(seen.size,3);
  }
}
assert.equal(E.generateBoard({...C,boardRadius:4}).length,81);
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
assert.match(E.validatePath(s,['a','b','c','d'],C),/enemy/);
assert.match(E.validatePath(s,['a','b','c'],{...C,dictionaryEnabled:true}),/unavailable/);
assert.match(E.validatePath(s,['a','b','c'],{...C,dictionaryEnabled:true},true,new Set(['dog'])),/not in/);
assert.equal(E.validatePath(s,['a','b','c'],{...C,dictionaryEnabled:true},true,new Set(['cat'])),null);
const result=E.submit(s,['a','b','c'],C);
assert.deepEqual(result.captured,['b','c']);
assert.deepEqual(E.scores(result.state,C),[5,1]);
assert.equal(result.state.player,2);
assert.deepEqual(result.state.turns,[1,0]);
assert.equal(s.tiles[1].owner,0);
const jokerState={...s,tiles:tiles.map(t=>t.id==='b'?{...t,letter:'?'}:t)};
for(const choice of ['', 'AB', '1', 'a']) assert.match(E.submit(jokerState,['a','b','c'],C,null,{b:choice}).error,/joker/);
const jokerResult=E.submit(jokerState,['a','b','c'],{...C,dictionaryEnabled:true},new Set(['cat']),{b:'A'});
assert.equal(jokerResult.state.log[0].word,'CAT');
assert.equal(jokerResult.state.tiles[1].letter,'?');
assert.deepEqual(E.scores(jokerResult.state,C),[5,1]);
assert.match(E.submit(jokerState,['a','b','c'],{...C,dictionaryEnabled:true},new Set(['cat']),{b:'O'}).error,/dictionary/);
assert.equal(E.submit(jokerState,['a','b','c'],C,null,{b:'O'}).state.log[0].word,'COT');
const twoJokers={...jokerState,tiles:jokerState.tiles.map(t=>t.id==='a'?{...t,letter:'?'}:t)};
assert.equal(E.submit(twoJokers,['a','b','c'],C,null,{a:'H',b:'I'}).state.log[0].word,'HIT');
assert.match(E.submit(twoJokers,['a','b','c'],C,null,{a:'H'}).error,/joker/);
const diagonal={...s,tiles:tiles.map((t,i)=>({...t,q:i,r:i}))};
assert.equal(E.submit(diagonal,['a','b','c'],C).state.log[0].word,'CAT');
const last={...s,player:2,turns:[15,14]};
const end=E.submit(last,['c','b','a'],C).state;
assert.equal(end.over,true);
assert.deepEqual(end.turns,[15,15]);
assert.match(E.submit(end,['c','b','a'],C).error,/ended/);
let game=E.newGame(C);
function findPath(game,path=[]) {
  if(path.length===3)return path;
  for(const tile of game.tiles) {
    const next=[...path,tile.id];
    if(!E.validatePath(game,next,C,false)){const found=findPath(game,next);if(found)return found;}
  }
}
for(let turn=0;turn<30;turn++) {
  const path=findPath(game); assert.ok(path,'A legal move exists');
  const jokerLetters=Object.fromEntries(path.map(id=>[id,'A']));
  game=E.submit(game,path,C,null,jokerLetters).state;
  assert.equal(game.over,turn===29);
}
console.log('Passed: 100 49-tile boards, joker distribution and assignments, 8-way adjacency, capture/scoring, dictionary adapter, and a complete 30-turn game.');
