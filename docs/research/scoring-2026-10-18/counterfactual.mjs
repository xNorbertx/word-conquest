import fs from 'node:fs';import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import * as L from './lab.mjs';import {play} from './run.mjs';
const mean=a=>a.reduce((n,x)=>n+x,0)/a.length;
if(!isMainThread){
 const v=L.variants.find(v=>v.id===workerData.id),trie=L.makeTrie(JSON.parse(fs.readFileSync('work/balance/frequency.json')),3.5,10),cases=[];
 for(let seed=20000;seed<20064&&cases.length<8;seed++)for(const flip of [false,true]){
  if(cases.length>=8)break;
  const game=play(v,seed,flip,trie,'main',['balanced','balanced'],true),index=game.row.moves.findIndex((m,i)=>game.states[i].lettersUsed>=24&&game.states[i].lettersUsed<=84&&m.spatialSacrifice);
  if(index<0)continue;
  const s=game.states[index],m=game.row.moves[index],alternatives=[m,m.bestWord],outcomes=[];
  for(let k=0;k<24;k++){
   const margins=[];
   for(const move of alternatives){
    const branchSeed=L.hash(`counter/${v.id}/${seed}/${flip}/${index}/${k}`),n=L.apply(s,move,v,L.rng(branchSeed),trie.words);
    const g=play(v,L.hash(`notice-counter/${seed}/${flip}/${k}`),false,trie,'main',['balanced','balanced'],false,n,L.hash(`continuation/${branchSeed}`));
    margins.push(g.row.scores[s.player-1]-g.row.scores[2-s.player]);
   }
   outcomes.push({chosen:margins[0],word:margins[1],difference:margins[0]-margins[1]});
  }
  cases.push({variant:v.id,seed,flip,turn:index+1,player:s.player,lettersUsed:s.lettersUsed,chosen:{word:m.word,path:m.path,points:m.wordPoints,land:m.land,incomeSwing:m.incomeSwing},alternative:m.bestWord,outcomes,
   chosenMargin:mean(outcomes.map(x=>x.chosen)),wordMargin:mean(outcomes.map(x=>x.word)),difference:mean(outcomes.map(x=>x.difference)),before:s});
 }
 if(cases.length!==8)throw Error('Insufficient predetermined eligible decisions');
 fs.writeFileSync(`work/scoring-2026-10-18/counter-${v.id}.json`,JSON.stringify({variant:v.id,cases,continuations:cases.length*24*2}));parentPort.postMessage({id:v.id,cases:cases.length,continuations:cases.length*48});
}else{
 await Promise.all(L.variants.map(v=>new Promise((resolve,reject)=>{const w=new Worker(new URL(import.meta.url),{workerData:{id:v.id}});w.on('message',console.log);w.on('error',reject);w.on('exit',code=>code?reject(Error('Counterfactual worker '+code)):resolve());})));
}
