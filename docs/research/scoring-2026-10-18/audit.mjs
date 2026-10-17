import fs from 'node:fs';import assert from 'node:assert/strict';import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import * as L from './lab.mjs';import {play} from './run.mjs';
const mean=a=>a.reduce((n,x)=>n+x,0)/a.length;
if(!isMainThread){
 const v=L.variants.find(v=>v.id===workerData.id),data=JSON.parse(fs.readFileSync(`work/scoring-2026-10-18/main/${v.id}.json`)),dictionary=new Set(JSON.parse(fs.readFileSync('server/versions/dictionary-v1.json'))),trie=L.makeTrie(JSON.parse(fs.readFileSync('work/balance/frequency.json')),3.5,10);
 for(const w of trie.words)assert.ok(dictionary.has(w),'Vocabulary must be a subset of the live dictionary');
 const rows=[];
 for(const original of data.rows){
  const g=play(v,original.seed,original.flip,trie,'main',original.seats,true);assert.deepEqual(g.row,original,'Deterministic replay must match recorded game');
  const counts=[0,0,0,0,0,0],letterCounts={},bonus=g.row.combined.bonus;
  for(const [i,m]of g.row.moves.entries())for(const pos of m.path){const letter=g.states[i].tiles[pos].letter,points=L.Engine.letterValue(letter,L.config(v));counts[points]++;letterCounts[letter]=(letterCounts[letter]||0)+1;}
  const letterPoints=counts.reduce((n,x,i)=>n+x*i,0);assert.equal(letterPoints,g.row.combined.letters);assert.equal(letterPoints+bonus,g.row.combined.letters+g.row.combined.bonus);
  const total=counts.reduce((n,x)=>n+x,0),hard=Object.entries(letterCounts).filter(([l])=>'FHKVWYJQXZ'.includes(l)).reduce((n,[,x])=>n+x,0),rare=Object.entries(letterCounts).filter(([l])=>'JQXZ'.includes(l)).reduce((n,[,x])=>n+x,0);
  rows.push({seed:original.seed,flip:original.flip,counts,letterCounts,total,hardShare:hard/total,rareShare:rare/total});
 }
 const result={id:v.id,checkedGames:rows.length,vocabulary:trie.words.size,hardShare:mean(rows.map(r=>r.hardShare)),rareShare:mean(rows.map(r=>r.rareShare)),tierUses:countsSum(rows),tierPoints:countsSum(rows).map((x,i)=>x*i),rows};
 fs.writeFileSync(`work/scoring-2026-10-18/audit-${v.id}.json`,JSON.stringify(result));parentPort.postMessage({id:v.id,games:rows.length,hardShare:result.hardShare,rareShare:result.rareShare});
}else{
 await Promise.all(L.variants.map(v=>new Promise((resolve,reject)=>{const w=new Worker(new URL(import.meta.url),{workerData:{id:v.id}});w.on('message',console.log);w.on('error',reject);w.on('exit',code=>code?reject(Error('Audit worker '+code)):resolve());})));
 const rows=L.variants.map(v=>JSON.parse(fs.readFileSync(`work/scoring-2026-10-18/audit-${v.id}.json`)));
 fs.writeFileSync('docs/research/scoring-2026-10-18/letter-audit.json',JSON.stringify(rows));
}
function countsSum(rows){return Array.from({length:6},(_,i)=>rows.reduce((n,r)=>n+r.counts[i],0));}
