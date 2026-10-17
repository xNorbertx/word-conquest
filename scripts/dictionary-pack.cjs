// Build-time transport only. Pinned JSON sources and their hashes stay unchanged.
const {gzipSync}=require('node:zlib');
function packDictionary(words){
  let previous='';
  const rows=words.map(word=>{
    if(!/^[a-zåäö]{3,69}$/.test(word)||word<=previous)throw Error('Dictionary must be sorted, unique board spellings');
    let prefix=0;while(prefix<previous.length&&word[prefix]===previous[prefix])prefix++;
    const row=String.fromCharCode(33+prefix)+word.slice(prefix);previous=word;return row;
  });
  return {format:'front-gzip-v1',size:words.length,data:gzipSync(rows.join('\n'),{level:9}).toString('base64')};
}
module.exports={packDictionary};
