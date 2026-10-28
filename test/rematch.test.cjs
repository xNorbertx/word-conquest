const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');
const id=()=>crypto.randomUUID();let db,d,l,createHandler,createRematchSender;
const rpc=async(name,args)=>(await db.query(`select ${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) value`,args)).rows[0].value;
async function person(){const user=id();await db.query('insert into auth.users values($1)',[user]);await rpc('wc_complete_username',[user,'User'+user.replaceAll('-','').slice(0,12)]);return user;}
async function finished(a,b,rules=d.RULES_VERSION){const game=id();await db.query("insert into games(id,players,state,status,result,rules_version,dictionary_version) values($1,$2,$3,'completed','1',$4,'old-dictionary')",[game,[a,b],JSON.stringify({...d.Engine.newGame(d.configFor(rules)),over:true}),rules]);return game;}
const rematch=(actor,source,game=id(),rules=d.RULES_VERSION)=>rpc('wc_rematch',[actor,source,game,id(),JSON.stringify(d.Engine.newGame(d.configFor(rules))),rules,l.languageForRules(rules).dictionary.version]);
before(async()=>{
 d=await import('../server/domain.mjs');l=await import('../server/languages.mjs');({createHandler}=await import('../server/api.mjs'));({createRematchSender}=await import('../online/rematch.mjs'));db=new PGlite();
 await db.exec(`create schema auth;create table auth.users(id uuid primary key);create role anon;create role authenticated;create role service_role bypassrls;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);
 for(const f of ['202609290001_online.sql','202610030002_android_push.sql','202610040001_friends.sql','202610040002_usernames.sql','202610050001_username_onboarding.sql','202610280001_rematches.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+f,'utf8'));
});
after(async()=>await db?.close());

test('non-friend opponents get one addressed rematch; retries and crossed requests reuse it and notify once',async()=>{
 const a=await person(),b=await person(),other=await person(),source=await finished(a,b),newId=id();
 const first=await rematch(a,source,newId);assert.equal(first.status,'invited');assert.deepEqual(first.players,[a]);assert.equal(first.rules_version,d.RULES_VERSION);assert([1,2].includes(first.state.startingPlayer));
 assert.deepEqual(await rematch(a,source,newId),first);assert.deepEqual(await rematch(a,source),first);assert.deepEqual(await rematch(b,source),first);
 assert.equal((await db.query('select count(*)::int n from notifications where game_id=$1',[first.id])).rows[0].n,1);
 assert.equal((await db.query('select recipient from invitations where game_id=$1',[first.id])).rows[0].recipient,b);
 assert.equal((await rpc('wc_friends',[b])).invitations[0].id,first.id);
 const token=(await db.query('select token from invitations where game_id=$1',[first.id])).rows[0].token;
 await assert.rejects(()=>rpc('wc_invitation',[other,token,'accept']),/invitation_unavailable/);
 const joined=await rpc('wc_invitation',[b,token,'accept']);assert.equal(joined.status,'active');assert.deepEqual(joined.players,[a,b]);assert.deepEqual(joined.state,first.state);
 assert.equal((await rematch(a,source)).id,first.id);assert.equal((await rematch(b,source)).id,first.id);
 assert.equal((await db.query('select count(*)::int n from friendships where low_id=least($1::uuid,$2::uuid)',[a,b])).rows[0].n,0);
});

test('existing matching invitations are reused, while another language is never silently substituted',async()=>{
 const a=await person(),b=await person(),source=await finished(a,b),other=await finished(a,b);
 const first=await rematch(a,source);assert.equal((await rematch(b,other)).id,first.id);
 const swedish=await finished(a,b,l.LANGUAGES.sv.rulesVersion);
 await assert.rejects(()=>rematch(a,swedish,id(),l.LANGUAGES.sv.rulesVersion),/invitation_pending/);
 assert.equal((await db.query('select count(*)::int n from rematches where source_game=$1',[swedish])).rows[0].n,0);
});

test('source membership, completed status, available opponent and blocks are enforced inside the transaction',async()=>{
 const a=await person(),b=await person(),c=await person(),source=await finished(a,b);
 await assert.rejects(()=>rematch(c,source),/not_found/);
 await db.query("update games set status='active' where id=$1",[source]);await assert.rejects(()=>rematch(a,source),/rematch_unavailable/);
 await db.query("update games set status='completed' where id=$1",[source]);
 await rpc('wc_friend_action',[b,a,'block',id(),null]);await assert.rejects(()=>rematch(a,source),/friend_unavailable/);await assert.rejects(()=>rematch(b,source),/friend_unavailable/);
 await rpc('wc_friend_action',[b,a,'unblock',id(),null]);await db.query('update profiles set deleting=true where id=$1',[b]);await assert.rejects(()=>rematch(a,source),/friend_unavailable/);
 await db.query('update games set players=$2 where id=$1',[source,[a,null]]);await assert.rejects(()=>rematch(a,source),/rematch_unavailable/);
 await db.query('update games set players=$2 where id=$1',[source,[a,a]]);await assert.rejects(()=>rematch(a,source),/rematch_unavailable/);
});

test('creation IDs cannot steal another game and normal active-game limits still apply',async()=>{
 const a=await person(),b=await person(),source=await finished(a,b),foreign=await finished(b,a);
 await assert.rejects(()=>rematch(a,source,foreign),/idempotency_conflict/);
 for(let i=0;i<30;i++)await db.query("insert into games(id,players,state,rules_version,dictionary_version) values($1,$2,'{}',$3,'test')",[id(),[a],d.RULES_VERSION]);
 await assert.rejects(()=>rematch(a,source),/game_limit/);
 assert.equal((await db.query('select count(*)::int n from rematches where source_game=$1',[source])).rows[0].n,0);
});

test('browser roles cannot call rematch with a forged actor or read/write rematch receipts',async()=>{
 const a=await person(),b=await person(),source=await finished(a,b);
 for(const role of ['anon','authenticated']){await db.exec('set role '+role);try{
   await assert.rejects(()=>rematch(a,source),/permission denied/);await assert.rejects(()=>db.query('select * from rematches'),/permission denied/);await assert.rejects(()=>db.query('delete from rematches'),/permission denied/);
 }finally{await db.exec('reset role');}}
 await db.exec('set role service_role');try{assert.equal((await rematch(a,source)).status,'invited');}finally{await db.exec('reset role');}
});

function apiFixture(source){
 const actor=source.players[0],calls=[];let wakes=0;
 const handler=createHandler({auth:{getUser:async()=>({data:{user:{id:actor}}})},from:table=>{
  let key,member;const q={select:()=>q,eq:(_,v)=>{key=v;return q;},contains:(_,v)=>{member=v[0];return q;},single:async()=>({data:{id:actor,username:'Alice'}}),maybeSingle:async()=>({data:key===source.id&&source.players.includes(member)?source:null}),in:async()=>({data:source.players.map((id,i)=>({id,display_name:i?'Opponent':'Alice'}))})};return q;
 },rpc:async(name,args)=>{if(name==='wc_rate_limit')return{data:true};calls.push({name,args});assert.equal(name,'wc_rematch');return{data:{id:args.p_id,players:[actor],state:args.p_state,rules_version:args.p_rules,dictionary_version:args.p_dictionary,status:'invited'}};}},{wakePush:()=>wakes++});
 return{calls,wakes:()=>wakes,call:async(body={})=>{const response=await handler(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify({action:'rematch',sourceGameId:source.id,gameId:id(),supportedRules:d.SUPPORTED_RULES,...body})}));return{status:response.status,...await response.json()};}};
}
test('API derives current English/Swedish/Dutch rules and dictionary from source language, ignoring forged client fields',async()=>{
 for(const rules of d.SUPPORTED_RULES){const source={id:id(),players:[id(),id()],status:'completed',rules_version:rules},x=apiFixture(source),language=l.LANGUAGES[l.languageForRules(rules).code];
  const response=await x.call({friendId:id(),language:'xx',rulesVersion:'forged',dictionaryVersion:'forged',state:{player:99}});assert.equal(response.status,200);assert.equal(response.game.rules_version,language.rulesVersion);assert.equal(response.game.dictionary_version,language.dictionary.version);assert.equal(response.game.state.tiles.length,69);assert([1,2].includes(response.game.state.player));assert.equal(x.calls[0].args.p_source,source.id);assert.equal(x.calls[0].args.p_actor,source.players[0]);assert.equal(x.wakes(),1);
 }
});
test('API rejects stale/unsupported clients, unfinished or foreign sources before any rematch write',async()=>{
 const source={id:id(),players:[id(),id()],status:'completed',rules_version:d.RULES_VERSION},x=apiFixture(source);
 assert.equal((await x.call({supportedRules:['autumn-v1']})).code,'client_update_required');assert.equal((await x.call({sourceGameId:id()})).code,'not_found');assert.equal((await x.call({gameId:'bad'})).code,'invalid_id');
 source.status='active';assert.equal((await x.call()).code,'rematch_unavailable');source.status='completed';source.players[1]=null;assert.equal((await x.call()).code,'rematch_unavailable');assert.equal(x.calls.length,0);assert.equal(x.wakes(),0);
});

test('client shares rapid taps, retries a lost reply with the same ID, and isolates accounts and source games',async()=>{
 const stored=new Map(),storage={getItem:k=>stored.get(k),setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)},calls=[];let reject,resolve;
 const send=createRematchSender({storage,api:(body,actor)=>{calls.push({body,actor});return new Promise((a,b)=>{resolve=a;reject=b;});}}),a=id(),b=id(),source=id();
 const first=send(a,source);assert.equal(send(a,source),first);await Promise.resolve();reject(Error('Lost reply'));await assert.rejects(first,/Lost reply/);assert.equal(calls.length,1);
 const retry=send(a,source);await Promise.resolve();assert.equal(calls[1].body.gameId,calls[0].body.gameId);resolve({game:{id:calls[0].body.gameId}});await retry;assert.equal(stored.size,0);
 const switched=send(b,source);await Promise.resolve();assert.notEqual(calls[2].body.gameId,calls[0].body.gameId);assert.equal(calls[2].actor,b);resolve({game:{id:'new'}});await switched;
 const another=send(a,id());await Promise.resolve();assert.notEqual(calls[3].body.sourceGameId,source);resolve({game:{id:'other'}});await another;
});
test('client keeps its retry identity even when browser storage is denied',async()=>{
 const storage={getItem(){throw Error();},setItem(){throw Error();},removeItem(){throw Error();}},calls=[],send=createRematchSender({storage,api:async body=>{calls.push(body);if(calls.length===1)throw Error('offline');return{game:{id:body.gameId}};}}),a=id(),source=id();
 await assert.rejects(send(a,source),/offline/);await send(a,source);assert.equal(calls[0].gameId,calls[1].gameId);
});
