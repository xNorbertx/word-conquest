const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');
const words=require('../server/versions/dictionary-sv-v1.json'),meta=require('../server/versions/dictionary-sv-v1.meta.json');
const enMeta=require('../server/versions/dictionary-v1.meta.json'),dictionary=new Set(words),version='autumn-sv-v1';
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
function fixture(word='FÅR',actor=1,joker=false){
 const state=d.Engine.newGame(c,rng(7));state.player=actor;state.startingPlayer=3-actor;state.turns=actor===1?[3,4]:[4,3];
 const path=[...word].map((letter,i)=>{const id=`${i-1},0`;Object.assign(state.tiles.find(t=>t.id===id),{letter:joker&&i===1?'?':letter,owner:i===0?actor:3-actor});return id;});
 const game={id:crypto.randomUUID(),players:[A,B],revision:8,status:'active',rules_version:version,dictionary_version:meta.version,state};
 return{game,input:command(game,'word',{path,jokers:joker?{[path[1]]:word[1]}:{}})};
}
test('Swedish dictionary is pinned, normalized, licensed, and uses listed forms only',async()=>{
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('server/versions/dictionary-sv-v1.json')).digest('hex'),meta.sha256);
 assert.equal(dictionary.size,400901);assert.equal(words.length,dictionary.size);
 assert.ok(words.every(w=>/^[a-zåäö]{3,69}$/.test(w)&&w===w.normalize('NFC')));
 for(const w of ['får','bär','öar','hund','hunden','hundar','hundarna','älg','älgar','äpple','smör'])assert.ok(dictionary.has(w),w);
 for(const w of ['stockholm','norbert','hello','cat','qzx'])assert.ok(!dictionary.has(w),w);
 assert.match(fs.readFileSync('server/versions/SWEDISH-LICENSE.txt','utf8'),/MIT License/);
 const {dictionaryFor}=await import('../server/dictionaries.mjs');assert.equal(await dictionaryFor(meta.version),await dictionaryFor(meta.version));assert.equal(await dictionaryFor('missing'),null);
 assert.ok((await dictionaryFor(enMeta.version)).has('cat'));assert.ok(!(await dictionaryFor(meta.version)).has('cat'));
});
test('compressed deployment dictionaries inflate to the exact pinned content',async()=>{
 const {dictionaryWords}=await import('../server/dictionaries.mjs');
 for(const file of ['dictionary-v1.json','dictionary-sv-v1.json']){const original=fs.readFileSync('server/versions/'+file),packed=require('node:zlib').gzipSync(original,{level:9}).toString('base64');assert.ok(packed.length<original.length/2);assert.deepEqual(await dictionaryWords(packed),JSON.parse(original));}
 await assert.rejects(()=>dictionaryWords('broken payload'));
});
test('Swedish alphabet, categories, weights, board generation and replacement letters agree',()=>{
 const cats=['vowels','flexible','ordinary','rare'].map(k=>c.letterBalance[k]).join('');assert.equal(new Set(cats).size,29);assert.equal(cats.length,29);
 assert.deepEqual([...cats].sort(),[...c.alphabet].sort());assert.deepEqual(Object.keys(c.letterWeights).sort(),[...c.alphabet].sort());
 assert.ok(Object.values(c.letterWeights).every(n=>n>0));assert.ok(c.letterBalance.vowels.includes('Y'));assert.ok(c.letterBalance.ordinary.includes('J'));
 assert.ok(d.configFor('autumn-v3').letterBalance.rare.includes('J'));const seen=new Set();
 for(let seed=1;seed<=100;seed++){
  let s=d.Engine.newGame(c,rng(seed));assert.equal(s.tiles.length,69);assert.equal(s.tiles.filter(t=>t.letter==='?').length,6);
  for(let turn=0;turn<3;turn++){for(const t of s.tiles){assert.match(t.letter,/^[A-ZÅÄÖ?]$/);seen.add(t.letter);}const result=d.Engine.refreshTurn(s,c,rng(seed+turn));assert.ok(!result.error);s=result.state;}
 }
 for(const letter of 'ÅÄÖ')assert.ok(seen.has(letter));
});
test('Å Ä Ö words and jokers score authoritatively and reconcile with board animations',async()=>{
 const {scoreMotionPlan}=await import('../online/score-motion.mjs');
 for(const word of ['FÅR','BÄR','ÖAR'])for(const actor of [1,2])for(const joker of [false,true]){
  const {game,input}=fixture(word,actor,joker);input.score=999;input.language='en';input.state={over:true};
  const {next,recap}=d.applyCommand(game,game.players[actor-1],input,dictionary,meta.version,rng(17));
  assert.equal(recap.word,word);assert.equal(recap.score.wordPoints,(word==='ÖAR'?3:4)-(joker?1:0));assert.equal(next.state.lettersUsed,3);
  assert.ok(recap.income[actor-1]>=4);assert.equal(recap.captured.length,2);
  for(const id of input.path){const old=game.state.tiles.find(t=>t.id===id),tile=next.state.tiles.find(t=>t.id===id);assert.equal(tile.owner,actor);if(old.letter==='?')assert.equal(tile.letter,'?');else assert.notEqual(tile.letter,old.letter);assert.match(tile.letter,/^[A-ZÅÄÖ?]$/);}
  const plan=scoreMotionPlan(next,{revision:next.revision,recap},c);assert.ok(plan);assert.deepEqual(plan.totalsAfter,d.Engine.scores(next.state,c));
  assert.equal(game.state.wordPoints[actor-1],0);
 }
});
test('language cannot be changed by a turn, wrong dictionaries and stale clients fail safely',()=>{
 const {game,input}=fixture();
 assert.throws(()=>d.applyCommand(game,A,input,dictionary,enMeta.version),/original rules and dictionary/);
 assert.throws(()=>d.applyCommand({...game,dictionary_version:enMeta.version},A,input,dictionary,enMeta.version),/original rules and dictionary/);
 assert.throws(()=>d.applyCommand(game,A,{...input,revision:99},dictionary,meta.version),/newer turn/);
 const bad=fixture('CAT');assert.throws(()=>d.applyCommand(bad.game,A,bad.input,dictionary,meta.version),/dictionary/);
 const english={...game,rules_version:'autumn-v3',dictionary_version:enMeta.version};english.state=structuredClone(game.state);english.state.tiles.find(t=>t.id==='0,0').letter='?';
 assert.throws(()=>d.applyCommand(english,A,{...input,jokers:{'0,0':'Å'}},new Set(require('../server/versions/dictionary-v1.json')),enMeta.version),/joker/i);
 assert.equal(l.normalizeJoker('a\u030a',c),'Å');assert.equal(l.normalizeJoker('ä',c),'Ä');assert.equal(l.normalizeJoker('ö',c),'Ö');assert.equal(l.normalizeJoker('å',d.configFor('autumn-v3')),'');
 assert.equal(l.languageLabel(version),'Svenska');assert.equal(l.languageLabel('autumn-v1'),'English');assert.equal(l.languageFor('__proto__'),null);
});
test('saved Swedish boards and compact game cards retain their language after restart',async()=>{
 const {createSnapshotCache}=await import('../online/snapshot-cache.mjs'),{gameSummary}=await import('../server/game-summary.mjs');
 const store=new Map(),storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},f=fixture();f.game.names=['Alva','Björn'];f.game.updated_at=new Date().toISOString();
 const cache=createSnapshotCache(storage);cache.saveHome(A,{profile:{id:A,username:'Alva',display_name:'Alva'},games:[gameSummary(f.game)]});cache.saveGame(A,{game:f.game});
 const restarted=createSnapshotCache(storage);assert.equal(l.languageLabel(restarted.home(A).games[0].rules_version),'Svenska');assert.equal(restarted.game(A,f.game.id).game.state.tiles.find(t=>t.id==='0,0').letter,'Å');
 const english={...f.game,id:crypto.randomUUID(),rules_version:'autumn-v3'};cache.saveGame(A,{game:english});assert.equal(cache.game(A,english.id),null);
});
test('API creates the selected language on the server, preserves retries and rejects older clients',async()=>{
 const {createHandler}=await import('../server/api.mjs');const saved=new Map();let calls=0;
 const mock={auth:{getUser:async()=>({data:{user:{id:A}}})},from:table=>({select:()=>({eq:()=>({single:async()=>({data:{id:A,username:'Alva'}})}),in:async()=>({data:[{id:A,display_name:'Alva'}]})})}),rpc:async(name,args)=>{
  if(name==='wc_rate_limit')return{data:true};calls++;assert.ok(['wc_create','wc_create_friend'].includes(name));
  if(!saved.has(args.p_id))saved.set(args.p_id,{id:args.p_id,players:[A,null],state:args.p_state,rules_version:args.p_rules,dictionary_version:args.p_dictionary,status:'invited',revision:0});
  return{data:saved.get(args.p_id)};
 }};
 const handler=createHandler(mock);async function call(body){const response=await handler(new Request('https://api.example',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify({action:'create',supportedRules:d.SUPPORTED_RULES,...body})}));return{status:response.status,...await response.json()};}
 const id=crypto.randomUUID(),first=await call({gameId:id,language:'sv',rulesVersion:version,state:{tiles:[]},dictionaryVersion:enMeta.version});assert.equal(first.status,200);assert.equal(first.game.dictionary_version,meta.version);assert.equal(first.game.state.tiles.length,69);
 const retry=await call({gameId:id,language:'sv',rulesVersion:version});assert.deepEqual(retry.game,first.game);
 assert.equal((await call({gameId:crypto.randomUUID(),language:'sv',rulesVersion:'autumn-v3'})).code,'invalid_language');
 assert.equal((await call({gameId:crypto.randomUUID(),language:'sv',rulesVersion:version,supportedRules:['autumn-v1','autumn-v2','autumn-v3']})).code,'client_update_required');
 const en=await call({gameId:crypto.randomUUID(),language:'en',rulesVersion:'autumn-v3',friendId:B});assert.equal(en.game.dictionary_version,enMeta.version);assert.equal(calls,3);
});
test('a complete Swedish game survives database saves, retries, invitation acceptance and final scoring',async()=>{
 const random=rng(73),id=crypto.randomUUID(),token=crypto.randomUUID();let g=await rpc('wc_create',[A,id,token,JSON.stringify(d.Engine.newGame(c,random)),version,meta.version]);
 const retry=await rpc('wc_create',[A,id,crypto.randomUUID(),'{}','autumn-v3',enMeta.version]);assert.equal(retry.rules_version,version);assert.equal(retry.dictionary_version,meta.version);assert.deepEqual(retry.state,g.state);
 assert.equal((await rpc('wc_invitation',[B,token,'preview'])).state,undefined);g=await rpc('wc_invitation',[B,token,'accept']);
 const prefixes=new Set();for(const w of words)if(w.length<=6)for(let n=1;n<=w.length;n++)prefixes.add(w.slice(0,n));
 function find(state){function visit(path,text,jokers){if(text.length>=3&&dictionary.has(text))return{path,jokers};if(path.length>=6)return null;
  for(const t of state.tiles){if(d.Engine.validatePath(state,[...path,t.id],c,false))continue;for(const letter of t.letter==='?'?c.alphabet:t.letter){const word=text+letter.toLowerCase();if(!prefixes.has(word))continue;const found=visit([...path,t.id],word,t.letter==='?'?{...jokers,[t.id]:letter}:jokers);if(found)return found;}}return null;}return visit([],'',{});}
 let steps=0,wordTurns=0,accentTurns=0;
 while(!g.state.over&&steps++<70){const found=find(g.state);if(found)wordTurns++;const actor=g.players[g.state.player-1],input=command(g,found?'word':'refresh',found||{}),{next,recap}=d.applyCommand(g,actor,input,dictionary,meta.version,random);if(/[ÅÄÖ]/.test(recap.word))accentTurns++;
  const args=[actor,id,input.operationId,d.commandKey(input),g.revision,JSON.stringify(next),JSON.stringify(recap)],first=await rpc('wc_commit',args),again=await rpc('wc_commit',args);assert.ok(again.replayed);assert.equal(first.game.revision,again.game.revision);
  if(steps===1)await assert.rejects(()=>rpc('wc_commit',[actor,id,crypto.randomUUID(),d.commandKey(input),g.revision,JSON.stringify(next),JSON.stringify(recap)]),/stale/);
  g=(await db.query('select * from games where id=$1',[id])).rows[0];assert.equal(g.dictionary_version,meta.version);
 }
 assert.ok(wordTurns>=20);assert.ok(accentTurns>0);assert.equal(g.status,'completed');assert.equal(g.state.turns[0],g.state.turns[1]);assert.equal((await db.query('select count(*)::int n from operations where game_id=$1',[id])).rows[0].n,steps);
 const stats=d.statistics([g],A);assert.equal(stats[version+'/'+meta.version].games,1);assert.equal(Object.keys(stats).length,1);
});
