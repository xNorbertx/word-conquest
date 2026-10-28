const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');
const words=require('../server/versions/dictionary-nl-v1.json'),meta=require('../server/versions/dictionary-nl-v1.meta.json');
const enMeta=require('../server/versions/dictionary-v1.meta.json'),dictionary=new Set(words),version='autumn-nl-v1';
const A=crypto.randomUUID(),B=crypto.randomUUID();let d,l,c,db;
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
before(async()=>{
 d=await import('../server/domain.mjs');l=await import('../server/languages.mjs');c=d.configFor(version);db=new PGlite();
 await db.exec(`create schema auth;create table auth.users(id uuid primary key);create role anon;create role authenticated;create role service_role bypassrls;create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;insert into auth.users values('${A}'),('${B}');`);
 await db.exec(fs.readFileSync('supabase/migrations/202609290001_online.sql','utf8'));await db.query('insert into profiles(id) values($1),($2)',[A,B]);
});
after(async()=>db?.close());
async function rpc(name,args){return(await db.query(`select ${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as result`,args)).rows[0].result;}
const command=(g,action='refresh',extra={})=>({operationId:crypto.randomUUID(),revision:g.revision,action,...extra});
function fixture(word='IJS',actor=1,joker=false){
 const state=d.Engine.newGame(c,rng(7));state.player=actor;state.startingPlayer=3-actor;state.turns=actor===1?[3,4]:[4,3];
 const path=[...word].map((letter,i)=>{const id=`${i-1},0`;Object.assign(state.tiles.find(t=>t.id===id),{letter:joker&&i===1?'?':letter,owner:i===0?actor:3-actor});return id;});
 const game={id:crypto.randomUUID(),players:[A,B],revision:8,status:'active',rules_version:version,dictionary_version:meta.version,state};
 return{game,input:command(game,'word',{path,jokers:joker?{[path[1]]:word[1]}:{}})};
}

test('OpenTaal snapshot is pinned, licensed, normalized and reproducible',async()=>{
 const {boardSpelling}=require('../scripts/dutch-import.cjs');
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('server/versions/dictionary-nl-v1.json')).digest('hex'),meta.sha256);
 assert.equal(words.length,355792);assert.equal(dictionary.size,words.length);
 assert.deepEqual(words,[...words].sort());assert(words.every(w=>/^[a-z]{3,69}$/.test(w)));
 assert.equal(meta.license,'BSD-3-Clause');assert.match(fs.readFileSync('server/versions/DUTCH-LICENSE.txt','utf8'),/Copyright \(c\) 2020, OpenTaal/);
 for(const [original,expected]of [['café','cafe'],['cafe\u0301','cafe'],['zeeën','zeeen'],['ideeën','ideeen'],['reünie','reunie'],['coöperatie','cooperatie'],["auto's",'autos'],['zee-egel','zeeegel'],['ĳzer','ijzer']])assert.equal(boardSpelling(original),expected);
 for(const value of ['Amsterdam','Nederland','NAVO','ad hoc','voor-','-zus','4x4','a+b','ab_cd','ij',"'s",'a'.repeat(70),null])assert.equal(boardSpelling(value),null,String(value));
 for(const w of ['fiets','fietsen','fietste','gefietst','schaatsen','ijs','ijzer','cafe','cafeine','zeeen','ideeen','reunie','cooperatie','autos'])assert(dictionary.has(w),w);
 for(const w of ['amsterdam','qzx','hello','café','ad hoc'])assert(!dictionary.has(w),w);
 const {dictionaryFor,dictionaryWords}=await import('../server/dictionaries.mjs');
 const loaded=await dictionaryFor(meta.version);assert.equal(loaded,await dictionaryFor(meta.version));assert(loaded.has('fiets'));
 const packed=require('../scripts/dictionary-pack.cjs').packDictionary(words);assert(packed.data.length<fs.statSync('server/versions/dictionary-nl-v1.json').size/2);
 assert.deepEqual([...await dictionaryWords(packed)],words);
});

