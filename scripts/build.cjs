const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..');process.chdir(root);
const compressedDictionaries={name:'server-dictionaries',setup(build){build.onLoad({filter:/dictionary(?:-sv)?-v\d+\.json$/},args=>({contents:'export default '+JSON.stringify(require('./dictionary-pack.cjs').packDictionary(JSON.parse(fs.readFileSync(args.path,'utf8'))))+';',loader:'js'}));}};
const meta=require('../server/versions/dictionary-v1.meta.json');
for(const [file,hash] of Object.entries(require('../server/versions/rules-integrity.json'))){
  const source=fs.readFileSync(path.join(root,'server/versions',file),'utf8').replace(/\r\n/g,'\n');
  if(crypto.createHash('sha256').update(source).digest('hex')!==hash)throw Error('Pinned rules integrity mismatch: '+file);
}
if(crypto.createHash('sha256').update(fs.readFileSync('server/versions/dictionary-v1.json')).digest('hex')!==meta.sha256)throw new Error('Pinned dictionary hash mismatch');
const swedish=require('../server/versions/dictionary-sv-v1.meta.json');
if(crypto.createHash('sha256').update(fs.readFileSync('server/versions/dictionary-sv-v1.json')).digest('hex')!==swedish.sha256)throw new Error('Pinned Swedish dictionary hash mismatch');
const expandedSwedish=require('../server/versions/dictionary-sv-v2.meta.json');
if(crypto.createHash('sha256').update(fs.readFileSync('server/versions/dictionary-sv-v2.json')).digest('hex')!==expandedSwedish.sha256)throw new Error('Expanded Swedish dictionary hash mismatch');
fs.mkdirSync('dist/online',{recursive:true});fs.mkdirSync('supabase/functions/_shared',{recursive:true});
for(const file of ['index.html','style.css','app.js','config.js','engine.js'])fs.copyFileSync(file,path.join('dist',file));
for(const file of ['index.html','online.css'])fs.copyFileSync('online/'+file,'dist/online/'+file);
fs.copyFileSync(fs.existsSync('online/config.local.js')?'online/config.local.js':'online/config.example.js','dist/online/config.local.js');
fs.copyFileSync('server/versions/DICTIONARY-LICENSE.txt','dist/online/dictionary-license.txt');
if(fs.existsSync('server/versions/LETTERPRESS-LICENSE.txt'))fs.appendFileSync('dist/online/dictionary-license.txt','\n'+fs.readFileSync('server/versions/LETTERPRESS-LICENSE.txt','utf8'));
fs.appendFileSync('dist/online/dictionary-license.txt','\n\nSwedish dictionary: martinlindhe/wordlist_swedish\n'+swedish.sourceUrl+'\nFiltered to lowercase NFC words of 3–69 letters in A–Z/Å/Ä/Ö.\n\n'+fs.readFileSync('server/versions/SWEDISH-LICENSE.txt','utf8'));
fs.appendFileSync('dist/online/dictionary-license.txt','\n\n'+fs.readFileSync('server/versions/SWEDISH-EXPANDED-NOTICE.txt','utf8')+'\n'+fs.readFileSync('server/versions/CC-BY-4.0.txt','utf8'));
Promise.all([
  esbuild.build({entryPoints:['online/app.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',define:{module:'undefined'},outfile:'dist/online/app.js',minify:false}),
  esbuild.build({entryPoints:['server/api.mjs'],bundle:true,format:'esm',platform:'neutral',target:'es2022',define:{module:'undefined'},plugins:[compressedDictionaries],outfile:'supabase/functions/_shared/api.mjs'}),
  esbuild.build({entryPoints:['server/notify.mjs'],bundle:true,format:'esm',platform:'neutral',target:'es2022',outfile:'supabase/functions/_shared/notify.mjs'}),
  esbuild.build({entryPoints:['server/push.mjs'],bundle:true,format:'esm',platform:'neutral',target:'es2022',outfile:'supabase/functions/_shared/push.mjs'})
]).then(()=>console.log('Built prototype, online client and server function bundles.')).catch(e=>{console.error(e);process.exitCode=1;});
