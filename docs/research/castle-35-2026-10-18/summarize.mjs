import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';import zlib from 'node:zlib';import * as L from './lab.mjs';
const root='docs/research/castle-35-2026-10-18',oldRoot='docs/research/final-territory-2026-10-18',stages=['main','styles','sparse','exhaustive','planner','full_weight','late_weight'];
const old=JSON.parse(fs.readFileSync(oldRoot+'/results.json')),oldRecords=JSON.parse(zlib.gunzipSync(fs.readFileSync(oldRoot+'/games.json.gz'))),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const mean=a=>a.length?a.reduce((n,x)=>n+x,0)/a.length:null,quantile=(a,p)=>[...a].sort((a,b)=>a-b)[Math.floor((a.length-1)*p)];
function interval(rows,fn){const groups=new Map();for(const row of rows){const x=fn(row);if(x===null)continue;if(!groups.has(row.seed))groups.set(row.seed,[]);groups.get(row.seed).push(x);}const a=[...groups.values()].map(mean),random=L.rng(87344),values=[];for(let i=0;i<2000;i++)values.push(mean(a.map(()=>a[Math.floor(random()*a.length)])));return[quantile(values,.025),quantile(values,.975)];}
const firstWin=r=>r.winner===0?.5:r.winner===r.starter?1:0,castleShare=r=>(r.combined.sideIncome+r.combined.centreIncome)/r.combined.total;
function summary(rows,v){const result={games:rows.length,seeds:new Set(rows.map(r=>r.seed)).size};
 result.points=Object.fromEntries([...L.components,'total'].map(k=>[k,mean(rows.map(r=>r.combined[k]))]));result.shares=Object.fromEntries(L.components.map(k=>[k,mean(rows.map(r=>r.combined[k]/r.combined.total))]));
 for(const k of ['turns','averageLength','attackRate','lateAttackRate','spatialSacrificeRate','lateSpatialSacrificeRate','castleFlips','refreshRate','lastMoveTerritorySwing','finalOwned','normalizedMargin'])result[k]=mean(rows.map(r=>r[k]).filter(x=>x!==null));
 result.firstWin=mean(rows.map(firstWin));result.firstWinInterval=interval(rows,firstWin);result.castleShareInterval=interval(rows,castleShare);
 result.sideDefences=mean(rows.map(r=>r.combined.sideIncome/v.sideRate));result.centreDefences=mean(rows.map(r=>r.combined.centreIncome/v.centreRate));result.castleDefences=result.sideDefences+result.centreDefences;
 result.castleCaptureRate=mean(rows.map(r=>mean(r.moves.filter(m=>m.word).map(m=>+m.castleCapture))));
 for(const k of ['halfLeaderWon','halfProjectedLeaderWon','lastMoveReversal']){const relevant=rows.filter(r=>r[k]!==null);result[k]=mean(relevant.map(r=>+r[k]));result[k+'Games']=relevant.length;}
 result.finalTerritoryChangesResult=mean(rows.map(r=>+r.finalTerritoryChangesResult));
 result.balancedWin=rows[0].policies[0]!==rows[0].policies[1]?mean(rows.map(r=>r.winner===0?.5:r.policies[r.winner-1]==='balanced'?1:0)):null;
 return result;
}
const records=[],datasets=[],manifests=[],replays=[],rawHashes={};
for(const stage of stages){const manifest=JSON.parse(fs.readFileSync(`work/castle-35-2026-10-18/${stage}/manifest.json`));manifests.push(manifest);
 for(const v of L.variants){const reused=v.id!=='final_territory_35',folder=`work/${reused?'final-territory':'castle-35'}-2026-10-18/${stage}`,bytes=fs.readFileSync(`${folder}/${v.id}.json`),d=JSON.parse(bytes);rawHashes[stage+'/'+v.id]=sha(bytes);if(reused)assert.equal(rawHashes[stage+'/'+v.id],old.rawHashes[stage+'/'+v.id]);
  for(const pair of manifest.matchups){const rows=d.rows.filter(r=>r.policies.join(':')===pair.join(':'));datasets.push({stage,id:v.id,matchup:pair.join(':'),...summary(rows,v)});}
  for(const row of d.rows)records.push({stage,reused,repeatedControl:stage==='late_weight'&&v.id==='no_territory',...row});
  if(stage==='main')for(const replay of d.replays)replays.push({id:v.id,...replay});
 }
}
assert.deepEqual(records.filter(r=>r.reused).map(({reused,...r})=>r),oldRecords);
const paired=[];
for(const stage of stages){const rows=records.filter(r=>r.stage===stage);for(const pair of manifests.find(m=>m.stage===stage).matchups){const rowsA=rows.filter(r=>r.variant==='final_territory'&&r.policies.join(':')===pair.join(':')),rowsB=rows.filter(r=>r.variant==='final_territory_35'&&r.policies.join(':')===pair.join(':'));
 const diffs=rowsA.map(a=>{const b=rowsB.find(b=>b.seed===a.seed&&b.flip===a.flip);assert.ok(b);return{seed:a.seed,castleShare:castleShare(b)-castleShare(a),castlePoints:b.combined.sideIncome+b.combined.centreIncome-a.combined.sideIncome-a.combined.centreIncome,firstWin:firstWin(b)-firstWin(a),attackRate:b.attackRate-a.attackRate,lateAttackRate:b.lateAttackRate-a.lateAttackRate,spatialSacrificeRate:b.spatialSacrificeRate-a.spatialSacrificeRate,lateSpatialSacrificeRate:b.lateSpatialSacrificeRate-a.lateSpatialSacrificeRate,castleFlips:b.castleFlips-a.castleFlips,averageLength:b.averageLength-a.averageLength,castleDefences:b.combined.sideIncome/3+b.combined.centreIncome/5-a.combined.sideIncome/2-a.combined.centreIncome/4};});
 paired.push({stage,matchup:pair.join(':'),comparison:'3/5 minus 2/4; both with final territory',...Object.fromEntries(Object.keys(diffs[0]).filter(k=>k!=='seed').map(k=>[k,{difference:mean(diffs.map(r=>r[k])),interval:interval(diffs,r=>r[k])}]))});
}}
const audit=JSON.parse(fs.readFileSync(`${root}/audit.json`)),sourceFiles=['lab.mjs','run.mjs','lab.test.mjs','baseline.test.mjs','audit.mjs','summarize.mjs'].map(f=>root+'/'+f),unique=records.filter(r=>!r.repeatedControl),fresh=unique.filter(r=>!r.reused);
const result={date:'2026-10-18',games:unique.length,turns:unique.reduce((n,r)=>n+r.turns,0),newGames:fresh.length,newTurns:fresh.reduce((n,r)=>n+r.turns,0),reusedGames:old.games,executions:records.length,repeatedControls:records.length-unique.length,cutoffs:records.reduce((n,r)=>n+r.cutoffs,0),variants:L.variants,manifests,datasets,paired,auditedGames:old.auditedGames+audit.checkedGames,newAuditedGames:audit.checkedGames,controlChecks:audit.controlChecks,rawHashes,sourceHashes:{...old.sourceHashes,...Object.fromEntries(sourceFiles.map(p=>[p,sha(fs.readFileSync(p,'utf8').replaceAll('\r\n','\n'))]))},priorResultsHash:sha(fs.readFileSync(oldRoot+'/results.json')),priorGamesHash:sha(fs.readFileSync(oldRoot+'/games.json.gz')),frequencyHash:sha(fs.readFileSync('work/balance/frequency.json')),dictionaryHash:sha(fs.readFileSync('server/versions/dictionary-v1.json'))};
assert.equal(result.frequencyHash,old.frequencyHash);assert.equal(result.dictionaryHash,old.dictionaryHash);
fs.writeFileSync(`${root}/results.json`,JSON.stringify(result));fs.writeFileSync(`${root}/games.json.gz`,zlib.gzipSync(JSON.stringify(records)));fs.writeFileSync(`${root}/replays.json`,JSON.stringify(replays));
console.log(JSON.stringify({games:result.games,newGames:result.newGames,turns:result.turns,newTurns:result.newTurns}));
for(const stage of stages){console.log(stage);console.table(datasets.filter(r=>r.stage===stage).map(r=>({id:r.id,match:r.matchup,g:r.games,word:(100*(r.shares.letters+r.shares.bonus)).toFixed(1),castle:(100*(r.shares.sideIncome+r.shares.centreIncome)).toFixed(1),end:(100*r.shares.finalTerritory).toFixed(1),attack:(100*r.attackRate).toFixed(1),first:(100*r.firstWin).toFixed(1),half:(100*r.halfLeaderWon).toFixed(1),lastReversal:(100*r.lastMoveReversal).toFixed(1),flips:r.castleFlips.toFixed(1),defences:r.castleDefences.toFixed(1),balanced:r.balancedWin===null?'':(100*r.balancedWin).toFixed(1)})));}
console.log('Main paired change');console.log(JSON.stringify(paired.find(p=>p.stage==='main')));
