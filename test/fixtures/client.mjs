// Local-only UI fixture adapter. Never imported by the production build.
import {Engine,config,applyCommand,RULES_VERSION} from '../../server/domain.mjs';
import words from '../../server/versions/dictionary-v1.json';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',C='33333333-3333-4333-8333-333333333333';
const ids=['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','cccccccc-cccc-4ccc-8ccc-cccccccccccc','dddddddd-dddd-4ddd-8ddd-dddddddddddd'];
const token='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',dictionary=new Set(words),now=Date.now();
let randomSeed=981;function random(){randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0;return randomSeed/4294967296;}
const date=minutes=>new Date(now-minutes*60000).toISOString();
const scenario=new URLSearchParams(location.search).get('fixture')||'home';
if(scenario==='motion_reduced'){
 const originalMedia=window.matchMedia.bind(window);
 window.matchMedia=query=>query==='(prefers-reduced-motion: reduce)'?{matches:true,addEventListener(){},removeEventListener(){}}:originalMedia(query);
}
const secondSeat=['walnut','walnut_waiting','motion_walnut'].includes(scenario);
const self={id:secondSeat?B:A,email:'demo@example.invalid'},profile={display_name:secondSeat?'Mara':'Norbert',email_notifications:false,friend_code:'A1B2C3D4E5F6'};
profile.username=scenario==='onboarding'?(sessionStorage.getItem('wc-design-username')||null):profile.display_name;
if(scenario==='onboarding')profile.display_name=profile.username||'Player';
let user=scenario==='auth'?null:self,authListener=null,channelListener=null,failNext=false,staleNext=false,commits=0;
function newGame(id,other='Mara'){return {id,players:[A,B],names:['Norbert',other],state:{...Engine.newGame(config,random),player:1,startingPlayer:1},status:'active',revision:10,updated_at:date(24),last_play_at:date(24),rules_version:RULES_VERSION,dictionary_version:'english-letterpress-v1',draw_by:null};}
const games=[newGame(ids[0]),newGame(ids[1],'Jules'),newGame(ids[2],'Alex'),newGame(ids[3])];
games[0].state.wordPoints=[38,35];games[0].state.lettersUsed=62;games[0].state.turns=[5,5];
games[1].state.player=2;games[1].state.wordPoints=[15,25];games[1].updated_at=date(160);
games[2].status='completed';games[2].result='1';games[2].state.over=true;games[2].state.wordPoints=[99,76];games[2].updated_at=date(1700);
games[3].status='invited';games[3].players=[A,null];games[3].names=['Norbert',''];games[3].revision=0;games[3].updated_at=date(3);
function findPath(state,length){const visit=path=>{if(path.length===length)return path;for(const t of state.tiles){if(Engine.validatePath(state,[...path,t.id],config,false))continue;const result=visit([...path,t.id]);if(result)return result;}return null;};return visit([]);}
if(scenario==='walnut')games[0].state.player=2;
if(scenario==='reentry')games[0].state.tiles.forEach(t=>{if(t.owner===1)t.owner=0;});
const wordPath=findPath(games[0].state,4);wordPath.forEach((id,i)=>{games[0].state.tiles.find(t=>t.id===id).letter='WORD'[i];});
if(['capture','legacy_capture'].includes(scenario)){
  games[0].rules_version=scenario==='legacy_capture'?'autumn-v1':RULES_VERSION;
  [...'GARDENS'].forEach((letter,i)=>{const tile=games[0].state.tiles.find(t=>t.id===`${i-3},0`);Object.assign(tile,{letter,owner:i===0?1:i<6?2:0,castle:i===3});});
}

if(['income','motion','motion_walnut','motion_incoming','motion_final','motion_reduced'].includes(scenario)){
 if(scenario.startsWith('motion'))games[0].revision=Math.floor(Date.now()/1000);
 const s=games[0].state,actor=['motion_walnut','motion_incoming'].includes(scenario)?2:1;s.player=actor;s.startingPlayer=3-actor;s.turns=actor===1?[5,6]:[6,5];s.castleIncome=[8,12];
 s.tiles.forEach(t=>{if(t.castle)t.owner=0;});s.tiles.find(t=>t.castle&&t.q<0).owner=3-actor;
 [...'GARDENS'].forEach((letter,i)=>Object.assign(s.tiles.find(t=>t.id===`${i-3},0`),{letter,owner:i===0?actor:i<6?3-actor:0,castle:i===3}));
 if(scenario==='motion_final')s.lettersUsed=119;
}

