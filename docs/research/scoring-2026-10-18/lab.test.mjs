import test from 'node:test';import assert from 'node:assert/strict';
import * as L from './lab.mjs';
const v=id=>L.variants.find(v=>v.id===id),dict=new Set(['cat','cats','at']);
function fixture(id='proposal',player=1){
 const s=L.newState(v(id),17);s.player=player;s.startingPlayer=1;
 s.tiles=s.tiles.map(t=>({...t,owner:0}));s.tiles.find(t=>t.id==='-1,0').owner=player;
 for(const [i,id]of ['-1,0','0,0','1,0'].entries())s.tiles.find(t=>t.id===id).letter='CAT'[i];
 s.book=s.book.map(b=>({...b,ordinary:0}));s.claims=s.tiles.map(t=>t.owner?1<<(t.owner-1):0);return s;
}
function move(s,v,ids=['-1,0','0,0','1,0'],word='cat'){const path=ids.map(id=>s.tiles.findIndex(t=>t.id===id));return{path,word,wordPoints:L.Engine.scoreMove(s,ids,L.config(v)).wordPoints};}
test('five letter tiers cover the alphabet once; delayed bonus and zero-point jokers',()=>{
 assert.equal([...L.letterGroups.map(g=>g.letters).join('')].sort().join(''),'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
 const c=L.config(v('proposal'));assert.deepEqual([3,4,5,6,7,8,9,10,11,12].map(n=>L.Engine.lengthBonus(n,c)),[0,0,0,1,3,5,7,9,11,13]);assert.equal(L.Engine.letterValue('?',c),0);
});
test('every variant starts on the identical live board, paired starter changes only',()=>{
 const a=L.newState(v('current'),42);for(const variant of L.variants){assert.deepEqual(L.newState(variant,42).tiles,a.tiles);const b=L.newState(variant,42,true);assert.deepEqual(b.tiles,a.tiles);assert.equal(b.player,3-a.player);}
});
test('newly captured castle does not pay; surviving opponent castle does',()=>{
 const variant=v('proposal'),s=fixture(),side=s.tiles.find(t=>t.castle&&!L.centre(t));side.owner=2;
 const n=L.apply(s,move(s,variant),variant,L.rng(5),dict);
 assert.equal(n.book[0].centreIncome,0);assert.equal(n.book[1].sideIncome,2);assert.equal(n.book[0].ordinary,1);assert.equal(L.breakdown(n,variant)[0].castleValue,0);
});
test('defended centre pays owner after opponent word or refresh',()=>{
 const variant=v('proposal'),s=fixture('proposal',2);s.tiles.find(t=>t.id==='0,0').owner=1;
 const n=L.apply(s,null,variant,L.rng(5),dict);assert.equal(n.book[0].centreIncome,4);assert.equal(n.book[1].centreIncome,0);
});
test('captured opponent castle denies payment without subtracting earned income',()=>{
 const variant=v('proposal'),s=fixture();s.tiles.find(t=>t.id==='0,0').owner=2;s.book[1].centreIncome=12;
 const n=L.apply(s,move(s,variant),variant,L.rng(5),dict);assert.equal(n.book[1].centreIncome,12);assert.equal(n.book[0].centreIncome,0);
});
test('ordinary recapture pays every time only in proposal, never in first-claim or castles-only',()=>{
 for(const id of ['proposal','first_claim','castles_only']){const variant=v(id),s=fixture(id),i=s.tiles.findIndex(t=>t.id==='1,0');s.tiles[i].owner=2;s.claims[i]=3;
 const n=L.apply(s,move(s,variant),variant,L.rng(5),dict);assert.equal(n.book[0].ordinary,id==='proposal'?1:0);assert.equal(n.book[0].recapturePoints,id==='proposal'?1:0);}
});
test('current baseline pays both at round boundary and retains exact production totals',()=>{
 const variant=v('current'),s=fixture('current',2);s.turns=[1,0];s.tiles.find(t=>t.castle&&!L.centre(t)).owner=1;
 const n=L.apply(s,move(s,variant),variant,L.rng(5),dict);assert.equal(n.book[0].sideIncome,2);assert.equal(n.book[1].centreIncome,4);assert.deepEqual(L.totals(n,variant),L.Engine.scores(n,L.config(variant)));
});
test('final move pays only surviving opponent castles; no extra end value',()=>{
 const variant=v('proposal'),s=fixture('proposal',2);s.turns=[12,11];s.lettersUsed=120;s.tiles.find(t=>t.castle&&!L.centre(t)).owner=1;
 const n=L.apply(s,move(s,variant),variant,L.rng(5),dict);assert.equal(n.over,true);assert.equal(n.book[0].sideIncome,2);assert.equal(n.book[1].centreIncome,0);assert.equal(L.breakdown(n,variant)[1].castleValue,0);
});
test('proposal never deducts ordinary points from previous owner',()=>{
 const variant=v('proposal'),s=fixture(),i=s.tiles.findIndex(t=>t.id==='1,0');s.tiles[i].owner=2;s.book[1].ordinary=10;
 const n=L.apply(s,move(s,variant),variant,L.rng(5),dict);assert.equal(n.book[1].ordinary,10);assert.equal(n.book[0].ordinary,1);
});
test('repeat application from same state and RNG is deterministic and non-mutating',()=>{
 const variant=v('proposal'),s=fixture(),saved=structuredClone(s),m=move(s,variant);
 assert.deepEqual(L.apply(s,m,variant,L.rng(90),dict),L.apply(s,m,variant,L.rng(90),dict));assert.deepEqual(s,saved);
});
