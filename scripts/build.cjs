const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..');process.chdir(root);
const meta=require('../server/versions/dictionary-v1.meta.json');
if(crypto.createHash('sha256').update(fs.readFileSync('server/versions/dictionary-v1.json')).digest('hex')!==meta.sha256)throw new Error('Pinned dictionary hash mismatch');
fs.mkdirSync('dist/online',{recursive:true});fs.mkdirSync('supabase/functions/_shared',{recursive:true});
for(const file of ['index.html','style.css','app.js','config.js','engine.js'])fs.copyFileSync(file,path.join('dist',file));
for(const file of ['index.html','online.css'])fs.copyFileSync('online/'+file,'dist/online/'+file);
fs.copyFileSync(fs.existsSync('online/config.local.js')?'online/config.local.js':'online/config.example.js','dist/online/config.local.js');
fs.copyFileSync('server/versions/DICTIONARY-LICENSE.txt','dist/online/dictionary-license.txt');
if(fs.existsSync('server/versions/LETTERPRESS-LICENSE.txt'))fs.appendFileSync('dist/online/dictionary-license.txt','\n'+fs.readFileSync('server/versions/LETTERPRESS-LICENSE.txt','utf8'));
Promise.all([
  esbuild.build({entryPoints:['online/app.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',define:{module:'undefined'},outfile:'dist/online/app.js',minify:false}),
  esbuild.build({entryPoints:['server/api.mjs'],bundle:true,format:'esm',platform:'neutral',target:'es2022',define:{module:'undefined'},outfile:'supabase/functions/_shared/api.mjs'}),
  esbuild.build({entryPoints:['server/notify.mjs'],bundle:true,format:'esm',platform:'neutral',target:'es2022',outfile:'supabase/functions/_shared/notify.mjs'})
]).then(()=>console.log('Built prototype, online client and server function bundles.')).catch(e=>{console.error(e);process.exitCode=1;});
