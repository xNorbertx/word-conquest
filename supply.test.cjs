const assert=require('node:assert/strict');
const E=require('./engine.js'), C={...require('./config.js'),refreshUsedLetters:false};
const initial=()=>({tiles:[...'CAT?DOG'].map((letter,q)=>({id:String(q),q,r:0,letter,owner:q<3?1:2})),player:1,turns:[0,0],wordPoints:[0,0],lettersUsed:0,log:[],over:false});
assert.equal(C.endCondition,'letters');
assert.equal(E.lettersRemaining(E.newGame(C),C),120);
let state=initial();
const before=JSON.stringify(state);
assert.ok(E.submit(state,['0','1'],C).error);
assert.equal(JSON.stringify(state),before);
state=E.submit(state,['0','1','2'],{...C,letterBudget:3}).state;
assert.equal(state.over,false,'Player 2 receives the final reply');
assert.equal(state.player,2);
assert.equal(state.lettersUsed,3);
assert.equal(E.lettersRemaining(state,{...C,letterBudget:3}),0);
const end=E.submit(state,['3','4','5','6'],{...C,letterBudget:3},null,{'3':'A'}).state;
assert.equal(end.over,true);
assert.equal(end.lettersUsed,7,'Jokers and the whole final word count');
assert.deepEqual(end.turns,[1,1]);
assert.ok(end.wordPoints[1]>0,'Final reply still earns full points');
assert.ok(E.submit(end,['0','1','2'],C).error);
assert.ok(E.refreshTurn(end,C).error);
state=E.submit(initial(),['0','1','2'],{...C,letterBudget:5}).state;
state=E.submit(state,['4','5','6'],{...C,letterBudget:5}).state;
assert.equal(state.over,true,'Player 2 exhaustion ends immediately after equal turns');
assert.equal(state.lettersUsed,6,'Threshold crossing does not truncate words');
const finalRefresh=E.refreshTurn({...initial(),player:2,turns:[1,0],lettersUsed:120},C).state;
assert.equal(finalRefresh.over,true);
assert.equal(finalRefresh.lettersUsed,123);
assert.deepEqual(finalRefresh.wordPoints,[0,0]);
const small=initial();small.tiles[1].letter='?';small.tiles[2].letter='?';
const refresh=E.refreshTurn(small,C);
assert.equal(refresh.refreshed.length,1);
assert.equal(refresh.state.lettersUsed,3,'Refresh minimum cost prevents stalling');
assert.equal(small.lettersUsed,0,'Refresh is immutable');
const originalScores=E.scores(small,C);
assert.deepEqual(E.scores(refresh.state,C),originalScores);
let long=initial();
for(let i=0;i<40;i++) {
  long=E.submit(long,long.player===1?['0','1','2']:['4','5','6'],C).state;
  assert.equal(long.over,i===39);
}
assert.deepEqual(long.turns,[20,20],'Letter mode can exceed the old 12-turn limit');
assert.equal(long.lettersUsed,120);
assert.equal(E.newGame(C).lettersUsed,0);
// The reduced target must actually alter the common four/six-letter replacement batches.
for(const size of [4,6]) {
  const tiles=Array.from({length:size},(_,q)=>({id:String(q),q,r:0,letter:'B',owner:1}));
  const next=E.refreshLetters(tiles,tiles.map(t=>t.id),C,()=>0.25).tiles;
  assert.equal(next.filter(t=>'AEIOU'.includes(t.letter)).length,size===4?1:2);
}
console.log('Passed: letter supply, equal-turn final reply, overshoot, jokers, refresh cost, invalid/end moves, 20-round game, reset and reduced vowel quotas.');
