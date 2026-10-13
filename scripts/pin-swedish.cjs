// Supply the downloaded upstream files; never rewrite a released snapshot.
// node scripts/pin-swedish.cjs /path/to/swe_wordlist /path/to/LICENSE
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sourceCommit='c1c4464df5d2232fcdd04f2b17bc491aba3cda27';
const sourceSha256='ed072a895de54b96fa256e7d6480408c61fc75d1160bfc6bcad0c95b83b3d194';
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const raw=fs.readFileSync(process.argv[2]),license=fs.readFileSync(process.argv[3],'utf8');
if(hash(raw)!==sourceSha256)throw Error('Swedish source checksum mismatch');
if(!license.includes('Copyright (c) 2014 Martin Lindhe')||!license.includes('MIT License'))throw Error('Unexpected dictionary licence');
const words=[...new Set(raw.toString('utf8').split(/\r?\n/).map(w=>w.normalize('NFC')).filter(w=>/^[a-zåäö]{3,69}$/.test(w)))].sort();
const content=JSON.stringify(words),sha256=hash(content);
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ',counts=Object.fromEntries([...alphabet].map(c=>[c,0]));
for(const word of words)for(const c of word.toUpperCase())counts[c]++;
const total=Object.values(counts).reduce((a,b)=>a+b,0);
const weights=Object.fromEntries(Object.entries(counts).map(([c,n])=>[c,Number((n/total*100).toFixed(5))]));
const metadata={version:'swedish-lindhe-v1-'+sha256.slice(0,12),language:'sv',sha256,words:words.length,source:'martinlindhe/wordlist_swedish',sourceCommit,sourceSha256,
  sourceUrl:`https://github.com/martinlindhe/wordlist_swedish/tree/${sourceCommit}`,license:'MIT',
  policy:'Exact listed lowercase forms, NFC, 3–69 letters in A–Z/Å/Ä/Ö. No name additions, runtime stemming, accent folding or generated compounds. Inflections and compounds are accepted only when listed. The author describes the source as excluding names; this is not a curated tournament or family-safe dictionary.',
  letterWeights:weights};
const dir=path.join(__dirname,'../server/versions');
for(const [name,text]of [['dictionary-sv-v1.json',content],['dictionary-sv-v1.meta.json',JSON.stringify(metadata,null,2)+'\n'],['SWEDISH-LICENSE.txt',license]]){
  const file=path.join(dir,name);if(fs.existsSync(file)&&fs.readFileSync(file,'utf8')!==text)throw Error('Refusing to change pinned file: '+name);fs.writeFileSync(file,text);
}
console.log(JSON.stringify({version:metadata.version,words:words.length,bytes:Buffer.byteLength(content),letterWeights:weights}));
