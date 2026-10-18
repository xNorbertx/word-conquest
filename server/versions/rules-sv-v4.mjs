// Same payout timing as English v5; retain Swedish letter values and dictionary.
import base from './rules-sv-v3.mjs';
import defended from './rules-v5.mjs';
export default Object.freeze({...base,scoringMode:defended.scoringMode,
  normalTerritoryPoints:0,castlePoints:0,centerCastlePoints:0,finalTerritoryPoints:1,
  castleIncome:defended.castleIncome,
  wordScoring:Object.freeze({...base.wordScoring,lengthBonuses:defended.wordScoring.lengthBonuses,extraLetterBonus:2})
});
