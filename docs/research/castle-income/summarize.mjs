import fs from 'node:fs';import crypto from 'node:crypto';import {rng,variants} from './lab.mjs';
const mean=a=>a.length?a.reduce((n,x)=>n+x,0)/a.length:null,quantile=(a,p)=>{const b=[...a].sort((x,y)=>x-y);return b[Math.floor((b.length-1)*p)];};
function interval(rows,fn){
 const groups=new Map();for(const g of rows){if(!groups.has(g.seed))groups.set(g.seed,[]);groups.get(g.seed).push(fn(g));}
 const a=[...groups.values()].map(mean),random=rng(6174),b=[];for(let i=0;i<2000;i++)b.push(mean(a.map(()=>a[Math.floor(random()*a.length)])));
 return [quantile(b,.025),quantile(b,.975)];
}
function summary(games){
 const row={games:games.length,seeds:new Set(games.map(g=>g.seed)).size};
 for(const k of ['wordsShare','ordinaryShare','sideEndShare','centerEndShare','sideIncomeShare','centerIncomeShare','territoryShare','incomeShare','turns','averageLength','attackRate','castleFlips','sacrificeRate','territorySacrificeRate','castleSacrificeRate','castleCaptureRate','refreshRate','centerOccupiedRounds','sidesOccupiedRounds','normalizedMargin'])row[k]=mean(games.map(g=>g[k]));
 row.points=Object.fromEntries(Object.keys(games[0].combined).map(k=>[k,mean(games.map(g=>g.combined[k]))]));
 row.aggregateTerritoryShare=1-games.reduce((n,g)=>n+g.combined.words,0)/games.reduce((n,g)=>n+g.combined.total,0);
 row.territoryInterval=interval(games,g=>g.territoryShare);row.territoryGameRange=[quantile(games.map(g=>g.territoryShare),.05),quantile(games.map(g=>g.territoryShare),.95)];
 row.incomeInterval=interval(games,g=>g.incomeShare);
 row.firstPlayerWin=mean(games.map(g=>g.winner===1?1:g.winner===0?.5:0));
 row.firstPlayerInterval=interval(games,g=>g.winner===1?1:g.winner===0?.5:0);
 row.halfLeaderGames=games.filter(g=>g.halfLeaderWon!==null).length;row.halfLeaderWin=mean(games.filter(g=>g.halfLeaderWon!==null).map(g=>+g.halfLeaderWon));
 row.incomeChangesWinner=mean(games.map(g=>+g.incomeChangesWinner));
 row.firstCastleHolderWin=mean(games.filter(g=>g.firstCastle).map(g=>g.winner===g.firstCastle.owner?1:g.winner===0?.5:0));
 row.firstCenterHolderWin=mean(games.filter(g=>g.firstCenterOwner).map(g=>g.winner===g.firstCenterOwner?1:g.winner===0?.5:0));
 row.balancedWin=mean(games.filter(g=>g.seats[0]!==g.seats[1]).map(g=>!g.winner?.5:g.seats[g.winner-1]==='balanced'?1:0));
 return row;
}
const datasets=[],records=[],manifests=[],rawHashes={};let turns=0;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const stage of ['main','styles','expert','timing']){
 const dir='work/castle-income/'+stage,manifest=JSON.parse(fs.readFileSync(dir+'/manifest.json'));manifests.push(manifest);
 for(const id of manifest.chosen){
  const file=dir+'/'+id+'.json',bytes=fs.readFileSync(file),d=JSON.parse(bytes);rawHashes[stage+'/'+id]=sha(bytes);
  for(const pair of manifest.matchups){
   const games=d.results.filter(g=>g.seats.join(':')===pair.join(':')||[...g.seats].reverse().join(':')===pair.join(':'));
   datasets.push({stage,id,variant:d.variant,matchup:pair.join(':'),...summary(games)});
  }
  for(const g of d.results){turns+=g.turns;records.push({stage,id,seed:g.seed,mirror:g.mirror,seats:g.seats,components:g.components,winner:g.winner,turns:g.turns});}
 }
}
const sourceHashes={};for(const p of ['docs/research/castle-income/lab.mjs','docs/research/castle-income/run.mjs','docs/research/castle-income/summarize.mjs','docs/research/balance/lab.mjs','server/versions/engine-v1.mjs','server/versions/rules-v2.mjs','server/versions/rules-v1.mjs'])sourceHashes[p]=sha(fs.readFileSync(p,'utf8').replaceAll('\r\n','\n'));
const result={date:'2026-10-04',games:records.length,turns,cutoffs:0,variants,manifests,datasets,records,rawHashes,sourceHashes,frequencyHash:sha(fs.readFileSync('work/balance/frequency.json')),dictionaryHash:sha(fs.readFileSync('server/versions/dictionary-v1.json'))};
fs.writeFileSync('docs/research/castle-income-2026-10-04.json',JSON.stringify(result));
console.log(JSON.stringify({games:result.games,turns,datasets:datasets.length}));
for(const stage of ['main','styles','expert','timing']){console.log(stage);console.table(datasets.filter(r=>r.stage===stage).map(r=>({id:r.id,match:r.matchup,g:r.games,territory:(100*r.territoryShare).toFixed(1),income:(100*r.incomeShare).toFixed(1),rounds:(r.turns/2).toFixed(1),length:r.averageLength.toFixed(1),p1:(100*r.firstPlayerWin).toFixed(1),balanced:r.balancedWin===null?'':(100*r.balancedWin).toFixed(1)})));}
