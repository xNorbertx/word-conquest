const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),{PGlite}=require('@electric-sql/pglite');
let db;const existing=crypto.randomUUID();
const rpc=async(name,args=[])=>{const r=await db.query(`select ${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as value`,args);return r.rows[0].value;};
const profile=async id=>(await db.query('select * from profiles where id=$1',[id])).rows[0];
const signup=async(meta={})=>{const id=crypto.randomUUID();await db.query('insert into auth.users(id,raw_user_meta_data) values($1,$2)',[id,JSON.stringify(meta)]);return id;};
before(async()=>{db=new PGlite();await db.exec(`create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');create role anon;create role authenticated;create role service_role bypassrls;create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);
 for(const f of ['202609290001_online.sql','202610030002_android_push.sql','202610040001_friends.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+f,'utf8'));
 await db.query('insert into auth.users(id) values($1)',[existing]);await db.query('insert into profiles(id,display_name) values($1,$2)',[existing,'Norbert']);
 for(const f of ['202610040002_usernames.sql','202610050001_username_onboarding.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+f,'utf8'));
});after(async()=>{await db?.close();});

test('new accounts have persistent missing-name state; existing names survive; signup metadata cannot skip setup',async()=>{
 assert.equal((await profile(existing)).username,'Norbert');
 for(const meta of [{},{username:'Injected'},{username:'Norbert'}]){const id=await signup(meta);assert.equal((await profile(id)).username,null);assert.equal((await profile(id)).display_name,'Player');
  await db.query('update auth.users set raw_user_meta_data=$1 where id=$2',[JSON.stringify({username:'PretendComplete',onboarding_complete:true}),id]);assert.equal((await profile(id)).username,null);
 }
});

test('choosing a name is unique, normalized, durable and safe to retry after a lost reply or on another device',async()=>{
 const id=await signup(),other=await signup();
 await assert.rejects(()=>rpc('wc_complete_username',[id,' ＮＯＲＢＥＲＴ ']),/profiles_username_key/);assert.equal((await profile(id)).username,null);
 await assert.rejects(()=>rpc('wc_complete_username',[id,'<bad>']),/invalid_username/);assert.equal((await profile(id)).username,null);
 const chosen=await rpc('wc_complete_username',[id,' Ｍａｐｌｅ ']);assert.equal(chosen.username,'Maple');assert.equal(chosen.display_name,'Maple');
 const retry=await rpc('wc_complete_username',[id,'AnotherName']);assert.equal(retry.username,'Maple');
 await assert.rejects(()=>rpc('wc_complete_username',[other,'mApLe']),/profiles_username_key/);assert.equal((await profile(other)).username,null);
 await db.query('update profiles set username=$1 where id=$2',['RenamedMaple',id]);assert.equal((await rpc('wc_complete_username',[id,'Maple'])).username,'RenamedMaple');
 await assert.rejects(()=>db.query('update profiles set username=null where id=$1',[id]),/username_required/);
});

test('unnamed accounts are absent from search, including exact friend codes, and cannot receive/send requests',async()=>{
 const id=await signup(),p=await profile(id);assert.deepEqual(await rpc('wc_friend_search',[existing,p.friend_code]),[]);
 await assert.rejects(()=>rpc('wc_friend_action',[existing,id,'request',crypto.randomUUID(),null]),/friend_unavailable/);
 await assert.rejects(()=>rpc('wc_friend_action',[id,existing,'request',crypto.randomUUID(),null]),/username_required/);
 await rpc('wc_complete_username',[id,'ReadyFriend']);assert.equal((await rpc('wc_friend_search',[existing,p.friend_code]))[0].id,id);
 const request=crypto.randomUUID();await rpc('wc_friend_action',[existing,id,'request',request,null]);await rpc('wc_friend_action',[id,existing,'accept',crypto.randomUUID(),request]);
 assert.equal((await rpc('wc_friends',[existing])).people.find(p=>p.id===id).status,'accepted');
});

test('unfinished accounts can be deleted safely without ever claiming a name',async()=>{
 const a=await signup(),b=await signup();for(const id of [a,b,a])await rpc('wc_delete_account',[id]);
 for(const id of [a,b]){const p=await profile(id);assert.equal(p.username,null);assert.equal(p.display_name,'Deleted player');assert.equal(p.deleting,true);}
 await assert.rejects(()=>rpc('wc_complete_username',[a,'TooLate']),/account_deleting/);
});

test('browser roles cannot claim a username for another account or bypass the friend wrapper',async()=>{
 for(const role of ['anon','authenticated']){await db.exec('set role '+role);try{
  await assert.rejects(()=>rpc('wc_complete_username',[existing,'Forged']),/permission denied/);
  await assert.rejects(()=>rpc('wc_named_friend_action',[existing,crypto.randomUUID(),'request',crypto.randomUUID(),null]),/permission denied/);
 }finally{await db.exec('reset role');}}
});

test('random suggestions are valid, checked for availability, retried on collision and bounded',async()=>{
 const {suggestUsername,randomUsername}=await import('../server/usernames.mjs'),{validUsername}=await import('../online/username.mjs');
 for(let i=0;i<100;i++)assert.ok(validUsername(randomUsername()));
 let count=0;const name=await suggestUsername(async value=>{assert.ok(validUsername(value));return ++count===3;});assert.ok(validUsername(name));assert.equal(count,3);
 count=0;await assert.rejects(()=>suggestUsername(async()=>{count++;return false;}),/username_suggestion_busy/);assert.equal(count,8);
});

async function apiFixture(){
 const {createHandler}=await import('../server/api.mjs');const actor=crypto.randomUUID(),calls=[],state={id:actor,username:null,display_name:'Player',deleting:false};
 const db={auth:{getUser:async()=>({data:{user:{id:actor}}})},rpc:async(name,args)=>{calls.push({name,args});if(name==='wc_rate_limit')return {data:true};if(name==='wc_username_available')return {data:true};if(name==='wc_complete_username'){state.username??=args.p_username;state.display_name=state.username;return {data:{...state}};}if(name==='wc_friends')return {data:{people:[]}};return {data:null};},from:table=>{const q={select:()=>q,eq:()=>q,contains:()=>q,order:()=>q,limit:async()=>({data:[]}),single:async()=>({data:{...state}})};return q;}};
 const send=body=>createHandler(db)(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer fixture','Content-Type':'application/json'},body:JSON.stringify(body)}));return {actor,calls,state,send};
}

test('the API gates games, deep links, friends, stats and push opt-in until setup is complete',async()=>{
 const x=await apiFixture();for(const action of ['game','create','turn','invitation','friends','friend_search','friend_action','stats','profile','push_test']){const r=await x.send({action});assert.equal(r.status,409);assert.equal((await r.json()).code,'username_required');}
 const push=await x.send({action:'push_device',enabled:true});assert.equal((await push.json()).code,'username_required');
 assert.ok(x.calls.every(c=>c.name==='wc_rate_limit'));
 const old=await x.send({action:'home'});assert.equal((await old.json()).code,'client_update_required');
 for(let reconnect=0;reconnect<2;reconnect++){const r=await x.send({action:'home',supportsUsernameOnboarding:true});assert.equal(r.status,200);const home=await r.json();assert.equal(home.needsUsername,true);assert.deepEqual(home.games,[]);}
});

test('the API offers a suggestion without finishing setup; saving binds the authenticated actor and retries return the saved name',async()=>{
 const x=await apiFixture(),suggestion=await x.send({action:'suggest_username'});assert.equal(suggestion.status,200);assert.ok((await suggestion.json()).username);assert.equal(x.state.username,null);
 const save=await x.send({action:'complete_username',username:'A Good Name',actor:crypto.randomUUID()});assert.equal(save.status,200);assert.equal(x.calls.find(c=>c.name==='wc_complete_username').args.p_actor,x.actor);
 const retry=await x.send({action:'complete_username',username:'Another Suggestion'});assert.equal((await retry.json()).username,'A Good Name');
 const home=await x.send({action:'home',supportsUsernameOnboarding:true});assert.equal((await home.json()).needsUsername,false);
});
