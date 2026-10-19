const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../online/app.js'),'utf8');
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const session=(id=A)=>({user:{id},access_token:'test-only'});
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
function fragment(start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert(a>=0&&b>a);return source.slice(a,b);}
async function settle(){for(let i=0;i<30;i++)await Promise.resolve();}
function setup({cached=false,actualEntry=true}={}){
 const timers=new Map(),elements=new Map(),wait=deferred(),calls={entries:0,reads:0,renders:0,clears:0,errors:[]};let serial=0,callback;
 const noop=()=>{},snapshot={profile:{id:A,username:'Alice'},games:[]};
 const c={console,Promise,Error,JSON,user:null,currentView:'loading',recovering:false,authReady:false,gameFresh:false,game:null,homeData:null,analyticsData:null,analyticsActor:null,navigation:0,gameLoad:0,homeLoad:0,entering:false,entryEpoch:0,entryTimer:null,startupTimer:null,notificationGame:null,launchGame:null,params:new URLSearchParams(),navigator:{onLine:true},
  setTimeout:(fn,ms)=>{const id=++serial;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id),
  db:{auth:{onAuthStateChange:fn=>callback=fn,getSession:async()=>({data:{session:session()}})}},
  snapshots:{clear:()=>calls.clears++,home:id=>cached&&id===A?snapshot:null},moveHistory:{reset:noop},gameRequests:{reset:noop},homeRequests:{reset:noop},friends:{reset:noop},renderPush:noop,
  $:id=>{if(!elements.has(id))elements.set(id,{hidden:false,value:'',textContent:'',querySelector:()=>c.$(id+'-spinner')});return elements.get(id);},
  screen:name=>c.currentView=name,connectLiveUpdates:noop,renderHome:()=>calls.renders++,offlineNotice:(show,message)=>calls.notice={show,message},
  fetchHome:()=>{calls.reads++;return wait.promise;},showInvite:async()=>false,openNotification:noop,showFriends:noop,account:noop,showAnalytics:noop,localStorage:{getItem:()=>null},
  status:message=>calls.errors.push(message),friendlyError:e=>e.message,lastProblem:null,lastRequestId:null,
 };
 vm.createContext(c);
 vm.runInContext(fragment('async function readSession()','async function api(')+fragment('async function run(','const act=')+fragment('async function showHome(','let analyticsData=')+fragment('async function enterApp()','async function usernameSetup(')+fragment('function cancelAppEntry()',"\ndocument.addEventListener('visibilitychange',()=>document.body.classList"),c);
 if(!actualEntry)c.enterApp=async()=>{calls.entries++;};
 return{c,calls,wait,elements,timers,event:(event,s=session())=>callback(event,s),async tick(ms=0){for(const [id,t]of [...timers])if(t.ms===ms){timers.delete(id);t.fn();}await settle();}};
}
test('expired saved session: TOKEN_REFRESHED before INITIAL_SESSION automatically opens saved Games before its network response',async()=>{
 const h=setup({cached:true});h.event('TOKEN_REFRESHED');h.event('INITIAL_SESSION');assert.equal(h.calls.reads,0,'SDK calls stay outside auth callback');await h.tick();
 assert.equal(h.c.currentView,'home');assert.equal(h.calls.renders,1);assert.equal(h.calls.reads,1);assert.equal(h.c.authReady,false,'cache cannot authorize actions');
 h.wait.resolve({games:[]});await settle();assert.equal(h.c.entering,false);
});
test('first session without cache loads automatically, repeated events share one startup',async()=>{
 const h=setup();h.event('INITIAL_SESSION');h.event('SIGNED_IN');await h.tick();h.event('TOKEN_REFRESHED');await h.tick();
 assert.equal(h.calls.reads,1);assert.equal(h.c.currentView,'loading');h.wait.resolve({games:[]});await settle();assert.equal(h.c.currentView,'home');assert.equal(h.c.entering,false);
});
test('ordinary token refresh and repeat SIGNED_IN do not interrupt an open game',async()=>{
 const h=setup({actualEntry:false});h.c.user=session().user;h.c.currentView='game';h.event('TOKEN_REFRESHED');h.event('SIGNED_IN');h.event('INITIAL_SESSION');await h.tick();assert.equal(h.calls.entries,0);assert.equal(h.c.currentView,'game');
});
test('sign-out cancels queued startup and clears account data',async()=>{
 const h=setup({actualEntry:false});h.event('TOKEN_REFRESHED');h.event('SIGNED_OUT',null);await h.tick();assert.equal(h.calls.entries,0);assert.equal(h.c.currentView,'auth');assert.equal(h.calls.clears,1);
});
test('a refresh-first account switch resets old state and starts only the new account',async()=>{
 const h=setup({actualEntry:false});h.event('INITIAL_SESSION');h.c.homeData={private:'old'};h.event('TOKEN_REFRESHED',session(B));h.event('INITIAL_SESSION',session(B));await h.tick();assert.equal(h.c.user.id,B);assert.equal(h.c.homeData,null);assert.equal(h.calls.entries,1);assert.equal(h.calls.clears,1);
});
test('password recovery cancels scheduled entry and survives subsequent session events',async()=>{
 const h=setup({actualEntry:false});h.event('TOKEN_REFRESHED');h.event('PASSWORD_RECOVERY');h.event('INITIAL_SESSION');await h.tick();assert.equal(h.c.currentView,'recovery');assert.equal(h.calls.entries,0);assert.equal(h.c.authReady,false);
});
test('late completion from previous account cannot unlock the new startup',async()=>{
 const h=setup();const old=deferred(),fresh=deferred();h.c.showHome=()=>h.c.user.id===A?old.promise:fresh.promise;
 h.event('INITIAL_SESSION');await h.tick();h.event('SIGNED_IN',session(B));await h.tick();assert.equal(h.c.entering,true);old.resolve(true);await settle();assert.equal(h.c.entering,true);fresh.resolve(true);await settle();assert.equal(h.c.entering,false);
});
test('password recovery cannot be overwritten by a Games response already in flight',async()=>{
 const h=setup();h.event('TOKEN_REFRESHED');await h.tick();h.event('PASSWORD_RECOVERY');h.wait.resolve({games:[]});await settle();assert.equal(h.c.currentView,'recovery');assert.equal(h.c.entering,false);
});
test('slow or failed refresh keeps the saved list visible and startup can retry',async()=>{
 const h=setup({cached:true});h.event('INITIAL_SESSION');await h.tick();h.wait.reject(Error('offline'));await settle();assert.equal(h.c.currentView,'home');assert.equal(h.c.entering,false);assert.match(h.calls.notice.message,/saved games/);
 h.c.fetchHome=async()=>({games:[]});await h.c.retryStartup();assert.equal(h.c.currentView,'home');
});
test('no-cache loading failure exposes a functioning retry',async()=>{
 const h=setup();h.event('INITIAL_SESSION');await h.tick();h.wait.reject(Error('offline'));await settle();assert.equal(h.c.$('retry-load').hidden,false);assert.equal(h.c.$('loading-spinner').hidden,true);
 h.c.fetchHome=async()=>({games:[]});await h.c.retryStartup();assert.equal(h.c.currentView,'home');
});
test('missing initial auth event shows retry and restores a session even before user exists',async()=>{
 const h=setup({actualEntry:false});await h.tick(12000);assert.equal(h.c.$('retry-load').hidden,false);assert.equal(h.c.$('loading-spinner').hidden,true);await h.c.retryStartup();await h.tick();assert.equal(h.calls.entries,1);assert.equal(h.c.user.id,A);
});
test('retry without a saved session opens sign-in instead of staying on the spinner',async()=>{
 const h=setup();h.c.db.auth.getSession=async()=>({data:{session:null}});await h.c.retryStartup();assert.equal(h.c.currentView,'auth');
});
test('a stalled auth refresh times out without destroying the cache or signing out',async()=>{
 const h=setup();h.c.db.auth.getSession=()=>new Promise(()=>{});const pending=h.c.readSession();const rejected=assert.rejects(pending,/restore your sign-in/);await h.tick(10000);await rejected;assert.equal(h.calls.clears,0);assert.equal(h.c.currentView,'loading');
});
test('settled session reads remove their deadline and stale retry cannot undo sign-out',async()=>{
 const h=setup();await h.c.readSession();assert.equal([...h.timers.values()].filter(t=>t.ms===10000).length,0);
 const wait=deferred();h.c.db.auth.getSession=()=>wait.promise;const retry=h.c.retryStartup();h.event('SIGNED_OUT',null);wait.resolve({data:{session:session()}});await retry;await h.tick();assert.equal(h.c.user,null);assert.equal(h.c.currentView,'auth');assert.equal(h.calls.reads,0);
});
test('logo/Home path also renders persisted Games before any network response',async()=>{
 const h=setup({cached:true});h.c.user=session().user;const loading=h.c.showHome();assert.equal(h.c.currentView,'home');assert.equal(h.calls.renders,1);h.wait.resolve({games:[]});await loading;
});
test('game deep link opens directly and does not wait for Games',async()=>{
 const h=setup();h.c.launchGame='game-id';let opened;h.c.openGame=async id=>{opened=id;h.c.currentView='game';return true;};h.event('TOKEN_REFRESHED');h.event('INITIAL_SESSION');await h.tick();assert.equal(opened,'game-id');assert.equal(h.c.currentView,'game');assert.equal(h.c.entering,false);assert.equal(h.calls.reads,1);h.wait.resolve({games:[]});await settle();assert.equal(h.c.currentView,'game');
});
test('username completion remains a prerequisite to following an invitation',async()=>{
 const h=setup();h.c.localStorage.getItem=()=> 'invitation';h.c.fetchHome=async()=>{h.c.currentView='username-setup';return null;};let invited=false;h.c.showInvite=async()=>{invited=true;};h.event('INITIAL_SESSION');await h.tick();assert.equal(h.c.currentView,'username-setup');assert.equal(invited,false);
});
test('the pinned Supabase SDK reproduces refresh-before-initial and the real app starts once',async()=>{
 const {createClient}=require('@supabase/supabase-js'),h=setup({cached:true}),events=[],ready=deferred();let refreshes=0;
 const token=Buffer.from('{}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:A,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.test';
 const key='startup-sdk-test',saved=new Map([[key,JSON.stringify({...session(),refresh_token:'test-refresh',expires_at:1,expires_in:3600,token_type:'bearer'})]]);
 const client=createClient('https://startup.invalid','test-key',{auth:{storageKey:key,storage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},autoRefreshToken:true,detectSessionInUrl:false},global:{fetch:async url=>{
  assert.match(String(url),/\/auth\/v1\/token\?grant_type=refresh_token/);refreshes++;
  return new Response(JSON.stringify({...session(),access_token:token,refresh_token:'test-refresh-next',expires_in:3600,token_type:'bearer'}),{status:200,headers:{'Content-Type':'application/json'}});
 }}});
 const {data:{subscription}}=client.auth.onAuthStateChange((event,s)=>{events.push(event);h.c.handleAuthState(event,s);if(event==='INITIAL_SESSION')ready.resolve();});
 let timeout;
 try{
  await Promise.race([ready.promise,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('SDK did not initialize')),3000);})]);
  assert.deepEqual(events,['TOKEN_REFRESHED','INITIAL_SESSION']);assert.equal(refreshes,1);await h.tick();assert.equal(h.c.currentView,'home');assert.equal(h.calls.reads,1);assert.equal(h.calls.renders,1);
  h.wait.resolve({games:[]});await settle();
 }finally{clearTimeout(timeout);subscription.unsubscribe();await client.auth.stopAutoRefresh();}
});
test('API session timeout preserves saved data and does not issue an unauthenticated game request',async()=>{
 const h=setup({cached:true});h.c.user=session().user;h.c.homeData={games:[]};h.c.db.auth.getSession=()=>new Promise(()=>{});let requests=0;h.c.fetch=()=>{requests++;};
 vm.runInContext(fragment('async function api(body)','async function run('),h.c);
 const failed=assert.rejects(h.c.api({action:'home'}),/restore your sign-in/);await h.tick(10000);await failed;assert.equal(requests,0);assert.equal(h.calls.clears,0);assert(h.c.homeData);
});
test('returning to the app retries a stranded loading view and keeps a fresh game on its normal refresh path',async()=>{
 const h=setup({actualEntry:false});let retries=0,polls=0,renders=0;Object.assign(h.c,{retryStartup:()=>retries++,poll:()=>polls++,renderGame:()=>renders++,preview:false,busy:false});vm.runInContext(fragment('function resume()','if(native)'),h.c);
 h.c.resume();assert.equal(retries,1);assert.equal(polls,0);h.c.entering=true;h.c.resume();assert.equal(retries,1);
 h.c.currentView='game';h.c.game={id:'game'};h.c.gameFresh=true;h.c.resume();assert.equal(h.c.gameFresh,false);assert.equal(renders,1);
});
