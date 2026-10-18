import fs from 'node:fs';import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';import * as L from './lab.mjs';
const mean=a=>a.length?a.reduce((n,x)=>n+x,0)/a.length:null,winning=s=>s[0]===s[1]?0:s[0]>s[1]?1:2;
export function play(v,seed,flip,trie,model='main',policies=['balanced','balanced'],schedule='ramp',save=false){
 const random=L.rng(L.hash(`${seed}/actual-replacements`)),moves=[],states=[];let s=L.newState(v,seed,flip),half=null,halfProjected=null,castleFlips=0;
 if(save)states.push(structuredClone(s));
 for(let step=0;!s.over&&step<100;step++){
  const p=s.player,found=L.enumerate(s,v,trie,model,seed),bestWord=L.choose(s,found.moves,v,'words',schedule);
  const m=policies[p-1]==='planner'?L.plan(s,found.moves,v,trie,model,seed,schedule):L.choose(s,found.moves,v,policies[p-1],schedule);
  const before=L.totals(s,v),preProjected=L.projected(s,v),n=L.apply(s,m,v,random,trie.words),after=L.totals(n,v);
  for(let i=0;i<s.tiles.length;i++)if(s.tiles[i].castle&&s.tiles[i].owner&&n.tiles[i].owner!==s.tiles[i].owner)castleFlips++;
  const turn={turn:step+1,player:p,word:m?.word||null,path:m?.path||[],wordPoints:m?.wordPoints||0,length:m?.path.length||0,attack:!!m?.enemy,castleCapture:!!m?.castleCapture,
   endSwing:m?.endSwing||0,incomeSwing:m?.incomeSwing||0,jokers:m?.jokers||0,sacrifice:m?bestWord.wordPoints-m.wordPoints:0,
   spatialSacrifice:!!m&&bestWord.wordPoints-m.wordPoints>=2&&(m.endSwing>bestWord.endSwing||m.incomeSwing>bestWord.incomeSwing),
   bestWord:bestWord?{word:bestWord.word,path:bestWord.path,points:bestWord.wordPoints,endSwing:bestWord.endSwing,incomeSwing:bestWord.incomeSwing}:null,
   before,preProjected,after,delta:after.map((x,i)=>x-before[i]),spentBefore:s.lettersUsed,spentAfter:n.lettersUsed,available:found.words,visits:found.visits};
  moves.push(turn);s=n;if(save)states.push(structuredClone(s));if(!half&&s.lettersUsed>=60){half=L.totals(s,v);halfProjected=L.projected(s,v);}
 }
 if(!s.over)throw Error('Unfinished game');
 const parts=L.breakdown(s,v),combined=Object.fromEntries([...L.components,'total'].map(k=>[k,parts[0][k]+parts[1][k]])),scores=L.totals(s,v),winner=winning(scores),without=winning(parts.map(p=>p.total-p.finalTerritory));
 const words=moves.filter(m=>m.word),late=words.filter(m=>m.spentBefore>=90),halfWinner=winning(half),halfProjectedWinner=winning(halfProjected),last=moves.at(-1),beforeLastLeader=winning(last.preProjected);
 const row={variant:v.id,seed,flip,model,schedule,policies,starter:s.startingPlayer,parts,combined,scores,winner,turns:moves.length,words:words.length,cutoffs:0,
  averageLength:mean(words.map(m=>m.length)),attackRate:mean(words.map(m=>+m.attack)),lateAttackRate:mean(late.map(m=>+m.attack)),sacrificeRate:mean(words.map(m=>+(m.sacrifice>=2))),spatialSacrificeRate:mean(words.map(m=>+m.spatialSacrifice)),lateSpatialSacrificeRate:mean(late.map(m=>+m.spatialSacrifice)),castleFlips,
  refreshRate:1-words.length/moves.length,halfLeaderWon:halfWinner?winner===halfWinner:null,halfProjectedLeaderWon:halfProjectedWinner?winner===halfProjectedWinner:null,
  lastMoveReversal:beforeLastLeader?winner===3-beforeLastLeader:null,lastMoveTerritorySwing:last.endSwing,finalTerritoryChangesResult:winner!==without,withoutTerritoryWinner:without,
  finalOwned:s.tiles.filter(t=>t.owner).length,finalOwnedPerPlayer:[1,2].map(p=>L.holdings(s,p)),normalizedMargin:Math.abs(scores[0]-scores[1])/Math.max(...scores),moves};
 return {row,states};
}
if(!isMainThread&&workerData.output){
 const {id,seedStart,seeds,model,matchups,schedule,output,length}=workerData,v=L.variants.find(v=>v.id===id),trie=L.makeTrie(JSON.parse(fs.readFileSync('work/balance/frequency.json')),3.5,length),rows=[],replays=[],start=Date.now();
 for(let seed=seedStart;seed<seedStart+seeds;seed++)for(const policies of matchups)for(const flip of [false,true]){
  const save=seed===seedStart&&policies===matchups[0],g=play(v,seed,flip,trie,model,policies,schedule,save);rows.push(g.row);if(save)replays.push(g);
  if(rows.length%128===0)parentPort.postMessage({id,progress:rows.length});
 }
 fs.writeFileSync(`${output}/${id}.json`,JSON.stringify({variant:v,vocabulary:trie.words.size,rows,replays}));parentPort.postMessage({id,games:rows.length,seconds:(Date.now()-start)/1000});
}else if(isMainThread&&process.argv[1]?.replaceAll('\\','/').endsWith('/run.mjs')){
 const args=Object.fromEntries(process.argv.slice(2).map(x=>x.replace(/^--/,'').split('='))),stage=args.stage||'smoke',seedStart=Number(args.seedStart||29000),seeds=Number(args.seeds||2),model=args.model||'main',schedule=args.schedule||'ramp',length=Number(args.length||10),matchups=(args.matchups||'balanced:balanced').split(',').map(x=>x.split(':'));
 const output=`work/final-territory-2026-10-18/${stage}`;if(fs.existsSync(`${output}/manifest.json`))throw Error('Stage already exists');fs.mkdirSync(output,{recursive:true});
 fs.writeFileSync(`${output}/manifest.json`,JSON.stringify({stage,seedStart,seeds,model,schedule,length,matchups,variants:L.variants,node:process.version,started:new Date().toISOString()},null,2));
 await Promise.all(L.variants.map(v=>new Promise((resolve,reject)=>{const w=new Worker(new URL(import.meta.url),{workerData:{id:v.id,seedStart,seeds,model,schedule,length,matchups,output}});w.on('message',m=>console.log(JSON.stringify({stage,...m})));w.on('error',reject);w.on('exit',c=>c?reject(Error('Worker '+c)):resolve());})));console.log('Complete '+stage);
}
