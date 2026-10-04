const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const words=new Set(require('../server/versions/dictionary-v1.json')),meta=require('../server/versions/dictionary-v1.meta.json');
const A=crypto.randomUUID(),B=crypto.randomUUID(),G=crypto.randomUUID(),T=crypto.randomUUID();
async function position(version='autumn-v2',player=1){
  const d=await import('../server/domain.mjs'),state=d.Engine.newGame(d.configFor(version),()=>.4);
  state.player=player;
  const path=[...'GARDENS'].map((letter,i)=>{const id=`${i-3},0`,tile=state.tiles.find(t=>t.id===id);Object.assign(tile,{letter,owner:i===0?player:i<6?3-player:0,castle:i===3});return id;});
  return {d,path,g:{id:G,players:[A,B],status:'active',revision:3,rules_version:version,dictionary_version:meta.version,state}};
}
const command=(g,path,extra={})=>({action:'word',revision:g.revision,operationId:crypto.randomUUID(),path,...extra});

test('new rules capture five opponents and a neutral tile with correct score, ownership and replacements for both seats',async()=>{
  for(const player of [1,2]){
    const {d,g,path}=await position('autumn-v2',player),before=structuredClone(g),preview=d.Engine.scoreMove(g.state,path,d.configFor(g.rules_version));
    const {next,recap}=d.applyCommand(g,g.players[player-1],command(g,path,{score:99999}),words,meta.version,()=>.4);
    assert.equal(recap.captured.filter(id=>g.state.tiles.find(t=>t.id===id).owner===3-player).length,5);
    assert.equal(recap.score.enemyLoss,7);assert.equal(recap.score.territoryGain,8);assert.equal(recap.score.wordPoints,19);assert.equal(recap.score.totalGain,27);assert.deepEqual(recap.score,preview);
    for(const id of path){const old=g.state.tiles.find(t=>t.id===id),tile=next.state.tiles.find(t=>t.id===id);assert.equal(tile.owner,player);assert.notEqual(tile.letter,old.letter);}
    assert.equal(next.state.lettersUsed,7);assert.equal(next.state.wordPoints[player-1],19);assert.equal(next.state.player,3-player);assert.deepEqual(g,before);
    assert.equal(recap.totalsAfter[player-1]-recap.totalsBefore[player-1],27);assert.equal(recap.totalsBefore[2-player]-recap.totalsAfter[2-player],7);
  }
});

test('stored v1 games retain the three-opponent cap; client rule overrides cannot change it',async()=>{
  const {d,g,path}=await position('autumn-v1');
  assert.throws(()=>d.applyCommand(g,A,command(g,path,{rulesVersion:'autumn-v2',maxEnemyTilesPerWord:69}),words,meta.version),/at most 3/);
  assert.equal(d.Engine.validatePath(g.state,path.slice(0,4),d.configFor('autumn-v1'),false),null);
  assert.match(d.Engine.validatePath(g.state,path.slice(0,5),d.configFor('autumn-v1'),false),/at most 3/);
  assert.equal(d.Engine.validatePath(g.state,path,d.configFor('autumn-v2'),false),null);
});

test('unlimited captures retain dictionary, adjacency, unique-tile, starting territory and joker rules',async()=>{
  const {d,g,path}=await position();
  const run=(game,p,jokers)=>d.applyCommand(game,A,command(game,p,{jokers}),words,meta.version);
  assert.throws(()=>run(g,[path[0],path[3],path[4]]),/adjacent/);
  assert.throws(()=>run(g,[path[0],path[1],path[0]]),/only be used once/);
  assert.throws(()=>run(g,path.slice(1)),/Start on one/);
  const invalid=structuredClone(g);path.forEach(id=>invalid.state.tiles.find(t=>t.id===id).letter='Q');assert.throws(()=>run(invalid,path),/dictionary/);
  const joker=structuredClone(g);joker.state.tiles.find(t=>t.id===path[3]).letter='?';assert.throws(()=>run(joker,path),/Choose one letter/);
  const result=run(joker,path,{[path[3]]:'D'});assert.equal(result.next.state.tiles.find(t=>t.id===path[3]).letter,'?');assert.equal(result.recap.score.wordPoints,17);
  const reentry=structuredClone(g);reentry.state.tiles.forEach(t=>{if(t.owner===1)t.owner=2;});assert.equal(run(reentry,path).recap.captured.length,7);
});

