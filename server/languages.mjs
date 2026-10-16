import {configFor,RULES_VERSION} from './rules.mjs';
import english from './versions/dictionary-v1.meta.json' with {type:'json'};
import swedish from './versions/dictionary-sv-v1.meta.json' with {type:'json'};
export const LANGUAGES=Object.freeze({
  en:Object.freeze({code:'en',label:'English',rulesVersion:RULES_VERSION,alphabet:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',dictionary:english}),
  sv:Object.freeze({code:'sv',label:'Svenska',rulesVersion:'autumn-sv-v2',alphabet:'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ',dictionary:swedish})
});
export const languageFor=code=>typeof code==='string'&&Object.hasOwn(LANGUAGES,code)?LANGUAGES[code]:null;
export const languageForRules=version=>{const c=configFor(version);return c?languageFor(c.language||'en'):null;};
export const languageLabel=version=>languageForRules(version)?.label||'Unknown language';
export const normalizeJoker=(value,config)=>{
  const alphabet=config.alphabet||LANGUAGES.en.alphabet;
  return [...String(value).normalize('NFC').toUpperCase()].filter(c=>alphabet.includes(c)).slice(0,1).join('');
};
