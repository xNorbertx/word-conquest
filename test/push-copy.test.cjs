const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');

test('queued turn text uses its exact saved revision and actor, even after a newer move',async()=>{
  const {pushHandler,turnDetails,notificationBody}=await import('../server/push.mjs');
  const db=new PGlite(),a=crypto.randomUUID(),b=crypto.randomUUID(),game=crypto.randomUUID(),device=crypto.randomUUID();
  try{
    await db.exec(`create schema auth;create table auth.users(id uuid primary key);create role anon;create role authenticated;create role service_role bypassrls;
      create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;`);
    await db.exec(fs.readFileSync('supabase/migrations/202609290001_online.sql','utf8'));
    await db.exec(fs.readFileSync('supabase/migrations/202610030002_android_push.sql','utf8'));
    await db.query('insert into auth.users values($1),($2)',[a,b]);
    await db.query("insert into profiles(id,display_name) values($1,'Norbert'),($2,'Mara')",[a,b]);
    await db.query("insert into games(id,players,state,rules_version,dictionary_version) values($1,$2,'{}','v1','v1')",[game,[a,b]]);
    await db.query('select wc_push_register($1,$2,$3,true)',[b,device,'test-device-token-1234567890']);
    for(const [revision,actor,score]of [[7,a,18],[8,b,999]])await db.query('insert into operations values($1,$2,$3,$4,$5,$6)',[game,crypto.randomUUID(),actor,'test',revision,JSON.stringify({action:'word',word:'SECRET',score:{wordPoints:10,territoryGain:score-10,totalGain:score}})]);
    const id=(await db.query("insert into notifications(user_id,game_id,revision,kind) values($1,$2,7,'word') returning id",[b,game])).rows[0].id;
    const storage={
      rpc:async(name,args)=>{
        if(name==='wc_push_claim')return {data:(await db.query('select * from wc_push_claim()')).rows};
        assert.equal(name,'wc_push_finish');await db.query('select wc_push_finish($1,$2,$3,$4)',[args.p_id,args.p_lease,args.p_outcome,args.p_token]);return {error:null};
      },
      from:table=>{
        assert.ok(['notifications','operations','profiles','push_devices'].includes(table));let columns,filters=[];
        const q={select:value=>{assert.match(value,/^[a-z_,]+$/);columns=value;return q;},eq:(column,value)=>{assert.match(column,/^[a-z_]+$/);filters.push([column,value]);return q;},maybeSingle:async()=>({data:(await db.query(`select ${columns} from ${table} where ${filters.map(([column],i)=>`${column}=$${i+1}`).join(' and ')}`,filters.map(([,value])=>value))).rows[0]||null})};return q;
      }
    };
    const sent=[];
    const response=await pushHandler(storage,{secret:'test',credentials:{private_key:'test'}},async event=>{sent.push(event);return 'sent';})(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer test'}}));
    assert.deepEqual(await response.json(),{processed:1,sent:1,retried:0});
    assert.deepEqual(sent[0].turn,{name:'Norbert',action:'word',points:18});
    assert.equal(notificationBody(sent[0]),'Norbert played a turn for 18 points. Your turn.');
    assert.equal((await db.query('select outcome from push_deliveries')).rows[0].outcome,'sent');
    assert.equal(await turnDetails(storage,{...sent[0],recipient:a}),null,'another recipient cannot resolve this event');
    await db.query('update profiles set deleting=true where id=$1',[a]);
    assert.equal((await turnDetails(storage,sent[0])).name,'Your opponent','deleting accounts do not expose their old name');
    await db.query('delete from profiles where id=$1',[a]);
    assert.equal((await turnDetails(storage,sent[0])).name,'Your opponent','missing profiles have a readable fallback');
  }finally{await db.close();}
});

test('notification wording handles points, final turns and refreshes without inventing scores',async()=>{
  const {notificationBody}=await import('../server/push.mjs');
  const event={kind:'word',turn:{name:'Mara',action:'word',points:1}};
  assert.equal(notificationBody(event),'Mara played a turn for 1 point. Your turn.');
  assert.equal(notificationBody({...event,turn:{...event.turn,points:0}}),'Mara played a turn for 0 points. Your turn.');
  assert.equal(notificationBody({...event,kind:'game complete'}),'Mara played a turn for 1 point. Game finished.');
  assert.equal(notificationBody({...event,turn:{name:'Mara',action:'refresh'}}),'Mara refreshed their letters. Your turn.');
  assert.equal(notificationBody({...event,kind:'game complete',turn:null}),'Your game has finished.');
  for(const points of [undefined,NaN,-1,'99'])assert.equal(notificationBody({...event,turn:{...event.turn,points}}),'Mara played a turn. Your turn.');
});

test('temporary turn lookup failure retries without sending inaccurate text',async()=>{
  const {pushHandler}=await import('../server/push.mjs');let finished;
  const db={rpc:async(name,args)=>name==='wc_push_claim'?{data:[{kind:'word'}]}:(finished=args,{error:null}),from:()=>{const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({error:{message:'offline'}})};return q;}};
  const response=await pushHandler(db,{secret:'test',credentials:{private_key:'test'}},async()=>{assert.fail('must not send incomplete notification');})(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer test'}}));
  assert.deepEqual(await response.json(),{processed:1,sent:0,retried:1});assert.equal(finished.p_outcome,'retry');
});
