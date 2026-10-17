import fs from 'node:fs';
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import * as L from './lab.mjs';
const mean=a=>a.length?a.reduce((a,b)=>a+b,0)/a.length:0;
export function play(v,seed,flip,trie,model='main',policies=['balanced','balanced'],save=false,initial=null,randomSeed=null){
 const seats=[...policies],random=L.rng(randomSeed??L.hash(`${seed}/actual-replacements`));
 let s=initial?structuredClone(initial):L.newState(v,seed,flip),half=null,firstCentre=0,castleFlips=0;
 const moves=[],states=save?[structuredClone(s)]:[];
 for(let step=0;!s.over&&step<100;step++){
  const p=s.player,found=L.enumerate(s,v,trie,model,seed),bestWord=L.choose(s,found.moves,v,'words');
  const m=seats[p-1]==='planner'?L.plan(s,found.moves,v,trie,model,seed):L.choose(s,found.moves,v,seats[p-1]);
  const n=L.apply(s,m,v,random,trie.words),before=L.totals(s,v),after=L.totals(n,v);
  for(let i=0;i<n.tiles.length;i++){const a=s.tiles[i],b=n.tiles[i];if(b.castle&&a.owner&&b.owner!==a.owner)castleFlips++;if(!firstCentre&&b.castle&&L.centre(b)&&b.owner)firstCentre=b.owner;}
  moves.push({turn:step+1,player:p,word:m?.word||null,path:m?.path||[],wordPoints:m?.wordPoints||0,jokers:m?.jokers||0,
   attack:!!m?.enemy,castleCapture:!!m?.castleCapture,recapture:m?.recapture||0,available:found.words,visits:found.visits,
   sacrifice:m?bestWord.wordPoints-m.wordPoints:0,bestWord:bestWord?{word:bestWord.word,path:bestWord.path,wordPoints:bestWord.wordPoints}:null,
   spatialSacrifice:!!m&&bestWord.wordPoints-m.wordPoints>=2&&(m.land>bestWord.land||m.incomeSwing>bestWord.incomeSwing),
   land:m?.land||0,incomeSwing:m?.incomeSwing||0,scores:after,delta:after.map((x,i)=>x-before[i]),lettersUsed:n.lettersUsed});
  s=n;if(save)states.push(structuredClone(s));if(!half&&s.lettersUsed>=60)half=L.totals(s,v);
 }
 if(!s.over)throw Error('Unfinished game');
 const parts=L.breakdown(s,v),combined=Object.fromEntries([...L.components,'total'].map(k=>[k,parts[0][k]+parts[1][k]])),scores=L.totals(s,v);
 const winner=scores[0]===scores[1]?0:scores[0]>scores[1]?1:2,wordMoves=moves.filter(m=>m.word),leader=half?(half[0]===half[1]?0:half[0]>half[1]?1:2):0;
 const row={variant:v.id,seed,flip,model,seats,starter:s.startingPlayer,scores,winner,parts,combined,turns:moves.length,
  averageLength:mean(wordMoves.map(m=>m.word.length)),attackRate:mean(wordMoves.map(m=>+m.attack)),sacrificeRate:mean(wordMoves.map(m=>+(m.sacrifice>=2))),spatialSacrificeRate:mean(wordMoves.map(m=>+m.spatialSacrifice)),
  castleCaptureRate:mean(wordMoves.map(m=>+m.castleCapture)),castleFlips,refreshRate:1-wordMoves.length/moves.length,jokerRate:mean(wordMoves.map(m=>+(m.jokers>0))),multiJokerRate:mean(wordMoves.map(m=>+(m.jokers>1))),
  longWordRate:mean(wordMoves.map(m=>+(m.word.length>=6))),recapturePoints:s.book.reduce((n,b)=>n+b.recapturePoints,0),repeatRate:1-new Set(wordMoves.map(m=>m.word)).size/wordMoves.length,
  halfLeaderWon:leader?winner===leader:null,firstCentreHolderWin:firstCentre?(winner===0?.5:winner===firstCentre?1:0):null,normalizedMargin:Math.abs(scores[0]-scores[1])/Math.max(...scores),
  cutoffs:0,moves};
 return {row,states};
}
if(!isMainThread&&workerData.output){
 const {id,seedStart,seeds,model,matchups,output,length=10}=workerData,v=L.variants.find(v=>v.id===id),freq=JSON.parse(fs.readFileSync('work/balance/frequency.json'));
 const trie=L.makeTrie(freq,3.5,length),rows=[],replays=[],start=Date.now();
 for(let seed=seedStart;seed<seedStart+seeds;seed++)for(const pair of matchups)for(const flip of [false,true]){
  const save=seed===seedStart&&pair===matchups[0],g=play(v,seed,flip,trie,model,pair,save);rows.push(g.row);if(save)replays.push(g);
  if(rows.length%64===0)parentPort.postMessage({id,progress:rows.length});
 }
 fs.writeFileSync(`${output}/${id}.json`,JSON.stringify({variant:v,vocabulary:trie.words.size,rows,replays}));parentPort.postMessage({id,games:rows.length,seconds:(Date.now()-start)/1000,done:true});
}else if(process.argv[1]?.replaceAll('\\','/').endsWith('/run.mjs')){
 const args=Object.fromEntries(process.argv.slice(2).map(x=>x.replace(/^--/,'').split('=')));
 const stage=args.stage||'smoke',seedStart=Number(args.seedStart||18000),seeds=Number(args.seeds||2),model=args.model||'main',length=Number(args.length||10),matchups=(args.matchups||'balanced:balanced').split(',').map(x=>x.split(':'));
 const output=`work/scoring-2026-10-18/${stage}`;if(fs.existsSync(`${output}/manifest.json`))throw Error('Stage exists; choose a new stage name');fs.mkdirSync(output,{recursive:true});
 const manifest={stage,seedStart,seeds,model,length,matchups,variants:L.variants,node:process.version,started:new Date().toISOString()};fs.writeFileSync(`${output}/manifest.json`,JSON.stringify(manifest,null,2));
 await Promise.all(L.variants.map(v=>new Promise((resolve,reject)=>{const w=new Worker(new URL(import.meta.url),{workerData:{id:v.id,seedStart,seeds,model,length,matchups,output}});w.on('message',x=>console.log(JSON.stringify({stage,...x})));w.on('error',reject);w.on('exit',code=>code?reject(Error('Worker '+code)):resolve());})));
 console.log('Complete '+stage);
}
