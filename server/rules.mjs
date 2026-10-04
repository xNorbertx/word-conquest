import classic from './versions/rules-v1.mjs';
import conquest from './versions/rules-v2.mjs';
export const LEGACY_RULES_VERSION='autumn-v1';
export const RULES_VERSION='autumn-v2';
const rules=Object.freeze({
  'autumn-v1':Object.freeze({...classic,dictionaryEnabled:true}),
  'autumn-v2':Object.freeze({...conquest,dictionaryEnabled:true})
});
export const SUPPORTED_RULES=Object.freeze(Object.keys(rules));
export const configFor=version=>typeof version==='string'&&Object.hasOwn(rules,version)?rules[version]:null;
export const config=rules[RULES_VERSION];
export const rulesLabel=version=>({'autumn-v1':'Classic · 3 captures','autumn-v2':'Unlimited captures'}[version]||'Other rules');
export const captureRule=rules=>Number.isFinite(rules.maxEnemyTilesPerWord)?`Capture up to ${rules.maxEnemyTilesPerWord} opponent tiles per word.`:'No capture limit: every opponent tile in your word becomes yours.';
