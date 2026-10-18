import {Engine,configFor} from './domain.mjs';

// Deliberate starting point: records from the current defended-castle scoring.
// Older scoring totals are not comparable and require no migration/backfill.
export const ANALYTICS_RULES=Object.freeze(['autumn-v5','autumn-sv-v4']);
const integer=n=>Number.isSafeInteger(n)&&n>=0;
export function analytics(games,actor){
  const result={games:0,wins:0,losses:0,draws:0,bestGame:null,bestWord:null,longestWord:null,biggestCapture:null,castlesCaptured:0,words:0};
  const record=(key,value,details)=>{if(!result[key]||value>result[key].value)result[key]={value,...details};};
  for(const game of games){
    const seat=game.players.indexOf(actor)+1;
    if(!seat||!ANALYTICS_RULES.includes(game.rules_version)||!['active','completed'].includes(game.status))continue;
    const details={gameId:game.id,language:game.rules_version.includes('-sv-')?'sv':'en'};
    if(game.status==='completed'&&['1','2','draw'].includes(game.result)){
      result.games++;result[game.result==='draw'?'draws':game.result===String(seat)?'wins':'losses']++;
      const score=Engine.scores(game.state,configFor(game.rules_version))[seat-1];
      if(integer(score))record('bestGame',score,{...details,at:game.updated_at});
    }
    for(const turn of game.state.log||[]){
      if(turn.player!==seat||turn.type!=='word'||typeof turn.word!=='string'||!turn.word.length)continue;
      // Count only explicit authoritative fields, never infer historic captures.
      const scoring=turn.scoring;
      if(!scoring||!integer(scoring.letters)||!integer(scoring.lengthBonus)||scoring.wordPoints!==scoring.letters+scoring.lengthBonus||!integer(turn.captured)||!integer(turn.castles))continue;
      result.words++;const word={...details,word:turn.word};
      record('bestWord',scoring.wordPoints,word);
      record('longestWord',[...turn.word].length,word);
      record('biggestCapture',turn.captured,word);
      result.castlesCaptured+=turn.castles;
    }
  }
  return result;
}
