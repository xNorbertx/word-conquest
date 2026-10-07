import {Engine,configFor,uuid} from '../server/domain.mjs';
import {gameSummary} from '../server/game-summary.mjs';
const copy=value=>JSON.parse(JSON.stringify(value));
const emptySocial=()=>({people:[],invitations:[],outgoing:[],blocked:[]});
// Presentation only. A restored snapshot never authorizes a turn or an account action.
export function createSnapshotCache(storage,{namespace='',now=Date.now,ttl=7*86400000,maxGames=12,maxBytes=1000000}={}){
 const key='wc-snapshots:v1:'+namespace;let memory=null,loaded=false;
 const fresh=at=>Number.isFinite(at)&&at<=now()+60000&&now()-at<ttl;
 const owned=(g,actor)=>g&&uuid(g.id)&&Array.isArray(g.players)&&g.players.includes(actor)&&Number.isSafeInteger(g.revision)&&g.revision>=0;
 function validGame(g,actor){
  if(!owned(g,actor)||!configFor(g.rules_version)||!Array.isArray(g.names)||g.names.length!==2||!g.names.every(n=>typeof n==='string'))return false;
  const s=g.state;if(!s||!Array.isArray(s.tiles)||s.tiles.length!==69||!Array.isArray(s.turns)||!Array.isArray(s.wordPoints)||![1,2].includes(s.player))return false;
  if(!s.tiles.every(t=>t&&typeof t.id==='string'&&/^[A-Z?]$/.test(t.letter)&&[0,1,2].includes(t.owner)&&Number.isFinite(t.q)&&Number.isFinite(t.r)))return false;
  try{return Engine.scores(s,configFor(g.rules_version)).every(Number.isFinite);}catch{return false;}
 }
 function read(actor){
  if(!uuid(actor))return null;
  if(!loaded){loaded=true;try{const raw=storage?.getItem(key);if(raw&&raw.length<=maxBytes)memory=JSON.parse(raw);}catch{}}
  if(memory&&(memory.actor!==actor||!fresh(memory.at))){clear();return null;}
  if(memory?.schema!==1||memory.actor!==actor||!fresh(memory.at)||!Array.isArray(memory.games)||memory.games.some(item=>!item?.data?.game))return null;
  if(memory.home&&(!Array.isArray(memory.home.data?.games)||memory.home.data.profile?.id!==actor))return null;
  return memory;
 }
 function clear(){memory=null;loaded=true;try{storage?.removeItem(key);}catch{}}
 function save(data){
  memory=data;loaded=true;
  while(data.games.length>maxGames)data.games.pop();
  while(JSON.stringify(data).length>maxBytes&&data.games.length)data.games.pop();
  while(JSON.stringify(data).length>maxBytes&&data.home?.data.games.length)data.home.data.games.pop();
  if(JSON.stringify(data).length>maxBytes){clear();return;}
  try{
   while(true){try{storage?.setItem(key,JSON.stringify(data));break;}catch(e){if(!data.games.length){try{storage?.removeItem(key);}catch{}break;}data.games.pop();}}
  }catch{/* Storage is optional; the current in-memory screen remains usable. */}
 }
 function writable(actor){return read(actor)||{schema:1,actor,at:now(),home:null,games:[]};}
 return {
  home(actor){const h=read(actor)?.home;if(!h||!fresh(h.at)||h.data?.profile?.id!==actor||typeof h.data.profile.username!=='string'||!h.data.profile.username||typeof h.data.profile.display_name!=='string'||!Array.isArray(h.data.games))return null;
   if(!h.data.games.every(g=>owned(g,actor)&&g.state&&[1,2].includes(g.state.player)&&Array.isArray(g.names)&&g.names.every(n=>typeof n==='string')))return null;
   return copy({...h.data,notifications:[],social:emptySocial()});},
  game(actor,id){const item=read(actor)?.games?.find(g=>g.data?.game?.id===id);return item&&fresh(item.at)&&validGame(item.data.game,actor)?copy(item.data):null;},
  saveHome(actor,result){
   if(!uuid(actor)||result?.profile?.id!==actor)return;
   if(result.needsUsername||!result.profile.username){clear();return;}
   const data=writable(actor),p=result.profile;
   data.at=now();data.home={at:now(),data:{profile:{id:actor,username:p.username,display_name:p.display_name},needsUsername:false,games:(result.games||[]).filter(g=>owned(g,actor)).slice(0,200).map(g=>gameSummary(g))}};
   save(data);
  },
  saveGame(actor,result){
   const g=result?.game;if(!validGame(g,actor)||g.status==='invited')return;
   const data=writable(actor);if(data.games.some(item=>item.data.game.id===g.id&&item.data.game.revision>g.revision))return;
   const latest=(result.history||[]).filter(m=>Number.isSafeInteger(m.revision)&&m.revision<=g.revision&&m.recap).slice(0,1);
   data.games=data.games.filter(item=>item.data.game.id!==g.id);
   data.games.unshift({at:now(),data:{game:copy({...g,state:{...g.state,log:[]}}),history:copy(latest),historyHasMore:result.historyHasMore!==false,invitation:null}});data.at=now();
   if(data.home){const games=data.home.data.games,index=games.findIndex(item=>item.id===g.id),summary=gameSummary(g);if(index<0)games.unshift(summary);else if(games[index].revision<=g.revision)games[index]=summary;}
   save(data);
  },
  forgetGame(actor,id){const data=read(actor);if(!data)return;data.games=data.games.filter(item=>item.data.game.id!==id);if(data.home)data.home.data.games=data.home.data.games.filter(g=>g.id!==id);save(data);},
  clear
 };
}
