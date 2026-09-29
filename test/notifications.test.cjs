const {test}=require('node:test'),assert=require('node:assert/strict');
function storage(event,profile){
  const changes=[];
  return {changes,auth:{admin:{getUserById:async()=>({data:{user:{email:'test@example.invalid'}}})}},from(table){
    const q={select(){return q;},is(){return q;},lte(){return q;},lt(){return q;},order(){return q;},eq(){return q;},
      limit:async()=>({data:event?[event]:[],error:null}),maybeSingle:async()=>({data:profile,error:null}),
      update(patch){changes.push(patch);return q;},then(resolve){return Promise.resolve({error:null}).then(resolve);}};return q;
  }};
}
const env={secret:'test-local-secret',apiKey:'test-key',from:'test@example.invalid',appUrl:'https://game.example/online/'};
const request=()=>new Request('https://function.example/notify',{method:'POST',headers:{Authorization:'Bearer '+env.secret}});
test('notification worker requires its dedicated secret and configured delivery',async()=>{
  const {notificationHandler}=await import('../server/notify.mjs'),db=storage();
  assert.equal((await notificationHandler(db,env)(new Request('https://function.example/notify',{method:'POST'}))).status,401);
  assert.equal((await notificationHandler(db,{...env,apiKey:''})(request())).status,503);
});
test('opt-out consumes email attempt without sending; inbox remains intact',async()=>{
  const {notificationHandler}=await import('../server/notify.mjs'),db=storage({id:1,user_id:'test'},{email_notifications:false});
  const result=await notificationHandler(db,env)(request());assert.equal(result.status,200);assert.ok(db.changes[0].emailed_at);
});
test('delivery retries preserve provider idempotency and do not alter games',async()=>{
  const {notificationHandler}=await import('../server/notify.mjs');
  const event={id:2,user_id:'test',game_id:'game',attempts:0,created_at:new Date().toISOString()};
  const db=storage(event,{email_notifications:true}),original=global.fetch,calls=[];
  try{
    global.fetch=async(url,options)=>{calls.push({url,options});return new Response('',{status:503});};
    await notificationHandler(db,env)(request());assert.equal(db.changes[0].attempts,1);assert.ok(db.changes[0].next_attempt_at);assert.equal(db.changes[0].emailed_at,undefined);
    global.fetch=async(url,options)=>{calls.push({url,options});return new Response('{}',{status:200});};
    await notificationHandler(db,env)(request());assert.equal(calls[0].options.headers['Idempotency-Key'],calls[1].options.headers['Idempotency-Key']);assert.ok(db.changes[1].emailed_at);
    const payload=JSON.parse(calls[1].options.body);assert.ok(payload.text.includes('?game=game'));assert.equal(payload.subject,'Word Conquest · game update');
  }finally{global.fetch=original;}
});
test('old events never send beyond the bounded idempotency window',async()=>{
  const {notificationHandler}=await import('../server/notify.mjs'),db=storage({id:3,user_id:'test',attempts:1,created_at:'2020-01-01T00:00:00Z'},{email_notifications:true});
  await notificationHandler(db,env)(request());assert.equal(db.changes[0].attempts,6);
});
