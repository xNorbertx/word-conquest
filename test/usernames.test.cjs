const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');
const migrations=['202609290001_online.sql','202610030002_android_push.sql','202610040001_friends.sql'];
const sql=fs.readFileSync('supabase/migrations/202610040002_usernames.sql','utf8');
let db,names;const legacy=crypto.randomUUID(),other=crypto.randomUUID();
async function setup(){const p=new PGlite();await p.exec(`create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');create role anon;create role authenticated;create role service_role bypassrls;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);
 for(const file of migrations)await p.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));return p;}
const rpc=async(name,args=[])=>{const r=await db.query(`select ${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as value`,args);return r.rows[0].value;};
const signup=async(name,id=crypto.randomUUID())=>{await db.query('insert into auth.users(id,raw_user_meta_data) values($1,$2)',[id,JSON.stringify(name===undefined?{}:{username:name})]);return id;};
before(async()=>{names=await import('../online/username.mjs');db=await setup();for(const [id,name]of [[legacy,'Norbert'],[other,'Test player 1 (a123)']]){await db.query('insert into auth.users(id) values($1)',[id]);await db.query('insert into profiles(id,display_name) values($1,$2)',[id,name]);}await db.exec(sql);});
after(async()=>{await db?.close();});

test('migration preserves existing names, IDs and compatibility alias',async()=>{
 const {rows}=await db.query('select id,username,display_name from profiles order by username');
 assert.deepEqual(rows,[{id:legacy,username:'Norbert',display_name:'Norbert'},{id:other,username:'Test player 1 (a123)',display_name:'Test player 1 (a123)'}]);
 await db.query('insert into profiles(id) values($1) on conflict(id) do nothing',[legacy]);
 assert.equal((await db.query('select username from profiles where id=$1',[legacy])).rows[0].username,'Norbert');
});

test('historical 0.6.1 migration reserves signup names before the later onboarding migration',async()=>{
 const id=await signup('  Élise  ');assert.equal((await db.query('select username,display_name from profiles where id=$1',[id])).rows[0].username,'Élise');
 for(const name of [undefined,'','   ','<script>','a\nb','x\u200by','a'.repeat(41),'...','🙂']){
  const failed=crypto.randomUUID();await assert.rejects(()=>signup(name,failed),/username_required|invalid_username/);assert.equal((await db.query('select * from auth.users where id=$1',[failed])).rows.length,0);
 }
 for(const name of ['norbert',' NORBERT ','Ｎｏｒｂｅｒｔ','e\u0301LISE'])await assert.rejects(()=>signup(name),/profiles_username_key/);
 const winner=await signup('RaceName');await assert.rejects(()=>signup('racename'),/profiles_username_key/);
 assert.equal((await db.query('select id from profiles where lower(username)=\'racename\'')).rows[0].id,winner);
});

test('client and database agree on username validation',async()=>{
 for(const raw of ['Al','a','Anne-Marie','张三','Élise','Åke','A.B_9','Test player 3 (abc)','O\'Brien','ＮＯＲＢ','  Alex  ','','a\nb','<Alex>','x\u200by','🙂','a'.repeat(41),'---']){
  const normalized=names.normalizeUsername(raw);assert.equal(await rpc('wc_username_valid',[normalized]),names.validUsername(normalized),JSON.stringify(raw));
  assert.equal(await rpc('wc_username',[raw]),normalized);
 }
});

test('renames enforce uniqueness for both modern and old clients, synchronizing the displayed identity',async()=>{
 const id=await signup('Renamer');
 await assert.rejects(()=>db.query('update profiles set username=$1 where id=$2',['nOrBeRt',id]),/profiles_username_key/);
 await assert.rejects(()=>db.query('update profiles set display_name=$1 where id=$2',['Norbert',id]),/profiles_username_key/);
 await db.query('update profiles set username=$1 where id=$2',['NewName',id]);
 assert.deepEqual((await db.query('select username,display_name from profiles where id=$1',[id])).rows[0],{username:'NewName',display_name:'NewName'});
 await db.query('update profiles set display_name=$1 where id=$2',['NEWNAME',id]);
 assert.equal((await db.query('select username from profiles where id=$1',[id])).rows[0].username,'NEWNAME');
 // Auth metadata edits are never an alternative source of displayed identity.
 await db.query('update auth.users set raw_user_meta_data=$1 where id=$2',[JSON.stringify({username:'Norbert'}),id]);
 assert.equal((await db.query('select username from profiles where id=$1',[id])).rows[0].username,'NEWNAME');
});

test('anonymous availability is a boolean only; profile access and all mutations stay private',async()=>{
 await db.exec('set role anon');
 try{assert.equal(await rpc('wc_username_available',[' NORBERT ']),false);assert.equal(await rpc('wc_username_available',['UnusedName']),true);assert.equal(await rpc('wc_username_available',['<bad>']),false);
  await assert.rejects(()=>db.query('select * from profiles'),/permission denied/);
  await assert.rejects(()=>rpc('wc_friend_search',[legacy,'Norbert']),/permission denied/);
  await assert.rejects(()=>db.query('insert into profiles(id,username) values($1,$2)',[crypto.randomUUID(),'Injected']),/permission denied/);
 }finally{await db.exec('reset role');}
 await db.exec('set role authenticated');try{await assert.rejects(()=>db.query('update profiles set username=$1 where id=$2',['Forged',legacy]),/permission denied/);}finally{await db.exec('reset role');}
});

test('short exact usernames and normalized search work, retaining blocks and private-field filtering',async()=>{
 const id=await signup('Bo');assert.equal((await rpc('wc_friend_search',[legacy,'bo']))[0].id,id);
 assert.equal((await rpc('wc_friend_search',[legacy,'b'])).length,0);
 const result=await rpc('wc_friend_search',[legacy,'ｂｏ']);assert.equal(result[0].display_name,'Bo');assert.ok(!('email' in result[0]));
 await rpc('wc_friend_action',[legacy,id,'block',crypto.randomUUID(),null]);assert.equal((await rpc('wc_friend_search',[legacy,'Bo'])).length,0);
});

test('account deletion and retries anonymize without a shared Deleted player uniqueness collision',async()=>{
 const a=await signup('DepartingOne'),b=await signup('DepartingTwo');
 for(const id of [a,b,a])await rpc('wc_delete_account',[id]);
 const {rows}=await db.query('select display_name,deleting from profiles where id in ($1,$2)',[a,b]);assert.ok(rows.every(p=>p.deleting&&p.display_name==='Deleted player'));
 assert.equal(await rpc('wc_username_available',['DepartingOne']),true);await signup('DepartingOne');
 await db.query('delete from auth.users where id in ($1,$2)',[a,b]);
});

test('ambiguous legacy names stop migration without silently changing accounts',async()=>{
 const p=await setup();try{for(const name of ['Alex','alex']){const id=crypto.randomUUID();await p.query('insert into auth.users(id) values($1)',[id]);await p.query('insert into profiles(id,display_name) values($1,$2)',[id,name]);}
  await p.exec('begin');await assert.rejects(()=>p.exec(sql),/username_migration_duplicate/);await p.exec('rollback');assert.deepEqual((await p.query('select display_name from profiles order by display_name')).rows.map(r=>r.display_name),['Alex','alex']);
 }finally{await p.close();}
});

test('account creation takes email/password only, independently of username availability',async()=>{
 const calls=[],db={rpc:()=>{throw Error('Signup must not depend on a username');},auth:{signUp:async body=>{calls.push(body);return {data:{session:null}};}}};
 await names.signUpAccount(db,{email:'test@example.invalid',password:'not-a-real-password',redirectTo:'https://example.invalid/'});
 assert.deepEqual(calls[0],{email:'test@example.invalid',password:'not-a-real-password',options:{emailRedirectTo:'https://example.invalid/'}});
 const original=Object.assign(new Error('Rate limit'),{code:'over_email_send_rate_limit'});db.auth.signUp=async()=>({error:original});
 await assert.rejects(()=>names.signUpAccount(db,{email:'test@example.invalid'}),e=>e===original);
});

test('profile API accepts old and new payloads and returns a useful duplicate-name conflict',async()=>{
 const {createHandler}=await import('../server/api.mjs');let stored,error;
 const client={auth:{getUser:async()=>({data:{user:{id:legacy}}})},rpc:async()=>({data:true}),from:()=>{let update=false;const q={select:()=>q,update:value=>{stored=value;update=true;return q;},eq:()=>update?Promise.resolve({error}):q,single:async()=>({data:{id:legacy,deleting:false}})};return q;}};
 const send=body=>createHandler(client)(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer test','Content-Type':'application/json'},body:JSON.stringify({action:'profile',...body})}));
 assert.equal((await send({username:' Ａlex '})).status,200);assert.equal(stored.username,'Alex');
 assert.equal((await send({name:'Legacy'})).status,200);assert.equal(stored.username,'Legacy');
 assert.equal((await send({username:'<bad>'})).status,400);
 error={code:'23505',message:'duplicate key value violates unique constraint "profiles_username_key"'};const r=await send({username:'Norbert'});assert.equal(r.status,409);assert.equal((await r.json()).code,'username_taken');
});
