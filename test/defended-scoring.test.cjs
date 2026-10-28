const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');
const words=new Set(require('../server/versions/dictionary-v1.json')),meta=require('../server/versions/dictionary-v1.meta.json');
const A=crypto.randomUUID(),B=crypto.randomUUID();let d,m,l,db;
before(async()=>{
 d=await import('../server/domain.mjs');m=await import('../online/score-motion.mjs');l=await import('../server/languages.mjs');
 db=new PGlite();await db.exec('create schema auth;create table auth.users(id uuid primary key);create role anon;create role authenticated;create role service_role bypassrls;create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;');
 await db.exec(fs.readFileSync('supabase/migrations/202609290001_online.sql','utf8'));
 await db.query('insert into auth.users values($1),($2)',[A,B]);await db.query('insert into profiles(id) values($1),($2)',[A,B]);
});
after(async()=>await db?.close());
const cmd=(g,action='refresh',extra={})=>({action,revision:g.revision,operationId:crypto.randomUUID(),...extra});
const game=(starter=1,version='autumn-v5')=>({id:crypto.randomUUID(),players:[A,B],status:'active',revision:1,rules_version:version,dictionary_version:l.languageForRules(version).dictionary.version,state:d.Engine.newGame(d.configFor(version),()=>starter===1?.2:.8)});
const run=(g,action='refresh',extra={})=>d.applyCommand(g,g.players[g.state.player-1],cmd(g,action,extra),words,meta.version,()=>.4);
const totalOwned=s=>[1,2].map(p=>s.tiles.filter(t=>t.owner===p).length);
function ownCastles(g){g.state.tiles.filter(t=>t.castle).forEach((t,i)=>t.owner=t.id==='0,0'?1:i%2+1);return g;}
function pathFor(g,word='GARDENS',owner=3-g.state.player){return [...word].map((letter,i)=>{
 const id=`${i-3},0`;Object.assign(g.state.tiles.find(t=>t.id===id),{letter,owner:i===0?g.state.player:owner});return id;
});}
function plan(result,c){return m.scoreMotionPlan(result.next,{revision:result.next.revision,recap:result.recap},c);}
const income=(s,defender)=>s.tiles.reduce((n,t)=>n+(t.castle&&t.owner===defender?(t.id==='0,0'?5:3):0),0);
test('new games start at zero and pin English/Swedish versions without changing old dictionaries or letter values',()=>{
 assert.equal(d.RULES_VERSION,'autumn-v6');assert.equal(l.LANGUAGES.sv.rulesVersion,'autumn-sv-v5');
 for(const v of ['autumn-v5','autumn-sv-v4'])for(const starter of [1,2]){const g=game(starter,v);assert.equal(g.state.player,starter);assert.deepEqual(d.Engine.scores(g.state,d.configFor(v)),[0,0]);assert.equal(g.state.finalTerritory,null);assert.deepEqual(d.Engine.scoreBreakdown(g.state,d.configFor(v)).map(s=>s.pendingTerritory),[3,3]);}
 assert.deepEqual(d.configFor('autumn-sv-v4').wordScoring.letterGroups,d.configFor('autumn-sv-v3').wordScoring.letterGroups);
 assert.equal(l.languageForRules('autumn-sv-v4').dictionary.version,l.languageForRules('autumn-sv-v3').dictionary.version);
 assert.notEqual(l.languageForRules('autumn-sv-v4').dictionary.version,l.languageForRules('autumn-sv-v2').dictionary.version);
 assert.deepEqual(d.Engine.scores(game(1,'autumn-v4').state,d.configFor('autumn-v4')),[3,3]);
});
test('tested English letter tiers, zero jokers, and six-letter bonus are exact',()=>{
 const c=d.configFor('autumn-v5');
 for(const [letters,points]of [['AEILNORSTU',1],['DG',2],['BCMP',3],['FHKVWY',4],['JQXZ',5],['?',0]])for(const letter of letters)assert.equal(d.Engine.letterValue(letter,c),points);
 for(let length=0;length<=69;length++)assert.equal(d.Engine.lengthBonus(length,c),length<6?0:2*length-11);
});
test('each valid word or refresh pays only the surviving defender, independent of starting order',()=>{
 for(const starter of [1,2]){
  let g=ownCastles(game(starter));for(let turn=0;turn<4;turn++){
   const defender=3-g.state.player,old=structuredClone(g),r=run(g),expected=[0,0];expected[defender-1]=income(g.state,defender);
   assert.deepEqual(r.recap.income,expected);assert.deepEqual(r.next.state.castleIncome,g.state.castleIncome.map((n,i)=>n+expected[i]));
   assert.equal(r.next.state.finalTerritory,null);assert.deepEqual(g,old);assert.deepEqual(plan(r,d.configFor(g.rules_version)).events.map(e=>e.kind),['castles']);g=r.next;
  }
 }
});
test('capturing a castle denies its old owner income and earns no immediate capture or defence reward',()=>{
 for(const actor of [1,2])for(const owner of [0,3-actor]){
  const g=ownCastles(game(actor)),c=d.configFor(g.rules_version),path=pathFor(g,'GARDENS',owner),preview=d.Engine.scoreMove(g.state,path,c),old=structuredClone(g);
  const r=run(g,'word',{path,score:99999,state:{castleIncome:[999,999]}});
  assert.deepEqual(r.recap.score,preview);assert.equal(preview.wordPoints,12);assert.equal(preview.territoryGain,0);assert.equal(preview.enemyLoss,0);assert.equal(preview.castleIncome,0);assert.equal(preview.totalGain,12);
  assert.equal(r.recap.income[actor-1],0);assert.equal(r.recap.income[2-actor],income(r.next.state,3-actor));
  assert.deepEqual(g,old);assert.ok(r.recap.totalsAfter.every((n,i)=>n>=r.recap.totalsBefore[i]));
  assert.deepEqual(plan(r,c).castleCaptures,['0,0']);assert.ok(plan(r,c).events.every(e=>e.kind==='word'||e.kind==='castles'));
  // The next player retakes the centre: it must never pay its temporary owner.
  const back=r.next;back.state.tiles.filter(t=>t.castle&&t.id!=='0,0').forEach(t=>t.owner=0);
  const backPath=pathFor(back,'GARDENS',actor),recapture=run(back,'word',{path:backPath});
  assert.deepEqual(recapture.recap.income,[0,0]);assert.equal(recapture.next.state.castleIncome[actor-1],old.state.castleIncome[actor-1]);
 }
});
test('a held new castle pays after the opponent refreshes, then keeps banked income after a later loss',()=>{
 let g=game();g.state.tiles.forEach(t=>{if(t.castle)t.owner=0;});g=run(g,'word',{path:pathFor(g,'GARDENS',0)}).next;
 const hold=run(g);assert.equal(hold.recap.income[0],5);g=hold.next;
 g=run(g).next;const loss=run(g,'word',{path:pathFor(g)});assert.equal(loss.next.state.castleIncome[0],5);assert.equal(loss.recap.income[0],0);
});
test('the last reply pays defender income, then counts every owned tile once, for either starter and action',()=>{
 for(const starter of [1,2])for(const action of ['word','refresh']){
  let g=ownCastles(game(starter));g.state.lettersUsed=119;g.state.turns=[9,9];const first=run(g);g=first.next;
  assert.equal(g.status,'active');assert.equal(g.state.finalTerritory,null);assert.equal(g.state.player,3-starter);
  const c=d.configFor(g.rules_version),path=action==='word'?pathFor(g):null,preview=path&&d.Engine.scoreMove(g.state,path,c);
  const r=run(g,action,path?{path}:{}),counts=totalOwned(r.next.state);
  assert.equal(r.next.status,'completed');assert.deepEqual(r.next.state.turns,[10,10]);assert.deepEqual(r.next.state.finalTerritory,counts);assert.deepEqual(r.recap.finalTerritory,counts);
  assert.equal(r.recap.income[starter-1],income(r.next.state,starter));assert.equal(r.recap.income[2-starter],0);
  if(preview)assert.deepEqual(preview,r.recap.score);
  const p=plan(r,c);assert.ok(p);assert.equal(p.events.filter(e=>e.kind==='final-territory').length,2);
  for(const e of p.events.filter(e=>e.kind==='final-territory'))assert.ok(e.sources.every(s=>s.amount===1));
  assert.deepEqual(d.Engine.settleFinalTerritory(r.next.state,c),r.next.state);
  assert.throws(()=>run(r.next),/not active/);
  assert.deepEqual(d.Engine.scores(r.next.state,c),r.recap.totalsAfter);
  assert.equal(r.next.result,r.recap.totalsAfter[0]===r.recap.totalsAfter[1]?'draw':r.recap.totalsAfter[0]>r.recap.totalsAfter[1]?'1':'2');
 }
});
test('resignation and agreed draw settle land without income; offer, invalid turn and abandonment do not',()=>{
 for(const action of ['resign','accept_draw','offer_draw','abandon']){
  const g=ownCastles(game()),c=d.configFor(g.rules_version);g.state.wordPoints=[500,10];g.state.castleIncome=[8,4];g.last_play_at='2020-01-01T00:00:00Z';if(action==='accept_draw')g.draw_by=B;
  const r=run(g,action);assert.deepEqual(r.next.state.castleIncome,[8,4]);assert.deepEqual(r.recap.income,[0,0]);
  const settled=['resign','accept_draw'].includes(action);assert.deepEqual(r.next.state.finalTerritory,settled?totalOwned(g.state):null);
  if(settled){assert.equal(r.next.result,action==='resign'?'2':'draw');assert.ok(plan(r,c).events.every(e=>e.kind==='final-territory'));}
  else assert.equal(plan(r,c),null);
 }
 const g=ownCastles(game()),old=structuredClone(g);assert.equal(d.Engine.settleFinalTerritory(g.state,d.configFor(g.rules_version)),g.state);
 assert.throws(()=>run(g,'word',{path:['0,0','0,0']}),/once/);assert.deepEqual(g,old);
 const path=pathFor(g,'ZZZZZZZ'),bad=structuredClone(g);assert.throws(()=>run(g,'word',{path}),/dictionary/);assert.deepEqual(g,bad);
 const stale={...cmd(g),revision:0};assert.throws(()=>d.applyCommand(g,A,stale,words,meta.version),/newer turn/);
});
test('score plans reject inconsistent defence/final tallies and never fabricate deductions',()=>{
 const g=ownCastles(game()),r=run(g,'resign'),c=d.configFor(g.rules_version);
 for(const delta of [{income:[1,0]},{income:[0,3]},{finalTerritory:[999,999]},{totalsBefore:[99,99]},{totalsAfter:[99,99]}])assert.equal(plan({...r,recap:{...r.recap,...delta}},c),null);
 assert.equal(m.scoreMotionPlan(r.next,{revision:1,recap:r.recap},c),null);
});
async function rpc(name,args){return(await db.query(`select ${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as result`,args)).rows[0].result;}
test('terminal word, refresh, resign and draw receipts commit once across retry and stale races',async()=>{
 for(const action of ['word','refresh','resign','accept_draw']){
  const g=ownCastles(game(2));g.state.lettersUsed=119;g.state.turns=[10,9];if(action==='accept_draw')g.draw_by=A;
  const c=cmd(g,action,action==='word'?{path:pathFor(g)}:{});
  await db.query("insert into games(id,players,state,status,revision,rules_version,dictionary_version,draw_by) values($1,$2,$3,'active',1,$4,$5,$6)",[g.id,g.players,JSON.stringify(g.state),g.rules_version,g.dictionary_version,g.draw_by||null]);
  const r=d.applyCommand(g,B,c,words,meta.version),args=[B,g.id,c.operationId,d.commandKey(c),1,JSON.stringify(r.next),JSON.stringify(r.recap)];
  const first=await rpc('wc_commit',args),retry=await rpc('wc_commit',args);assert.equal(retry.replayed,true);assert.deepEqual(retry.game.state,first.game.state);assert.deepEqual(retry.recap,first.recap);
  await assert.rejects(()=>rpc('wc_commit',[B,g.id,crypto.randomUUID(),d.commandKey(c),1,JSON.stringify(r.next),JSON.stringify(r.recap)]),/stale/);
  for(const table of ['operations','notifications'])assert.equal((await db.query(`select count(*)::int n from ${table} where game_id=$1`,[g.id])).rows[0].n,1);
 }
});
test('production reproduces both complete published 3/5 games, every replacement and every scoring component',()=>{
 const replays=JSON.parse(fs.readFileSync('docs/research/castle-35-2026-10-18/replays.json','utf8')).filter(r=>r.id==='final_territory_35');assert.equal(replays.length,2);
 const rng=seed=>{let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};};
 const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
 for(const replay of replays){let g=game();g.state={...structuredClone(replay.states[0]),castleIncome:[0,0],finalTerritory:null,log:[]};const random=rng(hash(`${replay.row.seed}/actual-replacements`));
  for(let i=0;i<replay.row.moves.length;i++){
   const move=replay.row.moves[i],path=move.path?.map(j=>g.state.tiles[j].id),jokers={};move.path?.forEach((j,k)=>{if(g.state.tiles[j].letter==='?')jokers[g.state.tiles[j].id]=move.word[k].toUpperCase();});
   const r=d.applyCommand(g,g.players[g.state.player-1],cmd(g,path?.length?'word':'refresh',path?.length?{path,jokers}:{}),words,meta.version,random),expected=replay.states[i+1];g=r.next;
   assert.deepEqual(g.state.tiles,expected.tiles);assert.deepEqual(g.state.turns,expected.turns);assert.deepEqual(g.state.wordPoints,expected.wordPoints);
   assert.deepEqual(g.state.castleIncome,expected.book.map(b=>b.sideIncome+b.centreIncome));assert.deepEqual(r.recap.totalsAfter,move.after);
   assert.ok(plan(r,d.configFor(g.rules_version)));assert.ok(r.recap.totalsAfter.every((n,j)=>n>=r.recap.totalsBefore[j]));
  }
  assert.equal(g.status,'completed');assert.deepEqual(d.Engine.scores(g.state,d.configFor(g.rules_version)),replay.row.scores);
  const stat=d.statistics([g],A)[g.rules_version+'/'+meta.version];assert.equal(stat.highestFinalScore,replay.row.scores[0]);
 }
});
test('new Swedish engine accepts its alphabet and expanded dictionary while scoring a joker as zero',()=>{
 const dictionary=new Set(require('../server/versions/dictionary-sv-v2.json')),g=game(1,'autumn-sv-v4'),c=d.configFor(g.rules_version),path=pathFor(g,'FÅR',0);g.state.tiles.find(t=>t.id===path[1]).letter='?';
 const r=d.applyCommand(g,A,cmd(g,'word',{path,jokers:{[path[1]]:'Å'}}),dictionary,g.dictionary_version,()=>.4);
 assert.equal(r.recap.word,'FÅR');assert.equal(r.recap.score.wordPoints,3);assert.deepEqual(r.recap.income,[0,0]);assert.ok(plan(r,c));
});
test('API selects the approved version and denies clients that do not support it, including explicit requests',async()=>{
 const {createHandler}=await import('../server/api.mjs'),saved=new Map();
 const stub={auth:{getUser:async()=>({data:{user:{id:A}}})},from:()=>({select:()=>({eq:()=>({single:async()=>({data:{id:A,username:'Test'}})}),in:async()=>({data:[{id:A,display_name:'Test'}]})})}),rpc:async(name,args)=>{
  if(name==='wc_rate_limit')return{data:true};assert.equal(name,'wc_create');if(!saved.has(args.p_id))saved.set(args.p_id,{id:args.p_id,players:[A,null],rules_version:args.p_rules,dictionary_version:args.p_dictionary,state:args.p_state,status:'invited',revision:0});return{data:saved.get(args.p_id)};
 }};
 const handler=createHandler(stub);for(const language of Object.values(l.LANGUAGES)){
  const id=crypto.randomUUID(),body={action:'create',gameId:id,language:language.code,rulesVersion:language.rulesVersion,supportedRules:d.SUPPORTED_RULES};
  const call=async b=>{const r=await handler(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify(b)}));return{status:r.status,...await r.json()};};
  const result=await call(body);assert.equal(result.status,200);assert.equal(result.game.rules_version,language.rulesVersion);assert.deepEqual(result.game.state.finalTerritory,null);assert.deepEqual((await call(body)).game,result.game);
  assert.equal((await call({...body,gameId:crypto.randomUUID(),supportedRules:d.SUPPORTED_RULES.filter(v=>v!==language.rulesVersion)})).code,'client_update_required');
 }
});
