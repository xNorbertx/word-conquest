const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');
let db,domain;
const id=()=>crypto.randomUUID();
const rpc=async(name,args=[])=>{const r=await db.query(`select ${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as value`,args);return r.rows[0].value;};
async function person(name='Alex'){const user=id();await db.query('insert into auth.users values($1)',[user]);await db.query('insert into profiles(id,display_name) values($1,$2)',[user,name]);return user;}
const action=(actor,target,choice,operation=id(),request=null)=>rpc('wc_friend_action',[actor,target,choice,operation,request]);
async function pair(){const a=await person('Alice'),b=await person('Alex'),request=id();await action(a,b,'request',request);await action(b,a,'accept',id(),request);return {a,b,request};}
const create=(a,b,game=id(),token=id())=>rpc('wc_create_friend',[a,b,game,token,JSON.stringify(domain.Engine.newGame(domain.config)),domain.RULES_VERSION,'dictionary-test']);
before(async()=>{
 domain=await import('../server/domain.mjs');db=new PGlite();
 await db.exec(`create schema auth;create table auth.users(id uuid primary key);create role anon;create role authenticated;create role service_role bypassrls;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);
 for(const file of ['202609290001_online.sql','202610030002_android_push.sql','202610040001_friends.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
});
after(async()=>{await db?.close();});

test('name search is case-insensitive, distinguishes duplicate names, supports exact codes and exposes no private profile fields',async()=>{
 const a=await person('Searcher'),b=await person('Alex Same'),c=await person('Alex Same');
 const results=await rpc('wc_friend_search',[a,'aLeX sAmE']);assert.equal(results.length,2);
 assert.notEqual(results[0].friend_code,results[1].friend_code);
 assert.deepEqual(Object.keys(results[0]).sort(),['display_name','friend_code','id','request_id','requested_by','status']);
 const code=results.find(p=>p.id===b).friend_code.match(/.{4}/g).join('-').toLowerCase();
 assert.deepEqual((await rpc('wc_friend_search',[a,code])).map(p=>p.id),[b]);
 assert.equal((await rpc('wc_friend_search',[b,'Alex Same'])).length,1);
 assert.deepEqual(await rpc('wc_friend_search',[a,'%']),[]);
 assert.deepEqual(await rpc('wc_friend_search',[a,'someone@example.com']),[]);
 await db.query('update profiles set deleting=true where id=$1',[c]);assert.equal((await rpc('wc_friend_search',[a,'Alex Same'])).length,1);
});

test('mutual acceptance, duplicate retries, cross-requests and stale request IDs are enforced',async()=>{
 const a=await person(),b=await person(),request=id(),retry=id();
 await assert.rejects(()=>action(a,a,'request'),/friend_unavailable/);
 await action(a,b,'request',request);await action(a,b,'request',request);await action(b,a,'request',retry);
 assert.equal((await rpc('wc_friends',[b])).people[0].status,'pending');
 await assert.rejects(()=>action(a,b,'accept',id(),request),/friend_stale/);
 await assert.rejects(()=>action(b,a,'accept',id(),id()),/friend_stale/);
 const accept=id();await action(b,a,'accept',accept,request);await action(b,a,'accept',accept,request);
 await assert.rejects(()=>action(b,a,'remove',accept,request),/idempotency_conflict/);
 assert.equal((await rpc('wc_friends',[a])).people[0].status,'accepted');
 await action(a,b,'remove',id(),request);
 // A delayed retry of the original request cannot recreate the relationship.
 await action(a,b,'request',request);await action(b,a,'request',retry);
 assert.equal((await rpc('wc_friends',[a])).people.length,0);
 await assert.rejects(()=>action(a,b,'request'),/friend_cooldown/);
});

test('decline/cancel retries are safe and a previous generation cannot accept a later request',async()=>{
 const a=await person(),b=await person(),r=id(),decline=id();await action(a,b,'request',r);
 await action(b,a,'decline',decline,r);await action(b,a,'decline',decline,r);
 await db.query("update friendships set requested_at=now()-interval '2 days' where low_id=least($1::uuid,$2::uuid) and high_id=greatest($1::uuid,$2::uuid)",[a,b]);
 const next=id();await action(a,b,'request',next);
 await assert.rejects(()=>action(b,a,'accept',id(),r),/friend_stale/);
 await action(a,b,'cancel',id(),next);assert.equal((await rpc('wc_friends',[b])).people.length,0);
});

test('addressed game invitations persist once, notify once, protect the seat, then start the actual versioned game',async()=>{
 const {a,b}=await pair(),c=await person(),gameId=id(),token=id();
 await assert.rejects(()=>create(a,c),/friend_unavailable/);
 const original=await create(a,b,gameId,token),retry=await create(a,b,gameId,id());assert.deepEqual(retry,original);
 assert.equal(original.rules_version,domain.RULES_VERSION);assert.ok([1,2].includes(original.state.player));
 await assert.rejects(()=>create(a,b),/invitation_pending/);
 const inbox=await rpc('wc_friends',[b]);assert.equal(inbox.invitations[0].id,gameId);assert.equal(inbox.invitations[0].host,'Alice');
 assert.equal((await db.query('select count(*)::int n from notifications where game_id=$1',[gameId])).rows[0].n,1);
 for(const choice of ['preview','accept','decline'])await assert.rejects(()=>rpc('wc_invitation',[c,token,choice]),/invitation_unavailable/);
 const joined=await rpc('wc_invitation',[b,token,'accept']);assert.deepEqual(joined.players,[a,b]);assert.deepEqual(joined.state,original.state);assert.equal(joined.status,'active');
 assert.equal((await rpc('wc_friends',[b])).invitations.length,0);
 assert.equal((await rpc('wc_invitation',[b,token,'accept'])).revision,joined.revision);
 assert.equal((await db.query("select read_at is not null as read from notifications where game_id=$1 and kind='invitation received'",[gameId])).rows[0].read,true);
});

test('blocking hides both players, prevents requests and link invitations, cancels addressed invitations and skips push',async()=>{
 const {a,b}=await pair(),token=id();await rpc('wc_push_register',[b,id(),'test-token-long-enough-for-push',true]);const g=await create(a,b,id(),token);
 await action(b,a,'block');assert.equal((await rpc('wc_friends',[a])).people.length,0);assert.equal((await rpc('wc_friends',[b])).blocked.length,1);
 assert.equal((await db.query('select status from games where id=$1',[g.id])).rows[0].status,'cancelled');
 assert.equal((await db.query('select * from wc_push_claim()')).rows.length,0);
 assert.equal((await db.query("select outcome from push_deliveries where notification_id in (select id from notifications where game_id=$1)",[g.id])).rows[0].outcome,'skipped');
 await assert.rejects(()=>action(a,b,'request'),/friend_unavailable/);await assert.rejects(()=>create(a,b),/friend_unavailable/);
 assert.equal((await rpc('wc_friend_search',[a,'Alex'])).some(p=>p.id===b),false);
 const openToken=id();await rpc('wc_create',[a,id(),openToken,'{}','autumn-v1','x']);await assert.rejects(()=>rpc('wc_invitation',[b,openToken,'preview']),/invitation_unavailable/);
 await action(b,a,'unblock');assert.equal((await rpc('wc_friends',[b])).blocked.length,0);assert.equal((await rpc('wc_friends',[a])).people.length,0);
});

test('account deletion clears relationships and invitations addressed to the deleted account',async()=>{
 const {a,b}=await pair(),g=await create(a,b);await rpc('wc_delete_account',[b]);await rpc('wc_delete_account',[b]);
 assert.equal((await rpc('wc_friends',[a])).people.length,0);
 assert.equal((await db.query('select status from games where id=$1',[g.id])).rows[0].status,'cancelled');
 assert.equal((await db.query('select * from invitations where game_id=$1',[g.id])).rows.length,0);
 assert.equal((await db.query("select * from friend_operations where actor=$1 or fingerprint like $1::text||':%'",[b])).rows.length,0);
 assert.equal((await rpc('wc_friend_search',[a,'Alex'])).some(p=>p.id===b),false);
});

test('RLS allows only your relationships and addressed invitations; RPCs and private receipts cannot be called from a browser',async()=>{
 const {a,b}=await pair(),c=await person(),g=await create(a,b);
 for(const [actor,count] of [[a,1],[b,1],[c,0]]){
  await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${actor}',false)`);
  try{
   assert.equal((await db.query('select * from friendships')).rows.length,count);
   assert.equal((await db.query('select * from invitations where game_id=$1',[g.id])).rows.length,actor===b?1:0);
   await assert.rejects(()=>rpc('wc_friend_search',[actor,'Alex']),/permission denied/);
   await assert.rejects(()=>rpc('wc_link_invitation',[actor,id(),'accept']),/permission denied/);
   await assert.rejects(()=>db.query('select * from friend_operations'),/permission denied/);
   await assert.rejects(()=>db.query("update friendships set status='accepted'"),/permission denied/);
  }finally{await db.exec('reset role');}
 }
});

test('friend request daily limits stop spam without preventing acceptance',async()=>{
 const actor=await person();
 for(let i=0;i<20;i++)await action(actor,await person('Rate test'),'request');
 const target=await person();await assert.rejects(()=>action(actor,target,'request'),/friend_limit/);
 const request=id();await action(target,actor,'request',request);await action(actor,target,'accept',id(),request);
 assert.ok((await rpc('wc_friends',[actor])).people.some(p=>p.id===target&&p.status==='accepted'));
});
