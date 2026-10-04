import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as lab from './lab.mjs';import * as old from '../balance/lab.mjs';import {play} from './run.mjs';
const dict=new Set(JSON.parse(fs.readFileSync('server/versions/dictionary-v1.json'))),v=lab.variants.find(v=>v.id==='example');
function board(variant=v){const s=lab.newState(variant,7);s.tiles.forEach(t=>{t.castle=false;t.owner=0;});Object.assign(s.tiles.find(t=>t.id==='0,0'),{castle:true,owner:1});Object.assign(s.tiles.find(t=>t.id==='-2,0'),{castle:true,owner:2});s.roundOwners=s.tiles.map(t=>t.owner);return s;}
test('side and center recurring income pays once after both turns, including the final round',()=>{
 let s=board();s.lettersUsed=114;s=lab.apply(s,null,v,lab.rng(1),dict);assert.deepEqual(s.income,[0,0]);s=lab.apply(s,null,v,lab.rng(2),dict);assert.equal(s.over,true);assert.deepEqual(s.income,[2,1]);assert.deepEqual(lab.totals(s,v),[7,4]);assert.deepEqual(lab.breakdown(s,v).map(c=>c.ordinary),[0,0]);
});
test('unowned castles never pay; ordinary territory does not receive income',()=>{
 let s=lab.newState(v,8);for(let i=0;i<4;i++)s=lab.apply(s,null,v,lab.rng(i),dict);assert.deepEqual(s.income,[0,0]);assert.deepEqual(lab.totals(s,v),[3,3]);
});
test('new boundary capture pays immediately; full-held variant waits one complete round',()=>{
 for(const timing of ['boundary','held']){const x={...v,timing};let s=board(x);s.tiles.forEach(t=>{t.castle=false;t.owner=0;});
 const path=[...'CAT'].map((letter,i)=>{const idx=s.tiles.findIndex(t=>t.id===`${i-1},0`);Object.assign(s.tiles[idx],{letter,owner:i===0?1:0,castle:i===1});return idx;});Object.assign(s.tiles.find(t=>t.id==='4,0'),{owner:2,letter:'R'});s.roundOwners=s.tiles.map(t=>t.owner);
 s=lab.apply(s,{path,word:'cat'},x,lab.rng(1),dict);s=lab.apply(s,null,x,lab.rng(2),dict);assert.deepEqual(s.income,timing==='boundary'?[2,0]:[0,0]);
 s=lab.apply(s,null,x,lab.rng(3),dict);s=lab.apply(s,null,x,lab.rng(4),dict);assert.deepEqual(s.income,timing==='boundary'?[4,0]:[2,0]);
 }
});
test('stealing a castle preserves banked income and moves final ownership points',()=>{
 let s=board();s=lab.apply(s,null,v,lab.rng(1),dict);s=lab.apply(s,null,v,lab.rng(2),dict);s.player=2;
 const path=[...'CAT'].map((letter,i)=>{const idx=s.tiles.findIndex(t=>t.id===`${i-1},0`);Object.assign(s.tiles[idx],{letter,owner:i===0?2:i===1?1:0});return idx;});
 const n=lab.apply(s,{path,word:'cat'},v,lab.rng(3),dict);assert.deepEqual(n.centerIncome,[2,2]);assert.deepEqual(lab.breakdown(n,v).map(c=>c.centerEnd),[0,5]);assert.deepEqual(s.centerIncome,[2,0]);
});
test('current variant preserves production engine totals and exact board outcomes',()=>{
 const current=lab.variants[0],s=lab.newState(current,9),trie=lab.makeTrie(JSON.parse(fs.readFileSync('work/balance/frequency.json')));
 const m=lab.choose(s,lab.enumerate(s,current,trie,{}).moves,current,'balanced'),n=lab.apply(s,m,current,lab.rng(22),dict);
 const expected=old.apply(s,m,{},lab.rng(22),dict);assert.deepEqual(n.tiles,expected.tiles);assert.deepEqual(lab.totals(n,current),lab.Engine.scores(expected,lab.config(current)));
});
test('all score components sum, final values are not added again as ordinary territory',()=>{
 for(const x of lab.variants){const s=board(x);s.wordPoints=[9,7];s.sideIncome=[3,8];s.centerIncome=[4,0];const b=lab.breakdown(s,x);
 assert.equal(b[0].total,9+4+3+x.centerEnd);assert.equal(b[1].total,7+8+x.sideEnd);
 assert.deepEqual(b.map(c=>Object.entries(c).filter(([k])=>k!=='total').reduce((n,[,z])=>n+z,0)),lab.totals(s,x));}
});
test('full game has even turns, conserved components, and deterministic reproducibility',()=>{
 const trie=lab.makeTrie(JSON.parse(fs.readFileSync('work/balance/frequency.json')));
 const a=play(v,8123,false,trie),b=play(v,8123,false,trie);assert.deepEqual(a,b);assert.equal(a.turns%2,0);
 assert.ok(Math.abs(a.wordsShare+a.territoryShare-1)<1e-12);assert.equal(a.combined.total,a.scores[0]+a.scores[1]);
});

test('a castle lost and regained within one round does not earn full-held income',()=>{
 const x={...v,timing:'held'};let s=board(x);s.tiles.find(t=>t.id==='0,0').owner=2;s.roundOwners=s.tiles.map(t=>t.owner);
 const setup=()=>{const path=[...'CAT'].map((letter,i)=>{const idx=s.tiles.findIndex(t=>t.id===`${i-1},0`);Object.assign(s.tiles[idx],{letter});return idx;});s.tiles[path[0]].owner=s.player;return {path,word:'cat'};};
 s=lab.apply(s,setup(),x,lab.rng(1),dict);assert.equal(s.tiles.find(t=>t.id==='0,0').owner,1);
 s=lab.apply(s,setup(),x,lab.rng(2),dict);assert.equal(s.tiles.find(t=>t.id==='0,0').owner,2);assert.deepEqual(s.centerIncome,[0,0]);
});
test('candidate territory swing accounts for center value and opponent loss for every configuration',()=>{
 const trie=lab.makeTrie({cat:5},0,3);
 for(const x of lab.variants){const s=board(x);s.player=1;
 for(const [id,letter,owner]of [['-1,0','C',1],['0,0','A',2],['1,0','T',0]])Object.assign(s.tiles.find(t=>t.id===id),{letter,owner});
 const m=lab.enumerate(s,x,trie,{}).moves.find(m=>m.path.map(i=>s.tiles[i].id).join(';')==='-1,0;0,0;1,0');
 assert.ok(m);assert.equal(m.land,2*x.centerEnd+1);assert.equal(m.incomeSwing,2*x.centerRate);}
});
