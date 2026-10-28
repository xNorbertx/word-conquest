const {test,before}=require('node:test'),assert=require('node:assert/strict');
let d,l,createHandler;const actor=crypto.randomUUID(),friend=crypto.randomUUID();
before(async()=>{d=await import('../server/domain.mjs');l=await import('../server/languages.mjs');({createHandler}=await import('../server/api.mjs'));});
function fixture(){
 const saved=new Map(),calls=[];let reads=0;
 const handler=createHandler({auth:{getUser:async()=>({data:{user:{id:actor}}})},from:table=>{
  let id;const q={select:()=>q,eq:(k,v)=>{id=v;return q;},single:async()=>({data:{id:actor,username:'Test'}}),maybeSingle:async()=>{reads++;return{data:saved.get(id)||null};},in:async()=>({data:[{id:actor,display_name:'Test'}]})};return q;
 },rpc:async(name,args)=>{
  if(name==='wc_rate_limit')return{data:true};calls.push({name,args});assert(['wc_create','wc_create_friend'].includes(name));
  if(!saved.has(args.p_id))saved.set(args.p_id,{id:args.p_id,players:[actor,null],state:args.p_state,rules_version:args.p_rules,dictionary_version:args.p_dictionary,status:'invited',revision:0});
  return{data:saved.get(args.p_id)};
 }});
 return{saved,calls,reads:()=>reads,call:async body=>{const r=await handler(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify({action:'create',gameId:crypto.randomUUID(),supportedRules:d.SUPPORTED_RULES,...body})}));return{status:r.status,...await r.json()};}};
}
test('obsolete English/Swedish creation is rejected for links and friends, even from a modern client',async()=>{
 const x=fixture();
 for(const v of d.SUPPORTED_RULES){const language=l.languageForRules(v);if(v===l.LANGUAGES[language.code].rulesVersion)continue;
  for(const friendId of [undefined,friend]){
   const response=await x.call({rulesVersion:v,language:language.code,friendId});assert.equal(response.status,409);assert.equal(response.code,'client_update_required');
  }
 }
 assert.equal((await x.call({supportedRules:undefined})).code,'client_update_required');assert.equal(x.reads(),2*(d.SUPPORTED_RULES.length-Object.keys(l.LANGUAGES).length)+1);assert.equal(x.calls.length,0);assert.equal(x.saved.size,0);
});
test('current creation in all three languages is authoritative and has no extra saved-game read',async()=>{
 const x=fixture();
 for(const language of Object.values(l.LANGUAGES))for(const friendId of [undefined,friend]){
  const body={gameId:crypto.randomUUID(),rulesVersion:language.rulesVersion,language:language.code,friendId,state:{player:99},dictionaryVersion:'forged'};
  const first=await x.call(body);assert.equal(first.status,200);assert.equal(first.game.rules_version,language.rulesVersion);assert.equal(first.game.dictionary_version,language.dictionary.version);assert.equal(first.game.state.tiles.length,69);
  assert.deepEqual((await x.call(body)).game,first.game);assert.deepEqual([5,6,7].map(n=>d.Engine.lengthBonus(n,d.configFor(first.game.rules_version))),[0,1,3]);
 }
 assert.equal(x.reads(),0);
});
test('already-saved legacy creations replay original scores, but unknown or foreign IDs cannot bypass the gate',async()=>{
 const x=fixture();
 for(const version of ['autumn-v1','autumn-v4','autumn-sv-v3']){
  const language=l.languageForRules(version),id=crypto.randomUUID(),game={id,players:[actor,null],rules_version:version,dictionary_version:language.dictionary.version,state:d.Engine.newGame(d.configFor(version)),revision:0,status:'invited'};
  game.state.wordPoints=[40,22];x.saved.set(id,game);
  const before=structuredClone(game),result=await x.call({gameId:id,rulesVersion:version,supportedRules:[version]});assert.equal(result.status,200);assert.deepEqual(result.game.state,before.state);assert.equal(result.game.rules_version,version);assert.deepEqual(x.saved.get(id),before);
  game.players=[friend,null];const count=x.calls.length;assert.equal((await x.call({gameId:id,rulesVersion:version})).code,'client_update_required');assert.equal(x.calls.length,count);
 }
 const version=l.LANGUAGES.en.rulesVersion,id=crypto.randomUUID();x.saved.set(id,{id,players:[actor],rules_version:version});
 assert.equal((await x.call({gameId:id,rulesVersion:'autumn-v4',supportedRules:['autumn-v4']})).code,'client_update_required');
});