const jokersPath=wordPath.slice(0,3);
if(scenario==='joker')games[0].state.tiles.find(t=>t.id===wordPath[1]).letter='?';
if(scenario==='longnames'){profile.display_name='Norbert with a very long display name';games[0].names[0]=profile.display_name;games[0].names[1]='Alexandra with a rather long surname';}
const recap={action:'word',player:2,at:date(24),word:'MEADOW',path:games[0].state.tiles.slice(15,21).map(t=>t.id),score:{letters:12,lengthBonus:3,wordPoints:15,territoryGain:4,enemyLoss:2,totalGain:19},changed:games[0].state.tiles.slice(15,21).map((t,i)=>({id:t.id,before:{...t,letter:'MEADOW'[i],owner:i<3?0:1},after:{...t,owner:2}}))};
const history={[ids[0]]:[{recap}], [ids[2]]:[{recap:{...recap,word:'GARDENS',score:{...recap.score,wordPoints:19},player:1}}]};
const notifications=[{id:'1',game_id:ids[0],kind:'word',read_at:null,created_at:date(24)},{id:'2',game_id:ids[1],kind:'invitation accepted',read_at:null,created_at:date(160)},{id:'3',game_id:ids[2],kind:'game complete',read_at:date(1500),created_at:date(1700)}];
const receipts=new Map();
const initialGames=scenario==='empty'?[]:games;
const sceneGame={game:ids[0],income:ids[0],capture:ids[0],legacy_capture:ids[0],walnut:ids[0],walnut_waiting:ids[0],reentry:ids[0],joker:ids[0],waiting:ids[1],finished:ids[2],invitation:ids[3],longnames:ids[0],draw:ids[0]};
for(const s of ['motion','motion_walnut','motion_incoming','motion_final','motion_reduced'])sceneGame[s]=ids[0];
if(scenario==='draw')games[0].draw_by=B;
if(sceneGame[scenario]){const url=new URL(location.href);url.searchParams.set('game',sceneGame[scenario]);window.history.replaceState(null,'',url);}
const social={people:scenario==='empty'?[]:[{id:B,display_name:'Mara',friend_code:'ABCDEF123456',status:'accepted',request_id:ids[1],requested_by:A},{id:C,display_name:'Jules',friend_code:'ABCDEF234567',status:'pending',request_id:ids[2],requested_by:C}],invitations:[],outgoing:[],blocked:[]};
if(scenario==='friends'){const url=new URL(location.href);url.searchParams.set('view','friends');window.history.replaceState(null,'',url);}
const originalFetch=window.fetch.bind(window);
window.fetch=async(url,options)=>{
  if(!String(url).includes('fixture.invalid/functions/v1/game-api'))return originalFetch(url,options);
  await new Promise(r=>setTimeout(r,120));const input=JSON.parse(options.body),game=games.find(g=>g.id===input.gameId);let result={};
  const error=(message,code,status=400)=>new Response(JSON.stringify({error:message,code,requestId:'test-reference'}),{status,headers:{'Content-Type':'application/json'}});
  if(!user)return error('Sign in to continue.','unauthorized',401);
  switch(input.action){
    case 'home':result={profile,needsUsername:profile.username===null,games:initialGames,notifications:scenario==='empty'?[]:notifications,social};break;
    case 'suggest_username':result={username:'GentleOtter'+String(Math.floor(Math.random()*10000)).padStart(4,'0')};break;
    case 'complete_username':if(profile.username===null){if(['norbert','mara'].includes(input.username.toLowerCase()))return error('That username is already taken. Try another.','username_taken',409);profile.username=profile.display_name=input.username;sessionStorage.setItem('wc-design-username',input.username);}result={profile,username:profile.username};if(failNext){failNext=false;throw new TypeError('Simulated response lost after username saved');}break;
    case 'game':if(!game)return error('Game not found','not_found',404);result={game,history:history[game.id]||[],invitation:game.status==='invited'?{token,expires_at:date(-7*1440)}:null};break;
    case 'create':{let g=games.find(g=>g.id===input.gameId);if(!g){g=newGame(input.gameId);g.status='invited';g.players=[A,null];g.revision=0;g.names=['Norbert',''];games.unshift(g);}if(input.friendId)social.outgoing.push({id:g.id,recipient:input.friendId});result={game:g};break;}
    case 'invitation':if(input.choice==='preview'){result={invitation:{id:'ffffffff-ffff-4fff-8fff-ffffffffffff',status:'invited',host:'Olivia',expires_at:date(-1440),rulesVersion:RULES_VERSION}};}else if(input.choice==='cancel'){games[3].status='cancelled';result={game:games[3]};}else if(input.choice==='accept'){const g=newGame('ffffffff-ffff-4fff-8fff-ffffffffffff','Olivia');games.push(g);result={game:g};}else result={game:{status:'declined'}};break;
    case 'turn':{
      const existing=receipts.get(input.command.operationId);if(existing){result={game,replayed:true,...existing};break;}
      if(staleNext){staleNext=false;game.revision++;return error('Stale board','stale',409);}
      try{const update=applyCommand(game,user.id,input.command,dictionary,'english-letterpress-v1',random);Object.assign(game,update.next);game.updated_at=new Date().toISOString();history[game.id]??=[];history[game.id].unshift({revision:game.revision,recap:update.recap});const receipt={acceptedRevision:game.revision,recap:update.recap};receipts.set(input.command.operationId,receipt);commits++;result={game,replayed:false,...receipt};updateMarker();if(failNext){failNext=false;throw new TypeError('Simulated response lost after commit');}}
      catch(e){if(e instanceof TypeError)throw e;return error(e.message,e.code||'invalid_word',e.status||400);}break;
    }
    case 'friends':result={social,profile};break;
    case 'friend_search':result={people:[{id:'44444444-4444-4444-8444-444444444444',display_name:input.query.toLowerCase().includes('long')?'Alexandra with a rather long surname':'Alex',friend_code:'AB12CD34EF56',status:null}]};break;
    case 'friend_action':{let p=social.people.find(p=>p.id===input.friendId);if(!p){p={id:input.friendId,display_name:'Alex',friend_code:'AB12CD34EF56'};social.people.push(p);}if(input.choice==='request')Object.assign(p,{status:'pending',requested_by:A,request_id:input.operationId});else if(input.choice==='accept')p.status='accepted';else social.people=social.people.filter(p=>p.id!==input.friendId);result={social};break;}
    case 'stats':result={statistics:scenario==='empty'?{}:{'autumn-v1/english-letterpress-v1':{wins:3,losses:1,draws:1,highestFinalScore:142,bestWord:'GARDENS',bestTurn:19}}};break;
    case 'profile':if((input.username||input.name).toLowerCase()==='mara')return error('That username is already taken. Try another.','username_taken',409);profile.username=profile.display_name=input.username||input.name;result={username:profile.username};break;
    case 'read_notifications':notifications.forEach(n=>n.read_at=new Date().toISOString());break;
    case 'export':result={profile,games:initialGames};break;
    case 'delete_account':return error('Deletion is disabled in design fixtures.','test_only');
    default:return error('Unexpected fixture action: '+input.action,'test_only');
  }
  return new Response(JSON.stringify(result),{status:200,headers:{'Content-Type':'application/json'}});
};
function session(){return user?{user,access_token:'local-design-fixture'}:null;}
export function createClient(){return {rpc:async(name,args)=>({data:name==='wc_username_available'&&!['norbert','mara'].includes(args.p_username.toLowerCase())}),auth:{getSession:async()=>({data:{session:session()}}),onAuthStateChange:fn=>{authListener=fn;setTimeout(()=>fn('INITIAL_SESSION',session()),0);},signInWithPassword:async()=>{user=self;authListener?.('SIGNED_IN',session());return {data:{session:session()}};},signUp:async()=>{profile.username=null;profile.display_name='Player';return {data:{session:null}};},resetPasswordForEmail:async()=>({}),updateUser:async()=>({}),signOut:async()=>{user=null;authListener?.('SIGNED_OUT',null);return {};},},realtime:{setAuth:async()=>{}},channel:()=>{const channel={on:(_a,_b,fn)=>{channelListener=fn;return channel;},subscribe:fn=>{setTimeout(()=>fn('SUBSCRIBED'),0);return {};}};return channel;},removeChannel:async()=>{}};}
const controls=document.createElement('div');controls.id='fixture-controls';controls.style.cssText='position:fixed;right:8px;top:0;z-index:70;font:10px system-ui;background:#eee7c9;color:#504f3c;padding:2px 6px;border-radius:0 0 6px 6px;';
const select=document.createElement('select');select.setAttribute('aria-label','Design test scenario');select.style.cssText='font:10px system-ui;background:transparent;border:0;width:80px';
for(const value of ['home','friends','game','income','motion','motion_walnut','motion_incoming','motion_final','motion_reduced','capture','legacy_capture','walnut','walnut_waiting','reentry','waiting','finished','invitation','empty','auth','onboarding','joker','draw','longnames','push_off','push_blocked','push_error']){const option=document.createElement('option');option.value=value;option.textContent=value;select.append(option);}select.value=scenario;select.onchange=()=>{location.href=location.pathname+'?fixture='+select.value;};
const marker=document.createElement('span');function updateMarker(){marker.textContent=`Test data · ${commits} saved `;}updateMarker();controls.append(marker,select);
for(const [label,handler]of [['Lose reply',()=>{failNext=true;}],['Stale',()=>{staleNext=true;}],['Other turn',()=>{games[0].state.player=2;games[0].revision++;channelListener?.();}]]){const b=document.createElement('button');b.textContent=label;b.style.cssText='font:9px system-ui;background:none;border:0;padding:3px;color:#504f3c';b.onclick=handler;controls.append(b);}document.body.append(controls);document.querySelector('.app-shell').style.paddingTop='24px';
if(scenario==='motion_incoming'){
 const incoming=document.createElement('button');incoming.textContent='Incoming word';incoming.onclick=()=>{
  const g=games[0],update=applyCommand(g,g.players[g.state.player-1],{action:'word',revision:g.revision,operationId:crypto.randomUUID(),path:[...'GARDENS'].map((_,i)=>`${i-3},0`)},dictionary,'english-letterpress-v1',random);
  Object.assign(g,update.next);history[g.id]=[{revision:g.revision,recap:update.recap}];incoming.disabled=true;channelListener?.();
 };controls.append(incoming);
}
