import fs from 'node:fs';import path from 'node:path';import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {variants,config,newState,apply,totals,makeTrie,enumerate,choose,merit,tradeoff,rng,hash,Engine} from './lab.mjs';
const average=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
function plan(s,moves,v,trie,seed,noticed){
 const sorted=[...moves].sort((a,b)=>merit(s,b,v)-merit(s,a,v)),options=[],words=new Set();for(const m of sorted)if(!words.has(m.word)){words.add(m.word);options.push(m);if(options.length===3)break;}const word=choose(s,moves,v,'words');if(word&&!options.includes(word))options.push(word);let best=null,value=-Infinity;
 for(const m of options){let total=0;for(let sample=0;sample<2;sample++){const random=rng(hash(`planning/${seed}/${s.turns.join(',')}/${sample}`)),c=config(v);let n=apply(s,m,v,random,trie.words);if(!n.over){const reply=enumerate(n,c,v,trie,{noticed,noticeSeed:seed});if(reply.cutoff)throw Error('Planner reply search truncated');n=apply(n,choose(n,reply.moves,v),v,random,trie.words);}const a=totals(n,c,v);total+=a[s.player-1]-a[2-s.player]+.25*(merit(s,m,v)-m.wordPoints-m.land);}if(total>value){value=total;best=m;}}
 return best;
}
export function play(v,seed,mirror,trie,policies=['balanced','balanced'],noticed=false,save=false){
 const c=config(v),random=rng(hash(seed+'/replacement')),moves=[],states=[];let s=newState(v,seed,mirror),half=null,firstContact=null,reentries=0,cutoffs=0;
 const seats=mirror?[...policies].reverse():policies;
 if(save)states.push(structuredClone(s));
 for(let step=0;!s.over&&step<100;step++){
  const player=s.player,before=totals(s,c,v),found=enumerate(s,c,v,trie,{noticed,noticeSeed:seed}),m=seats[player-1]==='planner'?plan(s,found.moves,v,trie,seed,noticed):choose(s,found.moves,v,seats[player-1]),t=tradeoff(found.moves);
  if(found.cutoff)cutoffs++;if(!s.tiles.some(t=>t.owner===player))reentries++;
  const bestWord=choose(s,found.moves,v,'words');
  if(m){const score=Engine.scoreMove(s,m.path.map(i=>s.tiles[i].id),c);if(score.wordPoints!==m.wordPoints||score.territoryGain+score.enemyLoss+(v.matureTerritory?m.path.reduce((n,i)=>n+(s.tiles[i].owner&&s.tiles[i].owner!==s.player&&s.ages[i]>=1?(s.tiles[i].castle?2:1):0),0):0)!==m.land)throw Error('Solver score disagrees with real engine');}
  if(m?.enemy&&!firstContact)firstContact=step+1;
  const n=apply(s,m,v,random,trie.words),after=totals(n,c,v),capture=m?m.path.filter(i=>s.tiles[i].owner!==player).length:0;
  const turn={n:step+1,player,policy:seats[player-1],word:m?.word||null,path:m?.path.map(i=>s.tiles[i].id)||[],wordPoints:m?.wordPoints||0,landSwing:m?.land||0,enemy:m?.enemy||0,captures:capture,jokers:m?.jokers||0,frequency:m?.frequency||0,available:found.words,noticed:found.noticedWords,tradeoff:t.exists,sacrifice:m?t.maxWord-m.wordPoints:0,territorialSacrifice:!!m&&t.maxWord-m.wordPoints>=2&&m.land>=t.topLand+3,bestWord:bestWord?{word:bestWord.word,points:bestWord.wordPoints,land:bestWord.land,path:bestWord.path.map(i=>s.tiles[i].id)}:null,before,after,income:[...n.income],nodes:found.visits,cutoff:found.cutoff};
  moves.push(turn);s=n;if(save)states.push(structuredClone(s));if(!half&&(c.endCondition==='turns'?s.turns[0]+s.turns[1]>=c.turnsPerPlayer:s.lettersUsed>=c.letterBudget/2))half=after;
 }
 if(!s.over)throw Error('Simulation did not finish');
 const scores=totals(s,c,v),wordTurns=moves.filter(t=>t.word),winner=scores[0]===scores[1]?0:scores[0]>scores[1]?1:2,leader=half[0]===half[1]?0:half[0]>half[1]?1:2;
 const income=s.income.reduce((a,b)=>a+b,0),land=Engine.scoreBreakdown(s,c).reduce((a,b)=>a+b.territory,0),wordTotal=s.wordPoints.reduce((a,b)=>a+b,0);
 const result={variant:v.id,seed,mirror,seats,scores,winner,winnerPolicy:winner?seats[winner-1]:'draw',turns:moves.length,words:wordTurns.length,refreshRate:1-wordTurns.length/moves.length,averageLength:average(wordTurns.map(t=>t.word.length)),averageWord:average(wordTurns.map(t=>t.wordPoints)),averageOptions:average(moves.map(t=>t.available)),lowOptions:moves.filter(t=>t.noticed<5).length/moves.length,tradeoffRate:average(wordTurns.map(t=>+t.tradeoff)),sacrificeRate:average(wordTurns.map(t=>+(t.sacrifice>=2))),territorialSacrificeRate:average(wordTurns.map(t=>+t.territorialSacrifice)),attackRate:average(wordTurns.map(t=>+(t.enemy>0))),enemyCaptures:wordTurns.reduce((n,t)=>n+t.enemy,0),firstContact:firstContact??moves.length+1,noContact:!firstContact,jokerUse:average(wordTurns.map(t=>+(t.jokers>0))),multiJokerUse:average(wordTurns.map(t=>+(t.jokers>1))),farmRate:average(wordTurns.map(t=>+(t.captures===0))),repeatRate:1-new Set(wordTurns.map(t=>t.word)).size/Math.max(1,wordTurns.length),incomeShare:income/(income+land+wordTotal),wordShare:wordTotal/(income+land+wordTotal),landShare:land/(income+land+wordTotal),normalizedMargin:Math.abs(scores[0]-scores[1])/Math.max(...scores),halfLead:Math.abs(half[0]-half[1]),earlyLeaderWon:leader?winner===leader:null,comeback:leader?winner===3-leader:null,reentries,cutoffs,moves};
 return {result,states};
}
if(!isMainThread){
 const {variant,seedStart,seeds,minFrequency,maxLength,noticed,matchups,output,stage}=workerData,v=variants.find(v=>v.id===variant),freq=JSON.parse(fs.readFileSync('work/balance/frequency.json')),trie=makeTrie(freq,minFrequency,maxLength),results=[],replays=[];
 for(let seed=seedStart;seed<seedStart+seeds;seed++)for(const matchup of matchups)for(const mirror of [false,true]){const save=seed===seedStart&&matchup.join(',')===matchups[0].join(',');const game=play(v,seed,mirror,trie,matchup,noticed,save);results.push(game.result);if(save)replays.push({variant:v,seed,mirror,policies:matchup,states:game.states,moves:game.result.moves});}
 fs.writeFileSync(path.join(output,variant+'.json'),JSON.stringify({variant:v,trieWords:trie.words.size,results,replays}));parentPort.postMessage({id:variant,games:results.length,cutoffs:results.reduce((n,g)=>n+g.cutoffs,0),seconds:(Date.now()-workerData.started)/1000});
}else if(process.argv[1]?.endsWith('run.mjs')){
 const args=Object.fromEntries(process.argv.slice(2).map(x=>{const [k,v]=x.replace(/^--/,'').split('=');return[k,v??true];})),stage=args.stage||'screen',chosen=args.variants?args.variants.split(','):variants.map(v=>v.id),seeds=Number(args.seeds||6),seedStart=Number(args.seedStart||100),minFrequency=Number(args.frequency??3.5),maxLength=Number(args.length||9),noticed=args.noticed==='true',jobs=Math.min(4,Number(args.jobs||3)),matchups=(args.matchups||'balanced:balanced').split(',').map(x=>x.split(':'));
 const output='work/balance/'+stage;fs.mkdirSync(output,{recursive:true});const manifest={stage,chosen,seeds,seedStart,minFrequency,maxLength,noticed,jobs,matchups,startedAt:new Date().toISOString(),dictionary:'english-letterpress-v1-5b448e6b1ace',frequency:'wordfreq 3.1.1',node:process.version};fs.writeFileSync(output+'/manifest.json',JSON.stringify(manifest,null,2));
 let cursor=0;async function worker(){while(cursor<chosen.length){const variant=chosen[cursor++];await new Promise((resolve,reject)=>{const w=new Worker(new URL(import.meta.url),{workerData:{variant,seedStart,seeds,minFrequency,maxLength,noticed,matchups,output,stage,started:Date.now()}});w.on('message',m=>{console.log(JSON.stringify(m));resolve();});w.on('error',reject);w.on('exit',code=>{if(code)reject(Error('Worker exited '+code));});});}}
 await Promise.all(Array.from({length:jobs},worker));console.log('Study complete: '+output);
}
