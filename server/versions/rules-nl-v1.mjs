// Immutable Dutch rules: current defended castles, with Dutch letters.
import base from './rules-v5.mjs';
import dictionary from './dictionary-nl-v1.meta.json' with {type:'json'};
export default Object.freeze({...base,language:'nl',alphabet:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  // IJ is two tiles. J is ordinary, so common IJ words remain accessible.
  letterBalance:Object.freeze({...base.letterBalance,vowels:'AEIOU',flexible:'RSTLNDG',ordinary:'BCFHJKMPVW',rare:'QXYZ'}),
  letterWeights:Object.freeze({...dictionary.letterWeights}),
  wordScoring:Object.freeze({...base.wordScoring,letterGroups:Object.freeze([
    {letters:'AEINORT',points:1},{letters:'DGLSU',points:2},
    {letters:'BHKMP',points:3},{letters:'CFJVWZ',points:4},{letters:'QXY',points:5}
  ])})
});
