const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');const id=()=>crypto.randomUUID();let db,d,A,B,C,unnamed,oldCode;
const rpc=async(name,args=[]) => (await db.query(`select ${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) value`,args)).rows[0].value;
const profile=async who=>(await db.query('select * from profiles where id=$1',[who])).rows[0];
async function person(name){const who=id();await db.query('insert into auth.users(id) values($1)',[who]);if(name)await rpc('wc_complete_username',[who,name]);return who;}
const friendAction=(actor,target,choice,request=null)=>rpc('wc_friend_action',[actor,target,choice,id(),request]);
before(async()=>{
 d=await import('../server/domain.mjs');db=new PGlite();
 await db.exec(`create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');create role anon;create role authenticated;create role service_role bypassrls;create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);
 for(const f of ['202609290001_online.sql','202610030002_android_push.sql','202610040001_friends.sql','202610040002_usernames.sql','202610050001_username_onboarding.sql','202610070001_fast_reads.sql','202610070002_fast_read_names.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+f,'utf8'));
 A=await person('Alice');B=await person('Åke');C=await person('Bo');unnamed=await person();oldCode=(await profile(B)).friend_code;
 const request=id();await rpc('wc_friend_action',[A,B,'request',request,null]);await friendAction(B,A,'accept',request);
 await rpc('wc_create_friend',[A,B,id(),id(),JSON.stringify(d.Engine.newGame(d.config)),d.RULES_VERSION,'dictionary-test']);
});after(async()=>{await db?.close();});
test('migration preserves all accounts, friendships, games and invitations while removing code fields from social payloads',async()=>{
 const tables=['profiles','friendships','games','invitations'];const before={};for(const table of tables)before[table]=(await db.query('select * from '+table)).rows;
 await db.exec(fs.readFileSync('supabase/migrations/202610170001_username_only_friends.sql','utf8'));
 for(const table of tables)assert.deepEqual((await db.query('select * from '+table)).rows,before[table]);
 const social=await rpc('wc_friends',[A]);assert.equal(social.people[0].id,B);assert.equal(social.people[0].status,'accepted');assert.ok(!JSON.stringify(social).includes('friend_code'));
 assert.equal((await rpc('wc_friends',[B])).invitations.length,1);
});
test('only usernames match: normalized names and short exact names work; friend codes, UUIDs and emails do not',async()=>{
 for(const query of ['ÅKE','  a\u030ake  '])assert.deepEqual((await rpc('wc_friend_search',[A,query])).map(p=>p.id),[B]);
 assert.deepEqual((await rpc('wc_friend_search',[A,'bo'])).map(p=>p.id),[C]);assert.deepEqual(await rpc('wc_friend_search',[A,'b']),[]);
 for(const query of [oldCode,oldCode.toLowerCase(),oldCode.match(/.{4}/g).join('-'),B,B.replaceAll('-',''), 'someone@example.com','%', 'Player'])assert.deepEqual(await rpc('wc_friend_search',[A,query]),[],query);
 assert.deepEqual(await rpc('wc_friend_search',[A,'Alice']),[]);
 const result=(await rpc('wc_friend_search',[B,'ali']))[0];assert.equal(result.id,A);assert.deepEqual(Object.keys(result).sort(),['display_name','id','request_id','requested_by','status']);
 await rpc('wc_complete_username',[unnamed,'NewFriend']);assert.equal((await rpc('wc_friend_search',[A,'NewFriend']))[0].id,unnamed);
 await db.query('update profiles set deleting=true where id=$1',[unnamed]);assert.deepEqual(await rpc('wc_friend_search',[A,'NewFriend']),[]);
});
test('blocking still hides players both ways and unblocking restores username discovery without exposing codes',async()=>{
 await friendAction(A,B,'block');assert.deepEqual(await rpc('wc_friend_search',[A,'Åke']),[]);assert.deepEqual(await rpc('wc_friend_search',[B,'Alice']),[]);
 const blocked=(await rpc('wc_friends',[A])).blocked;assert.deepEqual(blocked,[{id:B,display_name:'Åke'}]);
 await friendAction(A,B,'unblock');assert.deepEqual((await rpc('wc_friends',[A])).blocked,[]);assert.equal((await rpc('wc_friend_search',[A,'Åke']))[0].id,B);
});
test('discovery RPCs remain service-only so browser callers cannot supply another actor',async()=>{
 for(const role of ['anon','authenticated']){await db.exec('set role '+role);try{await assert.rejects(()=>rpc('wc_friend_search',[A,'Åke']),/permission denied/);await assert.rejects(()=>rpc('wc_friends',[A]),/permission denied/);}finally{await db.exec('reset role');}}
 await db.exec('set role service_role');try{assert.equal((await rpc('wc_friend_search',[A,'Åke']))[0].id,B);}finally{await db.exec('reset role');}
});
test('API strips retired codes from profile and nested social responses, and offers username-only validation',async()=>{
 const {createHandler}=await import('../server/api.mjs');
 const adapter={auth:{getUser:async()=>({data:{user:{id:A}}})},from(){const q={select:()=>q,eq:()=>q,single:async()=>({data:await profile(A)})};return q;},rpc:async(name,args)=>name==='wc_rate_limit'?{data:true}:{data:await rpc(name,Object.values(args))}};
 const handler=createHandler(adapter);const call=body=>handler(new Request('https://api.invalid',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify(body)}));
 for(const body of [{action:'friends'},{action:'friend_search',query:'Bo'},{action:'home',supportsFastReads:true,supportsFriends:true,supportsGameSummaries:true,supportedRules:d.SUPPORTED_RULES}]){const r=await call(body);assert.equal(r.status,200);const data=await r.json();assert.ok(!JSON.stringify(data).includes('friend_code'));assert.ok(!JSON.stringify(data).includes(oldCode));}
 for(const query of [oldCode,B])assert.deepEqual((await (await call({action:'friend_search',query})).json()).people,[]);
 const invalid=await call({action:'friend_search',query:''});assert.equal(invalid.status,400);assert.equal((await invalid.json()).error,'Enter a username.');
});
