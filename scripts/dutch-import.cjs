// Build-time normalization of listed forms; never stem or infer compounds.
function boardSpelling(value){
  if(typeof value!=='string')return null;
  const source=value.normalize('NFC');
  // Preserve case until names/initialisms have been excluded. Only internal
  // apostrophes/hyphens are spelling separators; spaces/digits are not letters.
  if(!/^\p{Ll}+(?:['’\-‐]\p{Ll}+)*$/u.test(source))return null;
  const word=source.replace(/ĳ/g,'ij').normalize('NFD').replace(/\p{M}/gu,'').replace(/['’\-‐]/g,'');
  return /^[a-z]{3,69}$/.test(word)?word:null;
}
module.exports={boardSpelling};
