// Help text follows each game's saved configuration; no gameplay logic lives here.
export function rulesSections(rules){
  const defended=rules.scoringMode==='defended-final';
  const bonus=rules.wordScoring.lengthBonuses.map((points,length)=>points?`${length} → +${points}`:null).filter(Boolean).join(' · ');
  const sections=[
    ['Words',`Start on your territory and connect ${rules.minimumWordLength}+ letters, including diagonals. Use each tile once. With no territory left, start anywhere.`],
    ['Captures',Number.isFinite(rules.maxEnemyTilesPerWord)?`Your word claims its tiles. Capture up to ${rules.maxEnemyTilesPerWord} opponent tiles per turn.`:'Your word claims every tile it uses. No capture limit.'],
    ['Word points','Add the value on each letter. Jokers score 0.'],
    ['Length bonus',`Letters → bonus: ${bonus}. Each further letter adds ${rules.wordScoring.extraLetterBonus} points.`]
  ];
  if(defended){
    sections.push(['Castles',`Side: +${rules.castleIncome.side} · Centre: +${rules.castleIncome.center}. Earn points for castles you hold through your opponent’s word or refresh. Capturing alone earns nothing.`],
      ['Final territory',`At game end, each tile you own adds ${rules.finalTerritoryPoints} point. No capture deductions or extra castle bonus.`]);
  }else{
    sections.push(['Territory',`Ordinary tiles: ${rules.normalTerritoryPoints} · Side castles: ${rules.castlePoints} · Centre: ${rules.centerCastlePoints??rules.castlePoints}. Points change with ownership.`]);
    if(rules.castleIncome)sections.push(['Castle income',`After both players move, held side castles add ${rules.castleIncome.side} points and the centre adds ${rules.castleIncome.center}, including the final round. Earned income stays yours.`]);
  }
  sections.push(['Letters',`Played letters are replaced; jokers stay. Refresh replaces your owned letters, except jokers, and uses your turn.`],
    ['Game end',`${rules.letterBudget} letters are shared. When they run out, the second player gets a final reply if needed. Highest score wins.${rules.castleIncome?' Starting player is random.':''}`]);
  return sections;
}
