import fs from 'node:fs';import crypto from 'node:crypto';import zlib from 'node:zlib';import * as L from './lab.mjs';
const root='docs/research/final-territory-2026-10-18',stages=['main','styles','sparse','exhaustive','planner','full_weight','late_weight'];
export const mean=a=>a.length?a.reduce((n,x)=>n+x,0)/a.length:null;
const quantile=(a,p)=>[...a].sort((a,b)=>a-b)[Math.floor((a.length-1)*p)];
function interval(rows,fn){const groups=new Map();for(const row of rows){const x=fn(row);if(x===null)continue;if(!groups.has(row.seed))groups.set(row.seed,[]);groups.get(row.seed).push(x);}const a=[...groups.values()].map(mean),random=L.rng(87344),resamples=[];for(let i=0;i<2000;i++)resamples.push(mean(a.map(()=>a[Math.floor(random()*a.length)])));return[quantile(resamples,.025),quantile(resamples,.975)];}
const firstWin=r=>r.winner===0?.5:r.winner===r.starter?1:0;
function summary(rows){const result={games:rows.length,seeds:new Set(rows.map(r=>r.seed)).size};
 result.points=Object.fromEntries([...L.components,'total'].map(k=>[k,mean(rows.map(r=>r.combined[k]))]));result.shares=Object.fromEntries(L.components.map(k=>[k,mean(rows.map(r=>r.combined[k]/r.combined.total))]));
 for(const k of ['turns','averageLength','attackRate','lateAttackRate','spatialSacrificeRate','lateSpatialSacrificeRate','castleFlips','refreshRate','lastMoveTerritorySwing','finalOwned','normalizedMargin'])result[k]=mean(rows.map(r=>r[k]).filter(x=>x!==null));
 result.firstWin=mean(rows.map(firstWin));result.firstWinInterval=interval(rows,firstWin);result.endShareInterval=interval(rows,r=>r.combined.finalTerritory/r.combined.total);
 for(const k of ['halfLeaderWon','halfProjectedLeaderWon','lastMoveReversal']){const relevant=rows.filter(r=>r[k]!==null);result[k]=mean(relevant.map(r=>+r[k]));result[k+'Games']=relevant.length;}
 result.finalTerritoryChangesResult=mean(rows.map(r=>+r.finalTerritoryChangesResult));
 result.balancedWin=rows[0].policies[0]!==rows[0].policies[1]?mean(rows.map(r=>r.winner===0?.5:r.policies[r.winner-1]==='balanced'?1:0)):null;
 return result;
}
const records=[],datasets=[],manifests=[],replays=[],rawHashes={},sha=x=>crypto.createHash('sha256').update(x).digest('hex');
for(const stage of stages){const folder=`work/final-territory-2026-10-18/${stage}`,manifest=JSON.parse(fs.readFileSync(`${folder}/manifest.json`));manifests.push(manifest);
 for(const v of L.variants){const bytes=fs.readFileSync(`${folder}/${v.id}.json`),d=JSON.parse(bytes);rawHashes[stage+'/'+v.id]=sha(bytes);
  for(const pair of manifest.matchups){const rows=d.rows.filter(r=>r.policies.join(':')===pair.join(':'));datasets.push({stage,id:v.id,matchup:pair.join(':'),...summary(rows)});}
  for(const row of d.rows)records.push({stage,repeatedControl:stage==='late_weight'&&v.id==='no_territory',...row});
  if(stage==='main')for(const replay of d.replays)replays.push({id:v.id,...replay});
 }
}
const paired=[];
for(const stage of stages){const rows=records.filter(r=>r.stage===stage);for(const pair of manifests.find(m=>m.stage===stage).matchups){const rowsA=rows.filter(r=>r.variant==='no_territory'&&r.policies.join(':')===pair.join(':')),rowsB=rows.filter(r=>r.variant==='final_territory'&&r.policies.join(':')===pair.join(':'));
 const differences=rowsA.map(a=>{const b=rowsB.find(b=>b.seed===a.seed&&b.flip===a.flip);if(!b)throw Error('Unpaired board');return{seed:a.seed,firstWin:firstWin(b)-firstWin(a),attackRate:b.attackRate-a.attackRate,lateAttackRate:b.lateAttackRate-a.lateAttackRate,spatialSacrificeRate:b.spatialSacrificeRate-a.spatialSacrificeRate,lateSpatialSacrificeRate:b.lateSpatialSacrificeRate-a.lateSpatialSacrificeRate,castleFlips:b.castleFlips-a.castleFlips,averageLength:b.averageLength-a.averageLength};});
 paired.push({stage,matchup:pair.join(':'),...Object.fromEntries(Object.keys(differences[0]).filter(k=>k!=='seed').map(k=>[k,{difference:mean(differences.map(r=>r[k])),interval:interval(differences,r=>r[k])}]))});
}}
const audit=JSON.parse(fs.readFileSync(`${root}/audit.json`)),sourceFiles=['lab.mjs','run.mjs','lab.test.mjs','audit.mjs','summarize.mjs'].map(f=>root+'/'+f).concat(['docs/research/scoring-2026-10-18/lab.mjs','docs/research/scoring-2026-10-18/run.mjs','docs/research/balance/lab.mjs','server/engine.mjs','server/rules.mjs','server/versions/engine-v1.mjs','server/versions/engine-v2.mjs','server/versions/opening-v4.mjs','server/versions/rules-v1.mjs','server/versions/rules-v3.mjs','server/versions/rules-v4.mjs']);
const unique=records.filter(r=>!r.repeatedControl),result={date:'2026-10-18',games:unique.length,turns:unique.reduce((n,r)=>n+r.turns,0),executions:records.length,repeatedControls:records.length-unique.length,cutoffs:records.reduce((n,r)=>n+r.cutoffs,0),variants:L.variants,manifests,datasets,paired,auditedGames:audit.reduce((n,x)=>n+x.checkedGames,0),rawHashes,sourceHashes:Object.fromEntries(sourceFiles.map(p=>[p,sha(fs.readFileSync(p,'utf8').replaceAll('\r\n','\n'))])),frequencyHash:sha(fs.readFileSync('work/balance/frequency.json')),dictionaryHash:sha(fs.readFileSync('server/versions/dictionary-v1.json'))};
fs.writeFileSync(`${root}/results.json`,JSON.stringify(result));fs.writeFileSync(`${root}/games.json.gz`,zlib.gzipSync(JSON.stringify(records)));fs.writeFileSync(`${root}/replays.json`,JSON.stringify(replays));
console.log(JSON.stringify({games:result.games,turns:result.turns,executions:result.executions,repeatedControls:result.repeatedControls}));
for(const stage of stages){console.log(stage);console.table(datasets.filter(r=>r.stage===stage).map(r=>({id:r.id,match:r.matchup,g:r.games,word:(100*(r.shares.letters+r.shares.bonus)).toFixed(1),income:(100*(r.shares.sideIncome+r.shares.centreIncome)).toFixed(1),end:(100*r.shares.finalTerritory).toFixed(1),attack:(100*r.attackRate).toFixed(1),lateAttack:(100*r.lateAttackRate).toFixed(1),first:(100*r.firstWin).toFixed(1),half:(100*r.halfLeaderWon).toFixed(1),lastReversal:(100*r.lastMoveReversal).toFixed(1),endChanged:(100*r.finalTerritoryChangesResult).toFixed(1),balanced:r.balancedWin===null?'':(100*r.balancedWin).toFixed(1)})));}
console.log('Main paired differences');console.log(JSON.stringify(paired.find(p=>p.stage==='main')));
