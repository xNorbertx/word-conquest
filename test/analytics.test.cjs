const {test,before}=require('node:test'),assert=require('node:assert/strict');
let analytics,domain,createHandler;
const actor='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
before(async()=>{({analytics}=await import('../server/analytics.mjs'));domain=await import('../server/domain.mjs');({createHandler}=await import('../server/api.mjs'));});
function fixture(overrides={}){
 const config=domain.configFor(overrides.rules_version||'autumn-v5'),state=domain.Engine.newGame(config,()=>.4);
 return{id:crypto.randomUUID(),players:[actor,other],status:'completed',result:'1',rules_version:'autumn-v5',updated_at:'2026-10-18T10:00:00Z',state:{...state,over:true,wordPoints:[31,20],castleIncome:[12,8],finalTerritory:[15,9],log:[{type:'word',player:1,word:'GARDENS',scoring:{letters:9,lengthBonus:3,wordPoints:12},captured:5,castles:2},{type:'word',player:2,word:'QUIZZES',scoring:{letters:25,lengthBonus:3,wordPoints:28},captured:7,castles:4}]},...overrides};
}
test('records have correct seat, result, score, date, word, capture and castle attribution',()=>{
 const g=fixture(),s=analytics([g],actor);assert.equal(s.wins,1);assert.equal(s.losses,0);assert.equal(s.bestGame.value,58);assert.equal(s.bestGame.at,g.updated_at);assert.equal(s.bestWord.value,12);assert.equal(s.bestWord.word,'GARDENS');assert.equal(s.longestWord.value,7);assert.equal(s.biggestCapture.value,5);assert.equal(s.castlesCaptured,2);
 const b=analytics([g],other);assert.equal(b.losses,1);assert.equal(b.bestGame.value,37);assert.equal(b.bestWord.word,'QUIZZES');assert.equal(b.castlesCaptured,4);
 assert.equal(analytics([fixture({result:'draw'})],actor).draws,1);
});
test('unfinished games contribute word/capture records but not game outcomes or best final score',()=>{
 const g=fixture({status:'active',result:null}),s=analytics([g],actor);assert.equal(s.games,0);assert.equal(s.bestGame,null);assert.equal(s.words,1);assert.equal(s.castlesCaptured,2);
 for(const status of ['abandoned','invited','cancelled','declined','expired'])assert.equal(analytics([fixture({status})],actor).words,0);
});
test('older rules, nonparticipants and incomplete historic move records are not guessed',()=>{
 const old=fixture({rules_version:'autumn-v3'});assert.equal(analytics([old],actor).games,0);assert.equal(analytics([fixture()],crypto.randomUUID()).games,0);
 const g=fixture();g.state.log.push({player:1,type:'word',word:'MISSING'},{player:1,type:'refresh',word:'FAKE',scoring:{letters:100,lengthBonus:0,wordPoints:100},captured:10,castles:4});
 assert.equal(analytics([g],actor).words,1);g.state.log[0].scoring.wordPoints=999;assert.equal(analytics([g],actor).bestWord,null);
});
test('Swedish letters count as letters, captures can be repeated and zero-point words remain records',()=>{
 const g=fixture({rules_version:'autumn-sv-v4'});g.state.log=[{type:'word',player:1,word:'ÅÄÖ',scoring:{letters:0,lengthBonus:0,wordPoints:0},captured:2,castles:1}];
 const s=analytics([g],actor);assert.equal(s.longestWord.value,3);assert.equal(s.bestWord.value,0);assert.equal(s.bestWord.language,'sv');assert.equal(analytics([g,{...g,id:crypto.randomUUID()}],actor).castlesCaptured,2);
});
test('real engine receipts produce analytics without inspecting client summaries or operation payloads',()=>{
 const config={...domain.config,dictionaryEnabled:false,minimumWordLength:1},state=domain.Engine.newGame(config,()=>.4),tile=state.tiles.find(t=>t.owner===1&&t.letter!=='?');
 const turn=domain.Engine.submit(state,[tile.id],config,null,{},()=>.4);assert(!turn.error);const g=fixture({status:'active',state:turn.state});const s=analytics([g],actor);
 assert.equal(s.words,1);assert.equal(s.bestWord.value,turn.state.log[0].scoring.wordPoints);assert.equal(s.castlesCaptured,turn.state.log[0].castles);
});
test('analytics endpoint uses authenticated identity, paginates, and keeps auth/rate/onboarding guards',async()=>{
 const games=Array.from({length:103},()=>fixture()),queries=[];
 const setup=(opts={})=>createHandler({auth:{getUser:async()=>({data:opts.unauthorized?null:{user:{id:actor}}})},rpc:async()=>({data:!opts.rate}),from(table){
  const filters=[];const q={select:()=>q,eq:()=>q,single:async()=>({data:{username:opts.unnamed?null:'Alice'}}),contains:(k,v)=>{filters.push([k,v]);return q;},in:(k,v)=>{filters.push([k,v]);return q;},order:()=>q,range:async(a,b)=>{queries.push({filters,a,b});return{data:games.slice(a,b+1)};}};return q;
 }});
 const request=()=>new Request('https://api.invalid',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify({action:'analytics',actor:other})});
 const response=await setup()(request());assert.equal(response.status,200);const body=await response.json();assert.equal(body.analytics.games,103);assert.equal(body.analytics.wins,103);assert.equal(queries.length,2);assert.deepEqual(queries[0].filters,[['players',[actor]],['rules_version',['autumn-v5','autumn-sv-v4','autumn-nl-v1','autumn-v6','autumn-sv-v5','autumn-nl-v2']],['status',['active','completed']]]);assert.equal(queries[1].a,100);assert(!JSON.stringify(body).includes(other));
 for(const [opts,status]of [[{unauthorized:true},401],[{rate:true},429],[{unnamed:true},409]])assert.equal((await setup(opts)(request())).status,status);
});
