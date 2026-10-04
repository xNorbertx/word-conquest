import fs from 'node:fs';import {play} from './run.mjs';import {variants,makeTrie} from './lab.mjs';
const output=[];
for(const id of ['baseline','land2','combo_land4']){
 const d=JSON.parse(fs.readFileSync('work/balance/holdout/'+id+'.json'));let picked=null;
 for(const g of d.results){const t=g.moves.at(-1),lettersBefore=g.moves.slice(0,-1).reduce((n,t)=>n+t.path.length,0);if(!t.word||!t.bestWord||lettersBefore<120||t.sacrifice<2)continue;const actor=t.player-1,chosen=t.after[actor]-t.after[1-actor],alternative=t.before[actor]-t.before[1-actor]+t.bestWord.points+t.bestWord.land;if(chosen>0&&alternative<0){picked={g,t,chosen,alternative};break;}}
 if(picked){const {g,t,chosen,alternative}=picked,v=variants.find(v=>v.id===id),trie=makeTrie(JSON.parse(fs.readFileSync('work/balance/frequency.json'))),policies=g.mirror?[...g.seats].reverse():g.seats;const replay=play(v,g.seed,g.mirror,trie,policies,true,true);output.push({variant:v,seed:g.seed,mirror:g.mirror,policies,states:replay.states,moves:replay.result.moves,example:{chosenMargin:chosen,alternativeMargin:alternative,turn:t.n}});console.log(JSON.stringify({id,seed:g.seed,turn:t.n,chosen:t.word,points:t.wordPoints,land:t.landSwing,alternative:t.bestWord,chosenMargin:chosen,alternativeMargin:alternative}));}
}
fs.writeFileSync('work/balance/endgame-examples.json',JSON.stringify(output));
