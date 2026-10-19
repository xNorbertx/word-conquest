import {configFor,RULES_VERSION} from './rules.mjs';
import english from './versions/dictionary-v1.meta.json' with {type:'json'};
import legacySwedish from './versions/dictionary-sv-v1.meta.json' with {type:'json'};
import swedish from './versions/dictionary-sv-v2.meta.json' with {type:'json'};
import dutch from './versions/dictionary-nl-v1.meta.json' with {type:'json'};
export const LANGUAGES=Object.freeze({
  en:Object.freeze({code:'en',label:'English',rulesVersion:RULES_VERSION,alphabet:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',dictionary:english}),
  sv:Object.freeze({code:'sv',label:'Svenska',rulesVersion:'autumn-sv-v4',alphabet:'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ',dictionary:swedish}),
  nl:Object.freeze({code:'nl',label:'Nederlands',rulesVersion:'autumn-nl-v1',alphabet:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',dictionary:dutch})
});
export const languageFor=code=>typeof code==='string'&&Object.hasOwn(LANGUAGES,code)?LANGUAGES[code]:null;
// Resolve the saved version, never substitute today's dictionary into an old game.
export const languageForRules=version=>{
  const c=configFor(version);if(!c)return null;
  const language=languageFor(c.language||'en');
  return language?.code==='sv'&&['autumn-sv-v1','autumn-sv-v2'].includes(version)
    ?Object.freeze({...language,rulesVersion:version,dictionary:legacySwedish}):language;
};
export const languageLabel=version=>languageForRules(version)?.label||'Unknown language';
export const normalizeJoker=(value,config)=>{
  const alphabet=config.alphabet||LANGUAGES.en.alphabet;
  return [...String(value).normalize('NFC').toUpperCase()].filter(c=>alphabet.includes(c)).slice(0,1).join('');
};
