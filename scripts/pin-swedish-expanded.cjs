// node scripts/pin-swedish-expanded.cjs <saldom.xml> <swe_wordlist> [output-directory]
// Source inputs are pinned; generating a later dictionary needs a new script/version.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {readSaldo,boardSpelling}=require('./swedish-import.cjs');
const sourceHash='8e484c61722e6ac1b40812aa09d9bea56852c178a95754d7406e752943ea05b2';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function pin(input,upstream,output,legacyFile){
  const hash=crypto.createHash('sha256');for await(const part of fs.createReadStream(input))hash.update(part);
  if(hash.digest('hex')!==sourceHash)throw Error('SALDO input checksum mismatch');
  const legacy=fs.readFileSync(legacyFile);
  if(sha(legacy)!=='f214ceab2ae3d5fc328a278537979c8833ab851dafc8d0a5214be47530d629fa')throw Error('Legacy dictionary checksum mismatch');
  const original=fs.readFileSync(upstream);
  if(sha(original)!=='ed072a895de54b96fa256e7d6480408c61fc75d1160bfc6bcad0c95b83b3d194')throw Error('Lindhe source checksum mismatch');
  const words=new Set(JSON.parse(legacy)),lindhe=new Set(original.toString('utf8').split(/\r?\n/).map(w=>boardSpelling(w)).filter(Boolean));
  for(const w of lindhe)words.add(w);
  const saldo=new Set(),entries=await readSaldo(input,w=>saldo.add(w));
  if(entries!==128036)throw Error('Incomplete SALDO entry count');
  for(const w of saldo)words.add(w);
  for(const w of ['moske','moskeerna','obokad','obokat','obokade','katter','sprungit','müsli'.replace('ü','u')])if(!words.has(w))throw Error('Missing regression word: '+w);
  const content=JSON.stringify([...words].sort()),digest=sha(content);
  const meta={version:'swedish-expanded-v2-'+digest.slice(0,12),language:'sv',sha256:digest,words:words.size,
    sources:[{name:'Martin Lindhe Swedish list',legacyVersion:'swedish-lindhe-v1-f214ceab2ae3',legacySha256:sha(legacy),sha256:sha(original),acceptedForms:lindhe.size,license:'MIT',url:'https://github.com/martinlindhe/wordlist_swedish/tree/c1c4464df5d2232fcdd04f2b17bc491aba3cda27'},
      {name:"SALDO's morphology",date:'2017-09-19',sha256:sourceHash,entries,acceptedForms:saldo.size,license:'CC-BY-4.0',url:'https://svn.spraakbanken.gu.se/sb-arkiv/pub/lmf/saldom/saldom.xml',doi:'https://doi.org/10.23695/agcm-ny22',attribution:'Språkbanken (2017). SALDO’s morphology. Enriched and distributed by Språkbanken.'}],
    addedWords:words.size-JSON.parse(legacy).length,
    policy:'Union of the retained legacy Swedish list, accent-normalized Lindhe source and listed SALDO full forms. SALDO excludes proper nouns, abbreviations, multiword entries and compound-only/affix forms. Lowercase NFC sources only, 3–69 board letters. Decomposable accents are removed (é→e, ü→u, ñ→n, ç→c); å/ä/ö remain distinct. No punctuation deletion, inferred compounds or runtime stemming. Not an official SAOL/Wordfeud list; uncommon/offensive words can occur.',
    saol:{included:false,reason:'Catalogue lists CC-BY-4.0; documented Karp-s API denied access to saol15-ord on 2026-10-17. Awaiting authorised export.'}};
  fs.mkdirSync(output,{recursive:true});
  for(const [file,data] of [['dictionary-sv-v2.json',content],['dictionary-sv-v2.meta.json',JSON.stringify(meta,null,2)+'\n']]){
    const dest=path.join(output,file);if(fs.existsSync(dest)&&fs.readFileSync(dest,'utf8')!==data)throw Error('Refusing to overwrite a different pinned snapshot: '+file);fs.writeFileSync(dest,data);
  }
  return meta;
}
module.exports={pin};
if(require.main===module){const root=path.resolve(__dirname,'..');pin(process.argv[2],process.argv[3],process.argv[4]||path.join(root,'server/versions'),path.join(root,'server/versions/dictionary-sv-v1.json')).then(m=>console.log(JSON.stringify(m,null,2))).catch(e=>{console.error(e.message);process.exitCode=1;});}
