// Word lists are server-only. Construct only the dictionary needed by a turn.
import {LANGUAGES} from './languages.mjs';
const loaders=new Map([
  [LANGUAGES.en.dictionary.version,()=>import('./versions/dictionary-v1.json',{with:{type:'json'}})],
  [LANGUAGES.sv.dictionary.version,()=>import('./versions/dictionary-sv-v1.json',{with:{type:'json'}})]
]),sets=new Map();
// The deployment bundle stores gzip/base64; source/test imports stay plain arrays.
// Inflate only the language requested by a turn, never during list/board reads.
export async function dictionaryWords(payload){
  if(Array.isArray(payload))return payload;
  const bytes=Uint8Array.from(atob(payload),c=>c.charCodeAt(0));
  const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return JSON.parse(await new Response(stream).text());
}
export async function dictionaryFor(version){
  if(!loaders.has(version))return null;
  if(!sets.has(version))sets.set(version,loaders.get(version)().then(m=>dictionaryWords(m.default)).then(words=>new Set(words)).catch(error=>{sets.delete(version);throw error;}));
  return sets.get(version);
}
