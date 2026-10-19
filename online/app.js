import {renderAnalytics} from './analytics.js';
import {rulesSections} from './copy.mjs';
import monogram from '../assets/monogram.json';
import {gameSummary} from '../server/game-summary.mjs';
import {createHomeRequests} from './home-requests.mjs';
import {createSnapshotCache} from './snapshot-cache.mjs';
import {version as appVersion} from '../package.json';
import {Capacitor,registerPlugin} from '@capacitor/core';
import {createTheme} from './theme.mjs';
import {trackFocusInput} from './focus.mjs';
import {App} from '@capacitor/app';
import {createClient} from '@supabase/supabase-js';
import {createPushControls} from './push.js';
import {createFriends} from './friends.js';
import {requireUsername,signUpAccount} from './username.mjs';
import {scoreMotionPlan,createScoreLedger} from './score-motion.mjs';
import {createBoardScoreMotion} from './score-motion.js';
import {createMoveHistory} from './move-history.js';
import {tilePoints,castleLabel} from './board-geometry.mjs';
import {createJokerKeyboard,canAssignJoker} from './joker-keyboard.mjs';
import {createBoardViewport} from './board-viewport.mjs';
import {LANGUAGES,languageFor,languageLabel} from '../server/languages.mjs';
import {Engine,config as defaultConfig,configFor,RULES_VERSION,SUPPORTED_RULES} from '../server/domain.mjs';
let config=defaultConfig;
import {$,svg,icon,node,button,setting,notify,showSheet,closeSheet,ask,initUI,closeTopDialog,emptyState,infoSections} from './ui.js';
import {seatOf,isFinished,opponentName,gameStatus,visibleGames,timeAgo,invitationToken,activityText,friendlyError} from './presentation.mjs';

trackFocusInput();initUI();$('app-version').textContent=appVersion;
const appearance=Capacitor.getPlatform()==='android'?registerPlugin('Appearance'):null;
createTheme({root:document.documentElement,button:$('dark-mode'),meta:document.querySelector('meta[name="theme-color"]'),onChange:theme=>appearance?.set({dark:theme==='dark'})});
const mark=svg('svg',{viewBox:monogram.viewBox,'aria-hidden':'true'});
for(const p of monogram.paths)mark.append(svg('path',{d:p.d,fill:'none',stroke:'currentColor','stroke-width':p.width,'stroke-linecap':'round','stroke-linejoin':'round'}));
document.querySelector('.brand-mark').replaceChildren(mark);
const cfg=window.WC_CONFIG||{},configured=!!(cfg.supabaseUrl&&cfg.supabaseAnonKey);
const db=configured?createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;
const params=new URLSearchParams(location.search),launchGame=params.get('game');
if(params.get('invite'))localStorage.setItem('wc-invitation',params.get('invite'));
let user=null,game=null,history=[],invite=null,selection=[],jokers={},busy=false,creating=false,preview=false,recovering=false,dragging=false;
let currentView='loading',homeData=null,filter='active',polling=false,gameLoad=0,homeLoad=0,notificationGame=null,authReady=false,navigation=0;
let liveChannel=null,liveUser=null,refreshQueued=false,highlightLast=false,focusTile=null,authMode='signin',authBusy=false;
let lastRequestId=null,lastProblem=null,usernameSetupBusy=false;
let gameFresh=false,entering=false,signingOut=false;
let entryEpoch=0,entryTimer=null,startupTimer=null;
const snapshots=createSnapshotCache(localStorage,{namespace:cfg.supabaseUrl+(cfg.cacheScope||'')});
const native=Capacitor.isNativePlatform();
const publicApp='https://xnorbertx.github.io/word-conquest/online/';
const authRedirect=()=>native?publicApp:location.origin+location.pathname;
const status=(message,error=false)=>notify(message,error);
const push=createPushControls({api,getUser:()=>user,onStatus:message=>{status(message);renderPush();},onChange:()=>renderPush(),onUpdate:()=>void poll(),onOpen:id=>{notificationGame=id;if(user&&authReady&&!recovering)void run(openNotification);}});
const friends=createFriends({api,getUser:()=>user,getData:()=>homeData,setData:partial=>{if(homeData)Object.assign(homeData,partial);},run,status,invite:person=>showNewGame(person),openGame});
const screens=['loading','setup','auth','username-setup','recovery','home','friends','analytics','account','game'];
const homeRequests=createHomeRequests(()=>api({action:'home'}));
const gameRequests=createHomeRequests(key=>api({action:'game',gameId:key.split('/')[1]}));
const scoreLedger=createScoreLedger(localStorage);
const scoreMotion=createBoardScoreMotion({onComplete:()=>{if(game&&currentView==='game')renderGame();}});
const moveHistory=createMoveHistory({api,getUser:()=>user,getGame:()=>game,getMoves:()=>history,isPreview:()=>preview,
  stopMotion:()=>scoreMotion.cancel(),canReplay:()=>!preview&&gameFresh&&!!scoreMotionPlan(game,history[0],config),replay:()=>animateScore(null,{replay:true})});
