// Word lists are server-only. Construct only the dictionary needed by a turn.
import {LANGUAGES} from './languages.mjs';
import legacySwedish from './versions/dictionary-sv-v1.meta.json' with {type:'json'};
const loaders=new Map([
  [LANGUAGES.nl.dictionary.version,()=>import('./versions/dictionary-nl-v1.json',{with:{type:'json'}})],
  [LANGUAGES.en.dictionary.version,()=>import('./versions/dictionary-v1.json',{with:{type:'json'}})],
  [legacySwedish.version,()=>import('./versions/dictionary-sv-v1.json',{with:{type:'json'}})],
  [LANGUAGES.sv.dictionary.version,()=>import('./versions/dictionary-sv-v2.json',{with:{type:'json'}})]
]),sets=new Map();
// Each compressed row stores the shared-prefix length and remaining letters.
// Decode without a full JSON parse or million-element temporary array.
function* unpackRows(text,size){
  let start=0,count=0,previous='';
  while(start<text.length){
    const newline=text.indexOf('\n',start),end=newline<0?text.length:newline;
    const prefix=text.charCodeAt(start)-33;
    if(prefix<0||prefix>previous.length||end<=start+1)throw Error('Invalid dictionary row');
    const word=previous.slice(0,prefix)+text.slice(start+1,end);
    if(word<=previous||!/^[a-zåäö]{3,69}$/.test(word))throw Error('Invalid dictionary spelling');
    previous=word;count++;start=end+1;yield {word,next:start};
  }
  if(count!==size)throw Error('Incomplete dictionary');
}
// Source/test imports stay arrays. The production build uses the compact payload.
async function dictionaryText(payload){
  if(payload?.format!=='front-gzip-v1'||!Number.isSafeInteger(payload.size)||payload.size<1||typeof payload.data!=='string')throw Error('Invalid dictionary format');
  // Avoid Uint8Array.from's large intermediate iterator allocation.
  const binary=atob(payload.data),bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
}
export async function dictionaryWords(payload){
  if(Array.isArray(payload))return payload;
  const text=await dictionaryText(payload);
  return (function*(){for(const {word} of unpackRows(text,payload.size))yield word;})();
}
// Keep one search anchor per 64 words, not a Set of nearly a million strings.
// Membership is exact: binary-search an anchor, then decode at most 63 rows.
export async function dictionaryIndex(payload){
  if(Array.isArray(payload))return new Set(payload);
  const text=await dictionaryText(payload),stride=64,anchors=[];
  const offsets=new Uint32Array(Math.ceil(payload.size/stride));let row=0;
  for(const {word,next} of unpackRows(text,payload.size)){
    if(row%stride===0){offsets[anchors.length]=next;anchors.push(word);}row++;
  }
  return Object.freeze({size:payload.size,has(value){
    if(typeof value!=='string')return false;
    let low=0,high=anchors.length-1,bucket=-1;
    while(low<=high){const mid=(low+high)>>>1;if(anchors[mid]<=value){bucket=mid;low=mid+1;}else high=mid-1;}
    if(bucket<0)return false;
    let word=anchors[bucket],start=offsets[bucket];if(word===value)return true;
    for(let i=1;i<stride&&bucket*stride+i<payload.size;i++){
      const newline=text.indexOf('\n',start),end=newline<0?text.length:newline;
      word=word.slice(0,text.charCodeAt(start)-33)+text.slice(start+1,end);
      if(word>=value)return word===value;start=end+1;
    }
    return false;
  }});
}
export async function dictionaryFor(version){
  if(!loaders.has(version))return null;
  if(!sets.has(version))sets.set(version,loaders.get(version)().then(m=>dictionaryIndex(m.default)).catch(error=>{sets.delete(version);throw error;}));
  return sets.get(version);
}
