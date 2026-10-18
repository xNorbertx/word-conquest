import classic from './versions/rules-v1.mjs';
import conquest from './versions/rules-v2.mjs';
import castles from './versions/rules-v3.mjs';
import swedish from './versions/rules-sv-v1.mjs';
import balanced from './versions/rules-v4.mjs';
import balancedSwedish from './versions/rules-sv-v2.mjs';
import expandedSwedish from './versions/rules-sv-v3.mjs';
import defended from './versions/rules-v5.mjs';
import defendedSwedish from './versions/rules-sv-v4.mjs';
export const LEGACY_RULES_VERSION='autumn-v1';
export const RULES_VERSION='autumn-v5';
const rules=Object.freeze({
  'autumn-v1':Object.freeze({...classic,dictionaryEnabled:true}),
  'autumn-v2':Object.freeze({...conquest,dictionaryEnabled:true}),
  'autumn-v3':Object.freeze({...castles,dictionaryEnabled:true}),
  'autumn-sv-v1':Object.freeze({...swedish,dictionaryEnabled:true}),
  'autumn-v4':Object.freeze({...balanced,dictionaryEnabled:true}),
  'autumn-sv-v2':Object.freeze({...balancedSwedish,dictionaryEnabled:true}),
  'autumn-sv-v3':Object.freeze({...expandedSwedish,dictionaryEnabled:true}),
  'autumn-v5':Object.freeze({...defended,dictionaryEnabled:true}),
  'autumn-sv-v4':Object.freeze({...defendedSwedish,dictionaryEnabled:true})
});
export const SUPPORTED_RULES=Object.freeze(Object.keys(rules));
export const configFor=version=>typeof version==='string'&&Object.hasOwn(rules,version)?rules[version]:null;
export const config=rules[RULES_VERSION];
export const rulesLabel=version=>({'autumn-v5':'Defended castles 3 / 5','autumn-sv-v4':'Defended castles 3 / 5','autumn-v1':'Classic · 3 captures','autumn-v2':'Unlimited captures','autumn-v3':'Castle income 2 / 4','autumn-sv-v1':'Castle income 2 / 4','autumn-v4':'Castle income 2 / 4','autumn-sv-v2':'Castle income 2 / 4','autumn-sv-v3':'Castle income 2 / 4'}[version]||'Other rules');
export const captureRule=rules=>Number.isFinite(rules.maxEnemyTilesPerWord)?`Capture up to ${rules.maxEnemyTilesPerWord} opponent tiles per word.`:'No capture limit: every opponent tile in your word becomes yours.';

export const castleRule=rules=>rules.scoringMode==='defended-final'?'Side castles earn 3 and the centre earns 5 after surviving an opponent’s word or refresh. Every owned tile is worth 1 point at the finish; castles have no extra final bonus.':rules.castleIncome?`Side castles earn ${rules.castleIncome.side} each round; the centre earns ${rules.castleIncome.center}. Final castle values are ${rules.castlePoints} and ${rules.centerCastlePoints}.`:`Castles are worth ${rules.castlePoints} territory points.`;
