const assert=require('node:assert/strict'),crypto=require('node:crypto');
(async()=>{
 const root=require('node:url').pathToFileURL(require('node:path').resolve(__dirname,'..')).href,d=await import(root+'/server/domain.mjs'),l=await import(root+'/server/languages.mjs');
 const {createHandler}=await import(root+'/supabase/functions/_shared/api.mjs');
 const players=[crypto.randomUUID(),crypto.randomUUID()];let game;
 const db={auth:{getUser:async()=>({data:{user:{id:players[0]}}})},from:table=>{
  const q={select:()=>q,eq:()=>q,contains:()=>q,single:async()=>({data:{id:players[0],username:'Test'}}),maybeSingle:async()=>({data:table==='games'?game:null}),in:async()=>({data:players.map(id=>({id,display_name:'Test'}))})};return q;
 },rpc:async(name,args)=>name==='wc_rate_limit'?{data:true}:{data:{game:args.p_next,recap:args.p_recap,replayed:false}}};
 const handler=createHandler(db),checks=[];
 for(const [version,word] of [['autumn-nl-v1','FIETS'],['autumn-nl-v1','CAFE'],['autumn-nl-v1','ZEEEN'],['autumn-v4','CAT'],['autumn-sv-v2','FÅR'],['autumn-sv-v3','MOSKEERNA'],['autumn-sv-v3','OBOKAD'],['autumn-sv-v3','OBOKAT']]){
  const c=d.configFor(version),state=d.Engine.newGame(c);state.player=1;state.startingPlayer=1;
  const path=[...word].map((letter,i)=>{const id=`${i-4},0`;Object.assign(state.tiles.find(t=>t.id===id),{letter,owner:i===0?1:0});return id;});
  game={id:crypto.randomUUID(),players,state,status:'active',revision:0,rules_version:version,dictionary_version:l.languageForRules(version).dictionary.version};
  const start=performance.now(),r=await handler(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify({action:'turn',gameId:game.id,supportedRules:d.SUPPORTED_RULES,command:{operationId:crypto.randomUUID(),action:'word',revision:0,path}})}));
  const result=await r.json();assert.equal(r.status,200,JSON.stringify(result));assert.equal(result.recap.word,word);assert.equal(result.game.dictionary_version,game.dictionary_version);global.gc?.();
  checks.push({version,word,ms:Math.round(performance.now()-start),heapMiB:Math.round(process.memoryUsage().heapUsed/1048576),maxRssMiB:Math.round(process.resourceUsage().maxRSS/1024)});
 }
 console.log(JSON.stringify(checks,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
