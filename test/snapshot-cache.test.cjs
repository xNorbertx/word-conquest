const {test}=require('node:test'),assert=require('node:assert/strict');
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
async function fixture(options={}){
 const {createSnapshotCache}=await import('../online/snapshot-cache.mjs'),{Engine,config,RULES_VERSION}=await import('../server/domain.mjs');
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const game={id:crypto.randomUUID(),players:[A,B],names:['Alice','Bob'],revision:4,status:'active',rules_version:RULES_VERSION,state:Engine.newGame(config),updated_at:new Date().toISOString()};
 const home={profile:{id:A,username:'Alice',display_name:'Alice',email:'private@example.invalid',friend_code:'private'},games:[game],notifications:[{secret:'inbox'}],social:{people:[{secret:'friend'}]}};
 const factory=()=>createSnapshotCache(storage,options);return{factory,cache:factory(),game,home,storage,values};
}
test('saved Games and boards survive restart, contain only screen data, and return isolated copies',async()=>{
 const x=await fixture();x.cache.saveHome(A,x.home);x.game.state.log=[{word:'OLDWORD'}];
 x.cache.saveGame(A,{game:x.game,history:[{revision:4,recap:{word:'WORD'}},{revision:3,recap:{word:'OLDER'}}],invitation:{token:'never-save'}});
 const restarted=x.factory(),home=restarted.home(A),board=restarted.game(A,x.game.id);assert.equal(home.profile.username,'Alice');assert.equal(home.games[0].state.tiles,undefined);assert.equal(board.game.state.tiles.length,69);assert.equal(board.history.length,1);assert.deepEqual(board.game.state.log,[]);
 const raw=[...x.values.values()][0];for(const hidden of ['private@example','friend_code','inbox','never-save','OLDWORD','OLDER'])assert.ok(!raw.includes(hidden),hidden);
 board.game.revision=99;assert.equal(restarted.game(A,x.game.id).game.revision,4);home.games.length=0;assert.equal(restarted.home(A).games.length,1);
});
test('switching accounts, signing out and unfinished usernames erase the local screen cache',async()=>{
 const x=await fixture();x.cache.saveHome(A,x.home);x.cache.saveGame(A,{game:x.game});assert.equal(x.factory().home(B),null);assert.equal(x.values.size,0);
 x.cache.saveHome(A,x.home);x.cache.clear();assert.equal(x.factory().home(A),null);
 x.cache.saveHome(A,x.home);x.cache.saveHome(A,{...x.home,needsUsername:true});assert.equal(x.factory().home(A),null);
});
test('expiration, corrupt storage and blocked/quota-limited storage cannot prevent online use',async()=>{
 let now=1000;const x=await fixture({now:()=>now,ttl:100});x.cache.saveHome(A,x.home);now+=101;assert.equal(x.factory().home(A),null);
 for(const raw of ['{bad',JSON.stringify({schema:1,actor:A,at:now,games:{}}),JSON.stringify({schema:1,actor:A,at:now,games:[null]})]){x.values.set('wc-snapshots:v1:',raw);assert.equal(x.factory().game(A,x.game.id),null);}
 x.values.clear();x.storage.setItem=()=>{throw Error('quota');};x.cache.saveHome(A,x.home);assert.equal(x.cache.home(A).profile.username,'Alice');
});
test('only twelve recent verified snapshots are retained, stale responses cannot replace a newer revision, and invites are excluded',async()=>{
 const x=await fixture({maxGames:2});const second={...x.game,id:crypto.randomUUID()},third={...x.game,id:crypto.randomUUID()};
 x.cache.saveGame(A,{game:x.game});x.cache.saveGame(A,{game:second});x.cache.saveGame(A,{game:third});assert.equal(x.cache.game(A,x.game.id),null);
 x.cache.saveGame(A,{game:{...third,revision:1}});assert.equal(x.cache.game(A,third.id).game.revision,4);
 x.cache.saveGame(A,{game:{...x.game,status:'invited'}});assert.equal(x.cache.game(A,x.game.id),null);
 x.cache.saveGame(B,{game:{...x.game,players:[A,null]}});assert.equal(x.cache.game(A,third.id).game.revision,4);
});
test('summary inputs remain compact, cached boards update list scores, and storage is bounded',async()=>{
 const x=await fixture(),{gameSummary}=await import('../server/game-summary.mjs');x.home.games=x.home.games.map(gameSummary);x.cache.saveHome(A,x.home);
 x.game.revision++;x.game.state.wordPoints[0]=25;x.cache.saveGame(A,{game:x.game});assert.equal(x.cache.home(A).games[0].revision,5);assert.equal(x.cache.home(A).games[0].scores[0],gameSummary(x.game).scores[0]);
 const tiny=await fixture({maxBytes:750});tiny.cache.saveHome(A,tiny.home);tiny.cache.saveGame(A,{game:tiny.game});assert.ok([...tiny.values.values()].every(s=>s.length<=750));
});
