const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');
let db;const A=crypto.randomUUID(),B=crypto.randomUUID(),G=crypto.randomUUID(),D=crypto.randomUUID(),token='test-registration-token-12345';
before(async()=>{
  db=new PGlite();
  await db.exec(`create schema auth;create table auth.users(id uuid primary key);create role anon;create role authenticated;create role service_role bypassrls;
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    insert into auth.users values('${A}'),('${B}');`);
  await db.exec(fs.readFileSync('supabase/migrations/202609290001_online.sql','utf8'));
  await db.exec(fs.readFileSync('supabase/migrations/202610030002_android_push.sql','utf8'));
  await db.query('insert into profiles(id) values($1),($2)',[A,B]);
  await db.query("insert into games(id,players,state,rules_version,dictionary_version) values($1,$2,'{}','v1','v1')",[G,[A,B]]);
});
after(()=>db?.close());
const register=(user,enabled=true,t=token)=>db.query('select wc_push_register($1,$2,$3,$4)',[user,D,t,enabled]);
const notify=async(user,rev)=>(await db.query("insert into notifications(user_id,game_id,revision,kind) values($1,$2,$3,'word') returning id",[user,G,rev])).rows[0].id;
const claim=async()=>(await db.query('select * from wc_push_claim()')).rows;
test('push queue preserves opt-in, exclusive leases, token rotation, logout and account isolation',async()=>{
  await notify(A,1);await register(A);assert.equal((await claim()).length,0,'old events are not replayed');
  await notify(A,2);const jobs=await claim();assert.equal(jobs.length,1);assert.equal(jobs[0].token,token);
  assert.equal((await claim()).length,0,'concurrent sender cannot claim the lease');
  await db.query('select wc_push_finish($1,$2,$3,$4)',[jobs[0].delivery_id,crypto.randomUUID(),'sent',token]);
  assert.equal((await db.query('select done_at from push_deliveries where id=$1',[jobs[0].delivery_id])).rows[0].done_at,null,'wrong lease cannot ack');
  await register(A,true,'rotated-registration-token-123');
  await db.query('select wc_push_finish($1,$2,$3,$4)',[jobs[0].delivery_id,jobs[0].lease_id,'invalid_token',token]);
  assert.equal((await db.query('select enabled from push_devices where id=$1',[D])).rows[0].enabled,true,'old token failure cannot disable new token');
  await notify(A,3);await register(B);assert.equal((await claim()).length,0,'account switch drops old recipient delivery');
  await notify(B,4);await register(B,false);assert.equal((await claim()).length,0,'opt-out skips queued deliveries');
  await register(B);const id=await notify(B,5);await db.query('update notifications set read_at=now() where id=$1',[id]);assert.equal((await claim()).length,0,'read event does not alert');
  await notify(B,6);const [retry]=await claim();await db.query('select wc_push_finish($1,$2,$3,$4)',[retry.delivery_id,retry.lease_id,'retry',retry.token]);
  assert.equal((await claim()).length,0,'retry backs off');
  await db.query("update push_deliveries set next_attempt_at=now()-interval '1 second' where id=$1",[retry.delivery_id]);
  const [again]=await claim();assert.equal(again.attempt,2);assert.notEqual(again.lease_id,retry.lease_id);
});
test('browser roles cannot read device tokens or invoke the internal delivery functions',async()=>{
  await db.exec('set role authenticated');
  try{await assert.rejects(()=>db.query('select * from push_devices'),/permission denied/);await assert.rejects(()=>db.query('select wc_push_claim()'),/permission denied/);}
  finally{await db.exec('reset role');}
});
test('FCM uses generic notification+data, token caching, and only disables unregistered tokens',async()=>{
  const {firebaseSender}=await import('../server/push.mjs');
  const {privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
  const credentials={type:'service_account',project_id:'word-conquest-test',client_email:'test@example.invalid',private_key:privateKey.export({type:'pkcs8',format:'pem'})};
  let authCalls=0,code='',payload;
  const send=firebaseSender(credentials,async(url,options)=>{
    if(url.includes('oauth2')){authCalls++;return Response.json({access_token:'test',expires_in:3600});}
    payload=JSON.parse(options.body);
    return code?Response.json({error:{details:[{'@type':'type.googleapis.com/google.firebase.fcm.v1.FcmError',errorCode:code}]}},{status:400}):Response.json({name:'accepted'});
  });
  const event={token,game_id:G,notification_id:2,kind:'word'};
  assert.equal(await send(event),'sent');assert.equal(payload.message.data.gameId,G);assert.ok(payload.message.notification.body);assert.equal(payload.message.android.notification.tag,`game-${G}`);
  code='INVALID_ARGUMENT';assert.equal(await send(event),'retry');code='UNREGISTERED';assert.equal(await send(event),'invalid_token');assert.equal(authCalls,1);
});
test('push function rejects calls without its private trigger secret',async()=>{
  const {pushHandler}=await import('../server/push.mjs');
  const handler=pushHandler({}, {secret:'private-test',credentials:{}},async()=>{throw Error('must not send');});
  assert.equal((await handler(new Request('https://example.invalid',{method:'POST'}))).status,401);
});
