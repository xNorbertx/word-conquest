// node scripts/pin-dutch.cjs /path/to/wordlist.txt /path/to/LICENSE.txt
// Reproduce this snapshot only. A changed source needs a new dictionary version.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {boardSpelling}=require('./dutch-import.cjs');
const sourceCommit='b250510dda431785f962019167d1415198ff3905';
const sourceSha256='12e5fb5e3c73840b583b30016926d1f63a75e9bf1652a3a6634b2ba7c49ad7be';
const licenseSha256='4633afec7da0033afad9271d3d4e2d5e531c255339517d65ffe15fbf6e4292d8';
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const raw=fs.readFileSync(process.argv[2]),license=fs.readFileSync(process.argv[3]);
if(hash(raw)!==sourceSha256||hash(license)!==licenseSha256)throw Error('OpenTaal source/license checksum mismatch');
const words=[...new Set(raw.toString('utf8').split(/\r?\n/).map(boardSpelling).filter(Boolean))].sort();
const content=JSON.stringify(words),sha256=hash(content);
const counts=Object.fromEntries([...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(c=>[c,0]));
for(const word of words)for(const c of word.toUpperCase())counts[c]++;
const total=Object.values(counts).reduce((a,b)=>a+b,0);
const letterWeights=Object.fromEntries(Object.entries(counts).map(([c,n])=>[c,Number((n/total*100).toFixed(5))]));
const metadata={version:'dutch-opentaal-v1-'+sha256.slice(0,12),language:'nl',sha256,words:words.length,
  source:'OpenTaal/opentaal-wordlist',sourceCommit,sourceSha256,licenseSha256,
  sourceUrl:`https://github.com/OpenTaal/opentaal-wordlist/tree/${sourceCommit}`,license:'BSD-3-Clause',
  policy:'Listed lowercase forms from wordlist.txt only; 3–69 A–Z letters after accent folding, IJ ligature expansion, and removal of internal apostrophes/hyphens. Capitalized names, initialisms, phrases, digits, symbols and dangling word fragments are excluded. IJ uses I + J. No runtime stemming, inferred compounds or corrections import. This is not a curated tournament or family-safe dictionary.',letterWeights};
const notice=`Dutch dictionary: OpenTaal (https://opentaal.org)\n${metadata.sourceUrl}\nSelected licence: BSD-3-Clause (upstream also offers CC BY 3.0).\nModified for Word Conquest: ${metadata.policy}\nSource SHA-256: ${sourceSha256}\nSnapshot SHA-256: ${sha256}\n`;
for(const [name,data]of [['dictionary-nl-v1.json',content],['dictionary-nl-v1.meta.json',JSON.stringify(metadata,null,2)+'\n'],['DUTCH-NOTICE.txt',notice],['DUTCH-LICENSE.txt',license]]){
 const file=path.join(__dirname,'../server/versions',name);
 if(fs.existsSync(file)&&!fs.readFileSync(file).equals(Buffer.from(data)))throw Error('Refusing to change pinned file: '+name);
 fs.writeFileSync(file,data);
}
console.log(JSON.stringify({version:metadata.version,words:words.length,bytes:Buffer.byteLength(content),letterWeights}));
