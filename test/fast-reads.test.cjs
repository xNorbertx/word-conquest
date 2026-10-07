const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{PGlite}=require('@electric-sql/pglite');
let db,domain,a,b,c,g;
const id=()=>crypto.randomUUID();
const rpc=async(name,args=[])=>(await db.query(`select ${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as value`,args)).rows[0].value;
const person=async name=>{const actor=id();await db.query('insert into auth.users(id) values($1)',[actor]);await rpc('wc_complete_username',[actor,name]);return actor;};
before(async()=>{
 domain=await import('../server/domain.mjs');db=new PGlite();
 await db.exec(`create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');create role anon;create role authenticated;create role service_role bypassrls;create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);
 for(const f of ['202609290001_online.sql','202610030002_android_push.sql','202610040001_friends.sql','202610040002_usernames.sql','202610050001_username_onboarding.sql','202610070001_fast_reads.sql','202610070002_fast_read_names.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+f,'utf8'));
 a=await person('Alice');b=await person('Bob');c=await person('Outsider');const token=id();g=await rpc('wc_create',[a,id(),token,JSON.stringify(domain.Engine.newGame(domain.config)),domain.RULES_VERSION,'dictionary-test']);await rpc('wc_invitation',[b,token,'accept']);
 // Include an operation newer than the selected snapshot to model a concurrent commit.
 for(let revision=2;revision<=54;revision++)await db.query('insert into operations(game_id,operation_id,actor,fingerprint,revision,recap) values($1,$2,$3,$4,$5,$6)',[g.id,id(),a,'test'+revision,revision,JSON.stringify({word:'WORD',player:1,action:'word'})]);
 await db.query("update games set revision=53,state=jsonb_set(state,'{log}','[{\"word\":\"PRESERVED\"}]') where id=$1",[g.id]);
});after(async()=>{await db?.close();});
test('aggregated reads preserve names/scores while returning just the latest receipt and leaving full history stored',async()=>{
 const home=await rpc('wc_read_home',[a]);assert.equal(home.games.length,1);assert.deepEqual(home.games[0].names,['Alice','Bob']);assert.deepEqual(home.games[0].state.log,[]);
 const detail=await rpc('wc_read_game',[b,g.id]);assert.equal(detail.game.revision,53);assert.deepEqual(detail.history.map(m=>m.revision),[53]);assert.equal(detail.historyHasMore,true);assert.equal(detail.invitation,null);
 const stored=(await db.query('select state from games where id=$1',[g.id])).rows[0].state;assert.equal(stored.log[0].word,'PRESERVED');assert.deepEqual(domain.Engine.scores(detail.game.state,domain.config),domain.Engine.scores(stored,domain.config));
 assert.equal((await db.query('select count(*)::int n from operations where game_id=$1',[g.id])).rows[0].n,53);
});
test('fast reads hide other games and invitation tokens from outsiders and browser database roles',async()=>{
 assert.deepEqual((await rpc('wc_read_home',[c])).games,[]);await assert.rejects(()=>rpc('wc_read_game',[c,g.id]),/not_found/);
 for(const role of ['anon','authenticated']){await db.exec('set role '+role);try{await assert.rejects(()=>rpc('wc_read_home',[a]),/permission denied/);await assert.rejects(()=>rpc('wc_read_game',[a,g.id]),/permission denied/);}finally{await db.exec('reset role');}}
 await db.exec('set role service_role');try{assert.equal((await rpc('wc_read_game',[a,g.id])).game.id,g.id);}finally{await db.exec('reset role');}
});
test('addressed invitations open for the intended friend and host without exposing a playable board to the recipient',async()=>{
 const request=id();await rpc('wc_friend_action',[a,b,'request',request,null]);await rpc('wc_friend_action',[b,a,'accept',id(),request]);
 const token=id(),invited=await rpc('wc_create_friend',[a,b,id(),token,JSON.stringify(domain.Engine.newGame(domain.config)),domain.RULES_VERSION,'dictionary-test']);
 const recipient=await rpc('wc_read_game',[b,invited.id]);assert.equal(recipient.game,undefined);assert.equal(recipient.invitation.token,token);assert.equal(recipient.invitation.rulesVersion,domain.RULES_VERSION);
 const host=await rpc('wc_read_game',[a,invited.id]);assert.equal(host.invitation.recipient_name,'Bob');assert.equal(host.invitation.token,token);
 await assert.rejects(()=>rpc('wc_read_game',[c,invited.id]),/not_found/);
});
async function apiFixture(options={}){
 const {createHandler}=await import('../server/api.mjs');const calls=[];
 const adapter={auth:{getUser:async()=>({data:options.unauthorized?null:{user:{id:a}}})},rpc:async(name,args)=>{calls.push(name);if(name==='wc_rate_limit')return{data:options.rate!==false};try{return{data:await rpc(name,Object.values(args))};}catch(e){return{error:{message:e.message}};}},from(table){
  const filters=[];let count;const q={select:()=>q,eq:(k,v)=>{filters.push([k,'=',v]);return q;},contains:(k,v)=>{filters.push([k,'@>',v]);return q;},lt:(k,v)=>{filters.push([k,'<',v]);return q;},order:()=>q,
   single:async()=>({data:{id:a,username:options.unnamed?null:'Alice',display_name:'Alice'}}),maybeSingle:async()=>({data:(await db.query('select * from games where id=$1 and players @> $2::uuid[]',[filters[0][2],filters[1][2]])).rows[0]||null}),
   limit:async n=>{count=n;calls.push({table,filters,count});return{data:(await db.query('select revision,recap from operations where game_id=$1 and revision<$2 order by revision desc limit $3',[filters[0][2],filters[1][2],n])).rows};}};return q;
 }};
 const handler=createHandler(adapter,{origins:['https://app.invalid']});const send=body=>handler(new Request('https://api.invalid',{method:'POST',headers:{Authorization:'Bearer test',Origin:'https://app.invalid'},body:JSON.stringify({supportsFastReads:true,supportsGameSummaries:true,supportsUsernameOnboarding:true,supportsFriends:true,supportedRules:domain.SUPPORTED_RULES,...body})}));return{send,handler,calls};
}
test('fast API uses authenticated actor and preserves auth/onboarding/rate/version gates and timing headers',async()=>{
 const x=await apiFixture();const r=await x.send({action:'game',gameId:g.id,actor:c});assert.equal(r.status,200);const data=await r.json();assert.equal(data.profile.id,a);assert.equal(data.history.length,1);assert.deepEqual(x.calls,['wc_rate_limit','wc_read_game']);assert.match(r.headers.get('server-timing'),/auth;dur=.*guards;dur=.*data;dur=.*total;dur=/);
 const home=await (await x.send({action:'home'})).json();assert.equal(home.games[0].state.tiles,undefined);
 for(const [options,status]of [[{unauthorized:true},401],[{rate:false},429],[{unnamed:true},409]]){const f=await apiFixture(options);assert.equal((await f.send({action:'game',gameId:g.id})).status,status);assert.ok(!f.calls.includes('wc_read_game'));}
 assert.equal((await x.send({action:'game',gameId:g.id,supportedRules:['autumn-v1']})).status,409);assert.equal((await x.send({action:'game',gameId:id()})).status,404);
});
test('history is paged without gaps or duplicates, bounded by board revision and participant access',async()=>{
 const x=await apiFixture(),first=await (await x.send({action:'game_history',gameId:g.id})).json();assert.equal(first.history.length,50);assert.equal(first.hasMore,true);assert.equal(first.history[0].revision,53);
 const second=await (await x.send({action:'game_history',gameId:g.id,beforeRevision:first.nextBefore})).json();assert.deepEqual(second.history.map(m=>m.revision),[3,2]);assert.equal(second.hasMore,false);assert.equal(new Set([...first.history,...second.history].map(m=>m.revision)).size,52);
 for(const cursor of [0,-1,1.5,'3'])assert.equal((await x.send({action:'game_history',gameId:g.id,beforeRevision:cursor})).status,400);
 assert.equal((await x.send({action:'game_history',gameId:id()})).status,404);
});
test('preflight caching keeps the origin allowlist and does not bypass authentication',async()=>{
 const x=await apiFixture();const preflight=await x.handler(new Request('https://api.invalid',{method:'OPTIONS',headers:{Origin:'https://app.invalid'}}));assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-max-age'),'600');assert.equal(x.calls.length,0);
 const denied=await x.handler(new Request('https://api.invalid',{method:'OPTIONS',headers:{Origin:'https://evil.invalid'}}));assert.equal(denied.status,403);assert.equal(denied.headers.get('access-control-allow-origin'),null);
 assert.equal((await x.handler(new Request('https://api.invalid',{method:'POST',headers:{Origin:'https://app.invalid'},body:'{}'}))).status,401);
});
test('older single-player invitations keep exactly one corresponding display name',async()=>{
 const waiting=await rpc('wc_create',[c,id(),id(),JSON.stringify(domain.Engine.newGame(domain.config)),domain.RULES_VERSION,'dictionary-test']);
 assert.equal(waiting.players.length,1);const home=await rpc('wc_read_home',[c]);assert.deepEqual(home.games[0].names,['Outsider']);
 const detail=await rpc('wc_read_game',[c,waiting.id]);assert.deepEqual(detail.game.names,['Outsider']);assert.deepEqual(detail.history,[]);assert.equal(detail.historyHasMore,false);
});
