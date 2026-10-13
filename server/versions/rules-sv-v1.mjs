// Swedish keeps autumn-v3 mechanics. Language/scoring changes require a new version.
import base from './rules-v3.mjs';
import dictionary from './dictionary-sv-v1.meta.json' with {type:'json'};
export default Object.freeze({...base,language:'sv',alphabet:'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ',
  letterBalance:Object.freeze({...base.letterBalance,vowels:'AEIOUYÅÄÖ',flexible:'RSTLND',ordinary:'BCFGHJKMPV',rare:'QWXZ'}),
  wordScoring:Object.freeze({...base.wordScoring,letterGroups:Object.freeze([
    {letters:'AEIOUYÅÄÖRSTLND',points:1},{letters:'BCFGHJKMPV',points:2},{letters:'QWXZ',points:4}
  ])}),
  // Relative letter occurrences in the pinned Swedish list; category quotas stay fixed.
  letterWeights:Object.freeze({...dictionary.letterWeights})
});
