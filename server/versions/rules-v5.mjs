// Words + defended castles + final territory. Immutable once published.
import base from './rules-v4.mjs';
export default Object.freeze({...base,scoringMode:'defended-final',
  normalTerritoryPoints:0,castlePoints:0,centerCastlePoints:0,finalTerritoryPoints:1,
  castleIncome:Object.freeze({side:3,center:5}),
  wordScoring:Object.freeze({
    letterGroups:Object.freeze([
      Object.freeze({letters:'AEILNORSTU',points:1}),
      Object.freeze({letters:'DG',points:2}),
      Object.freeze({letters:'BCMP',points:3}),
      Object.freeze({letters:'FHKVWY',points:4}),
      Object.freeze({letters:'JQXZ',points:5})
    ]),jokerPoints:0,lengthBonuses:Object.freeze([0,0,0,0,0,0,1,3,5]),extraLetterBonus:2
  })
});
