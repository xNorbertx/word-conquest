// Explicit opt-in: creates three isolated test identities and one test game.
// Never sends email, deletes records, logs credentials, or changes Auth configuration.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Engine,config} from '../server/domain.mjs';
import words from '../server/versions/dictionary-v1.json' with {type:'json'};
const ref=process.argv[2];
if(ref!=='aumiyyjsdqdazzmdmprl' || process.argv[3]!=='--create-test-data')throw new Error('Explicit dedicated project and test-data flag required.');
const base=`https://${ref}.supabase.co`,origin='http://127.0.0.1:4173';
const keys=JSON.parse(execFileSync(process.execPath,['node_modules/supabase/dist/supabase.js','projects','api-keys','--project-ref',ref,'--reveal'],{encoding:'utf8',stdio:['ignore','pipe','pipe']})).keys;
const service=keys.find(k=>k.name==='service_role')?.api_key;
const publicKey=keys.find(k=>k.type==='publishable')?.api_key;
if(!service || !publicKey)throw new Error('Required keys unavailable.');
async function request(path,body,{token=publicKey,key=publicKey,method='POST',expected=200}={}){
  const res=await fetch(base+path,{method,signal:AbortSignal.timeout(45000),headers:{apikey:key,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Origin:origin},...(body===undefined?{}:{body:JSON.stringify(body)})});
  let data;try{data=await res.json();}catch{data={};}
  if(res.status!==expected)throw new Error(`${path.split('?')[0]} returned ${res.status}; expected ${expected}; code=${data.code || 'unspecified'}`);
  return data;
}
const api=(user,body,expected=200)=>request('/functions/v1/game-api',body,{token:user.access_token,expected});
const run=crypto.randomUUID().slice(0,8),accounts=[];
for(let i=0;i<3;i++){
  const email=`wc-smoke-${run}-${i}@example.invalid`,password=crypto.randomUUID()+crypto.randomUUID();
  await request('/auth/v1/admin/users',{email,password,email_confirm:true,user_metadata:{username:`Test player ${i+1} (${run})`,purpose:'Word Conquest deployment smoke test'}},{key:service,token:service});
  const session=await request('/auth/v1/token?grant_type=password',{email,password});
  accounts.push(session);
  await api(session,{action:'profile',name:`Test player ${i+1} (${run})`,emailNotifications:false});
}
const [a,b,c]=accounts;console.log('Three isolated test identities authenticated; email preferences are off.');
const id=crypto.randomUUID();
const created=await api(a,{action:'create',gameId:id});
const repeated=await api(a,{action:'create',gameId:id});assert.deepEqual(repeated.game.state,created.game.state);
const {invitation}=await api(a,{action:'game',gameId:id});
const accepted=await api(b,{action:'invitation',choice:'accept',token:invitation.token});assert.equal(accepted.game.status,'active');
await api(c,{action:'game',gameId:id},404);
const hidden=await request(`/rest/v1/games?id=eq.${id}&select=id`,undefined,{token:c.access_token,method:'GET'});assert.equal(hidden.length,0);
await request(`/rest/v1/games?id=eq.${id}`,{revision:999},{token:a.access_token,method:'PATCH',expected:403});
let game=(await api(a,{action:'game',gameId:id})).game;
const first={operationId:crypto.randomUUID(),revision:game.revision,action:'refresh'};
const result=await api(a,{action:'turn',gameId:id,command:first});
const retried=await api(a,{action:'turn',gameId:id,command:first});assert.equal(retried.replayed,true);assert.equal(retried.game.revision,result.game.revision);
await api(a,{action:'turn',gameId:id,command:{...first,operationId:crypto.randomUUID()}},409);
await api(a,{action:'turn',gameId:id,command:{...first,action:'resign'}},409);
game=result.game;console.log('Invitations, participant isolation, write denial, idempotency and stale-board handling passed.');
const dictionary=new Set(words),prefixes=new Set();
for(const word of words)if(word.length<=6)for(let n=1;n<=word.length;n++)prefixes.add(word.slice(0,n));
function findWord(state){
  function visit(path,text,jokers){
    if(text.length>=3 && dictionary.has(text))return {path,jokers};if(path.length>=6)return null;
    const last=state.tiles.find(t=>t.id===path.at(-1));
    for(const tile of state.tiles){
      if(path.includes(tile.id) || (last && !Engine.adjacent(last,tile)))continue;
      const next=[...path,tile.id];if(Engine.validatePath(state,next,config,false))continue;
      for(const letter of tile.letter==='?'?'ABCDEFGHIJKLMNOPQRSTUVWXYZ':tile.letter){
        const word=text+letter.toLowerCase();if(!prefixes.has(word))continue;
        const found=visit(next,word,tile.letter==='?'?{...jokers,[tile.id]:letter}:jokers);if(found)return found;
      }
    }return null;
  }return visit([],'',{});
}
let wordTurns=0,turns=1;
while(!game.state.over && turns<60){
  const player=accounts[game.state.player-1],found=findWord(game.state);
  const command={operationId:crypto.randomUUID(),revision:game.revision,action:found?'word':'refresh',...(found || {})};
  const r=await api(player,{action:'turn',gameId:id,command});
  // Reload independently as a returning opponent, rather than trusting the mutation response.
  game=(await api(accounts[1-(game.state.player-1)],{action:'game',gameId:id})).game;
  assert.equal(game.revision,r.acceptedRevision);if(found)wordTurns++;turns++;
  if(turns%10===0)console.log(`Hosted test game: ${turns} turns persisted.`);
}
assert.equal(game.status,'completed');assert.ok(wordTurns>=5);assert.equal(game.state.turns[0],game.state.turns[1]);
const stats=await api(a,{action:'stats'});assert.equal(Object.values(stats.statistics)[0].games,1);
const final=await api(a,{action:'game',gameId:id});assert.equal(final.history.length,turns);
const inbox=await api(b,{action:'home'});assert.ok(inbox.notifications.length>0);
const unauth=await fetch(base+'/functions/v1/game-api',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(unauth.status,401);
const notify=await fetch(base+'/functions/v1/notify',{method:'POST'});assert.equal(notify.status,401);
const report={at:new Date().toISOString(),project:ref,gameId:id,testUsers:accounts.map(s=>s.user.id),turns,wordTurns,finalScores:Engine.scores(game.state,config),checks:['verified Auth sessions','create retry','invite accept','participant isolation','direct write denial','turn retry','stale revision','idempotency conflict','full dictionary game','persistent reload each turn','equal final turns','single ranked result','move recaps','inbox','unauthenticated functions denied'],emailSent:false};
fs.writeFileSync('work/hosted-smoke-result.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
