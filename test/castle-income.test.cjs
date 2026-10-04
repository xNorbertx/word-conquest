const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');
const words=new Set(require('../server/versions/dictionary-v1.json')),meta=require('../server/versions/dictionary-v1.meta.json');
const A=crypto.randomUUID(),B=crypto.randomUUID();let d,db;
before(async()=>{d=await import('../server/domain.mjs');db=new PGlite();
 await db.exec(`create schema auth;create table auth.users(id uuid primary key);create role anon;create role authenticated;create role service_role bypassrls;create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;`);
 await db.exec(fs.readFileSync('supabase/migrations/202609290001_online.sql','utf8'));
 await db.query('insert into auth.users values($1),($2)',[A,B]);await db.query('insert into profiles(id) values($1),($2)',[A,B]);
});
after(async()=>{await db?.close();});
const cmd=(g,action='refresh',extra={})=>({action,revision:g.revision,operationId:crypto.randomUUID(),...extra});
const game=starter=>({id:crypto.randomUUID(),players:[A,B],status:'active',revision:1,rules_version:'autumn-v3',dictionary_version:meta.version,state:d.Engine.newGame(d.config,()=>starter===1?.2:.8)});
async function rpc(name,args){return (await db.query(`select ${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as result`,args)).rows[0].result;}
function ownCastles(g){const side=g.state.tiles.filter(t=>t.castle&&t.q!==0);side[0].owner=1;side[1].owner=2;g.state.tiles.find(t=>t.id==='0,0').owner=1;return g;}
test('server-generated starts support either seat, while old versions always start with host',()=>{
 for(const [roll,expected]of [[0,1],[.499999,1],[.5,2],[.999999,2]]){const s=d.Engine.newGame(d.config,()=>roll);assert.equal(s.player,expected);assert.equal(s.startingPlayer,expected);assert.deepEqual(s.castleIncome,[0,0]);assert.deepEqual(s.turns,[0,0]);}
 for(const version of ['autumn-v1','autumn-v2']){const s=d.Engine.newGame(d.configFor(version),()=>.8);assert.equal(s.player,1);assert.equal(s.castleIncome,undefined);}
});
test('side 2 / center 4 pays both owners only after a full round for either starter',()=>{
 for(const starter of [1,2]){
  let g=ownCastles(game(starter)),before=structuredClone(g);
  const first=d.applyCommand(g,g.players[g.state.player-1],cmd(g),words,meta.version,()=>.4);
  assert.deepEqual(first.next.state.castleIncome,[0,0]);assert.equal(first.recap.roundComplete,false);
  g=first.next;const second=d.applyCommand(g,g.players[g.state.player-1],cmd(g),words,meta.version,()=>.4);
  assert.deepEqual(second.next.state.castleIncome,[6,2]);assert.deepEqual(second.recap.income,[6,2]);assert.equal(second.recap.round,1);assert.equal(second.next.state.player,starter);
  const parts=d.Engine.scoreBreakdown(second.next.state,d.config);assert.equal(parts[0].income,6);assert.equal(parts[1].income,2);assert.equal(parts[0].territory,11);assert.equal(parts[0].total,17);
  assert.deepEqual(before.state.castleIncome,[0,0]);
 }
});
test('center steal has value five, pays the new owner, and preview agrees with saved turn',()=>{
 for(const starter of [1,2]){
  const g=game(starter),p=3-starter;g.state.player=p;g.state.turns[starter-1]=1;g.state.castleIncome=[8,12];
  g.state.tiles.forEach(t=>{if(t.castle)t.owner=0;});g.state.tiles.find(t=>t.castle&&t.q<0).owner=starter;
  const path=[...'GARDENS'].map((letter,i)=>{const id=`${i-3},0`;Object.assign(g.state.tiles.find(t=>t.id===id),{letter,owner:i===0?p:i<6?starter:0,castle:i===3});return id;});
  const preview=d.Engine.scoreMove(g.state,path,d.config),before=structuredClone(g),{next,recap}=d.applyCommand(g,g.players[p-1],cmd(g,'word',{path,score:999,state:{castleIncome:[999,999]}}),words,meta.version,()=>.4);
  assert.equal(preview.wordPoints,19);assert.equal(preview.territoryGain,10);assert.equal(preview.enemyLoss,9);assert.equal(preview.castleIncome,4);assert.equal(preview.totalGain,33);assert.deepEqual(recap.score,preview);
  assert.equal(recap.income[starter-1],2);assert.equal(recap.income[p-1],4);assert.equal(next.state.castleIncome[p-1],before.state.castleIncome[p-1]+4);
  assert.equal(recap.totalsAfter[p-1]-recap.totalsBefore[p-1],33);assert.equal(recap.totalsAfter[starter-1]-recap.totalsBefore[starter-1],-7);
  for(const id of path){assert.equal(next.state.tiles.find(t=>t.id===id).owner,p);assert.notEqual(next.state.tiles.find(t=>t.id===id).letter,before.state.tiles.find(t=>t.id===id).letter);}assert.deepEqual(g,before);
 }
});
test('final reply keeps equal turns and pays the last round regardless of starting seat',()=>{
 for(const starter of [1,2]){
  let g=ownCastles(game(starter));g.state.lettersUsed=119;g.state.turns=[9,9];
  g=d.applyCommand(g,g.players[starter-1],cmd(g),words,meta.version,()=>.4).next;assert.equal(g.status,'active');assert.equal(g.state.over,false);assert.equal(g.state.player,3-starter);assert.deepEqual(g.state.castleIncome,[0,0]);
  const result=d.applyCommand(g,g.players[2-starter],cmd(g),words,meta.version,()=>.4);g=result.next;
  assert.equal(g.status,'completed');assert.deepEqual(g.state.turns,[10,10]);assert.deepEqual(g.state.castleIncome,[6,2]);assert.equal(result.recap.round,10);assert.equal(g.result,'1');
  assert.throws(()=>d.applyCommand(g,A,cmd(g),words,meta.version),/not active/);
 }
});
test('illegal moves, draw offers and resignation never mint an extra castle payment',()=>{
 const g=ownCastles(game(1));g.state.turns=[0,1];g.state.castleIncome=[8,4];
 assert.throws(()=>d.applyCommand(g,A,cmd(g,'word',{path:['0,0','0,0']}),words,meta.version),/once/);assert.deepEqual(g.state.castleIncome,[8,4]);
 for(const action of ['offer_draw','resign']){const r=d.applyCommand(g,A,cmd(g,action),words,meta.version);assert.deepEqual(r.next.state.castleIncome,[8,4]);assert.equal(r.recap.income,undefined);}
});
test('new-game retry and invitation acceptance preserve the stored random starter',async()=>{
 for(const starter of [1,2]){
  const id=crypto.randomUUID(),token=crypto.randomUUID(),s=game(starter).state;
  const g=await rpc('wc_create',[A,id,token,JSON.stringify(s),'autumn-v3',meta.version]);
  const retry=await rpc('wc_create',[A,id,crypto.randomUUID(),JSON.stringify(game(3-starter).state),'autumn-v3',meta.version]);assert.deepEqual(retry.state,g.state);
  const accepted=await rpc('wc_invitation',[B,token,'accept']);assert.equal(accepted.state.player,starter);assert.equal(accepted.state.startingPlayer,starter);assert.deepEqual(accepted.players,[A,B]);
  assert.throws(()=>d.applyCommand(accepted,accepted.players[2-starter],cmd(accepted),words,meta.version),/Waiting/);
 }
});
test('simultaneous round income is committed once across retries and stale races, with one receipt/event',async()=>{
 for(const starter of [1,2]){
  let g=ownCastles(game(starter));g.state.player=3-starter;g.state.turns[starter-1]=1;
  await db.query("insert into games(id,players,state,status,revision,rules_version,dictionary_version) values($1,$2,$3,'active',1,'autumn-v3',$4)",[g.id,g.players,JSON.stringify(g.state),meta.version]);
  const actor=g.players[g.state.player-1],c=cmd(g),{next,recap}=d.applyCommand(g,actor,c,words,meta.version);
  const args=[actor,g.id,c.operationId,d.commandKey(c),c.revision,JSON.stringify(next),JSON.stringify(recap)];
  const first=await rpc('wc_commit',args),retry=await rpc('wc_commit',args);assert.deepEqual(first.game.state.castleIncome,[6,2]);assert.deepEqual(retry.game.state,first.game.state);assert.equal(retry.replayed,true);
  await assert.rejects(()=>rpc('wc_commit',[actor,g.id,crypto.randomUUID(),d.commandKey(c),c.revision,JSON.stringify(next),JSON.stringify(recap)]),/stale/);
  assert.equal((await db.query('select count(*)::int n from operations where game_id=$1',[g.id])).rows[0].n,1);
  assert.equal((await db.query('select count(*)::int n from notifications where game_id=$1',[g.id])).rows[0].n,1);
 }
});
test('complete games use the exact researched income accounting and keep stats in v3',async()=>{
 const lab=await import('../docs/research/castle-income/lab.mjs'),freq=Object.fromEntries([...words].filter(w=>w.length<=5).map(w=>[w,4]));
 const trie=lab.makeTrie(freq);
 for(const starter of [1,2]){
  let g=game(starter),bank=[0,0],steps=0;
  while(!g.state.over&&steps++<60){
   const variant=lab.variants.find(v=>v.id==='double'),found=lab.enumerate(g.state,variant,trie,{noticed:true,noticeSeed:steps});
   const move=lab.choose(g.state,found.moves,variant,'balanced'),path=move.path.map(i=>g.state.tiles[i].id),jokers={};
   move.path.forEach((i,n)=>{if(g.state.tiles[i].letter==='?')jokers[g.state.tiles[i].id]=move.word[n].toUpperCase();});
   g=d.applyCommand(g,g.players[g.state.player-1],cmd(g,'word',{path,jokers}),words,meta.version,lab.rng(steps)).next;
   if(g.state.turns[0]===g.state.turns[1])for(const t of g.state.tiles)if(t.castle&&t.owner)bank[t.owner-1]+=(t.q===0&&t.r===0?4:2);
   assert.deepEqual(g.state.castleIncome,bank);
  }
  assert.equal(g.status,'completed');assert.equal(g.state.turns[0],g.state.turns[1]);assert.ok(bank[0]+bank[1]>0);
  assert.deepEqual(Object.keys(d.statistics([g],A)),['autumn-v3/'+meta.version]);
 }
});
