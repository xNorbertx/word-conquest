const {test,before}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {boardSpelling,saldoEntry}=require('../scripts/swedish-import.cjs');
const words=require('../server/versions/dictionary-sv-v2.json'),meta=require('../server/versions/dictionary-sv-v2.meta.json'),oldMeta=require('../server/versions/dictionary-sv-v1.meta.json');
const dictionary=new Set(words);let d,l;
before(async()=>{d=await import('../server/domain.mjs');l=await import('../server/languages.mjs');});
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
test('Swedish board spellings fold accents without collapsing å ä ö or admitting punctuation and names',()=>{
 for(const [source,want] of [['moskéerna','moskeerna'],['cafe\u0301','cafe'],['müsli','musli'],['jalapeño','jalapeno'],['façad','facad'],['crème','creme'],['idé','ide'],['gåva','gåva'],['räv','räv'],['öar','öar'],['a\u030angstro\u0308m','ångström']])assert.equal(boardSpelling(source),want,source);
 for(const source of ['Stockholm','MÜSLI','a-bc','a bc','a.bc','abc1','abc😀','øar','œuvre','ABBA','gå','a'.repeat(70),'аbc'])assert.equal(boardSpelling(source),null,source);
 assert.equal(boardSpelling('gå',1),'gå');
});
function entry(pos,lemma,forms){return `<Lemma><FormRepresentation><feat val="${lemma}" att="writtenForm"/><feat att="partOfSpeech" val="${pos}"/></FormRepresentation></Lemma>`+forms.map(([word,msd])=>`<WordForm><feat att="writtenForm" val="${word}"/><feat att="msd" val="${msd}"/></WordForm>`).join('');}
test('SALDO import keeps real inflections and excludes standalone fragments, names, abbreviations and multiword parts',()=>{
 assert.deepEqual(saldoEntry(entry('nn','katta',[['katta','sg indef nom'],['katte','ci'],['katts','cm'],['katte-','sms'],['kattorna','pl def nom']])),['katta','kattorna']);
 assert.deepEqual(saldoEntry(entry('vb','gå',[['går','pres ind aktiv'],['gick','pret ind aktiv'],['gått','sup aktiv']])),['går','gick','gått']);
 assert.deepEqual(saldoEntry(entry('nn','mosk&#233;',[['mosk&#xE9;erna','pl def nom']])),['moskeerna']);
 for(const pos of ['pm','pmm','nna','vba','nnm','vbm','sxc','nnh','avh'])assert.deepEqual(saldoEntry(entry(pos,'felord',[['felord','invar']])),[],pos);
 assert.deepEqual(saldoEntry(entry('nn','felord',[['felord','c'],['felord','invar 1:2-3'],['felord-','sg indef nom']])),[]);
 assert.throws(()=>saldoEntry(entry('nn','&unsupported;',[['felord','invar']])),/entity/);
});
test('expanded dictionary is pinned, preserves existing vocabulary and includes reported words and inflections',()=>{
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('server/versions/dictionary-sv-v2.json')).digest('hex'),meta.sha256);
 assert.equal(words.length,991634);assert.equal(dictionary.size,words.length);assert.equal(meta.words,words.length);
 assert.ok(words.every(w=>/^[a-zåäö]{3,69}$/.test(w)));assert.deepEqual(words,[...words].sort());
 for(const w of require('../server/versions/dictionary-sv-v1.json'))assert.ok(dictionary.has(w),w);
 for(const w of ['moske','mosken','moskeer','moskeerna','obokad','obokat','obokade','cafe','musli','katterna','sprang','sprungit','gick','gått','öarna'])assert.ok(dictionary.has(w),w);
 for(const w of ['stockholm','norbert','qzx','moskéerna','obokatxyz'])assert.ok(!dictionary.has(w),w);
 assert.equal(meta.saol.included,false);assert.equal(meta.sources[1].license,'CC-BY-4.0');
 assert.match(fs.readFileSync('server/versions/SWEDISH-EXPANDED-NOTICE.txt','utf8'),/Språkbanken \(2017\)/);
});
test('old Swedish games retain their dictionary and new versions keep identical openings and replacements',async()=>{
 assert.equal(l.LANGUAGES.sv.rulesVersion,'autumn-sv-v5');
 for(const v of ['autumn-sv-v1','autumn-sv-v2'])assert.equal(l.languageForRules(v).dictionary.version,oldMeta.version);
 assert.equal(l.languageForRules('autumn-sv-v3').dictionary.version,meta.version);assert.equal(l.languageForRules('missing'),null);
 const {dictionaryFor}=await import('../server/dictionaries.mjs');
 assert.equal((await dictionaryFor(oldMeta.version)).has('obokat'),false);assert.equal((await dictionaryFor(meta.version)).has('obokat'),true);
 assert.equal(await dictionaryFor(meta.version),await dictionaryFor(meta.version));
 for(let seed=1;seed<=20;seed++){
  const old=d.configFor('autumn-sv-v2'),fresh=d.configFor('autumn-sv-v3'),s=d.Engine.newGame(old,rng(seed));
  assert.deepEqual(d.Engine.newGame(fresh,rng(seed)),s);assert.deepEqual(old.letterWeights,fresh.letterWeights);
  assert.deepEqual(d.Engine.refreshTurn(s,fresh,rng(seed+2)),d.Engine.refreshTurn(s,old,rng(seed+2)));
 }
});
function fixture(word,version='autumn-sv-v3',joker=false){
 const c=d.configFor(version),state=d.Engine.newGame(c,rng(5)),players=[crypto.randomUUID(),crypto.randomUUID()];state.player=1;state.startingPlayer=1;
 const path=[...word].map((letter,i)=>{const id=`${i-4},0`;Object.assign(state.tiles.find(t=>t.id===id),{letter:joker&&i===1?'?':letter,owner:i===0?1:0});return id;});
 const game={id:crypto.randomUUID(),players,revision:0,status:'active',rules_version:version,dictionary_version:l.languageForRules(version).dictionary.version,state};
 return{game,command:{operationId:crypto.randomUUID(),revision:0,action:'word',path,jokers:joker?{[path[1]]:word[1]}:{}}};
}
test('server accepts newly supported words, scores board letters, and rejects wrong dictionary/version pairs',async()=>{
 const {dictionaryFor}=await import('../server/dictionaries.mjs');
 for(const word of ['MOSKEERNA','OBOKAD','OBOKAT','MUSLI','CAFÉ'.replace('É','E')])for(const joker of [false,true]){
  const {game,command}=fixture(word,'autumn-sv-v3',joker),c=d.configFor(game.rules_version);
  const result=d.applyCommand(game,game.players[0],{...command,score:9999},dictionary,meta.version,rng(8));
  assert.equal(result.recap.word,word);assert.equal(result.recap.score.wordPoints,d.Engine.scoreMove(game.state,command.path,c).wordPoints);
  assert.equal(result.next.dictionary_version,meta.version);assert.equal(game.revision,0);
  if(joker)assert.equal(result.next.state.tiles.find(t=>t.id===command.path[1]).letter,'?');
  assert.throws(()=>d.applyCommand(game,game.players[0],command,dictionary,oldMeta.version),/original rules and dictionary/);
 }
 const old=fixture('OBOKAT','autumn-sv-v2'),legacyDictionary=await dictionaryFor(oldMeta.version);
 assert.throws(()=>d.applyCommand(old.game,old.game.players[0],old.command,legacyDictionary,oldMeta.version),/dictionary/);
 const legacy=fixture('FÅR','autumn-sv-v2');assert.equal(d.applyCommand(legacy.game,legacy.game.players[0],legacy.command,await dictionaryFor(oldMeta.version),oldMeta.version,rng(4)).recap.word,'FÅR');
});
test('API pins the right dictionary on creation and retry, and gates clients missing the expanded version',async()=>{
 const {createHandler}=await import('../server/api.mjs'),actor=crypto.randomUUID(),saved=new Map();
 const db={auth:{getUser:async()=>({data:{user:{id:actor}}})},from:table=>{let id;const q={select:()=>q,eq:(k,v)=>{id=v;return q;},single:async()=>({data:{id:actor,username:'Test'}}),maybeSingle:async()=>({data:saved.get(id)||null}),in:async()=>({data:[{id:actor,display_name:'Test'}]})};return q;},rpc:async(name,args)=>{
  if(name==='wc_rate_limit')return{data:true};assert.equal(name,'wc_create');
  if(!saved.has(args.p_id))saved.set(args.p_id,{id:args.p_id,players:[actor,null],rules_version:args.p_rules,dictionary_version:args.p_dictionary,state:args.p_state,status:'invited',revision:0});
  return{data:saved.get(args.p_id)};
 }};
 const handler=createHandler(db),oldRules=d.SUPPORTED_RULES.filter(v=>v!==l.LANGUAGES.sv.rulesVersion);
 async function create(id,rulesVersion,supported=d.SUPPORTED_RULES){const r=await handler(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify({action:'create',gameId:id,language:'sv',rulesVersion,supportedRules:supported,dictionaryVersion:'client-forgery'})}));return{status:r.status,...await r.json()};}
 const id=crypto.randomUUID(),first=await create(id,l.LANGUAGES.sv.rulesVersion);assert.equal(first.status,200);assert.equal(first.game.dictionary_version,meta.version);assert.deepEqual((await create(id,l.LANGUAGES.sv.rulesVersion)).game,first.game);
 const legacyId=crypto.randomUUID();saved.set(legacyId,{...first.game,id:legacyId,rules_version:'autumn-sv-v2',dictionary_version:oldMeta.version,state:d.Engine.newGame(d.configFor('autumn-sv-v2'))});
 assert.equal((await create(legacyId,'autumn-sv-v2',oldRules)).game.dictionary_version,oldMeta.version);
 assert.equal((await create(legacyId,'autumn-sv-v3')).game.dictionary_version,oldMeta.version);
 assert.equal((await create(crypto.randomUUID(),l.LANGUAGES.sv.rulesVersion,oldRules)).code,'client_update_required');
});
test('compressed expanded dictionary inflates to the exact verified word set',async()=>{
 const {dictionaryWords}=await import('../server/dictionaries.mjs'),raw=fs.readFileSync('server/versions/dictionary-sv-v2.json');
 const packed=require('../scripts/dictionary-pack.cjs').packDictionary(words);assert.ok(packed.data.length<raw.length/4);
 assert.deepEqual([...await dictionaryWords(packed)],words);
 assert.throws(()=>require('../scripts/dictionary-pack.cjs').packDictionary(['zzz','aaa']),/sorted/);
 assert.throws(()=>require('../scripts/dictionary-pack.cjs').packDictionary(['aaa','aaa']),/unique/);
 await assert.rejects(async()=>[...await dictionaryWords({...packed,size:packed.size+1})],/Incomplete/);
 for(const text of ['!aaa\n!aaa','~aaa','!a-b','!aaa\n!']){const data=require('node:zlib').gzipSync(text).toString('base64');await assert.rejects(async()=>[...await dictionaryWords({format:'front-gzip-v1',size:2,data})],/Invalid/);}
});

test('production dictionary index matches every pinned word and rejects nearby nonwords across all versions',async()=>{
 const {dictionaryIndex}=await import('../server/dictionaries.mjs'),{packDictionary}=require('../scripts/dictionary-pack.cjs');
 for(const file of ['dictionary-v1.json','dictionary-sv-v1.json','dictionary-sv-v2.json']){
  const source=JSON.parse(fs.readFileSync('server/versions/'+file)),expected=new Set(source),index=await dictionaryIndex(packDictionary(source));
  assert.equal(index.size,expected.size);
  for(const word of source)assert.equal(index.has(word),true,word);
  for(let i=0;i<source.length;i+=31)for(const candidate of [source[i].slice(0,-1),source[i]+'a',source[i].toUpperCase(),source[i].replace(/[åäö]/g,'a')])assert.equal(index.has(candidate),expected.has(candidate),candidate);
  for(const candidate of ['',null,undefined,123,'!','zzzzzzzzzzzzzzzzzzzz','ö'.repeat(69)])assert.equal(index.has(candidate),false);
 }
});
