const {test,before}=require('node:test'),assert=require('node:assert/strict');
let rows,cacheFor,compact,domain,languages;
const enWords=new Set(require('../server/versions/dictionary-v1.json'));
before(async()=>{({moveHistoryRows:rows,createMoveHistoryCache:cacheFor}=await import('../online/move-history.mjs'));({compactHistory:compact}=await import('../server/history-summary.mjs'));domain=await import('../server/domain.mjs');languages=await import('../server/languages.mjs');});
const move=(revision,extra={})=>({revision,recap:{action:'word',player:1,word:'GARDENS',score:{letters:9,lengthBonus:3,wordPoints:12},income:[0,5],incomeTiming:'defended',...extra}});
const page=(revisions,hasMore=false)=>({history:revisions.map(n=>move(n)),hasMore,nextBefore:revisions.at(-1)??null});
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
test('history separates letter score and length bonus, and pays defended castles to their actual recipient',()=>{
 const r=rows(move(4));assert.deepEqual(r.map(x=>[x.player,x.word,x.bonus,x.castles,x.total]),[[1,9,3,0,12],[2,0,0,5,5]]);assert.equal(r[1].label,'Castle defence');
});
test('final territory and historical gains/losses remain explicit and reconcile for both players',()=>{
 const r=rows(move(4,{score:{letters:9,lengthBonus:3,wordPoints:12,territoryGain:7,enemyLoss:4},income:[2,4],finalTerritory:[8,10]}));
 assert.equal(r.filter(x=>x.player===1).reduce((n,x)=>n+x.total,0),29);assert.equal(r.filter(x=>x.player===2).reduce((n,x)=>n+x.total,0),10);
 assert.equal(r.find(x=>x.total===-4).label,'Territory');assert.equal(r.filter(x=>x.kind==='territory').length,4);
});
test('refresh and non-scoring actions remain visible without inventing word points',()=>{
 for(const action of ['refresh','resign','offer_draw','accept_draw','abandon']){const r=rows(move(3,{action,word:null,score:null,income:[0,0]}));assert.equal(r.length,1);assert.equal(r[0].total,0);assert.notEqual(r[0].label,'GARDENS');}
});
test('history totals reconcile with actual engine receipts across rules, seats, word/refresh and normal/final moves',()=>{
 for(const version of ['autumn-v1','autumn-v3','autumn-v5','autumn-sv-v4'])for(const seat of [1,2])for(const ending of [false,true])for(const action of ['word','refresh']){
  const config=domain.configFor(version),s=domain.Engine.newGame(config,()=>.3);s.player=seat;s.startingPlayer=3-seat;s.turns=seat===1?[3,4]:[4,3];s.wordPoints=[21,34];if(config.castleIncome)s.castleIncome=[6,9];if(ending)s.lettersUsed=config.letterBudget-1;
  s.tiles.forEach(t=>{if(t.castle)t.owner=3-seat;});const spelling=config.language==='sv'?'SPELARE':'GARDENS',dictionary=new Set([...enWords,spelling.toLowerCase()]),dictionaryVersion=languages.languageForRules(version).dictionary.version;const path=[...spelling].map((letter,i)=>{const id=`${i-3},0`;Object.assign(s.tiles.find(t=>t.id===id),{letter,owner:i===0?seat:i<3?3-seat:0});return id;});
  const game={id:crypto.randomUUID(),players:['a','b'],revision:2,status:'active',rules_version:version,dictionary_version:dictionaryVersion,state:s,last_play_at:new Date().toISOString()};
  const result=domain.applyCommand(game,game.players[seat-1],{action,path,revision:2,operationId:crypto.randomUUID()},dictionary,dictionaryVersion,()=>.4),r=rows({revision:3,recap:result.recap});
  for(const p of [1,2])assert.equal(r.filter(x=>x.player===p).reduce((n,x)=>n+x.total,0),result.recap.totalsAfter[p-1]-result.recap.totalsBefore[p-1],`${version}/${seat}/${ending}/${action}/${p}`);
 }
});
test('compact history removes tile payloads while preserving score rows and historical audit data',()=>{
 const full=move(9,{path:['0,0'],changed:Array.from({length:30},(_,i)=>({id:`${i},0`,before:{letter:'A',owner:1},after:{letter:'Z',owner:2}})),captured:['0,0'],refreshed:['0,0'],totalsBefore:[10,20],totalsAfter:[22,25]});const result=compact([full]);
 assert.equal(result[0].recap.path,undefined);assert.equal(result[0].recap.changed,undefined);assert.deepEqual(rows(result[0]),rows(full));assert.equal(full.recap.changed.length,30);assert.ok(JSON.stringify(result).length<JSON.stringify([full]).length/4);
});
test('history prefetch and opening share one request; reopening uses the complete cached page',async()=>{
 const d=deferred(),calls=[],cache=cacheFor(req=>{calls.push(req);return d.promise;});cache.seed('a',{id:'g',revision:4},[move(4)]);
 const a=cache.load('a','g'),b=cache.load('a','g');assert.equal(calls.length,1);assert.equal(calls[0].supportsCompactHistory,true);assert.equal(calls[0].beforeRevision,5);d.resolve(page([4,3,2]));await Promise.all([a,b]);
 assert.deepEqual(cache.read('a','g').moves.map(m=>m.revision),[4,3,2]);await cache.load('a','g');assert.equal(calls.length,1);assert.equal(cache.read('a','g').needsTop,false);
});
test('older pages deduplicate in-flight work and preserve order without gaps',async()=>{
 let call=0;const d=deferred(),cache=cacheFor(async()=>++call===1?page([6,5,4],true):d.promise);cache.seed('a',{id:'g',revision:6},[move(6)]);await cache.load('a','g');
 const a=cache.load('a','g',{older:true}),b=cache.load('a','g',{older:true});assert.equal(call,2);d.resolve(page([3,2]));await Promise.all([a,b]);assert.equal(call,2);assert.deepEqual(cache.read('a','g').moves.map(m=>m.revision),[6,5,4,3,2]);
});
test('a newer receipt during prefetch cannot be replaced by an older response',async()=>{
 const d=deferred();let count=0;const cache=cacheFor(()=>++count===1?d.promise:Promise.resolve(page([5,4,3,2])));
 cache.seed('a',{id:'g',revision:4},[move(4)]);const pending=cache.load('a','g');cache.seed('a',{id:'g',revision:5},[move(5)]);d.resolve(page([4,3,2]));await pending;
 assert.deepEqual(cache.read('a','g').moves.map(m=>m.revision),[5,4,3,2]);assert.equal(cache.read('a','g').needsTop,false);assert.equal(count,2);
});
test('refreshing a newer top page keeps already loaded older history and completion',async()=>{
 const pages=[page([4,3],true),page([2]),page([5,4],true)];const cache=cacheFor(async()=>pages.shift());cache.seed('a',{id:'g',revision:4});await cache.load('a','g');await cache.load('a','g',{older:true});cache.seed('a',{id:'g',revision:5},[move(5)]);await cache.load('a','g');
 assert.deepEqual(cache.read('a','g').moves.map(m=>m.revision),[5,4,3,2]);assert.equal(cache.read('a','g').hasMore,false);
});
test('a large live revision gap restarts pagination until the missing range is filled',async()=>{
 const pages=[page([4,3,2]),page([9,8],true),page([7,6,5,4,3,2])],cache=cacheFor(async()=>pages.shift());cache.seed('a',{id:'g',revision:4});await cache.load('a','g');cache.seed('a',{id:'g',revision:9},[move(9)]);await cache.load('a','g');assert.equal(cache.read('a','g').hasMore,true);await cache.load('a','g',{older:true});assert.deepEqual(cache.read('a','g').moves.map(m=>m.revision),[9,8,7,6,5,4,3,2]);
});
test('failed history loads keep cached rows and allow an explicit retry',async()=>{
 let call=0;const cache=cacheFor(async()=>{if(++call===1)throw Error('Offline');return page([3,2]);});cache.seed('a',{id:'g',revision:3},[move(3)]);await assert.rejects(()=>cache.load('a','g'),/Offline/);assert.equal(cache.read('a','g').moves.length,1);assert.equal(cache.read('a','g').loading,false);await cache.load('a','g');assert.equal(cache.read('a','g').moves.length,2);
});
test('history cache isolates accounts, evicts old games and rejects late responses after sign-out',async()=>{
 const d=deferred(),cache=cacheFor(()=>d.promise,{maxGames:2});cache.seed('a',{id:'g',revision:3},[move(3)]);cache.seed('b',{id:'g',revision:3},[move(2)]);assert.equal(cache.read('a','g').moves[0].revision,3);assert.equal(cache.read('b','g').moves[0].revision,2);
 cache.seed('b',{id:'next',revision:1});assert.equal(cache.read('a','g'),null);
 const waiting=cache.load('b','g');cache.reset();d.resolve(page([3,2]));assert.equal(await waiting,null);assert.equal(cache.read('b','g'),null);
});

test('Older moves waits for a top refresh and then loads the requested older page once',async()=>{
 const d=deferred();let calls=0;const cache=cacheFor(async()=>++calls===1?d.promise:page([2]));cache.seed('a',{id:'g',revision:4},[move(4)]);
 const top=cache.load('a','g'),older=cache.load('a','g',{older:true});d.resolve(page([4,3],true));await Promise.all([top,older]);assert.equal(calls,2);assert.deepEqual(cache.read('a','g').moves.map(m=>m.revision),[4,3,2]);
});
