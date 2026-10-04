import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {play} from './run.mjs';import {makeTrie} from './lab.mjs';
const d=JSON.parse(fs.readFileSync('docs/research/castle-income-2026-10-04.json')),dict=new Set(JSON.parse(fs.readFileSync('server/versions/dictionary-v1.json')));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
let games=0,turns=0;
for(const manifest of d.manifests)for(const id of manifest.chosen){
 const raw=fs.readFileSync('work/castle-income/'+manifest.stage+'/'+id+'.json');assert.equal(sha(raw),d.rawHashes[manifest.stage+'/'+id]);
 const data=JSON.parse(raw),v=data.variant;
 for(const g of data.results){
  games++;turns+=g.turns;assert.equal(g.turns%2,0);assert.equal(g.turns,g.moves.length);
  assert.equal(g.scores[0]+g.scores[1],g.combined.total);
  const perPlayerWords=[0,0];let income=[0,0];
  for(const m of g.moves){
   assert.equal(m.player,m.turn%2?1:2);
   if(m.word)assert.ok(dict.has(m.word),m.word);perPlayerWords[m.player-1]+=m.wordPoints;
   for(let p=0;p<2;p++)assert.ok(m.income[p]>=income[p]);
   if(m.turn%2)assert.deepEqual(m.income,income);
   assert.ok(m.income[0]+m.income[1]-income[0]-income[1]<=4*v.sideRate+v.centerRate);
   income=m.income;
  }
  for(let p=0;p<2;p++){
   const c=g.components[p];assert.equal(perPlayerWords[p],c.words);
   assert.equal(income[p],c.sideIncome+c.centerIncome);
   assert.equal(Object.entries(c).filter(([k])=>k!=='total').reduce((s,[,n])=>s+n,0),g.scores[p]);
  }
  assert.ok(Math.abs(g.wordsShare+g.ordinaryShare+g.sideEndShare+g.centerEndShare+g.incomeShare-1)<1e-12);
  assert.ok(g.combined.ordinary<=64);assert.ok(g.combined.sideEnd<=4*v.sideEnd);assert.ok(g.combined.centerEnd<=v.centerEnd);
 }
 if(manifest.stage==='main'&&['current','example','high'].includes(id)){
  const trie=makeTrie(JSON.parse(fs.readFileSync('work/balance/frequency.json')),manifest.minFrequency,manifest.maxLength);
  for(const old of data.results.filter(g=>g.seed===manifest.seedStart))assert.deepEqual(play(v,old.seed,old.mirror,trie,['balanced','balanced'],manifest.noticed),old);
 }
}
assert.equal(games,d.games);assert.equal(turns,d.turns);
for(const [file,want]of Object.entries(d.sourceHashes))assert.equal(sha(fs.readFileSync(file,'utf8').replaceAll('\r\n','\n')),want);
for(const m of d.manifests)for(const id of m.chosen){
 const records=d.records.filter(g=>g.stage===m.stage&&g.id===id);assert.equal(records.length,m.seeds*2*m.matchups.length);
 for(const g of records)assert.equal(g.components[0].total+g.components[1].total,g.components.reduce((n,c)=>n+c.words+c.ordinary+c.sideEnd+c.centerEnd+c.sideIncome+c.centerIncome,0));
}
console.log(JSON.stringify({auditedGames:games,auditedTurns:turns,reproducedCompleteGames:6,rawHashes:'match',sourceHashes:'match',scoreConservation:'pass',payoutTiming:'pass',dictionary:'pass'}));