test('Dutch categories, weights and 1–5 scoring cover A–Z exactly once, including I + J',()=>{
 for(const all of [Object.values(c.letterBalance).filter(v=>typeof v==='string').join(''),c.wordScoring.letterGroups.map(g=>g.letters).join('')])assert.deepEqual([...all].sort(),[...c.alphabet].sort());
 assert.deepEqual(Object.keys(c.letterWeights).sort(),[...c.alphabet]);assert(Object.values(c.letterWeights).every(n=>n>0));assert(c.letterBalance.ordinary.includes('J'));
 assert.equal(c.letterWeights.IJ,undefined);assert.equal(c.scoringMode,'defended-final');assert.deepEqual(c.castleIncome,{side:3,center:5});assert.equal(c.finalTerritoryPoints,1);
 for(let seed=1;seed<=80;seed++){
  let s=d.Engine.newGame(c,rng(seed));assert.equal(s.tiles.length,69);assert.equal(s.tiles.filter(t=>t.letter==='?').length,6);
  for(let i=0;i<3;i++){assert(s.tiles.every(t=>/^[A-Z?]$/.test(t.letter)));const result=d.Engine.refreshTurn(s,c,rng(seed+i));assert(!result.error);s=result.state;}
 }
});

test('Dutch words, IJ and jokers score on the server and castle defence goes to the opponent',()=>{
 for(const actor of [1,2])for(const joker of [false,true]){
  const {game,input}=fixture('IJS',actor,joker);input.score=999;input.language='en';
  const result=d.applyCommand(game,game.players[actor-1],input,dictionary,meta.version,rng(17));
  assert.equal(result.recap.word,'IJS');assert.equal(result.recap.score.wordPoints,joker?3:7);assert.equal(result.next.state.lettersUsed,3);
  assert.equal(result.recap.income[actor-1],0);assert(result.recap.totalsAfter.every((n,i)=>n>=result.recap.totalsBefore[i]));
 }
 const f=fixture('IJS',1,true);assert.throws(()=>d.applyCommand(f.game,A,{...f.input,jokers:{'0,0':'IJ'}},dictionary,meta.version),/joker/i);
 assert.throws(()=>d.applyCommand(f.game,A,{...f.input,jokers:{'0,0':'Å'}},dictionary,meta.version),/joker/i);
 assert.throws(()=>d.applyCommand(f.game,A,f.input,dictionary,enMeta.version),/original rules and dictionary/);
 assert.throws(()=>d.applyCommand(f.game,A,{...f.input,revision:99},dictionary,meta.version),/newer turn/);
 const invalid=fixture('QZX');assert.throws(()=>d.applyCommand(invalid.game,A,invalid.input,dictionary,meta.version),/dictionary/);
});