test('rules stay separate in statistics and user-facing capture descriptions',async()=>{
  const {d,g}=await position(),classic={...g,id:crypto.randomUUID(),rules_version:'autumn-v1',status:'completed',result:'1'},latest={...g,status:'completed',result:'2'};
  const groups=d.statistics([classic,latest],A);assert.equal(Object.keys(groups).length,2);assert.equal(groups['autumn-v1/'+meta.version].wins,1);assert.equal(groups['autumn-v2/'+meta.version].losses,1);
  assert.match(d.captureRule(d.configFor('autumn-v1')),/up to 3/);assert.match(d.captureRule(d.config),/No capture limit/);
  assert.notEqual(d.rulesLabel('autumn-v1'),d.rulesLabel('autumn-v2'));assert.equal(d.configFor('__proto__'),null);
});

async function apiFixture(version='autumn-v2'){
  const {createHandler}=await import('../server/api.mjs'),{g}=await position(version),calls=[];
  const storage={auth:{getUser:async()=>({data:{user:{id:A}}})},rpc:async(name,args)=>{
    calls.push({name,args});if(name==='wc_rate_limit')return {data:true};
    if(name==='wc_create')return {data:{...g,id:args.p_id,state:args.p_state,rules_version:args.p_rules}};
    if(name==='wc_invitation')return {data:args.p_action==='preview'?{id:G,status:'invited',host:'Mara'}:g};
    throw Error('Unexpected mutation '+name);
  },from:table=>{const q={upsert:async()=>({}),select:()=>q,eq:()=>q,contains:()=>q,order:()=>q,in:async()=>({data:[{id:A,display_name:'Norbert'},{id:B,display_name:'Mara'}]}),limit:async()=>({data:[]}),single:async()=>({data:table==='profiles'?{id:A,deleting:false}:g}),maybeSingle:async()=>({data:g})};return q;}};
  const handler=createHandler(storage);
  return {calls,g,send:body=>handler(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer test','Content-Type':'application/json'},body:JSON.stringify(body)}))};
}

test('API creates explicit v2 games and preserves v1 defaults for older clients',async()=>{
  const x=await apiFixture();
  const old=await x.send({action:'create',gameId:G});assert.equal(old.status,200);assert.equal((await old.json()).game.rules_version,'autumn-v1');
  const current=await x.send({action:'create',gameId:crypto.randomUUID(),rulesVersion:'autumn-v2',supportedRules:['autumn-v1','autumn-v2']});assert.equal(current.status,200);assert.equal((await current.json()).game.rules_version,'autumn-v2');
  const count=x.calls.filter(c=>c.name==='wc_create').length;
  assert.equal((await x.send({action:'create',gameId:G,rulesVersion:'unknown'})).status,400);
  assert.equal((await x.send({action:'create',gameId:G,rulesVersion:'autumn-v2'})).status,409);
  assert.equal(x.calls.filter(c=>c.name==='wc_create').length,count);
});

test('old clients must update before opening, joining or moving in v2; v1 remains playable',async()=>{
  const x=await apiFixture();
  for(const body of [{action:'game',gameId:G},{action:'invitation',choice:'accept',token:T},{action:'turn',gameId:G,command:command(x.g,['-3,0','-2,0','-1,0'])}]){
    const r=await x.send(body);assert.equal(r.status,409);assert.equal((await r.json()).code,'client_update_required');
  }
  assert.equal(x.calls.some(c=>c.name==='wc_commit'||c.name==='wc_invitation'&&c.args.p_action==='accept'),false);
  const preview=await x.send({action:'invitation',choice:'preview',token:T});assert.equal((await preview.json()).invitation.rulesVersion,'autumn-v2');
  assert.equal((await x.send({action:'game',gameId:G,supportedRules:['autumn-v1','autumn-v2']})).status,200);
  assert.equal((await x.send({action:'invitation',choice:'accept',token:T,supportedRules:['autumn-v1','autumn-v2']})).status,200);
  const old=await apiFixture('autumn-v1');assert.equal((await old.send({action:'game',gameId:G})).status,200);
});
