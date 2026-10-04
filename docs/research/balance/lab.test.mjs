import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {variants,config,newState,apply,totals,makeTrie,enumerate,choose,rng,Engine} from './lab.mjs';
const dictionary=new Set(JSON.parse(fs.readFileSync('server/versions/dictionary-v1.json'))),frequency=JSON.parse(fs.readFileSync('work/balance/frequency.json'));
const baseline=variants[0],trie=makeTrie(frequency);
test('seeded boards reproduce; mirror swaps letter positions and player identities',()=>{
 const a=newState(baseline,71),b=newState(baseline,71),m=newState(baseline,71,true);assert.deepEqual(a,b);
 for(const t of a.tiles){const other=m.tiles.find(x=>x.q===-t.q&&x.r===t.r);assert.equal(t.letter,other.letter);assert.equal(t.owner?3-t.owner:0,other.owner);}
});
test('solver candidates satisfy the production engine and agree on scores',()=>{
 for(const seed of [100,200,300]){const s=newState(baseline,seed),c=config(baseline),found=enumerate(s,c,baseline,trie);assert.equal(found.cutoff,false);assert.ok(found.moves.length>10);
  for(const m of found.moves.filter((_,i)=>i%7===0)){const ids=m.path.map(i=>s.tiles[i].id),j={};m.path.forEach((i,n)=>{if(s.tiles[i].letter==='?')j[s.tiles[i].id]=m.word[n].toUpperCase();});assert.equal(Engine.validatePath(s,ids,c,true,dictionary,j),null);const score=Engine.scoreMove(s,ids,c);assert.equal(m.wordPoints,score.wordPoints);assert.equal(m.land,score.territoryGain+score.enemyLoss);}
 }
});
test('baseline adapter preserves the exact engine result',()=>{
 const s=newState(baseline,8),c=config(baseline),m=choose(s,enumerate(s,c,baseline,trie).moves,baseline),before=structuredClone(s),ids=m.path.map(i=>s.tiles[i].id),j={};m.path.forEach((i,n)=>{if(s.tiles[i].letter==='?')j[s.tiles[i].id]=m.word[n].toUpperCase();});
 const expected=Engine.submit(s,ids,c,dictionary,j,rng(44)).state,actual=apply(s,m,baseline,rng(44),dictionary);
 for(const key of ['tiles','player','wordPoints','turns','lettersUsed','over','log'])assert.deepEqual(actual[key],expected[key]);assert.deepEqual(totals(actual,c,baseline),Engine.scores(expected,c));assert.deepEqual(s,before);
});
test('holding rewards are simultaneous per full round, capped and delayed as configured',()=>{
 for(const [v,want1,want2]of [[{income:{kind:'all',rate:1}},[3,3],[6,6]],[{income:{kind:'all',rate:1,cap:2}},[2,2],[4,4]],[{income:{kind:'castle',rate:3,delay:2}},[0,0],[3,3]]]){
  let s=newState(v,9);for(const p of [1,2])s.tiles.find(t=>t.owner===p).castle=true;
  s=apply(s,null,v,rng(30),dictionary);assert.deepEqual(s.income,[0,0]);s=apply(s,null,v,rng(31),dictionary);assert.deepEqual(s.income,want1);
  s=apply(s,null,v,rng(32),dictionary);s=apply(s,null,v,rng(33),dictionary);assert.deepEqual(s.income,want2);
 }
});
test('newly captured castle pays only after surviving the next complete round',()=>{
 const v={income:{kind:'castle',rate:2}},s=newState(v,12);s.tiles.forEach(t=>t.castle=false);
 const path=[...'GARDENS'].map((letter,i)=>{const index=s.tiles.findIndex(t=>t.id===`${i-3},0`);Object.assign(s.tiles[index],{letter,owner:i===0?1:2,castle:i===3});return index;});s.roundOwners=s.tiles.map(t=>t.owner);
 let n=apply(s,{path,word:'gardens'},v,rng(40),dictionary);n=apply(n,null,v,rng(41),dictionary);assert.deepEqual(n.income,[0,0]);n=apply(n,null,v,rng(42),dictionary);n=apply(n,null,v,rng(43),dictionary);assert.deepEqual(n.income,[2,0]);
});
test('joker placement variants and per-word caps are enforced',()=>{
 for(const v of variants.filter(v=>v.id.startsWith('jokers'))){const s=newState(v,44),expected=v.id==='jokers_neutral'?4:config(v).jokerCount;assert.equal(s.tiles.filter(t=>t.letter==='?').length,expected);}
 const v=variants.find(v=>v.id==='one_joker'),s=newState(v,31);assert.ok(enumerate(s,config(v),v,trie).moves.every(m=>m.jokers<=1));
});
test('trie search matches brute force on a small wildcard board',()=>{
 const c=config(baseline),s={over:false,player:1,tiles:[{id:'0,0',q:0,r:0,letter:'C',owner:1},{id:'1,0',q:1,r:0,letter:'?',owner:0},{id:'2,0',q:2,r:0,letter:'T',owner:2},{id:'1,1',q:1,r:1,letter:'R',owner:2}]};const t=makeTrie({cat:5,car:5,cart:5,rat:5},0,4),actual=enumerate(s,c,baseline,t).moves.map(m=>m.word+':'+m.path.join(',')).sort(),expected=[];
 function visit(p){for(const w of t.words){if(w.length!==p.length)continue;const j={};p.forEach((i,n)=>{if(s.tiles[i].letter==='?')j[s.tiles[i].id]=w[n].toUpperCase();});if(Engine.wordForPath(s,p.map(i=>s.tiles[i].id),j).toLowerCase()===w&&!Engine.validatePath(s,p.map(i=>s.tiles[i].id),c,true,t.words,j))expected.push(w+':'+p.join(','));}if(p.length<4)for(let i=0;i<4;i++)if(!p.includes(i))visit([...p,i]);}visit([]);assert.deepEqual(actual,expected.sort());
});

test('mature territory increases current value without banking recurring points',()=>{
 const v={matureTerritory:true};let s=newState(v,9);assert.deepEqual(totals(s,config(v),v),[3,3]);s=apply(s,null,v,rng(1),dictionary);s=apply(s,null,v,rng(2),dictionary);assert.deepEqual(totals(s,config(v),v),[6,6]);s=apply(s,null,v,rng(3),dictionary);s=apply(s,null,v,rng(4),dictionary);assert.deepEqual(totals(s,config(v),v),[6,6]);assert.deepEqual(s.income,[0,0]);
});
test('one-time castle reward cannot be collected again by waiting',()=>{const v={income:{kind:'castle',rate:3,once:true}};let s=newState(v,7);for(const p of [1,2])s.tiles.find(t=>t.owner===p).castle=true;for(let i=0;i<6;i++)s=apply(s,null,v,rng(i+1),dictionary);assert.deepEqual(s.income,[3,3]);});
