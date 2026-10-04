// Counterfactual continuation check. Samples replacement randomness, never the future game RNG.
import fs from 'node:fs';import {variants,config,apply,totals,makeTrie,enumerate,choose,rng,hash} from './lab.mjs';
const frequency=JSON.parse(fs.readFileSync('work/balance/frequency.json')),trie=makeTrie(frequency),results=[];
for(const id of ['baseline','land2','income_castles','combo_land4']){
 const source=JSON.parse(fs.readFileSync('work/balance/holdout/'+id+'.json')),v=variants.find(v=>v.id===id),c=config(v);
 for(const replay of source.replays){
  // First qualifying early/mid-game sacrifice, selected without knowing the outcome.
  const turn=replay.moves.find(t=>t.sacrifice>=3&&t.landSwing>=t.bestWord.land+4&&t.n<18);if(!turn)continue;
  const state=replay.states[turn.n-1],actor=state.player;
  function forced(word,ids){return {word,path:ids.map(id=>state.tiles.findIndex(t=>t.id===id))};}
  const options=[forced(turn.word,turn.path),forced(turn.bestWord.word,turn.bestWord.path)],branches=[[],[]];
  for(let trial=0;trial<64;trial++)for(let branch=0;branch<2;branch++){
   const random=rng(hash(`${id}/${replay.seed}/${turn.n}/${trial}`));let s=apply(state,options[branch],v,random,trie.words);
   for(let step=0;!s.over&&step<100;step++){const found=enumerate(s,c,v,trie,{noticed:true,noticeSeed:hash(`${replay.seed}/${trial}`)});if(found.cutoff)throw Error('Incomplete counterfactual search');s=apply(s,choose(s,found.moves,v,'balanced'),v,random,trie.words);}
   const score=totals(s,c,v);branches[branch].push(score[actor-1]-score[2-actor]);
  }
  const mean=a=>a.reduce((a,b)=>a+b,0)/a.length,diff=branches[0].map((v,i)=>v-branches[1][i]);
  results.push({variant:id,seed:replay.seed,mirror:replay.mirror,turn:turn.n,actor,chosen:{word:turn.word,wordPoints:turn.wordPoints,land:turn.landSwing,path:turn.path},alternative:turn.bestWord,trials:64,chosenMeanMargin:mean(branches[0]),alternativeMeanMargin:mean(branches[1]),chosenWinRate:mean(branches[0].map(v=>v>0?1:v===0?.5:0)),alternativeWinRate:mean(branches[1].map(v=>v>0?1:v===0?.5:0)),pairedMeanDifference:mean(diff),pairedSE:Math.sqrt(diff.reduce((n,d)=>n+(d-mean(diff))**2,0)/(diff.length-1)/diff.length)});
  console.log(JSON.stringify(results.at(-1)));
 }
}
fs.writeFileSync('work/balance/counterfactual.json',JSON.stringify(results,null,2));
