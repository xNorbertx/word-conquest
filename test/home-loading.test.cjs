const {test}=require('node:test'),assert=require('node:assert/strict');
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',C='33333333-3333-4333-8333-333333333333';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
test('overlapping Games reads share one request, and retry after failure',async()=>{
 const {createHomeRequests}=await import('../online/home-requests.mjs');let calls=0,wait=deferred();
 const reader=createHomeRequests(()=>{calls++;return wait.promise;});const first=reader.get(A),second=reader.get(A);
 assert.equal(first,second);await Promise.resolve();assert.equal(calls,1);wait.resolve({games:[]});assert.deepEqual(await second,{games:[]});
 wait=deferred();const failed=reader.get(A);wait.reject(Error('offline'));await assert.rejects(failed,/offline/);
 wait=deferred();const retry=reader.get(A);wait.resolve('fresh');assert.equal(await retry,'fresh');assert.equal(calls,3);
});
test('account switching and a saved turn invalidate shared reads without an old completion clearing the new request',async()=>{
 const {createHomeRequests}=await import('../online/home-requests.mjs');const waits=[];
 const reader=createHomeRequests(actor=>{const wait=deferred();waits.push({actor,...wait});return wait.promise;});
 const old=reader.get(A);await Promise.resolve();const switched=reader.get(B);await Promise.resolve();assert.notEqual(old,switched);
 waits[0].resolve('old');await old;assert.equal(reader.get(B),switched);
 reader.reset();const newer=reader.get(B);await Promise.resolve();assert.notEqual(newer,switched);
 waits[1].resolve('before move');await switched;assert.equal(reader.get(B),newer);waits[2].resolve('after move');assert.equal(await newer,'after move');
});
async function fixture(options={}){
 const domain=await import('../server/domain.mjs'),{createHandler}=await import('../server/api.mjs');
 const games=Array.from({length:12},(_,i)=>({id:crypto.randomUUID(),status:i%3?'active':'completed',result:'1',players:i%2?[A,B]:[C,A],rules_version:['autumn-v1','autumn-v2','autumn-v3'][i%3],dictionary_version:'english-letterpress-v1',revision:i,updated_at:new Date(2026,9,i+1).toISOString(),state:domain.Engine.newGame(domain.configFor(['autumn-v1','autumn-v2','autumn-v3'][i%3]))}));
 const profile={id:A,display_name:'Test A',username:options.unnamed?null:'Test A'},calls=[];
 const db={auth:{getUser:async()=>({data:options.unauthorized?null:{user:{id:A}}})},rpc:async(name,args)=>{calls.push({name,args});return{data:name==='wc_rate_limit'?options.rate!==false:{people:[],invitations:[]}};},from(table){
  const query={table,filters:[]};calls.push(query);
  const q={select(columns){query.columns=columns;return q;},eq(key,value){query.filters.push([key,value]);return q;},contains(key,value){query.filters.push([key,value]);return q;},order(){return q;},single:async()=>({data:profile}),
   in:async(key,ids)=>{query.ids=ids;return{data:[{id:B,display_name:'Test B'},{id:C,display_name:'Test C'}]};},
   limit:async()=>({data:table==='games'?games:[]})};return q;
 }};
 const handler=createHandler(db),response=await handler(new Request('https://test.invalid',{method:'POST',headers:{Authorization:'Bearer test-token'},body:JSON.stringify({action:'home',supportsUsernameOnboarding:true,...(options.legacy?{}:{supportsGameSummaries:true})})}));
 return{response,body:await response.json(),calls,games,domain};
}
test('Games batches unique player names, scopes reads to the caller, and sends accurate summaries for every ruleset',async()=>{
 const {response,body,calls,games,domain}=await fixture();assert.equal(response.status,200);
 const nameReads=calls.filter(c=>c.ids);assert.equal(nameReads.length,1);assert.deepEqual(new Set(nameReads[0].ids),new Set([B,C]));
 assert.deepEqual(calls.find(c=>c.table==='games').filters,[['players',[A]]]);assert.deepEqual(calls.find(c=>c.table==='notifications').filters,[['user_id',A]]);
 assert.equal(calls.filter(c=>c.table==='profiles').length,2);
 body.games.forEach((g,i)=>{assert.deepEqual(g.scores,domain.Engine.scores(games[i].state,domain.configFor(g.rules_version)));assert.equal(g.state.player,games[i].state.player);assert.equal(g.state.tiles,undefined);assert.deepEqual(g.names,g.players.map(id=>id===A?'Test A':id===B?'Test B':'Test C'));});
 assert.ok(JSON.stringify(body.games).length<JSON.stringify(games).length/5,'list omits at least 80% of board payload');
});
test('older APKs keep full boards, while auth, rate limit and unfinished usernames still gate Games',async()=>{
 const legacy=await fixture({legacy:true});assert.deepEqual(legacy.body.games[0].state,legacy.games[0].state);
 const unnamed=await fixture({unnamed:true});assert.equal(unnamed.body.needsUsername,true);assert.deepEqual(unnamed.body.games,[]);assert.ok(!unnamed.calls.some(c=>c.table==='games'));
 const limited=await fixture({rate:false});assert.equal(limited.response.status,429);assert.ok(!limited.calls.some(c=>c.table==='games'));
 const denied=await fixture({unauthorized:true});assert.equal(denied.response.status,401);assert.equal(denied.calls.length,0);
});