const jokerKeyboard=createJokerKeyboard();
const boardViewport=createBoardViewport({viewport:$('board-scroll'),board:$('board'),button:$('zoom'),icon,
  stamp:()=>currentView+'/'+game?.id+'/'+game?.revision,enabled:()=>currentView==='game'&&!scoreMotion.active,
  getFocus:()=>{const tile=game?.state.tiles.find(t=>t.id===selection.at(-1));return tile?{x:(tile.q*64+295)/590,y:(tile.r*64+295)/590}:null;},
  onTap:id=>{if(!canPlay()&&!preview)return;const edit=selection.includes(id)&&game.state.tiles.find(t=>t.id===id)?.letter==='?';if(edit)openJoker(id);else{choose(id);openPendingJoker();}}
});
function screen(name,{route=true,replace=false}={}){
  scoreMotion.cancel(false);
  closeSheet();currentView=name;for(const id of screens)$(id).hidden=id!==name;
  const inGame=name==='game';document.body.classList.toggle('auth-view',name==='auth');document.body.classList.toggle('game-view',inGame);if(!inGame)boardViewport.setZoom(false);
  $('back').hidden=!inGame;$('game-heading').hidden=!inGame;$('game-menu').hidden=!inGame;$('help-button').hidden=inGame;
  $('main-nav').hidden=!user||!['home','friends','analytics','account'].includes(name);
  for(const [id,view]of [['home-button','home'],['friends-button','friends'],['account-button','account']]){if(view===name||view==='account'&&name==='analytics')$(id).setAttribute('aria-current','page');else $(id).removeAttribute('aria-current');}
  if(route&&user){const url=name==='game'?`?game=${game.id}`:name==='home'?location.pathname:`?view=${name}`;window.history[replace?'replaceState':'pushState']({view:name},'',url);}
  document.title=inGame?`${opponentName(game,user?.id)} - Word Conquest`:'Word Conquest';
  window.scrollTo({top:0,behavior:'instant'});
}
function offlineNotice(show=true,message='Offline. Reconnect to play.'){$('connection').hidden=!show;$('connection').textContent=message;}
const pendingKey=()=>`wc-pending:${user?.id}:${game?.id}`;
function pending(){if(preview)return null;try{return JSON.parse(localStorage.getItem(pendingKey())||'null');}catch{return null;}}
function apiError(message,code,statusCode,requestId){const e=new Error(message);Object.assign(e,{code,status:statusCode,requestId});return e;}
async function readSession(){
  // Auth may be waiting on a token refresh or a lock held by another tab.
  // Do not turn a stalled refresh into a sign-out or discard the saved list.
  let timer;
  try{return await Promise.race([db.auth.getSession(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Could not restore your sign-in. Please try again.')),10000);})]);}
  finally{clearTimeout(timer);}
}
async function api(body){
  if(!db)throw new Error('Online play is not connected yet.');
  const {data:{session},error}=await readSession();if(error)throw error;if(!session){snapshots.clear();moveHistory.reset();analyticsData=null;analyticsActor=null;gameFresh=false;authReady=false;homeData=null;game=null;++navigation;++gameLoad;++homeLoad;screen('auth',{route:false});throw apiError('Sign in to continue.','unauthorized',401);}
  const response=await fetch(`${cfg.supabaseUrl}/functions/v1/game-api`,{method:'POST',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json',apikey:cfg.supabaseAnonKey,Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({...body,supportedRules:SUPPORTED_RULES,supportsFriends:true,supportsUsernameOnboarding:true,supportsGameSummaries:true,supportsFastReads:true})});
  const result=await response.json();if(!response.ok){if(user?.id===session.user.id){if(result.code==='username_required')showUsernameSetup();else if(['unauthorized','account_deleting'].includes(result.code)){snapshots.clear();moveHistory.reset();analyticsData=null;analyticsActor=null;gameFresh=false;game=null;homeData=null;authReady=false;++navigation;++gameLoad;++homeLoad;screen('auth',{route:false});}}throw apiError(result.error||'Request failed.',result.code,response.status,result.requestId);}return result;
}
async function run(fn){try{return await fn();}catch(e){lastProblem=friendlyError(e);lastRequestId=e.requestId||null;status(lastProblem,true);if(currentView==='loading'){$('loading-message').textContent='Could not load games.';$('retry-load').hidden=false;$('loading').querySelector('.spinner').hidden=true;}}}
const act=(label,fn,className='secondary',symbol)=>button(label,()=>run(fn),className,symbol);
const row=(label,symbol,fn,options)=>setting(label,symbol,()=>run(fn),options);
function avatar(name,className=''){return node('span',(name||'?').trim().slice(0,1).toUpperCase(),'avatar '+className);}
function renderPush(){
  const info=push.snapshot(),labels={off:'Off',connecting:'Connecting...',ready:'On',blocked:'Blocked',error:'Needs attention'};
  $('push-settings').hidden=!push.available;$('push-state').textContent=labels[info.state];
  $('push-prompt').hidden=!push.shouldPrompt();
  $('push-prompt-copy').textContent=info.state==='error'?'Could not connect. Try again.':info.state==='blocked'?'Allow notifications in Android settings.':'';
  $('push-prompt-copy').hidden=!['error','blocked'].includes(info.state);
  $('push-prompt-enable').textContent=info.state==='blocked'?'Settings':info.state==='error'?'Retry':'Enable';
  $('push-prompt-enable').setAttribute('aria-label',info.state==='blocked'?'Open Android notification settings':info.state==='error'?'Retry connecting notifications':'Enable notifications');
  if($('sheet').open&&$('sheet-title').textContent==='Notifications')showPush();
}
async function connectLiveUpdates(session){
  if(session?.user?.id!==user?.id)return;if(session?.access_token)await db.realtime.setAuth(session.access_token);if(session?.user?.id!==user?.id)return;if(liveUser===user?.id)return;
  if(liveChannel){void db.removeChannel(liveChannel);liveChannel=null;}liveUser=user?.id||null;if(!liveUser)return;
  const refresh=()=>{refreshQueued=true;void poll();};
  liveChannel=db.channel(`games:${liveUser}`).on('postgres_changes',{event:'UPDATE',schema:'public',table:'games'},refresh).on('postgres_changes',{event:'*',schema:'public',table:'friendships'},refresh).on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications'},refresh).subscribe(state=>{if(state==='SUBSCRIBED'){refreshQueued=true;void poll();}});
}
async function openNotification(){if(notificationGame&&user&&authReady&&!recovering){const id=notificationGame;notificationGame=null;await openGame(id);}}
function renderHome(){
  if(!homeData)return;const {games}=homeData;
  const active=games.filter(g=>!isFinished(g)).length;
  $('active-count').textContent=active||'';
  $('active-games').setAttribute('aria-pressed',filter==='active');$('finished-games').setAttribute('aria-pressed',filter==='finished');
  const invitations=$('game-invitations');invitations.replaceChildren();
  if(filter==='active')for(const i of homeData.social?.invitations||[]){const card=act('',()=>openGame(i.id),'friend-game-invite');card.replaceChildren(avatar(i.host,'sage'),node('span'),icon('arrow'));card.children[1].append(node('strong',i.host),node('small',`Invitation · ${languageLabel(i.rules_version)}`));invitations.append(card);}
  const list=$('game-list');list.replaceChildren();
  for(const g of visibleGames(games,user.id,filter)){
    const name=opponentName(g,user.id),state=gameStatus(g,user.id),language=languageLabel(g.rules_version),updated=timeAgo(g.updated_at);
    const card=act('',()=>openGame(g.id),'game-card'+(state==='Your turn'?' has-turn':''));card.replaceChildren();card.title=name;
    const top=node('div',undefined,'game-card-top'),identity=node('div',name,'game-card-name');top.append(identity);
    let scoreLabel='';
    if(!['invited','cancelled','declined'].includes(g.status)){
      const scores=g.scores||(g.state.tiles?Engine.scores(g.state,configFor(g.rules_version)||defaultConfig):['—','—']),seat=seatOf(g,user.id)-1,score=node('span',undefined,'card-score');
      scoreLabel=`You ${scores[seat]}, ${name} ${scores[1-seat]}.`;score.title=scoreLabel;score.setAttribute('aria-hidden','true');score.append(node('strong',scores[seat]),node('span',':'),node('strong',scores[1-seat]));top.append(score);
    }else top.append(icon('chevron'));
    const meta=node('div',undefined,'game-card-meta'),labels=node('span',undefined,'game-card-labels');
    labels.append(node('span',g.status==='invited'?'Invitation':state,'card-status'+(state==='Your turn'?'':' waiting')),node('span',language,'game-language'));meta.append(labels);
    if(updated){const time=node('time',updated,'game-card-time');time.dateTime=g.updated_at;time.title=new Date(g.updated_at).toLocaleString();meta.append(time);}
    card.setAttribute('aria-label',`${name}. ${scoreLabel} ${g.status==='invited'?'Invitation':state}. ${language}. ${updated}. Open game`);card.append(top,meta);list.append(card);
  }
  if(!list.childElementCount&&!invitations.childElementCount)list.append(emptyState(filter==='finished'?'No finished games':'No active games','',filter==='finished'?'award':'grid'));
  renderPush();friends.render();
}
function showUsernameSetup(){snapshots.clear();moveHistory.reset();analyticsData=null;analyticsActor=null;gameFresh=false;authReady=false;if(currentView!=='username-setup'){$('setup-username-error').hidden=true;$('setup-username').removeAttribute('aria-invalid');screen('username-setup',{route:false});}}
function accountReady(){const first=!authReady;authReady=true;if(first)void push.restore().catch(()=>{});}
async function fetchHome(){const request=homeLoad,actor=user?.id;const result=await homeRequests.get(actor);if(user?.id!==actor||request!==homeLoad)return null;homeData=result;if(result.needsUsername||result.profile.username===null){showUsernameSetup();return null;}snapshots.saveHome(actor,result);accountReady();return result;}
function rememberGame(saved){
  if(saved?.id===game?.id&&gameFresh)snapshots.saveGame(user?.id,{game:saved,history});
  if(!homeData||!saved?.id||!saved.players?.includes(user?.id))return;
  const index=homeData.games.findIndex(g=>g.id===saved.id),old=homeData.games[index];
  if(old&&old.revision>saved.revision)return;
  if(!old||old.revision!==saved.revision){++homeLoad;homeRequests.reset();}
  const summary=gameSummary(saved);if(index<0)homeData.games.unshift(summary);else homeData.games[index]=summary;
}
async function showHome(quiet=false,{route=true,replace=false}={}){
  if(!user)return;homeData??=snapshots.home(user.id);
  const ticket=quiet?navigation:++navigation,cached=!!homeData;
  if(!quiet&&cached){++gameLoad;screen('home',{route,replace});renderHome();}
  else if(!quiet){$('loading-message').textContent='Loading games…';$('retry-load').hidden=true;$('loading').querySelector('.spinner').hidden=false;screen('loading',{route:false});}
  const before=JSON.stringify(homeData);let result;
  try{result=await fetchHome();}catch(e){
    if(cached&&ticket===navigation)offlineNotice(true,'Could not update. Showing your saved games.');
    throw e;
  }
  if(!result||ticket!==navigation)return;
  if(!quiet&&!cached){++gameLoad;screen('home',{route,replace});}
  if(!cached||before!==JSON.stringify(result))renderHome();
  offlineNotice(!navigator.onLine);return true;
}
let analyticsData=null,analyticsActor=null,analyticsRequest=0;
async function showAnalytics({route=true}={}){
  if(!user)return;const actor=user.id,ticket=++navigation,request=++analyticsRequest;
  ++gameLoad;screen('analytics',{route});
  if(analyticsActor!==actor){analyticsData=null;analyticsActor=actor;}
  const root=$('analytics-content');root.replaceChildren();
  if(analyticsData)renderAnalytics(root,analyticsData,{openGame:id=>run(()=>openGame(id))});
  $('analytics-status').textContent=analyticsData?'Updating…':'Loading…';$('analytics-refresh').disabled=true;
  try{
    const result=await api({action:'analytics'});
    if(request!==analyticsRequest||ticket!==navigation||actor!==user?.id||currentView!=='analytics')return;
    analyticsData=result.analytics;renderAnalytics(root,analyticsData,{openGame:id=>run(()=>openGame(id))});$('analytics-status').textContent='';
  }catch(e){if(ticket===navigation&&actor===user?.id)$('analytics-status').textContent=analyticsData?'Could not update. Tap refresh to retry.':'Could not load. Tap refresh to retry.';throw e;}
  finally{if(request===analyticsRequest)$('analytics-refresh').disabled=false;}
}
async function showFriends({route=true}={}){if(!user)return;const ticket=++navigation,actor=user.id;if(!homeData?.social||typeof homeData?.profile.email_notifications!=='boolean')await fetchHome();if(ticket!==navigation||actor!==user?.id||!homeData)return;if(homeData.profile.username===null)return showUsernameSetup();++gameLoad;screen('friends',{route});friends.render();await friends.refresh();}
async function showInvite(){
  const raw=localStorage.getItem('wc-invitation');if(!raw||!user||homeData?.profile.username===null)return false;const token=invitationToken(raw);if(!token){localStorage.removeItem('wc-invitation');throw Error('Invalid invitation link.');}
  const {invitation:i}=await api({action:'invitation',choice:'preview',token});
  const own=homeData?.games.find(g=>g.id===i.id&&g.players[0]===user.id);
  if(own){localStorage.removeItem('wc-invitation');await openGame(own.id);return true;}
  const available=i.status==='invited'&&Date.parse(i.expires_at)>Date.now();
  if(!available){localStorage.removeItem('wc-invitation');showSheet('Invitation unavailable',[node('p','Ask for a new invitation.'),act('Back to games',closeSheet,'primary full')]);return true;}
  const heading=node('div',undefined,'invitation-summary'),identity=node('div',undefined,'invitation-summary-copy'),rules=configFor(i.rulesVersion)||configFor('autumn-v1');identity.append(node('h3',i.host),node('span',languageLabel(i.rulesVersion),'invitation-language'));heading.append(avatar(i.host),identity);
  const details=node('details',undefined,'info-disclosure');details.append(node('summary','Rules'),infoSections(rulesSections(rules)));
  showSheet('Game invitation',[heading,details,act('Join game',()=>decideInvite('accept'),'primary full','arrow'),act('Decline',()=>decideInvite('decline'),'text-button full')]);return true;
}
async function decideInvite(choice){const token=invitationToken(localStorage.getItem('wc-invitation')||'');const result=await api({action:'invitation',choice,token});localStorage.removeItem('wc-invitation');closeSheet();if(choice==='accept'&&result.game.status==='active')await openGame(result.game.id);else {await showHome();status('Invitation declined.');}}
async function openGame(id,quiet=false,{route=true}={}){
  if(!quiet)boardViewport.setZoom(false);
  const ticket=quiet?navigation:++navigation,request=quiet?gameLoad:++gameLoad,actor=user?.id;
  const cached=!quiet&&snapshots.game(actor,id);
  if(cached){preview=false;config=configFor(cached.game.rules_version);game=cached.game;history=cached.history;invite=null;gameFresh=false;selection=[];jokers={};highlightLast=false;focusTile=null;screen('game',{route});renderGame();}
  else if(!quiet){gameFresh=false;$('loading-message').textContent='Opening game…';$('retry-load').hidden=true;$('loading').querySelector('.spinner').hidden=false;screen('loading',{route:false});}
  let result;
  try{result=await gameRequests.get(`${actor}/${id}`);}catch(e){
    if(ticket===navigation&&request===gameLoad&&actor===user?.id){
      if(['not_found','forbidden','client_update_required'].includes(e.code)){snapshots.forgetGame(actor,id);if(homeData)homeData.games=homeData.games.filter(g=>g.id!==id);gameFresh=false;game=null;await showHome(false,{route}).catch(()=>{});}
      else if(currentView==='game'){gameFresh=false;renderGame();offlineNotice(true,'Could not refresh this board. Reconnect to play.');}
    }throw e;
  }
  if(ticket!==navigation||request!==gameLoad||actor!==user?.id)return;if(quiet&&(currentView!=='game'||game?.id!==id))return;
  if(result.profile&&!homeData)homeData={profile:result.profile,games:[],notifications:[],social:{people:[],invitations:[],outgoing:[],blocked:[]}};
  accountReady();
  if(result.invitation&&!result.game){if(!quiet){localStorage.setItem('wc-invitation',result.invitation.token);await showInvite();}return true;}
  if(game?.id===id&&game.revision>result.game.revision)return;
  const previousRevision=game?.id===id?game.revision:null;
  const changed=!game||game.id!==id||game.revision!==result.game.revision,wasFresh=gameFresh;
  const gameConfig=configFor(result.game.rules_version);if(!gameConfig)throw apiError('Update Word Conquest to play this game.','client_update_required',409);
  preview=false;config=gameConfig;game=result.game;history=result.history;invite=result.invitation;gameFresh=true;rememberGame(game);moveHistory.warm();
  if(changed){selection=[];jokers={};highlightLast=false;focusTile=null;}
  if(!quiet&&!cached)screen('game',{route});
  if(changed||!quiet||!wasFresh){renderGame();animateScore(previousRevision);}
  offlineNotice(!navigator.onLine);return true;
}
function animateScore(previousRevision=null,{replay=false}={}){
  if(preview||!gameFresh||currentView!=='game'||!game||pending())return;
  const move=history[0];
  const claimed=replay||scoreLedger.claim({userId:user?.id,game,move,previousRevision});
  const plan=claimed&&scoreMotionPlan(game,move,config);
  if(!plan||document.hidden)return;
  closeSheet();$('toast').hidden=true;
  boardViewport.setZoom(false);
  // Keep the source tiles and score destinations in view before motion begins.
  $('game-table').scrollIntoView({block:'start',behavior:'instant'});
  void scoreMotion.play(plan,{seat:seatOf(game,user.id),names:game.names});
}
const pos=t=>({x:t.q*64,y:t.r*64});
function myTurn(){return game?.status==='active'&&game.players[game.state.player-1]===user?.id;}
function canPlay(){return !preview&&gameFresh&&myTurn()&&!busy&&!pending()&&!scoreMotion.active;}
function drawBoard(){
  const board=$('board');board.setAttribute('viewBox','-295 -295 590 590');
  // Keep the hit targets connected throughout a touch gesture. Replacing SVG
  // children on pointerdown can interrupt implicit capture in touch WebViews.
  const existing=new Map([...board.querySelectorAll('.tile')].map(tile=>[tile.dataset.id,tile]));
  const ids=new Set(game.state.tiles.map(t=>t.id));for(const [id,tile]of existing)if(!ids.has(id))tile.remove();
  const last=history[0]?.recap,seat=seatOf(game,user?.id)||1;if(!focusTile)focusTile=game.state.tiles.find(t=>t.owner===seat)?.id||game.state.tiles[0].id;
  for(const t of game.state.tiles){const p=pos(t),step=selection.indexOf(t.id),letter=t.letter==='?'?(step>=0?jokers[t.id]||'':''):t.letter;
    const attrs={'data-id':t.id,role:'button',tabindex:t.id===focusTile?0:-1,'aria-pressed':step>=0,'aria-disabled':!canPlay()&&!preview,'aria-label':`${t.letter==='?'?'Joker'+(letter?', '+letter:''):letter}, ${t.owner===seat?'yours':t.owner?'opponent':'neutral'}, ${Engine.letterValue(t.letter,config)} letter points${t.castle?', '+castleLabel(t,config):''}`,class:`tile owner${t.owner}${t.letter==='?'?' joker-tile':''}${t.castle?' castle-tile'+(t.q===0&&t.r===0?' centre-castle':''):''}${t.owner===seat?' your-tile':''}${step>=0?' selected':''}${highlightLast&&last?.path?.includes(t.id)?' last-move':''}`};
    const g=existing.get(t.id)||svg('g');for(const [key,value]of Object.entries(attrs))g.setAttribute(key,String(value));
    if(!existing.has(t.id)){g.append(svg('polygon',{points:tilePoints(t)}),svg('text',{x:p.x,y:p.y+(t.castle?1:-2)},letter),svg('text',{x:p.x,y:p.y+19,class:'value'},Engine.letterValue(t.letter,config)));board.append(g);}
    g.querySelector('polygon').setAttribute('points',tilePoints(t));
    const letterNode=g.querySelector('text:not(.value)');letterNode.setAttribute('y',p.y+(t.castle?1:-2));letterNode.textContent=letter;
    g.querySelector('.value').textContent=Engine.letterValue(t.letter,config);
    if(t.owner&&!g.querySelector('.marker'))g.append(svg('circle',{cx:p.x+20,cy:p.y-19,r:4.3,class:'marker'}));
    if(!t.owner)g.querySelector('.marker')?.remove();
    if(t.castle&&!g.querySelector('.castle-pulse'))g.append(svg('title',{},castleLabel(t,config)),svg('circle',{cx:p.x,cy:p.y,r:34,class:'castle-pulse','aria-hidden':'true'}));
    if(t.castle)g.querySelector('title').textContent=castleLabel(t,config);
    else {g.querySelector('title')?.remove();g.querySelector('.castle-pulse')?.remove();}
    let number=g.querySelector('.step');if(step>=0){if(!number){number=svg('text',{x:p.x-19,y:p.y-18,class:'step'});g.append(number);}number.textContent=step+1;}else number?.remove();
  }
  const centers=selection.map(id=>pos(game.state.tiles.find(t=>t.id===id)));const segments=centers.slice(1).map((b,i)=>{const a=centers[i],length=Math.hypot(b.x-a.x,b.y-a.y),dx=(b.x-a.x)/length*15,dy=(b.y-a.y)/length*15;return `M${a.x+dx},${a.y+dy} L${b.x-dx},${b.y-dy}`;}).join(' ');let line=board.querySelector('.path');if(!line){line=svg('path',{class:'path'});board.append(line);}line.setAttribute('d',segments);
}
function openJoker(id){
  const snapshot={gameId:game?.id,revision:game?.revision};
  const valid=tileId=>currentView==='game'&&canAssignJoker({...snapshot,tileId},{gameId:game?.id,revision:game?.revision,editable:preview||canPlay(),path:selection,tiles:game?.state.tiles||[]});
  if(!valid(id))return;
  jokerKeyboard.open({tileId:id,tiles:game.state.tiles,path:[...selection],assignments:{...jokers},alphabet:config.alphabet||LANGUAGES.en.alphabet,valid,
    onCommit:(tileId,letter)=>{if(!valid(tileId))return false;jokers[tileId]=letter;drawBoard();renderSelection();return true;}
  });
}
function openPendingJoker(){
  const id=selection.find(id=>game.state.tiles.find(t=>t.id===id).letter==='?'&&!jokers[id]);
  if(id)openJoker(id);
}
function renderWord(){
  const heading=$('word');heading.replaceChildren();
  if(!selection.length)return;
  for(const [i,id] of selection.entries()){
    const tile=game.state.tiles.find(t=>t.id===id);
    if(tile.letter!=='?'){heading.append(node('span',tile.letter));continue;}
    const slot=button(jokers[id]||'',()=>openJoker(id),'word-joker');
    slot.setAttribute('aria-label','Joker at position '+(i+1)+(jokers[id]?', '+jokers[id]:'')+'. Choose a letter');
    slot.disabled=!preview&&!canPlay();heading.append(slot);
  }
}
function renderSelection(){
  const error=Engine.validatePath(game.state,selection,{...config,dictionaryEnabled:false},true,null,jokers);
  renderWord();$('submit-word').disabled=!canPlay()||!!error;$('clear-word').disabled=!selection.length||busy||!!pending();
  $('word').scrollLeft=$('word').scrollWidth;
  $('submit-label').textContent=busy?'Saving…':'Play';
  $('pending').hidden=!pending();$('pending-message').textContent=busy?'Saving move…':'Move not confirmed. Reconnect and retry.';$('retry').disabled=busy;
}
function renderGame(){
  scoreMotion.cancel(false);jokerKeyboard.validate();
  const totals=Engine.scoreBreakdown(game.state,config),seat=seatOf(game,user?.id)||1;
  const active=game.status==='active',ownTurn=preview||myTurn(),unconfirmed=!!pending();
  const other=opponentName(game,user?.id);
  $('game-table').dataset.side=seat===1?'sage':'walnut';
  $('game-table').dataset.seat=seat;
  [1,2].forEach(p=>{
    const mine=p===seat,name=game.names?.[p-1]||(mine?'You':'Opponent'),colour=p===1?'Sage green':'Walnut brown',card=$('player-score-'+p);
    $('name-'+p).textContent=mine?'You':name;$('name-'+p).title=mine?'You':name;
    $('score-'+p).textContent=totals[p-1].total;card.style.order=mine?1:2;
    card.classList.toggle('is-you',mine);card.classList.toggle('is-turn',active&&!unconfirmed&&game.state.player===p);
    card.setAttribute('aria-label',`${mine?'You, ':''}${name}. ${colour}. ${active&&!unconfirmed&&game.state.player===p?'Current turn. ':''}Score: ${totals[p-1].total}. View breakdown`);
  });
  const scoreboard=document.querySelector('.scoreboard'),ownCard=$('player-score-'+seat);if(scoreboard.firstElementChild!==ownCard)scoreboard.prepend(ownCard);
  document.querySelector('.turn').style.order=3;
  $('game-heading-name').textContent=preview?'Practice game':other;$('game-heading-subtitle').textContent=languageLabel(game.rules_version)+' · '+(game.status==='invited'?'Invitation':isFinished(game)?'Finished game':config.castleIncome&&config.scoringMode!=='defended-final'?`Round ${Math.min(...game.state.turns)+1}`:`Turn ${game.state.turns.reduce((a,b)=>a+b,0)+1}`);
  const turnText=!preview&&!gameFresh?'Updating…':unconfirmed?(busy?'Saving turn…':'Turn not confirmed'):preview?'Your turn':active?(ownTurn?'Your turn':`${other}'s turn`):gameStatus(game,user?.id);
  const turnIcon=unconfirmed?'refresh':!active?'flag':ownTurn?'arrow':'hourglass';
  if($('turn').dataset.label!==turnText){const copy=node('span',undefined,'turn-copy');if(active&&!ownTurn&&!unconfirmed&&gameFresh){copy.append(node('span',other,'turn-player'),node('span',"'s turn",'turn-suffix'));}else copy.textContent=turnText;$('turn').replaceChildren(icon(turnIcon),copy);$('turn').dataset.label=turnText;}
  $('turn').classList.toggle('is-waiting-turn',active&&!ownTurn&&!unconfirmed&&gameFresh&&!preview);
  $('turn').title=turnText;$('turn').classList.toggle('waiting',!ownTurn||unconfirmed);$('turn').dataset.side=active&&!unconfirmed?(game.state.player===1?'sage':'walnut'):'none';
  const left=Engine.lettersRemaining(game.state,config);$('supply').textContent=isFinished(game)?'Final score':left===0?'Final reply':`${left} letters left`;$('supply-fill').style.width=`${Math.max(0,Math.min(100,left/config.letterBudget*100))}%`;
  $('share').hidden=!invite;$('game-table').hidden=!!invite;
  if(invite){$('share-link').value=`${authRedirect()}?invite=${invite.token}`;$('invite-expiry').textContent=`Expires ${new Date(invite.expires_at).toLocaleDateString(undefined,{month:'short',day:'numeric'})}`;}
  const addressed=!!invite?.recipient;$('share').querySelector('h1').textContent=addressed?'Invitation sent':'Invite a friend';$('share').querySelector('.muted').textContent=addressed?`Waiting for ${invite.recipient_name}`:'';$('share').querySelector('.muted').hidden=!addressed;$('share-invite').hidden=addressed;$('share').querySelector('.copy-field').hidden=addressed;
  $('composer').hidden=(!myTurn()&&!preview)||isFinished(game)||!!pending()&&!busy;$('game-result').hidden=!isFinished(game);

  if(isFinished(game)){$('result-title').textContent=game.status==='completed'?gameStatus(game,user?.id):game.status==='abandoned'?'Game closed':game.status==='declined'?'Invitation declined':'Invitation cancelled';$('result-description').textContent=game.status==='completed'?`${totals[seat-1].total} – ${totals[seat===1?1:0].total}`:'No win or loss recorded.';}
  const last=history[0]?.recap;$('recap').hidden=!last;
  if(last){const copy=node('span'),symbol=node('span',undefined,'recap-symbol');symbol.append(icon('history'));copy.append(node('small','LAST MOVE'),node('strong',last.word?`${game.names[last.player-1]} played ${last.word}`:activityText(last.action,game.names[last.player-1])));$('recap').replaceChildren(symbol,copy,node('span',last.score?`+${last.score.wordPoints}`:''));}
  drawBoard();renderSelection();
}
function choose(id){
  if((!canPlay()&&!preview)||!id||id===selection.at(-1))return;
  if(selection.length>1&&id===selection.at(-2))delete jokers[selection.pop()];
  else {const error=Engine.validatePath(game.state,[...selection,id],config,false);if(error){if(!dragging)status(error,true);return;}selection.push(id);}
  highlightLast=false;focusTile=id;drawBoard();renderSelection();
}
function clearWord(){if(busy||pending())return;selection=[];jokers={};highlightLast=false;jokerKeyboard.close();renderGame();}
async function sendPending(){
  const command=pending();if(!command||busy)return;const sentGame=game.id,sentUser=user.id,storageKey=pendingKey();busy=true;++gameLoad;gameRequests.reset();renderGame();
  try{
    const result=await api({action:'turn',gameId:sentGame,command});localStorage.removeItem(storageKey);
    if(user?.id===sentUser&&game?.id===sentGame&&result.game.revision>=game.revision){
      const previousRevision=game.revision;game=result.game;gameFresh=true;selection=[];jokers={};
      if(result.recap&&result.acceptedRevision===game.revision)history=[{revision:result.acceptedRevision,recap:result.recap},...history.filter(m=>m.revision!==result.acceptedRevision)];
      rememberGame(game);moveHistory.warm();
      if(command.action==='resign'){await showHome();status('You left the game.');}
      else if(currentView==='game'){
        // The accepted receipt is enough to render, even if a history refresh fails.
        busy=false;renderGame();animateScore(previousRevision);refreshQueued=true;
        if(!scoreMotion.active)status(result.replayed?'Your earlier move was already saved.':'Move saved.');
      }
    }
  }
  catch(e){if(e.status>=400&&e.status<500&&![401,429].includes(e.status)){localStorage.removeItem(storageKey);if(user?.id===sentUser&&game?.id===sentGame){if(e.code!=='illegal_move'){selection=[];jokers={};}await openGame(sentGame,true).catch(()=>{});}}if(user?.id===sentUser){lastProblem=friendlyError(e);lastRequestId=e.requestId||null;if(!pending())status(lastProblem,true);}}
  finally{busy=false;if(game&&currentView==='game'&&!scoreMotion.active)renderGame();if(refreshQueued)void poll();}
}
async function action(kind){
  if(preview||!gameFresh||busy||pending()||game?.status!=='active')return;if(['word','refresh'].includes(kind)&&!canPlay())return;
  const command={operationId:crypto.randomUUID(),revision:game.revision,action:kind,...(kind==='word'?{path:[...selection],jokers:{...jokers}}:{})};
  localStorage.setItem(pendingKey(),JSON.stringify(command));closeSheet();await sendPending();
}
function scoreLines(rows){const container=node('div',undefined,'score-lines');for(const [label,value,total]of rows){const line=node('div',undefined,'score-line'+(total?' total':''));line.append(node('span',label),node('strong',value));container.append(line);}return container;}
function showScore(player){
  const s=Engine.scoreBreakdown(game.state,config)[player-1],defended=config.scoringMode==='defended-final';
  const rows=[['Words + bonuses',s.words],...(defended?[]:[['Current territory',s.territory]]),...(config.castleIncome?[['Castles',s.income]]:[]),...(defended&&game.state.finalTerritory!=null?[['Final territory',s.territory]]:[]),['Total',s.total,true]];
  if(defended&&!game.state.over)rows.push(['Territory at game end',`+${s.pendingTerritory}`]);
  showSheet(player===seatOf(game,user?.id)?'Your score':`${game.names[player-1]}'s score`,[scoreLines(rows),node('p',defended?'Castles score after your opponent’s turn. Territory scores at game end.':config.castleIncome?'Castles score after both players move. Territory points change with ownership.':'Territory points change with ownership.')]);
}
function showRules(){
  const rules=currentView==='game'&&game?(configFor(game.rules_version)||defaultConfig):defaultConfig;
  showSheet('How to play',[infoSections(rulesSections(rules)),act('Dictionary',showDictionary,'text-button','book')]);
}
function showDictionary(){
  const link=node('a','Dictionary licences','text-link');link.href='dictionary-license.txt';link.target='_blank';link.rel='noopener';
  const swedish=currentView==='game'&&config.language==='sv',expanded=config.dictionaryNormalization==='latin-accents-v1';
  const dutch=currentView==='game'&&config.language==='nl';
  const text=dutch?'Dutch uses OpenTaal. Accents use the plain letter; apostrophes and hyphens are omitted. IJ is played as I + J.':swedish?(expanded?'Swedish uses SALDO and the original Swedish list. Accents such as é use the plain letter; Å, Ä and Ö stay distinct.':'This game uses the original Martin Lindhe Swedish list. Å, Ä and Ö are distinct letters.'):'English uses the Letterpress-derived list. Swedish uses SALDO and the original Swedish list; Dutch uses OpenTaal.';
  showSheet('Dictionary',[node('p',text),node('p','Listed inflections and compounds are accepted. A game keeps the dictionary it started with. Lists may include uncommon or offensive words.'),link]);
}
function showHistory(){moveHistory.show();}
function showNewGame(person=null){
  if(!person?.display_name)person=null;
  let chosen='en';try{chosen=languageFor(localStorage.getItem(`wc-language:${user.id}`))?.code||'en';}catch{}
  const picker=node('fieldset',undefined,'language-picker'),legend=node('legend','Language');picker.append(legend);
  for(const language of Object.values(LANGUAGES)){const label=node('label'),input=node('input');input.type='radio';input.name='game-language';input.value=language.code;input.checked=language.code===chosen;input.onchange=()=>{chosen=language.code;try{localStorage.setItem(`wc-language:${user.id}`,chosen);}catch{}};label.append(input,node('span',language.label));picker.append(label);}
  const content=[picker];
  if(person)content.push(act(`Invite ${person.display_name}`,()=>createGame(person,chosen),'primary full','plus'));
  else content.push(act('Choose a friend',()=>showFriends(),'primary full','friends'),act('Share a link',()=>createGame(null,chosen),'secondary full','share'),act('Join with a link',showJoin,'text-button full','mail'));
  showSheet('New game',content);
}
function showJoin(){const form=node('form',undefined,'stack-form'),label=node('label','Invitation link'),input=node('input');input.id='invite-code';input.autocomplete='off';input.required=true;input.placeholder='Paste link';label.htmlFor=input.id;const submit=button('Open invitation',null,'primary full','arrow');submit.type='submit';form.append(label,input,submit);form.onsubmit=e=>{e.preventDefault();void run(async()=>{const token=invitationToken(input.value);if(!token)throw Error('Enter a valid invitation link.');submit.disabled=true;try{localStorage.setItem('wc-invitation',token);await showInvite();}finally{submit.disabled=false;}});};showSheet('Join game',form);}
async function createGame(person,code='en'){
  if(creating||!user)return;creating=true;$('new-game').disabled=true;closeSheet();
  try{const language=languageFor(code);if(!language)throw Error('Choose a supported language.');const legacyKey=`wc-create:${user.id}${person?':'+person.id:''}`,key=legacyKey+':'+code,id=localStorage.getItem(key)||(code==='en'?localStorage.getItem(legacyKey):null)||crypto.randomUUID();localStorage.setItem(key,id);const {game:g}=await api({action:'create',gameId:id,rulesVersion:language.rulesVersion,language:code,...(person?{friendId:person.id}:{})});localStorage.removeItem(key);if(code==='en')localStorage.removeItem(legacyKey);if(person){await fetchHome();friends.render();status(`${languageLabel(g.rules_version)} invitation sent to ${person.display_name}.`);}else await openGame(g.id);}finally{creating=false;$('new-game').disabled=false;}
}
async function copyInvite(){try{await navigator.clipboard.writeText($('share-link').value);status('Link copied.');}catch{$('share-link').focus();$('share-link').select();status('Copy the link manually.',true);}}
async function shareInvite(){if(navigator.share){try{await navigator.share({title:'Word Conquest',text:`Word Conquest · ${languageLabel(game.rules_version)}`,url:$('share-link').value});}catch(e){if(e.name!=='AbortError')await copyInvite();}}else await copyInvite();}
async function quitGame(){
  if(preview||!gameFresh||busy||pending())return;
  if(game.status==='invited'){
    if(!invite||!await ask({title:'Cancel invitation?',message:'This invitation will stop working.',label:'Cancel invitation',cancel:'Keep invitation',symbol:'mail'}))return;
    busy=true;try{const result=await api({action:'invitation',choice:'cancel',token:invite.token});rememberGame(result.game);await showHome();status('Invitation cancelled.');}finally{busy=false;}
  }else if(game.status==='active'&&await ask({title:'Leave game?',message:'This counts as a loss. Your opponent wins.',label:'Leave game',danger:true,symbol:'flag'}))await action('resign');
}
async function confirmAction(kind){
  const cost=Math.max(config.refreshMinimumLetterCost,game.state.tiles.filter(t=>t.owner===game.state.player&&t.letter!=='?').length);
  const options={refresh:{title:'Refresh letters?',message:`Replace your letters, except jokers. Uses your turn and ${cost} letters from the supply.${config.scoringMode==='defended-final'?' Your opponent’s held castles still score.':''}`,label:'Refresh letters',symbol:'refresh'},abandon:{title:'Close inactive game?',message:'No turns for 30 days. Closing records no win or loss.',label:'Close game',symbol:'hourglass'}};
  if(await ask(options[kind]))await action(kind);
}
function showGameMenu(){
  scoreMotion.cancel();
  const list=node('div',undefined,'settings-list');list.append(row('Move history','history',showHistory),row('How to play','book',showRules));
  if(game.status==='active'&&!preview){
    const refresh=row('Refresh letters','refresh',()=>confirmAction('refresh'));refresh.disabled=!canPlay();list.append(refresh);
    if(Date.now()-Date.parse(game.last_play_at)>=30*86400000)list.append(row('Close inactive game','hourglass',()=>confirmAction('abandon')));
    list.append(row('Leave game','flag',quitGame,{danger:true}));
  }
  if(game.status==='invited')list.append(row('Cancel invitation','close',quitGame));showSheet('Game options',list);
}
async function account({route=true}={}){
  if(!user)return;const ticket=++navigation,actor=user.id;if(typeof homeData?.profile.email_notifications!=='boolean')await fetchHome();if(ticket!==navigation||actor!==user?.id||!homeData)return;if(homeData.profile.username===null)return showUsernameSetup();++gameLoad;screen('account',{route});
  const profile=homeData.profile;$('profile-name').textContent=profile.display_name;$('profile-email').textContent=user.email||'';$('profile-avatar').textContent=profile.display_name.slice(0,1).toUpperCase();renderPush();
}
async function showBlockedPlayers(){
  if(!user)return;const ticket=++navigation,actor=user.id;await friends.refresh();
  if(ticket!==navigation||actor!==user?.id||currentView!=='account')return;friends.showBlocked();
}
function editProfile(){
  const form=node('form',undefined,'stack-form'),label=node('label','Username'),input=node('input'),error=node('p',undefined,'form-alert');
  input.id='edit-username';label.htmlFor=input.id;input.maxLength=40;input.required=true;input.autocomplete='username';input.autocapitalize='none';input.spellcheck=false;input.value=homeData.profile.username||homeData.profile.display_name;
  error.id='edit-username-error';error.setAttribute('role','alert');error.hidden=true;input.setAttribute('aria-describedby',error.id);
  input.oninput=()=>{input.removeAttribute('aria-invalid');error.hidden=true;};
  const save=button('Save username',null,'primary full','check');save.type='submit';form.append(label,input,error,save);
  form.onsubmit=e=>{e.preventDefault();void run(async()=>{save.disabled=true;try{const username=requireUsername(input.value);const result=await api({action:'profile',username,emailNotifications:homeData.profile.email_notifications});homeData.profile.username=result.username;homeData.profile.display_name=result.username;closeSheet();await account({route:false});status('Username updated.');}catch(e){error.textContent=friendlyError(e);error.hidden=false;if(['username_taken','invalid_username'].includes(e.code)){input.setAttribute('aria-invalid','true');input.focus();}}finally{save.disabled=false;}});};showSheet('Edit username',form);
}
async function connectPush(){try{await push.enable();}catch{showPush();}}
function showPush(){
  const info=push.snapshot(),content=[];
  const labels={ready:'On this device',off:'Off',connecting:'Connecting…',blocked:'Blocked',error:'Connection failed'};
  const state=node('div',undefined,'notification-state');state.append(icon('bell'),node('strong',labels[info.state]));content.push(state);
  if(info.problem)content.push(node('p',info.problem));
  if(info.state==='ready'){
    const list=node('div',undefined,'settings-list');
    const test=row('Test notification','bell',async()=>{test.disabled=true;try{await push.test();status('Test sent. Check this device’s notifications.');}finally{test.disabled=false;}});
    list.append(test,row('Device settings','phone',()=>push.openSettings()),row('Turn off','bell',async()=>{await push.disable();showPush();}));content.push(list);
  }else if(info.state==='connecting'){
    const waiting=act('Connecting…',()=>{},'primary full');waiting.disabled=true;content.push(waiting);
  }else {
    content.push(act(info.state==='blocked'?'Open settings':info.state==='error'?'Retry':'Enable notifications',()=>info.state==='blocked'?push.openSettings():connectPush(),'primary full','bell'));
    if(info.state==='error')content.push(act('Device settings',()=>push.openSettings(),'text-button full'));
  }
  showSheet('Notifications',content);
}
function showPrivacy(){
  const list=node('div',undefined,'settings-list');list.append(row('Data & privacy','shield',showDataInfo),row('Dictionary','book',showDictionary));
  if(user)list.append(row('Download data','download',exportData),row('Delete account','trash',showDelete,{danger:true}));
  const content=[list];
  if(cfg.supportEmail){const contact=node('a',cfg.supportEmail,'text-link support-contact');contact.href='mailto:'+cfg.supportEmail;content.push(contact);}
  if(cfg.operatorName)content.push(node('p',cfg.operatorName,'menu-note'));
  if(lastProblem){content.push(node('p',lastProblem,'menu-note'));if(lastRequestId)content.push(act('Copy support reference',async()=>{await navigator.clipboard.writeText(lastRequestId);status('Support reference copied.');},'text-button'));}
  showSheet('Privacy & account',content);
}
function showDataInfo(){showSheet('Data & privacy',infoSections([
  ['Visibility','Players can search by username. Username availability is public; emails are private. Friend requests require acceptance. Only the players can see a game’s board and moves.'],
  ['Storage','Supabase stores accounts and games. Resend sends account emails. Optional Android notifications use Google Firebase Cloud Messaging, a device token and a game reference.'],
  ['Tracking','No ads, contact uploads or analytics trackers.'],
  ['Deletion','Deleting your account removes your login, profile, friendships, blocks and private inbox. Opponents retain anonymized game history. Backups expire under the hosting provider’s retention policy.']
]));}
async function exportData(){const data=await api({action:'export'}),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),link=node('a');link.href=url;link.download='word-conquest-data.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);closeSheet();status('Export ready.');}
function showDelete(){
  const form=node('form',undefined,'stack-form'),label=node('label','Type DELETE to confirm'),input=node('input');input.id='delete-confirmation';input.autocomplete='off';input.required=true;input.pattern='DELETE';label.htmlFor=input.id;const remove=button('Permanently delete account',null,'primary danger full','trash');remove.type='submit';form.append(label,input,remove);
  form.onsubmit=e=>{e.preventDefault();void run(async()=>{remove.disabled=true;try{if(input.value!=='DELETE')return;await api({action:'delete_account',confirmation:'DELETE'});const actor=user.id;for(const key of Object.keys(localStorage))if(key.startsWith(`wc-pending:${actor}:`)||key===`wc-create:${actor}`||key.startsWith(`wc-create:${actor}:`)||key===`wc-language:${actor}`)localStorage.removeItem(key);await db.auth.signOut();closeSheet();status('Account deleted.');}finally{remove.disabled=false;}});};
  showSheet('Delete account?',[node('p','Permanently delete your account and private data. Active games close without a win or loss. Opponents keep anonymized game history.'),node('p','You must have signed in within the last 10 minutes.'),form]);
}
function setAuthMode(mode){
  authMode=mode;const signup=mode==='signup',forgot=mode==='recover';
  $('auth-heading').textContent=signup?'Create account':forgot?'Reset password':'Sign in';$('auth-heading').hidden=mode==='signin';
  $('password-field').hidden=forgot;$('password').required=!forgot;$('password').minLength=signup?12:1;$('password').autocomplete=signup?'new-password':'current-password';$('password-hint').hidden=!signup;$('auth-recovery').hidden=signup||forgot;
  if(signup)$('password').setAttribute('aria-describedby','password-hint');else $('password').removeAttribute('aria-describedby');
  $('password').type='password';$('show-password').setAttribute('aria-label','Show password');$('show-password').setAttribute('aria-pressed','false');
  $('auth-submit').replaceChildren(node('span',signup?'Create account':forgot?'Send reset link':'Sign in'),icon('arrow'));
  $('signup').textContent=signup||forgot?'Sign in':'Create account';
}
$('auth-form').onsubmit=e=>{e.preventDefault();void run(async()=>{
  if(authBusy)return;authBusy=true;$('auth-submit').disabled=true;
  try{const email=$('email').value.trim(),password=$('password').value;
    if(authMode==='recover'){const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:authRedirect()});if(error)throw error;showSheet('Check your email',[node('p','If an account uses that email, you’ll receive a reset link. Check junk mail too.'),act('Back to sign in',()=>{closeSheet();setAuthMode('signin');},'primary full')]);}
    else if(authMode==='signup'){const {data}=await signUpAccount(db,{email,password,redirectTo:authRedirect()});if(!data.session){$('password').value='';setAuthMode('signin');showSheet('Confirm your email',[node('p','Use the link in your email, then sign in. Check junk mail too.'),act('Close',closeSheet,'primary full','check')]);}}
    else {const {error}=await db.auth.signInWithPassword({email,password});if(error)throw error;}
  }finally{authBusy=false;$('auth-submit').disabled=false;}
});};
$('signup').onclick=()=>setAuthMode(authMode==='signin'?'signup':'signin');$('recover').onclick=()=>setAuthMode('recover');
$('show-password').onclick=()=>{const showing=$('password').type==='password';$('password').type=showing?'text':'password';$('show-password').setAttribute('aria-label',showing?'Hide password':'Show password');$('show-password').setAttribute('aria-pressed',String(showing));};
$('recovery-form').onsubmit=e=>{e.preventDefault();void run(async()=>{const submit=e.currentTarget?.querySelector('button')||$('recovery-form').querySelector('button');submit.disabled=true;try{const {error}=await db.auth.updateUser({password:$('new-password').value});if(error)throw error;recovering=false;$('new-password').value='';status('Password updated.');await enterApp();}finally{submit.disabled=false;}});};
$('retry-load').onclick=()=>run(retryStartup);
$('home-button').onclick=$('back').onclick=$('result-home').onclick=()=>run(()=>user?showHome():screen(configured?'auth':'setup',{route:false}));
$('brand').onclick=e=>{e.preventDefault();void run(()=>user?showHome():screen(configured?'auth':'setup',{route:false}));};
$('analytics-button').onclick=()=>run(()=>showAnalytics());$('analytics-back').onclick=()=>run(()=>account());$('analytics-refresh').onclick=()=>run(()=>showAnalytics({route:false}));$('account-button').onclick=()=>run(()=>account());
$('friends-button').onclick=()=>run(()=>showFriends());
$('active-games').onclick=()=>{filter='active';renderHome();};$('finished-games').onclick=()=>{filter='finished';renderHome();};
$('push-prompt-enable').onclick=()=>run(async()=>{if(push.snapshot().state==='blocked')await push.openSettings();else await connectPush();});$('push-prompt-dismiss').onclick=()=>push.snooze();
$('new-game').onclick=showNewGame;$('blocked-players').onclick=()=>run(showBlockedPlayers);$('edit-profile').onclick=editProfile;$('push-settings').onclick=showPush;
$('help-button').onclick=showRules;for(const b of document.querySelectorAll('[data-sheet]'))b.onclick=()=>b.dataset.sheet==='rules'?showRules():showPrivacy();
$('game-menu').onclick=showGameMenu;$('share-invite').onclick=()=>run(shareInvite);$('copy-invite').onclick=()=>run(copyInvite);$('cancel-invite').onclick=()=>run(quitGame);
$('player-score-1').onclick=()=>{scoreMotion.cancel();showScore(1);};$('player-score-2').onclick=()=>{scoreMotion.cancel();showScore(2);};$('recap').onclick=showHistory;

async function confirmSignOut(){
  if(signingOut)return;signingOut=true;
  try{
    if(!await ask({title:'Sign out?',label:'Sign out',cancel:'Cancel',symbol:'logout'}))return;
    await push.disable(false);const {error}=await db.auth.signOut();if(error)throw error;
    notificationGame=null;game=null;homeData=null;selection=[];$('password').value='';$('setup-username').value='';setAuthMode('signin');status('Signed out.');
  }finally{signingOut=false;}
}
$('setup-signout').onclick=$('signout').onclick=()=>run(confirmSignOut);
$('submit-word').onclick=()=>run(()=>action('word'));$('retry').onclick=()=>run(sendPending);$('clear-word').onclick=clearWord;
const tileAt=(x,y)=>document.elementFromPoint(x,y)?.closest('[data-id]')?.dataset.id;
let boardGesture=null;
$('board').onpointerdown=e=>{
  if(e.button!==0||e.isPrimary===false||(!canPlay()&&!preview))return;const id=tileAt(e.clientX,e.clientY);if(!id)return;
  e.preventDefault();dragging=true;boardGesture={id,pointerId:e.pointerId,moved:false,edit:selection.includes(id)&&game.state.tiles.find(t=>t.id===id).letter==='?'};
  $('board').setPointerCapture(e.pointerId);if(!boardGesture.edit)choose(id);
};
$('board').onpointermove=e=>{if(!dragging||boardGesture?.pointerId!==e.pointerId)return;const id=tileAt(e.clientX,e.clientY);if(!id||id===boardGesture.id&&!boardGesture.moved)return;
  if(!boardGesture.moved&&boardGesture.edit)choose(boardGesture.id);boardGesture.moved=true;choose(id);
};
$('board').addEventListener('pointerup',e=>{if(boardGesture?.pointerId!==e.pointerId)return;const gesture=boardGesture;boardGesture=null;dragging=false;
  if($('board').hasPointerCapture(e.pointerId))$('board').releasePointerCapture(e.pointerId);
  if(gesture.edit&&!gesture.moved)openJoker(gesture.id);else openPendingJoker();
});
$('board').addEventListener('pointercancel',e=>{if(boardGesture?.pointerId===e.pointerId){dragging=false;boardGesture=null;}});
// Touch capture can transfer from a tile to the board. A bubbled loss from that
// tile is not cancellation of the board's own capture or of another pointer.
$('board').addEventListener('lostpointercapture',e=>{if(e.target===$('board')&&boardGesture?.pointerId===e.pointerId){dragging=false;boardGesture=null;}});
$('board').onkeydown=e=>{
  const id=e.target.closest('[data-id]')?.dataset.id;if(!id)return;
  if(e.key==='Enter'||e.key===' '){e.preventDefault();const edit=selection.includes(id)&&game.state.tiles.find(t=>t.id===id).letter==='?';if(!edit)choose(id);$('board').querySelector(`[data-id="${id}"]`)?.focus({preventScroll:true});if(edit)openJoker(id);else openPendingJoker();}
  else if(e.key==='Escape'){e.preventDefault();clearWord();$('board').querySelector(`[data-id="${id}"]`)?.focus({preventScroll:true});}
  else if(e.key==='Backspace'){e.preventDefault();if(canPlay()||preview){delete jokers[selection.pop()];drawBoard();renderSelection();$('board').querySelector(`[data-id="${id}"]`)?.focus({preventScroll:true});}}
  else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const tile=game.state.tiles.find(t=>t.id===id),[dq,dr]={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];const next=game.state.tiles.find(t=>t.q===tile.q+dq&&t.r===tile.r+dr);if(next){focusTile=next.id;drawBoard();$('board').querySelector(`[data-id="${next.id}"]`)?.focus({preventScroll:true});}}
};
$('preview-button').onclick=()=>{preview=true;config=defaultConfig;game={id:'preview',rules_version:RULES_VERSION,state:{...Engine.newGame(config),player:1,startingPlayer:1},status:'active',players:[],names:['You','Alex'],revision:0};history=[];invite=null;selection=[];jokers={};screen('game',{route:false});renderGame();};
async function enterApp(){
  if(recovering||!user||entering)return;const actor=user.id,epoch=entryEpoch;entering=true;
  homeData??=snapshots.home(actor);
  try{
    const target=notificationGame||launchGame;
    if(target&&!localStorage.getItem('wc-invitation')){
      notificationGame=null;
      if(!await openGame(target,false,{route:false})||actor!==user?.id)return;
      // The game response has already checked identity and username. Games can refresh independently.
      void fetchHome().then(result=>{if(result&&currentView==='home')renderHome();}).catch(()=>{});
    }else {
      if(!await showHome(false,{route:false})||actor!==user?.id)return;
      const invited=await showInvite();if(actor!==user?.id)return;
      if(notificationGame)await openNotification();
      else if(!invited&&params.get('view')==='friends')await showFriends({route:false});else if(!invited&&params.get('view')==='account')await account({route:false});else if(!invited&&params.get('view')==='analytics')await showAnalytics({route:false});
    }
  }finally{if(epoch===entryEpoch)entering=false;}
}
async function usernameSetup(randomize=false){
  if(usernameSetupBusy||!user)return;usernameSetupBusy=true;const actor=user.id,input=$('setup-username'),error=$('setup-username-error');
  error.hidden=true;input.removeAttribute('aria-invalid');for(const id of ['setup-username','save-username','randomize-username','setup-signout'])$(id).disabled=true;
  try{
    if(randomize){const result=await api({action:'suggest_username'});if(user?.id===actor&&currentView==='username-setup')input.value=result.username;}
    else {await api({action:'complete_username',username:requireUsername(input.value)});if(user?.id===actor)await enterApp();}
  }catch(e){if(user?.id===actor&&currentView==='username-setup'){error.textContent=friendlyError(e);error.hidden=false;if(['invalid_username','username_taken'].includes(e.code))input.setAttribute('aria-invalid','true');}}
  finally{usernameSetupBusy=false;for(const id of ['setup-username','save-username','randomize-username','setup-signout'])$(id).disabled=false;if(user?.id===actor&&currentView==='username-setup'&&!randomize)input.focus();}
}
$('username-form').onsubmit=e=>{e.preventDefault();void usernameSetup();};$('randomize-username').onclick=()=>usernameSetup(true);
$('setup-username').oninput=()=>{$('setup-username-error').hidden=true;$('setup-username').removeAttribute('aria-invalid');};
async function poll(){
  if(polling||entering||busy||usernameSetupBusy||!user||document.hidden||recovering)return;polling=true;refreshQueued=false;
  try{if(currentView==='username-setup'){if(await fetchHome())await enterApp();}else if(currentView==='game'&&!preview)await openGame(game.id,true);else if(currentView==='home')await showHome(true);else if(currentView==='friends')await friends.refresh();offlineNotice(!navigator.onLine);}
  catch{offlineNotice(true,'Could not update. Reconnect to play.');}
  finally{polling=false;if(refreshQueued)void poll();}
}
function resume(){if(currentView==='loading'&&!entering){void run(retryStartup);return;}if(game&&currentView==='game'&&!preview&&!busy){gameFresh=false;renderGame();}void poll();}
if(native){void push.initialize().catch(()=>{});void App.addListener('appStateChange',({isActive})=>{if(isActive){resume();if(authReady)void push.restore().catch(()=>{});}else scoreMotion.cancel();});void App.addListener('backButton',()=>{if(closeTopDialog())return;if(currentView!=='home'&&currentView!=='username-setup'&&user)void run(()=>showHome());else void App.minimizeApp();});}
window.addEventListener('popstate',()=>run(async()=>{if(!user)return;closeSheet();const route=new URLSearchParams(location.search);if(route.get('game'))await openGame(route.get('game'),false,{route:false});else if(route.get('view')==='friends')await showFriends({route:false});else if(route.get('view')==='account')await account({route:false});else if(route.get('view')==='analytics')await showAnalytics({route:false});else await showHome(false,{route:false});}));
window.addEventListener('online',()=>{resume();if(authReady)void push.restore().catch(()=>{});});window.addEventListener('offline',()=>offlineNotice());window.addEventListener('focus',resume);document.addEventListener('visibilitychange',()=>{if(!document.hidden)resume();});setInterval(poll,20000);
function cancelAppEntry(){++entryEpoch;clearTimeout(entryTimer);entryTimer=null;entering=false;}
function queueAppEntry(){
  if(entryTimer!==null||entering||recovering||!user)return;
  const actor=user.id,epoch=entryEpoch;
  // Leave the auth callback before any Supabase calls (including getSession).
  entryTimer=setTimeout(()=>{
    entryTimer=null;if(epoch!==entryEpoch||actor!==user?.id||recovering)return;
    void run(enterApp);
  },0);
}
function handleAuthState(event,session){
  clearTimeout(startupTimer);startupTimer=null;
  const previousUser=user?.id;user=session?.user||null;
  setTimeout(()=>run(()=>connectLiveUpdates(session)),0);
  if(previousUser!==user?.id||!user){
    cancelAppEntry();recovering=false;if(previousUser||!user)snapshots.clear();
    moveHistory.reset();analyticsData=null;analyticsActor=null;gameRequests.reset();gameFresh=false;game=null;homeRequests.reset();
    authReady=false;homeData=null;$('setup-username').value='';friends.reset();++navigation;++gameLoad;++homeLoad;
  }
  if(event==='PASSWORD_RECOVERY'){cancelAppEntry();++navigation;++gameLoad;++homeLoad;gameFresh=false;authReady=false;recovering=true;screen('recovery',{route:false});return;}
  if(!user){recovering=false;renderPush();screen('auth',{route:false});return;}
  // Refreshing an expired saved token can precede INITIAL_SESSION. Both must
  // start the app; a routine refresh must leave an already-open game alone.
  if(recovering||!['SIGNED_IN','INITIAL_SESSION','TOKEN_REFRESHED'].includes(event))return;
  if(previousUser!==user.id||['loading','auth'].includes(currentView))queueAppEntry();
}
async function retryStartup(){
  if(!db||recovering||entering)return;
  $('loading-message').textContent='Loading games…';$('retry-load').hidden=true;$('loading').querySelector('.spinner').hidden=false;
  if(user){await enterApp();return;}
  const epoch=entryEpoch,{data:{session},error}=await readSession();
  if(epoch!==entryEpoch||recovering)return;if(error)throw error;
  handleAuthState('INITIAL_SESSION',session);
}
if(!db)screen('setup',{route:false});else {
  // The SDK can stall before its first auth event on an unavailable network.
  startupTimer=setTimeout(()=>{if(currentView==='loading'&&!entering){$('loading-message').textContent='Could not connect. Please try again.';$('retry-load').hidden=false;$('loading').querySelector('.spinner').hidden=true;}},12000);
  db.auth.onAuthStateChange(handleAuthState);
}

document.addEventListener('visibilitychange',()=>document.body.classList.toggle('app-background',document.hidden));
