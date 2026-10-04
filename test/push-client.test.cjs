const {test}=require('node:test'),assert=require('node:assert/strict');
async function setup(options={}){
  const {pushController}=await import('../online/push-controller.mjs');
  const values=new Map(),events={},calls=[],messages=[];
  let actor={id:'actor-a'},permission='granted',system={enabled:true,channelBlocked:false},fail=false,hold=false,promptCount=0,clock=1000;
  const plugin={
    createChannel:async()=>{},addListener:async(name,fn)=>{events[name]=fn;return {remove:async()=>{delete events[name];}};},
    checkPermissions:async()=>({receive:permission}),
    requestPermissions:async()=>{promptCount++;permission='granted';return {receive:permission};},
    register:async()=>{if(!hold)queueMicrotask(()=>events.registration({value:'test-device-token-1234567890'}));},
    unregister:async()=>{calls.push({unregister:true});},removeAllDeliveredNotifications:async()=>{}
  };
  const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
  const controller=pushController({available:true,plugin,settings:{status:async()=>system,open:async()=>calls.push({settings:true})},storage,
    api:async body=>{calls.push(body);if(fail&&body.enabled)throw Error('Server unavailable');return {ok:true};},
    getUser:()=>actor,onOpen:id=>calls.push({open:id}),onUpdate:()=>calls.push({update:true}),onStatus:m=>messages.push(m),now:()=>clock,timeoutMs:25,...options});
  return {controller,calls,events,messages,storage,setActor:v=>actor=v,setPermission:v=>permission=v,setSystem:v=>system=v,setFail:v=>fail=v,setHold:v=>hold=v,setClock:v=>clock=v,promptCount:()=>promptCount};
}
test('permission alone does not falsely report a phone connection; opt-in connects and hides the prompt',async()=>{
  const x=await setup();await x.controller.restore();assert.equal(x.controller.snapshot().state,'off');assert.equal(x.controller.shouldPrompt(),true);assert.equal(x.calls.length,0);
  x.setPermission('prompt');await x.controller.enable();assert.equal(x.promptCount(),1);assert.equal(x.calls[0].action,'push_device');assert.equal(x.calls[0].enabled,true);assert.equal(x.controller.snapshot().state,'ready');assert.equal(x.controller.shouldPrompt(),false);
});
test('failed registration preserves consent and retries on resume without silently reporting success',async()=>{
  const x=await setup();x.setFail(true);await assert.rejects(x.controller.enable(),/Server unavailable/);assert.equal(x.controller.snapshot().state,'error');assert.equal(x.controller.preferred(),true);assert.equal(x.controller.shouldPrompt(),true);
  x.setFail(false);await x.controller.restore();assert.equal(x.controller.snapshot().state,'ready');
});
test('notification channel blocking is detected and returning from Android settings reconnects',async()=>{
  const x=await setup();await x.controller.enable();x.setSystem({enabled:true,channelBlocked:true});await x.controller.restore();assert.equal(x.controller.snapshot().state,'blocked');assert.equal(x.calls.at(-1).enabled,false);
  await x.controller.openSettings();assert.equal(x.calls.at(-1).settings,true);x.setSystem({enabled:true,channelBlocked:false});await x.controller.restore();assert.equal(x.controller.snapshot().state,'ready');
});
test('explicit opt-out stays off; prompt dismissal lasts a week and is per account',async()=>{
  const x=await setup();x.controller.snooze();assert.equal(x.controller.shouldPrompt(),false);x.setActor({id:'actor-b'});assert.equal(x.controller.shouldPrompt(),true);x.setActor({id:'actor-a'});x.setClock(8*86400000);assert.equal(x.controller.shouldPrompt(),true);
  await x.controller.enable();await x.controller.disable();const count=x.calls.length;await x.controller.restore();assert.equal(x.calls.length,count);assert.equal(x.controller.preferred(),false);
});
test('token rotation is saved; foreground notification and tap are handled without exposing the token',async()=>{
  const x=await setup();await x.controller.enable();x.events.registration({value:'rotated-test-token-1234567890'});await new Promise(r=>setImmediate(r));assert.equal(x.calls.at(-1).token,'rotated-test-token-1234567890');
  x.events.pushNotificationReceived({data:{test:'true'}});assert.match(x.messages.at(-1),/Test notification received/);
  x.events.pushNotificationReceived({data:{gameId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'}});assert.equal(x.calls.at(-1).update,true);
  x.events.pushNotificationActionPerformed({notification:{data:{gameId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'}}});assert.equal(x.calls.at(-1).open,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
});
test('registration timeout is retryable and an account change cannot attach the arriving token',async()=>{
  const x=await setup();x.setHold(true);await assert.rejects(x.controller.enable(),/timed out/);assert.equal(x.controller.snapshot().state,'error');
  const pending=x.controller.enable();await new Promise(r=>setImmediate(r));x.setActor({id:'actor-b'});x.events.registration({value:'late-test-token-1234567890'});await pending;assert.equal(x.calls.length,0);assert.equal(x.controller.snapshot().state,'off');
});
test('test send requires a confirmed connection and only sends this device ID',async()=>{
  const x=await setup();await assert.rejects(x.controller.test(),/Connect notifications/);await x.controller.enable();await x.controller.test();assert.deepEqual(x.calls.at(-1),{action:'push_test',deviceId:x.storage.getItem('wc-push-device')});
});
