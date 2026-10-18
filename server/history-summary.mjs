// History needs scores, not tile replacements or board coordinates. Opt-in keeps
// existing clients' full receipts compatible; stored audit data is untouched.
export function compactHistory(history){
  return history.map(({revision,recap:r})=>({revision,recap:{action:r.action,player:r.player,at:r.at,word:r.word,
    ...(r.score?{score:{letters:r.score.letters,lengthBonus:r.score.lengthBonus,wordPoints:r.score.wordPoints,territoryGain:r.score.territoryGain,enemyLoss:r.score.enemyLoss}}:{}),
    income:r.income,incomeTiming:r.incomeTiming,finalTerritory:r.finalTerritory,totalsBefore:r.totalsBefore,totalsAfter:r.totalsAfter}}));
}
