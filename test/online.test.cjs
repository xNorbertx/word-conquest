const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');
const words=require('../server/versions/dictionary-v1.json'),meta=require('../server/versions/dictionary-v1.meta.json');
const dictionary=new Set(words),A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',C='33333333-3333-4333-8333-333333333333';
let domain,db;
before(async()=>{
  domain=await import('../server/domain.mjs');db=new PGlite();
  await db.exec(`create schema auth;create table auth.users(id uuid primary key);
    create role anon;create role authenticated;create role service_role bypassrls;
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;
    insert into auth.users values('${A}'),('${B}'),('${C}');`);
  await db.exec(fs.readFileSync('supabase/migrations/202609290001_online.sql','utf8'));
  await db.query('insert into profiles(id) values($1),($2),($3)',[A,B,C]);
});
after(async()=>{await db?.close();});
async function rpc(name,args){const {rows}=await db.query(`select ${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as result`,args);return rows[0].result;}
async function newGame(){const id=crypto.randomUUID(),token=crypto.randomUUID();let g=await rpc('wc_create',[A,id,token,JSON.stringify(domain.Engine.newGame(domain.config)),domain.RULES_VERSION,meta.version]);return {g,token};}
const command=(g,action='refresh',extra={})=>({operationId:crypto.randomUUID(),revision:g.revision,action,...extra});
async function commit(g,actor,c){const {next,recap}=domain.applyCommand(g,actor,c,dictionary,meta.version);return rpc('wc_commit',[actor,g.id,c.operationId,domain.commandKey(c),c.revision,JSON.stringify(next),JSON.stringify(recap)]);}
function findWord(state){
  const prefixes=new Set();for(const word of words)if(word.length<=6)for(let n=1;n<=word.length;n++)prefixes.add(word.slice(0,n));
  function visit(path,text,jokers){
    if(text.length>=3 && dictionary.has(text))return {path,jokers};
    if(path.length>=6)return null;
    const last=state.tiles.find(t=>t.id===path.at(-1));
    for(const tile of state.tiles){
      if(path.includes(tile.id) || (last && !domain.Engine.adjacent(last,tile)))continue;
      const next=[...path,tile.id];if(domain.Engine.validatePath(state,next,domain.config,false))continue;
      for(const letter of tile.letter==='?'?'ABCDEFGHIJKLMNOPQRSTUVWXYZ':tile.letter){
        const word=text+letter.toLowerCase();if(!prefixes.has(word))continue;
        const found=visit(next,word,tile.letter==='?'?{...jokers,[tile.id]:letter}:jokers);if(found)return found;
      }
    }
    return null;
  }
  return visit([],'',{});
}
test('dictionary integrity and malformed inputs',()=>{
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync('server/versions/dictionary-v1.json')).digest('hex'),meta.sha256);
  assert.ok(dictionary.size>100000);for(const word of ['cat','hounds','meadow'])assert.ok(dictionary.has(word));
  assert.throws(()=>domain.checkCommand({operationId:'fake',revision:0,action:'word'}));
  assert.throws(()=>domain.checkCommand({operationId:crypto.randomUUID(),revision:0,action:'word',path:['0,0'],jokers:{'0,0':'ZZ'}}));
});
test('invites are idempotent, private, single-use and require another player',async()=>{
  const {g,token}=await newGame();const retry=await rpc('wc_create',[A,g.id,crypto.randomUUID(),'{}',domain.RULES_VERSION,meta.version]);assert.deepEqual(retry.state,g.state);
  assert.equal((await rpc('wc_invitation',[B,token,'preview'])).state,undefined);
  await assert.rejects(()=>rpc('wc_invitation',[A,token,'accept']),/cannot_accept_own/);
  const accepted=await rpc('wc_invitation',[B,token,'accept']);assert.deepEqual(accepted.players,[A,B]);
  assert.equal((await rpc('wc_invitation',[B,token,'accept'])).revision,accepted.revision);
  await assert.rejects(()=>rpc('wc_invitation',[C,token,'accept']),/invitation_unavailable/);
});
test('server rejects spoofing, wrong turns, stale clients, missing versions and unlisted words',async()=>{
  const {token}=await newGame(),g=await rpc('wc_invitation',[B,token,'accept']);
  assert.throws(()=>domain.applyCommand(g,C,command(g),dictionary,meta.version),/belongs/);
  assert.throws(()=>domain.applyCommand(g,B,command(g),dictionary,meta.version),/Waiting/);
  assert.throws(()=>domain.applyCommand(g,A,{...command(g),revision:99},dictionary,meta.version),/newer turn/);
  assert.throws(()=>domain.applyCommand({...g,rules_version:'future'},A,command(g),dictionary,meta.version),/original rules/);
  assert.throws(()=>domain.applyCommand(g,A,command(g),null,meta.version),/dictionary/);
  const fake=structuredClone(g);fake.state.tiles=[{id:'0,0',q:0,r:0,owner:1,letter:'Q'},{id:'1,0',q:1,r:0,owner:0,letter:'Z'},{id:'2,0',q:2,r:0,owner:0,letter:'X'}];
  assert.throws(()=>domain.applyCommand(fake,A,command(fake,'word',{path:['0,0','1,0','2,0']}),dictionary,meta.version),/dictionary/);
  const legal=structuredClone(fake);['C','A','T'].forEach((l,i)=>legal.state.tiles[i].letter=l);
  const input=command(legal,'word',{path:['0,0','1,0','2,0'],score:999999,state:{over:true}});
  const {next,recap}=domain.applyCommand(legal,A,input,dictionary,meta.version);
  assert.equal(next.state.wordPoints[0],4);assert.equal(recap.score.wordPoints,4);assert.deepEqual(recap.path,input.path);
  for(let i=0;i<3;i++){assert.equal(next.state.tiles[i].owner,1);assert.notEqual(next.state.tiles[i].letter,legal.state.tiles[i].letter);}
  assert.equal(legal.state.wordPoints[0],0);
});
test('lost-response retries and concurrent stale submissions cannot duplicate a turn',async()=>{
  const {token}=await newGame(),g=await rpc('wc_invitation',[B,token,'accept']),c=command(g);
  const {next,recap}=domain.applyCommand(g,A,c,dictionary,meta.version);
  const args=[A,g.id,c.operationId,domain.commandKey(c),c.revision,JSON.stringify(next),JSON.stringify(recap)];
  const first=await rpc('wc_commit',args),retry=await rpc('wc_commit',args);
  assert.equal(retry.replayed,true);assert.equal(first.game.revision,retry.game.revision);assert.equal(retry.game.state.turns[0],1);
  await assert.rejects(()=>rpc('wc_commit',[...args.slice(0,3),'different',...args.slice(4)]),/idempotency_conflict/);
  const attempts=await Promise.allSettled([rpc('wc_commit',[A,g.id,crypto.randomUUID(),domain.commandKey(c),c.revision,JSON.stringify(next),JSON.stringify(recap)]),rpc('wc_commit',args)]);
  assert.equal(attempts[0].status,'rejected');assert.equal(attempts[1].status,'fulfilled');
  assert.equal((await db.query('select count(*)::int n from operations where game_id=$1',[g.id])).rows[0].n,1);
  assert.equal((await db.query('select count(*)::int n from notifications where game_id=$1 and revision=$2',[g.id,first.game.revision])).rows[0].n,1);
});
test('five-opponent capture persists atomically and a retry cannot award it twice',async()=>{
  const {token}=await newGame(),g=await rpc('wc_invitation',[B,token,'accept']);
  const path=[...'GARDENS'].map((letter,i)=>{const id=`${i-3},0`;Object.assign(g.state.tiles.find(t=>t.id===id),{letter,owner:i===0?1:i<6?2:0,castle:i===3});return id;});
  await db.query('update games set state=$1 where id=$2',[JSON.stringify(g.state),g.id]);
  const c=command(g,'word',{path}),first=await commit(g,A,c),retry=await commit(g,A,c);
  assert.equal(first.recap.score.totalGain,27);assert.equal(retry.replayed,true);assert.equal(retry.game.revision,g.revision+1);
  const saved=(await db.query('select * from games where id=$1',[g.id])).rows[0];
  assert.equal(saved.rules_version,'autumn-v2');assert.equal(saved.state.wordPoints[0],19);assert.equal(saved.state.lettersUsed,7);
  for(const id of path)assert.equal(saved.state.tiles.find(t=>t.id===id).owner,1);
  assert.equal((await db.query('select count(*)::int n from operations where game_id=$1',[g.id])).rows[0].n,1);
  assert.equal((await db.query('select count(*)::int n from notifications where game_id=$1 and revision=$2',[g.id,saved.revision])).rows[0].n,1);
});

