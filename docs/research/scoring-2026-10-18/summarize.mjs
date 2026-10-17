import fs from 'node:fs';import crypto from 'node:crypto';import zlib from 'node:zlib';import * as L from './lab.mjs';
const mean=a=>a.length?a.reduce((n,x)=>n+x,0)/a.length:null;
const q=(a,p)=>[...a].sort((a,b)=>a-b)[Math.floor((a.length-1)*p)];
function interval(rows,fn){const groups=new Map();for(const r of rows){if(!groups.has(r.seed))groups.set(r.seed,[]);const n=fn(r);if(n!==null)groups.get(r.seed).push(n);}const a=[...groups.values()].filter(a=>a.length).map(mean),random=L.rng(987654),samples=[];for(let i=0;i<2000;i++)samples.push(mean(a.map(()=>a[Math.floor(a.length*random())])));return[q(samples,.025),q(samples,.975)];}
function summarize(rows){
 const share=(r,k)=>r.combined[k]/r.combined.total,territory=r=>(r.combined.ordinary+r.combined.castleValue+r.combined.sideIncome+r.combined.centreIncome)/r.combined.total;
 const result={games:rows.length,seeds:new Set(rows.map(r=>r.seed)).size};
 result.points=Object.fromEntries([...L.components,'total'].map(k=>[k,mean(rows.map(r=>r.combined[k]))]));
 result.shares=Object.fromEntries(L.components.map(k=>[k,mean(rows.map(r=>share(r,k)))]));result.territory=mean(rows.map(territory));result.territoryInterval=interval(rows,territory);result.territoryRange=[q(rows.map(territory),.05),q(rows.map(territory),.95)];
 const first=r=>r.winner===0?.5:r.winner===r.starter?1:0;result.firstWin=mean(rows.map(first));result.firstWinInterval=interval(rows,first);
 result.halfLeaderWin=mean(rows.filter(r=>r.halfLeaderWon!==null).map(r=>+r.halfLeaderWon));result.halfLeaderGames=rows.filter(r=>r.halfLeaderWon!==null).length;
 result.balancedWin=rows[0].seats[0]!==rows[0].seats[1]?mean(rows.map(r=>r.winner===0?.5:r.seats[r.winner-1]==='balanced'?1:0)):null;
 result.balancedWinInterval=result.balancedWin===null?null:interval(rows,r=>r.winner===0?.5:r.seats[r.winner-1]==='balanced'?1:0);
 for(const k of ['turns','averageLength','attackRate','sacrificeRate','spatialSacrificeRate','castleCaptureRate','castleFlips','refreshRate','jokerRate','multiJokerRate','longWordRate','recapturePoints','repeatRate','normalizedMargin'])result[k]=mean(rows.map(r=>r[k]));
 result.recaptureShare=mean(rows.map(r=>r.recapturePoints/r.combined.total));result.firstCentreHolderWin=mean(rows.filter(r=>r.firstCentreHolderWin!==null).map(r=>r.firstCentreHolderWin));return result;
}
const stages=['main','styles','sparse','exhaustive','planner'],datasets=[],records=[],replays=[],manifests=[],rawHashes={};let turns=0;
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
for(const stage of stages){const root=`work/scoring-2026-10-18/${stage}`,manifest=JSON.parse(fs.readFileSync(`${root}/manifest.json`));manifests.push(manifest);
 for(const v of L.variants){const bytes=fs.readFileSync(`${root}/${v.id}.json`),data=JSON.parse(bytes);rawHashes[`${stage}/${v.id}`]=sha(bytes);
  for(const pair of manifest.matchups){const rows=data.rows.filter(r=>r.seats.join(':')===pair.join(':'));datasets.push({stage,id:v.id,matchup:pair.join(':'),...summarize(rows)});}
  for(const r of data.rows){turns+=r.turns;records.push({stage,...r});}
  if(stage==='main')for(const replay of data.replays)replays.push({id:v.id,...replay});
 }
}
const counterfactual=L.variants.map(v=>JSON.parse(fs.readFileSync(`work/scoring-2026-10-18/counter-${v.id}.json`)));
for(const item of counterfactual)for(const c of item.cases){const random=L.rng(516),samples=[];for(let n=0;n<2000;n++)samples.push(mean(c.outcomes.map(()=>c.outcomes[Math.floor(random()*c.outcomes.length)].difference)));c.interval=[q(samples,.025),q(samples,.975)];}
const sources=['lab.mjs','run.mjs','counterfactual.mjs','summarize.mjs','audit.mjs','lab.test.mjs'].map(x=>'docs/research/scoring-2026-10-18/'+x);
const productionFiles=['server/engine.mjs','server/rules.mjs','server/versions/engine-v1.mjs','server/versions/engine-v2.mjs','server/versions/opening-v4.mjs','server/versions/rules-v1.mjs','server/versions/rules-v2.mjs','server/versions/rules-v3.mjs','server/versions/rules-v4.mjs'];
const sourceHashes=Object.fromEntries([...sources,...productionFiles,'docs/research/balance/lab.mjs'].map(p=>[p,sha(fs.readFileSync(p,'utf8').replaceAll('\r\n','\n'))]));
const result={date:'2026-10-18',games:records.length,turns,continuations:counterfactual.reduce((n,c)=>n+c.continuations,0),cutoffs:records.reduce((n,r)=>n+r.cutoffs,0),variants:L.variants,letterGroups:L.letterGroups,manifests,datasets,rawHashes,sourceHashes,frequencyHash:sha(fs.readFileSync('work/balance/frequency.json')),dictionaryHash:sha(fs.readFileSync('server/versions/dictionary-v1.json')),
 counterfactual:counterfactual.map(x=>({...x,cases:x.cases.map(({before,...c})=>c)}))};
const out='docs/research/scoring-2026-10-18';fs.writeFileSync(`${out}/results.json`,JSON.stringify(result));fs.writeFileSync(`${out}/games.json.gz`,zlib.gzipSync(JSON.stringify(records)));fs.writeFileSync(`${out}/replays.json`,JSON.stringify(replays));
fs.writeFileSync(`${out}/decisions.json`,JSON.stringify(counterfactual));
console.log(JSON.stringify({games:result.games,turns,continuations:result.continuations,cutoffs:result.cutoffs}));
for(const stage of stages){console.log(stage);console.table(datasets.filter(x=>x.stage===stage).map(r=>({id:r.id,matchup:r.matchup,g:r.games,word:(100*(r.shares.letters+r.shares.bonus)).toFixed(1),land:(100*r.shares.ordinary).toFixed(1),castleValue:(100*r.shares.castleValue).toFixed(1),income:(100*(r.shares.sideIncome+r.shares.centreIncome)).toFixed(1),len:r.averageLength.toFixed(2),first:(100*r.firstWin).toFixed(1),flips:r.castleFlips.toFixed(1),sacrifice:(100*r.spatialSacrificeRate).toFixed(1),balanced:r.balancedWin===null?'':(100*r.balancedWin).toFixed(1)})));}
console.log('counterfactual');console.table(counterfactual.map(r=>({id:r.variant,decisions:r.cases.length,mean:mean(r.cases.map(c=>c.difference)).toFixed(2),positive:r.cases.filter(c=>c.difference>0).length,clearPositive:r.cases.filter(c=>c.interval[0]>0).length,clearNegative:r.cases.filter(c=>c.interval[1]<0).length})));
