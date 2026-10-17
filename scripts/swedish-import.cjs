// Build-time only. Never infer compounds or inflections during a turn.
const fs=require('node:fs');
const allowedPos=new Set(['nn','vb','av','ab','pn','nl','pp','kn','sn','in','al','ie']);
function boardSpelling(value,minLength=3){
  if(typeof value!=='string')return null;
  const source=value.normalize('NFC');
  // Keep source case: lowering proper names here would make them playable.
  if(source!==source.toLowerCase()||!/^\p{Ll}+$/u.test(source))return null;
  const word=[...source].map(c=>'åäö'.includes(c)?c:c.normalize('NFD').replace(/\p{M}/gu,'')).join('');
  return /^[a-zåäö]{1,69}$/.test(word)&&word.length>=minLength?word:null;
}
function decodeXml(value){
  return value.replace(/&([^;]+);/g,(_,entity)=>{
    const entities={amp:'&',quot:'"',apos:"'",lt:'<',gt:'>'};
    if(Object.hasOwn(entities,entity))return entities[entity];
    if(/^#x[0-9a-f]+$/i.test(entity))return String.fromCodePoint(parseInt(entity.slice(2),16));
    if(/^#\d+$/.test(entity))return String.fromCodePoint(Number(entity.slice(1)));
    throw Error('Unsupported XML entity: '+entity);
  });
}
function features(xml){
  const result={};
  for(const feature of xml.matchAll(/<feat\s+([^>]*?)\s*\/>/g)){
    const attrs=Object.fromEntries([...feature[1].matchAll(/([\w:-]+)="([^"]*)"/g)].map(m=>[m[1],decodeXml(m[2])]));
    if(attrs.att&&attrs.val!==undefined)result[attrs.att]=attrs.val;
  }
  return result;
}
function saldoEntry(xml){
  const lemma=xml.match(/<Lemma>([\s\S]*?)<\/Lemma>/);
  if(!lemma)throw Error('SALDO entry has no lemma');
  const info=features(lemma[1]);
  if(!allowedPos.has(info.partOfSpeech)||!boardSpelling(info.writtenForm,1))return [];
  const forms=[];
  for(const m of xml.matchAll(/<WordForm>([\s\S]*?)<\/WordForm>/g)){
    const f=features(m[1]);
    if(!f.msd||/^(?:c|ci|cm|sms)(?:\s|$)/.test(f.msd)||/\d+:\d+-\d+/.test(f.msd))continue;
    const word=boardSpelling(f.writtenForm);if(word)forms.push(word);
  }
  return forms;
}
async function readSaldo(file,accept){
  let buffer='',entries=0;
  for await(const chunk of fs.createReadStream(file,{encoding:'utf8'})){
    buffer+=chunk;if(/<!DOCTYPE|<!ENTITY/.test(buffer))throw Error('Unexpected XML declaration');
    let end;
    while((end=buffer.indexOf('</LexicalEntry>'))!==-1){
      const start=buffer.indexOf('<LexicalEntry>');if(start<0)throw Error('Malformed SALDO entry');
      const entry=buffer.slice(start+14,end);buffer=buffer.slice(end+15);entries++;
      for(const word of saldoEntry(entry))accept(word);
    }
  }
  if(buffer.includes('<LexicalEntry>')||!buffer.includes('</LexicalResource>'))throw Error('Truncated SALDO XML');
  return entries;
}
module.exports={boardSpelling,decodeXml,saldoEntry,readSaldo};
