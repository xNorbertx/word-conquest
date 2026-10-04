import fs from 'node:fs';import path from 'node:path';import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import * as lab from './lab.mjs';
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
export function play(v,seed,mirror,trie,policies=['balanced','balanced'],noticed=true){
 const random=lab.rng(lab.hash(seed+'/replacement')),seats=mirror?[...policies].reverse():policies,moves=[];
 let s=lab.newState(v,seed,mirror),half=null,centerRounds=0,sideRounds=0,firstCastle=null,castleFlips=0,firstCenterOwner=0;
 for(let step=0;!s.over&&step<100;step++){
  const p=s.player,f=lab.enumerate(s,v,trie,{noticed,noticeSeed:seed});
  if(f.cutoff)throw Error('Search cutoff');
  const m=lab.choose(s,f.moves,v,seats[p-1]),bestWord=lab.choose(s,f.moves,v,'words');
  const n=lab.apply(s,m,v,random,trie.words);
  if(m){
   const real=lab.Engine.scoreMove(s,m.path.map(i=>s.tiles[i].id),lab.config(v));
   if(real.wordPoints!==m.wordPoints)throw Error('Word score mismatch');
   const before=lab.breakdown(s,v),after=lab.breakdown(n,v);
   const land=x=>x.ordinary+x.sideEnd+x.centerEnd;
   if(land(after[p-1])-land(before[p-1])+land(before[2-p])-land(after[2-p])!==m.land)throw Error('Territory score mismatch');
  }
  for(let i=0;i<n.tiles.length;i++){
   const a=s.tiles[i],b=n.tiles[i];if(!b.castle)continue;
   if(!firstCastle&&b.owner)firstCastle={turn:step+1,owner:b.owner};
   if(a.owner&&b.owner&&a.owner!==b.owner)castleFlips++;
   if(!firstCenterOwner&&lab.isCenter(b)&&b.owner)firstCenterOwner=b.owner;
  }
  if(p===2){centerRounds+=n.tiles.filter(t=>t.castle&&lab.isCenter(t)&&t.owner).length;sideRounds+=n.tiles.filter(t=>t.castle&&!lab.isCenter(t)&&t.owner).length;}
  moves.push({turn:step+1,player:p,word:m?.word||null,wordPoints:m?.wordPoints||0,length:m?.path.length||0,
   attack:!!m?.enemy,castleCapture:!!m?.path.some(i=>s.tiles[i].castle&&s.tiles[i].owner!==p),
   sacrifice:!!m&&bestWord.wordPoints-m.wordPoints>=2,
   territorySacrifice:!!m&&bestWord.wordPoints-m.wordPoints>=2&&m.land>=bestWord.land+3,
   castleSacrifice:!!m&&bestWord.wordPoints-m.wordPoints>=2&&m.incomeSwing>bestWord.incomeSwing,
   income:[...n.income],scores:lab.totals(n,v)});
  s=n;if(!half&&s.lettersUsed>=60)half=lab.totals(s,v);
 }
 if(!s.over)throw Error('Unfinished game');
 const components=lab.breakdown(s,v),combined=Object.fromEntries(Object.keys(components[0]).map(k=>[k,components[0][k]+components[1][k]]));
 const scores=lab.totals(s,v),winner=scores[0]===scores[1]?0:scores[0]>scores[1]?1:2;
 const noIncome=components.map(c=>c.total-c.sideIncome-c.centerIncome),withoutIncomeWinner=noIncome[0]===noIncome[1]?0:noIncome[0]>noIncome[1]?1:2;
 const leader=half[0]===half[1]?0:half[0]>half[1]?1:2,words=moves.filter(m=>m.word);
 const shares=Object.fromEntries(Object.entries(combined).filter(([k])=>k!=='total').map(([k,x])=>[k+'Share',x/combined.total]));
 return {variant:v.id,seed,mirror,seats,components,combined,...shares,territoryShare:1-shares.wordsShare,
  incomeShare:shares.sideIncomeShare+shares.centerIncomeShare,scores,winner,withoutIncomeWinner,incomeChangesWinner:winner!==withoutIncomeWinner,
  turns:moves.length,averageLength:mean(words.map(m=>m.length)),attackRate:mean(words.map(m=>+m.attack)),
  sacrificeRate:mean(words.map(m=>+m.sacrifice)),territorySacrificeRate:mean(words.map(m=>+m.territorySacrifice)),
  castleSacrificeRate:mean(words.map(m=>+m.castleSacrifice)),castleCaptureRate:mean(words.map(m=>+m.castleCapture)),
  refreshRate:1-words.length/moves.length,castleFlips,centerOccupiedRounds:centerRounds/(moves.length/2),
  sidesOccupiedRounds:sideRounds/(4*moves.length/2),firstCastle,firstCenterOwner,
  halfLeaderWon:leader?winner===leader:null,comeback:leader?winner===3-leader:null,
  halfLead:Math.abs(half[0]-half[1]),normalizedMargin:Math.abs(scores[0]-scores[1])/Math.max(...scores),moves};
}
if(!isMainThread){
 const {id,seedStart,seeds,noticed,maxLength,minFrequency,matchups,output}=workerData,v=lab.variants.find(v=>v.id===id);
 const trie=lab.makeTrie(JSON.parse(fs.readFileSync('work/balance/frequency.json')),minFrequency,maxLength),results=[],start=Date.now();
 for(let seed=seedStart;seed<seedStart+seeds;seed++)for(const pair of matchups)for(const mirror of [false,true])results.push(play(v,seed,mirror,trie,pair,noticed));
 fs.writeFileSync(path.join(output,id+'.json'),JSON.stringify({variant:v,trieWords:trie.words.size,results}));
 parentPort.postMessage({id,games:results.length,seconds:(Date.now()-start)/1000});
}else if(process.argv[1]?.endsWith('run.mjs')){
 const args=Object.fromEntries(process.argv.slice(2).map(x=>{const [k,v]=x.replace(/^--/,'').split('=');return[k,v];}));
 if(!args.stage)throw Error('Use a new --stage name');
 const manifest={stage:args.stage,chosen:(args.variants||lab.variants.filter(v=>v.timing==='boundary').map(v=>v.id).join(',')).split(','),
  seedStart:Number(args.seedStart||8000),seeds:Number(args.seeds||64),noticed:args.noticed!=='false',
  maxLength:Number(args.length||9),minFrequency:Number(args.frequency||3.5),
  matchups:(args.matchups||'balanced:balanced').split(',').map(x=>x.split(':')),
  startedAt:new Date().toISOString(),node:process.version,dictionary:'english-letterpress-v1-5b448e6b1ace',frequency:'wordfreq 3.1.1'};
 if(manifest.chosen.some(id=>!lab.variants.some(v=>v.id===id)))throw Error('Unknown variant');
 const output='work/castle-income/'+args.stage;if(fs.existsSync(output))throw Error('Stage already exists; preserve old evidence');
 fs.mkdirSync(output,{recursive:true});fs.writeFileSync(output+'/manifest.json',JSON.stringify(manifest,null,2));
 let cursor=0;async function worker(){while(cursor<manifest.chosen.length){const id=manifest.chosen[cursor++];await new Promise((resolve,reject)=>{
  const w=new Worker(new URL(import.meta.url),{workerData:{...manifest,id,output}});w.on('message',m=>{console.log(JSON.stringify(m));resolve();});w.on('error',reject);w.on('exit',c=>{if(c)reject(Error('Worker failed '+c));});
 });}}
 await Promise.all(Array.from({length:Math.min(4,Number(args.jobs||3))},worker));console.log('Complete: '+output);
}