test('RLS and grants prohibit nonparticipant reads and direct client writes',async()=>{
  const {g}=await newGame();await db.exec(`set role authenticated;set request.jwt.claim.sub='${C}';`);
  try{
    assert.equal((await db.query('select * from games where id=$1',[g.id])).rows.length,0);
    await assert.rejects(()=>db.query('update games set revision=999 where id=$1',[g.id]),/permission denied/);
    await assert.rejects(()=>db.query('select * from invitations'),/permission denied/);
    await assert.rejects(()=>rpc('wc_delete_account',[A]),/permission denied/);
    await assert.rejects(()=>rpc('wc_rate_limit',[A]),/permission denied/);
    await db.exec(`set request.jwt.claim.sub='${A}';`);assert.equal((await db.query('select * from games where id=$1',[g.id])).rows.length,1);
  }finally{await db.exec('reset role');}
});
test('complete saved game keeps equal turns and exactly one ranked result',async()=>{
  const {token}=await newGame();let g=await rpc('wc_invitation',[B,token,'accept']),steps=0,wordTurns=0;
  while(!g.state.over && steps++<100){const found=findWord(g.state);if(found)wordTurns++;
    g=(await commit(g,g.players[g.state.player-1],command(g,found?'word':'refresh',found || {}))).game;
    g=(await db.query('select * from games where id=$1',[g.id])).rows[0];}
  assert.ok(wordTurns>=5,'complete game must actually play dictionary words');
  assert.ok(g.state.over);assert.equal(g.state.turns[0],g.state.turns[1]);assert.equal(g.status,'completed');
  const stats=Object.values(domain.statistics([g],A))[0];assert.equal(stats.games,1);assert.equal(stats.wins+stats.losses+stats.draws,1);
  assert.throws(()=>domain.applyCommand(g,A,command(g),dictionary,meta.version),/not active/);
});
test('mutual draw, resignation and unranked inactivity lifecycle',async()=>{
  let {token}=await newGame(),g=await rpc('wc_invitation',[B,token,'accept']);g=(await commit(g,A,command(g,'offer_draw'))).game;
  assert.throws(()=>domain.applyCommand(g,A,command(g,'accept_draw'),dictionary,meta.version),/friend/);
  g=(await commit(g,B,command(g,'accept_draw'))).game;assert.equal(g.result,'draw');
  ({token}=await newGame());g=await rpc('wc_invitation',[B,token,'accept']);g=(await commit(g,A,command(g,'resign'))).game;assert.equal(g.result,'2');
  ({token}=await newGame());g=await rpc('wc_invitation',[B,token,'accept']);assert.throws(()=>domain.applyCommand(g,A,command(g,'abandon'),dictionary,meta.version),/30 days/);
  g.last_play_at='2020-01-01T00:00:00Z';const abandoned=domain.applyCommand(g,A,command(g,'abandon'),dictionary,meta.version).next;assert.equal(abandoned.status,'abandoned');assert.deepEqual(domain.statistics([abandoned],A),{});
});
test('invitation expiry, decline and owner-only cancellation',async()=>{
  let {g,token}=await newGame();await db.query("update invitations set expires_at=now()-interval '1 day' where game_id=$1",[g.id]);assert.equal((await rpc('wc_invitation',[B,token,'accept'])).status,'expired');
  ({token}=await newGame());assert.equal((await rpc('wc_invitation',[B,token,'decline'])).status,'declined');
  ({token}=await newGame());await assert.rejects(()=>rpc('wc_invitation',[B,token,'cancel']),/forbidden/);assert.equal((await rpc('wc_invitation',[A,token,'cancel'])).status,'cancelled');
});
test('API rejects missing auth, unapproved origins and oversized bodies',async()=>{
  const {createHandler}=await import('../server/api.mjs');let touched=false;
  const handler=createHandler({auth:{getUser:async()=>{touched=true;return {data:{user:{id:A}}};}}},{origins:['https://game.example']});
  assert.equal((await handler(new Request('https://api.example',{method:'POST'}))).status,401);assert.equal(touched,false);
  assert.equal((await handler(new Request('https://api.example',{method:'POST',headers:{origin:'https://evil.example',authorization:'Bearer fake'}}))).status,403);assert.equal(touched,false);
  assert.equal((await handler(new Request('https://api.example',{method:'POST',headers:{authorization:'Bearer fake'},body:'x'.repeat(17000)}))).status,413);
});
test('deletion anonymizes games, blocks future mutation and is retryable',async()=>{
  const {token}=await newGame();let g=await rpc('wc_invitation',[B,token,'accept']);await rpc('wc_delete_account',[B]);await rpc('wc_delete_account',[B]);
  g=(await db.query('select to_jsonb(games) as game from games where id=$1',[g.id])).rows[0].game;assert.equal(g.status,'abandoned');assert.equal(g.players[1],null);assert.equal(g.state.over,true);
  assert.equal((await db.query('select * from notifications where user_id=$1',[B])).rows.length,0);
  await assert.rejects(()=>rpc('wc_create',[B,crypto.randomUUID(),crypto.randomUUID(),'{}','x','x']),/account_deleting/);
});