test('Dutch cards, account records and saved language survive restarting the client',async()=>{
 const {createSnapshotCache}=await import('../online/snapshot-cache.mjs'),{gameSummary}=await import('../server/game-summary.mjs'),{analytics}=await import('../server/analytics.mjs');
 const store=new Map(),storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},f=fixture();f.game.names=['Noor','Bram'];f.game.updated_at=new Date().toISOString();
 const {next}=d.applyCommand(f.game,A,f.input,dictionary,meta.version);const g={...f.game,...next};
 const cache=createSnapshotCache(storage);cache.saveHome(A,{profile:{id:A,username:'Noor',display_name:'Noor'},games:[gameSummary(g)]});cache.saveGame(A,{game:g});
 const restarted=createSnapshotCache(storage);assert.equal(l.languageLabel(restarted.home(A).games[0].rules_version),'Nederlands');assert.equal(restarted.game(A,g.id).game.dictionary_version,meta.version);
 assert.equal(analytics([g],A).bestWord.language,'nl');assert.equal(analytics([g],A).bestWord.word,'IJS');
});
test('API creates the selected language on the server, preserves retries and rejects older clients',async()=>{
 const version=l.LANGUAGES.nl.rulesVersion;
 const {createHandler}=await import('../server/api.mjs');const saved=new Map();let calls=0;
 const mock={auth:{getUser:async()=>({data:{user:{id:A}}})},from:table=>({select:()=>({eq:()=>({single:async()=>({data:{id:A,username:'Noor'}})}),in:async()=>({data:[{id:A,display_name:'Noor'}]})})}),rpc:async(name,args)=>{
  if(name==='wc_rate_limit')return{data:true};calls++;assert.ok(['wc_create','wc_create_friend'].includes(name));
  if(!saved.has(args.p_id))saved.set(args.p_id,{id:args.p_id,players:[A,null],state:args.p_state,rules_version:args.p_rules,dictionary_version:args.p_dictionary,status:'invited',revision:0});
  return{data:saved.get(args.p_id)};
 }};
 const handler=createHandler(mock);async function call(body){const response=await handler(new Request('https://api.example',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify({action:'create',supportedRules:d.SUPPORTED_RULES,...body})}));return{status:response.status,...await response.json()};}
 const id=crypto.randomUUID(),first=await call({gameId:id,language:'nl',rulesVersion:version,state:{tiles:[]},dictionaryVersion:enMeta.version});assert.equal(first.status,200);assert.equal(first.game.dictionary_version,meta.version);assert.equal(first.game.state.tiles.length,69);
 const retry=await call({gameId:id,language:'nl',rulesVersion:version});assert.deepEqual(retry.game,first.game);
 assert.equal((await call({gameId:crypto.randomUUID(),language:'nl',rulesVersion:'autumn-v3'})).code,'invalid_language');
 assert.equal((await call({gameId:crypto.randomUUID(),language:'nl',rulesVersion:version,supportedRules:['autumn-v1','autumn-v2','autumn-v3']})).code,'client_update_required');
 const en=await call({gameId:crypto.randomUUID(),language:'en',rulesVersion:d.RULES_VERSION,friendId:B});assert.equal(en.game.dictionary_version,enMeta.version);assert.equal(calls,3);
});
test('a complete Dutch game survives database saves, retries, invitation acceptance and final scoring',async()=>{
 const random=rng(73),id=crypto.randomUUID(),token=crypto.randomUUID();let g=await rpc('wc_create',[A,id,token,JSON.stringify(d.Engine.newGame(c,random)),version,meta.version]);
 const retry=await rpc('wc_create',[A,id,crypto.randomUUID(),'{}','autumn-v3',enMeta.version]);assert.equal(retry.rules_version,version);assert.equal(retry.dictionary_version,meta.version);assert.deepEqual(retry.state,g.state);
 assert.equal((await rpc('wc_invitation',[B,token,'preview'])).state,undefined);g=await rpc('wc_invitation',[B,token,'accept']);
 const prefixes=new Set();for(const w of words)if(w.length<=6)for(let n=1;n<=w.length;n++)prefixes.add(w.slice(0,n));
 function find(state){function visit(path,text,jokers){if(text.length>=3&&dictionary.has(text))return{path,jokers};if(path.length>=6)return null;
  for(const t of state.tiles){if(d.Engine.validatePath(state,[...path,t.id],c,false))continue;for(const letter of t.letter==='?'?c.alphabet:t.letter){const word=text+letter.toLowerCase();if(!prefixes.has(word))continue;const found=visit([...path,t.id],word,t.letter==='?'?{...jokers,[t.id]:letter}:jokers);if(found)return found;}}return null;}return visit([],'',{});}
 let steps=0,wordTurns=0;
 while(!g.state.over&&steps++<70){const found=find(g.state);if(found)wordTurns++;const actor=g.players[g.state.player-1],input=command(g,found?'word':'refresh',found||{}),{next,recap}=d.applyCommand(g,actor,input,dictionary,meta.version,random);
  const args=[actor,id,input.operationId,d.commandKey(input),g.revision,JSON.stringify(next),JSON.stringify(recap)],first=await rpc('wc_commit',args),again=await rpc('wc_commit',args);assert.ok(again.replayed);assert.equal(first.game.revision,again.game.revision);
  if(steps===1)await assert.rejects(()=>rpc('wc_commit',[actor,id,crypto.randomUUID(),d.commandKey(input),g.revision,JSON.stringify(next),JSON.stringify(recap)]),/stale/);
  g=(await db.query('select * from games where id=$1',[id])).rows[0];assert.equal(g.dictionary_version,meta.version);
 }
 assert.ok(wordTurns>=20);assert.ok(g.state.castleIncome.every(n=>n>=0));assert.deepEqual(g.state.finalTerritory,[1,2].map(p=>g.state.tiles.filter(t=>t.owner===p).length));assert.equal(g.status,'completed');assert.equal(g.state.turns[0],g.state.turns[1]);assert.equal((await db.query('select count(*)::int n from operations where game_id=$1',[id])).rows[0].n,steps);
 const stats=d.statistics([g],A);assert.equal(stats[version+'/'+meta.version].games,1);assert.equal(Object.keys(stats).length,1);
});
