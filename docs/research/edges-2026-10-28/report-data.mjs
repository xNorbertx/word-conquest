import fs from 'node:fs';
import Engine from '../../../server/engine.mjs';
import {configFor} from '../../../server/rules.mjs';
const rng=seed=>{let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};};
const profiles=JSON.parse(fs.readFileSync('work/edges/profiles.json','utf8'));
const data={training:JSON.parse(fs.readFileSync('work/edges/results-2000-all.json','utf8')),heldout:JSON.parse(fs.readFileSync('work/edges/results-50000-diverseCategory.json','utf8')),validation:JSON.parse(fs.readFileSync('work/edges/validation.json','utf8')),languages:{}};
for(const [lang,oldVersion,newVersion] of [['en','autumn-v5','autumn-v6'],['sv','autumn-sv-v4','autumn-sv-v5'],['nl','autumn-nl-v1','autumn-nl-v2']]){
  const old=configFor(oldVersion),current=configFor(newVersion),words=JSON.parse(fs.readFileSync(`work/edges/${lang}-words.json`,'utf8'));
  const before=Engine.newGame(old,rng(50000)).tiles,after=Engine.newGame(current,rng(50000)).tiles;
  const shares={baseline:{},new:{}};let edgeCount=0;
  for(let seed=50000;seed<50256;seed++)for(const [name,c] of [['baseline',old],['new',current]]){
    const tiles=Engine.newGame(c,rng(seed)).tiles;
    for(const t of tiles)if(t.letter!=='?'&&tiles.filter(n=>Engine.adjacent(t,n)).length<8){shares[name][t.letter]=(shares[name][t.letter]||0)+1;if(name==='baseline')edgeCount++;}
  }
  const examples={};for(const [a,pairs] of Object.entries(profiles[lang].pairs)){
    examples[a]=Object.entries(pairs).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([b,strength])=>({letter:b,strength,words:Object.keys(words).filter(w=>w.includes(a+b)||w.includes(b+a)).sort((a,b)=>words[b]-words[a]||a.localeCompare(b)).slice(0,3)}));
  }
  data.languages[lang]={profile:profiles[lang],before,after,shares,edgeCount,examples,categories:current.letterBalance,sampling:current.letterWeights,oldVersion,newVersion};
}
fs.mkdirSync('work/edges-report',{recursive:true});
fs.writeFileSync('work/edges-report/data.json',JSON.stringify(data));
fs.writeFileSync('docs/research/edges-2026-10-28/results.json',JSON.stringify({training:data.training,heldout:data.heldout,validation:data.validation}));
console.log('Report data written: paired boards, distribution counts, candidates, held-out checks and complete-game traces.');
