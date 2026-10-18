import fs from 'node:fs';import assert from 'node:assert/strict';import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';import * as L from './lab.mjs';import {play} from './run.mjs';import {play as previousPlay} from '../scoring-2026-10-18/run.mjs';import * as B from '../scoring-2026-10-18/lab.mjs';
if(!isMainThread){
 const v=L.variants.find(v=>v.id===workerData.id),data=JSON.parse(fs.readFileSync(`work/final-territory-2026-10-18/main/${v.id}.json`)),trie=L.makeTrie(JSON.parse(fs.readFileSync('work/balance/frequency.json')),3.5,10),dictionary=new Set(JSON.parse(fs.readFileSync('server/versions/dictionary-v1.json'))),examples=[];
 for(const word of trie.words)assert.ok(dictionary.has(word));let previousControlChecks=0;
 for(const original of data.rows){const g=play(v,original.seed,original.flip,trie,'main',original.policies,'ramp',true);assert.deepEqual(g.row,original);
  if(!v.endTerritory&&previousControlChecks<8){const old=previousPlay(B.variants.find(v=>v.id==='castles_only'),original.seed,original.flip,trie);assert.deepEqual(old.row.scores,g.row.scores);assert.deepEqual(old.row.moves.map(m=>[m.word,m.path]),g.row.moves.map(m=>[m.word,m.path]));previousControlChecks++;}
  const last=g.row.moves.at(-1),s=g.states.at(-2);if(examples.length>=8||!last.word||last.sacrifice<2)continue;
  const alternative={word:last.bestWord.word,path:last.bestWord.path,wordPoints:last.bestWord.points},n=L.apply(s,alternative,v,L.rng(719),trie.words);if(!n.over)continue;
  const chosen=g.states.at(-1);examples.push({seed:original.seed,flip:original.flip,player:s.player,before:s,chosen:{word:last.word,path:last.path,wordPoints:last.wordPoints,parts:L.breakdown(chosen,v),scores:L.totals(chosen,v),banked:B.totals(chosen,v)},alternative:{...alternative,parts:L.breakdown(n,v),scores:L.totals(n,v),banked:B.totals(n,v)}});
 }
 const result={id:v.id,checkedGames:data.rows.length,previousControlChecks,vocabulary:trie.words.size,examples};fs.writeFileSync(`work/final-territory-2026-10-18/audit-${v.id}.json`,JSON.stringify(result));parentPort.postMessage({id:v.id,games:result.checkedGames,previousControlChecks,examples:examples.length});
}else{
 await Promise.all(L.variants.map(v=>new Promise((resolve,reject)=>{const w=new Worker(new URL(import.meta.url),{workerData:{id:v.id}});w.on('message',console.log);w.on('error',reject);w.on('exit',c=>c?reject(Error('Audit worker '+c)):resolve());})));
 fs.writeFileSync('docs/research/final-territory-2026-10-18/audit.json',JSON.stringify(L.variants.map(v=>JSON.parse(fs.readFileSync(`work/final-territory-2026-10-18/audit-${v.id}.json`)))));
}
