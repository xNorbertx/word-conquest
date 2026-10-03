import {version as appVersion} from '../package.json';
import {Capacitor} from '@capacitor/core';
import {App} from '@capacitor/app';
import {createClient} from '@supabase/supabase-js';
import {createPushControls} from './push.js';
import {Engine,config} from '../server/domain.mjs';
import {$,svg,icon,node,button,setting,notify,showSheet,closeSheet,ask,initUI,closeTopDialog,emptyState} from './ui.js';
import {seatOf,isFinished,opponentName,gameStatus,visibleGames,timeAgo,invitationToken,activityText,friendlyError} from './presentation.mjs';

initUI();$('app-version').textContent=appVersion;
const cfg=window.WC_CONFIG||{},configured=!!(cfg.supabaseUrl&&cfg.supabaseAnonKey);
const db=configured?createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;
const params=new URLSearchParams(location.search),launchGame=params.get('game');
if(params.get('invite'))localStorage.setItem('wc-invitation',params.get('invite'));
let user=null,game=null,history=[],invite=null,selection=[],jokers={},busy=false,creating=false,preview=false,recovering=false,dragging=false;
let currentView='loading',homeData=null,filter='active',polling=false,gameLoad=0,homeLoad=0,notificationGame=null,authReady=false,navigation=0;
let liveChannel=null,liveUser=null,refreshQueued=false,highlightLast=false,focusTile=null,authMode='signin',authBusy=false;
let lastRequestId=null,lastProblem=null;
const native=Capacitor.isNativePlatform();
const publicApp='https://xnorbertx.github.io/word-conquest/online/';
const authRedirect=()=>native?publicApp:location.origin+location.pathname;
const status=(message,error=false)=>notify(message,error);
const push=createPushControls({api,getUser:()=>user,onStatus:message=>{status(message);renderPush();},onUpdate:()=>void poll(),onOpen:id=>{notificationGame=id;if(user&&authReady&&!recovering)void run(openNotification);}});
const screens=['loading','setup','auth','recovery','home','activity','account','game'];
function screen(name,{route=true,replace=false}={}){
  closeSheet();currentView=name;for(const id of screens)$(id).hidden=id!==name;
  const inGame=name==='game';document.body.classList.toggle('game-view',inGame);
  $('back').hidden=!inGame;$('game-heading').hidden=!inGame;$('game-menu').hidden=!inGame;$('help-button').hidden=inGame;
  $('main-nav').hidden=!user||!['home','activity','account'].includes(name);
  for(const [id,view]of [['home-button','home'],['activity-button','activity'],['account-button','account']]){if(view===name)$(id).setAttribute('aria-current','page');else $(id).removeAttribute('aria-current');}
  if(route&&user){const url=name==='game'?`?game=${game.id}`:name==='home'?location.pathname:`?view=${name}`;window.history[replace?'replaceState':'pushState']({view:name},'',url);}
  document.title=inGame?`${opponentName(game,user?.id)} - Word Conquest`:'Word Conquest';
  window.scrollTo({top:0,behavior:'instant'});
}
function offlineNotice(show=true,message='You are offline. Reconnect to send your turn.'){$('connection').hidden=!show;$('connection').textContent=message;}
const pendingKey=()=>`wc-pending:${user?.id}:${game?.id}`;
function pending(){if(preview)return null;try{return JSON.parse(localStorage.getItem(pendingKey())||'null');}catch{return null;}}
function apiError(message,code,statusCode,requestId){const e=new Error(message);Object.assign(e,{code,status:statusCode,requestId});return e;}
async function api(body){
  if(!db)throw new Error('Online play is not connected yet.');
  const {data:{session},error}=await db.auth.getSession();if(error||!session)throw apiError('Sign in to continue.','unauthorized',401);
  const response=await fetch(`${cfg.supabaseUrl}/functions/v1/game-api`,{method:'POST',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json',apikey:cfg.supabaseAnonKey,Authorization:`Bearer ${session.access_token}`},body:JSON.stringify(body)});
  const result=await response.json();if(!response.ok)throw apiError(result.error||'Request failed.',result.code,response.status,result.requestId);return result;
}
async function run(fn){try{return await fn();}catch(e){lastProblem=friendlyError(e);lastRequestId=e.requestId||null;status(lastProblem,true);if(currentView==='loading'){$('loading-message').textContent='Your table could not load.';$('retry-load').hidden=false;$('loading').querySelector('.spinner').hidden=true;}}}
const act=(label,fn,className='secondary',symbol)=>button(label,()=>run(fn),className,symbol);
const row=(label,symbol,fn,options)=>setting(label,symbol,()=>run(fn),options);
function avatar(name,className=''){return node('span',(name||'?').trim().slice(0,1).toUpperCase(),'avatar '+className);}
function renderPush(){const preferred=push.preferred();$('push-settings').hidden=!push.available;$('push-state').textContent=preferred?'On for this phone':'Off';}
async function connectLiveUpdates(session){
  if(session?.access_token)await db.realtime.setAuth(session.access_token);if(session?.user?.id!==user?.id)return;if(liveUser===user?.id)return;
  if(liveChannel){void db.removeChannel(liveChannel);liveChannel=null;}liveUser=user?.id||null;if(!liveUser)return;
  liveChannel=db.channel(`games:${liveUser}`).on('postgres_changes',{event:'UPDATE',schema:'public',table:'games'},()=>{refreshQueued=true;void poll();}).subscribe(state=>{if(state==='SUBSCRIBED'){refreshQueued=true;void poll();}});
}
async function openNotification(){if(notificationGame&&user&&!recovering){const id=notificationGame;notificationGame=null;await openGame(id);}}
function renderHome(){
  if(!homeData)return;const {games,profile}=homeData;
  $('greeting').textContent=profile.display_name&&profile.display_name!=='Player'?`WELCOME BACK, ${profile.display_name.toUpperCase()}`:'YOUR LITTLE WORD WORLD';
  const active=games.filter(g=>!isFinished(g)).length,turns=games.filter(g=>gameStatus(g,user.id)==='Your turn').length;
  $('active-count').textContent=active||'';$('turn-count').textContent=turns?`${turns} ${turns===1?'turn':'turns'} waiting`:'';
  $('active-games').setAttribute('aria-pressed',filter==='active');$('finished-games').setAttribute('aria-pressed',filter==='finished');
  const list=$('game-list');list.replaceChildren();
  for(const g of visibleGames(games,user.id,filter)){
    const name=opponentName(g,user.id),card=act('',()=>openGame(g.id),'game-card');card.replaceChildren();card.setAttribute('aria-label',`${name}. ${gameStatus(g,user.id)}. Open game`);
    const top=node('div',undefined,'game-card-top'),copy=node('div');copy.append(node('div',name,'game-card-name'));
    const meta=node('div',undefined,'game-card-meta'),dot=node('span',undefined,'status-dot'+(gameStatus(g,user.id)==='Your turn'?' active':''));meta.append(dot,node('span',timeAgo(g.updated_at)));copy.append(meta);
    const chevron=node('span',undefined,'card-chevron');chevron.append(icon('chevron'));top.append(avatar(g.status==='invited'?'+':name,'walnut'),copy,chevron);
    const bottom=node('div',undefined,'game-card-bottom');
    if(g.status==='invited')bottom.append(node('span','Your invitation is ready to share','small-note'));
    else {const scores=Engine.scores(g.state,config),seat=seatOf(g,user.id)-1,score=node('span',undefined,'card-score');score.append(node('strong',scores[seat]),node('span','  :  '),node('strong',scores[1-seat]));bottom.append(score);}
    bottom.append(node('span',gameStatus(g,user.id),'card-status'+(gameStatus(g,user.id)==='Your turn'?'':' waiting')));card.append(top,bottom);list.append(card);
  }
  if(!list.childElementCount){const blank=emptyState(filter==='finished'?'Your story starts here.':'A little friendly competition?',filter==='finished'?'Finished games will find a home here.':'Invite someone. Take your time. Find a great word.',filter==='finished'?'award':'leaf');if(filter==='active')blank.append(act('Invite a friend',createGame,'primary','plus'));list.append(blank);}
  renderActivity();
}
function renderActivity(){
  if(!homeData)return;const unread=homeData.notifications.filter(n=>!n.read_at).length;$('activity-badge').hidden=!unread;$('activity-badge').textContent=unread>9?'9+':String(unread);$('read-inbox').disabled=!unread;
  $('inbox').replaceChildren();for(const n of homeData.notifications){const g=homeData.games.find(g=>g.id===n.game_id),name=g?opponentName(g,user.id):'Your friend';const item=act('',()=>openGame(n.game_id),'activity-item'+(n.read_at?'':' unread'));item.replaceChildren(avatar(name),node('span'),icon('chevron'));item.children[1].append(node('strong',activityText(n.kind,name)),node('small',timeAgo(n.created_at)));$('inbox').append(item);}
  if(!homeData.notifications.length)$('inbox').append(emptyState('All quiet at the table.','Game updates will appear here.','bell'));
}
async function fetchHome(){const request=++homeLoad,actor=user?.id;const result=await api({action:'home'});if(user?.id!==actor||request!==homeLoad)return null;homeData=result;return result;}
async function showHome(quiet=false,{route=true,replace=false}={}){
  if(!user)return;const ticket=quiet?navigation:++navigation,before=JSON.stringify(homeData),result=await fetchHome();if(!result||ticket!==navigation)return;
  if(!quiet){++gameLoad;screen('home',{route,replace});}
  if(!quiet||before!==JSON.stringify(result))renderHome();
}
async function showActivity({route=true}={}){if(!user)return;const ticket=++navigation,actor=user.id;if(!homeData)await fetchHome();if(ticket!==navigation||actor!==user?.id||!homeData)return;++gameLoad;screen('activity',{route});renderActivity();}
async function showInvite(){
  const raw=localStorage.getItem('wc-invitation');if(!raw||!user)return false;const token=invitationToken(raw);if(!token){localStorage.removeItem('wc-invitation');throw Error('That invitation code does not look right.');}
  const {invitation:i}=await api({action:'invitation',choice:'preview',token});
  const own=homeData?.games.find(g=>g.id===i.id&&g.players[0]===user.id);
  if(own){localStorage.removeItem('wc-invitation');await openGame(own.id);return true;}
  const available=i.status==='invited'&&Date.parse(i.expires_at)>Date.now();
  if(!available){localStorage.removeItem('wc-invitation');showSheet('This seat is no longer available.',[node('p','Ask your friend for a new invitation.'),act('Back to games',closeSheet,'primary full')]);return true;}
  const heading=node('div',undefined,'invitation-summary');heading.append(avatar(i.host,'avatar-large'),node('h3',`${i.host} saved you a seat.`));
  showSheet('You are invited.',[heading,node('p','A game of words, in your own time.'),act('Join game',()=>decideInvite('accept'),'primary full','arrow'),act('Not this time',()=>decideInvite('decline'),'text-button full')]);return true;
}
async function decideInvite(choice){const token=invitationToken(localStorage.getItem('wc-invitation')||'');const result=await api({action:'invitation',choice,token});localStorage.removeItem('wc-invitation');closeSheet();if(choice==='accept'&&result.game.status==='active')await openGame(result.game.id);else {await showHome();status('Invitation declined.');}}
async function openGame(id,quiet=false,{route=true}={}){
  const ticket=quiet?navigation:++navigation,request=quiet?gameLoad:++gameLoad,actor=user?.id;const result=await api({action:'game',gameId:id});
  if(ticket!==navigation||request!==gameLoad||actor!==user?.id)return;if(quiet&&(currentView!=='game'||game?.id!==id))return;if(game?.id===id&&game.revision>result.game.revision)return;
  const changed=!game||game.id!==id||game.revision!==result.game.revision;
  preview=false;game=result.game;history=result.history;invite=result.invitation;
  if(changed){selection=[];jokers={};highlightLast=false;focusTile=null;}
  if(!quiet){$('board').classList.remove('enlarged');$('zoom').setAttribute('aria-pressed','false');screen('game',{route});}
  if(changed||!quiet)renderGame();
}
const pos=t=>({x:t.q*64,y:t.r*64});
function myTurn(){return game?.status==='active'&&game.players[game.state.player-1]===user?.id;}
function canPlay(){return !preview&&myTurn()&&!busy&&!pending();}
function drawBoard(){
  const board=$('board');board.replaceChildren();board.setAttribute('viewBox','-295 -295 590 590');
  const last=history[0]?.recap,seat=seatOf(game,user?.id)||1;if(!focusTile)focusTile=game.state.tiles.find(t=>t.owner===seat)?.id||game.state.tiles[0].id;
  for(const t of game.state.tiles){const p=pos(t),step=selection.indexOf(t.id),letter=t.letter==='?'&&step>=0?(jokers[t.id]||'?'):t.letter;
    const g=svg('g',{'data-id':t.id,role:'button',tabindex:t.id===focusTile?0:-1,'aria-pressed':step>=0,'aria-disabled':!canPlay()&&!preview,'aria-label':`${letter==='?'?'Joker':letter}, ${t.owner===seat?'yours':t.owner?'opponent':'neutral'}, ${Engine.letterValue(t.letter,config)} points${t.castle?', castle':''}`,class:`tile owner${t.owner}${step>=0?' selected':''}${highlightLast&&last?.path?.includes(t.id)?' last-move':''}`});
    const points=Array.from({length:8},(_,i)=>{const a=(45*i+22.5)*Math.PI/180;return `${p.x+32*Math.cos(a)},${p.y+32*Math.sin(a)}`;}).join(' ');
    g.append(svg('polygon',{points}),svg('text',{x:p.x,y:p.y-2},letter),svg('text',{x:p.x,y:p.y+19,class:'value'},Engine.letterValue(t.letter,config)));
    if(t.owner)g.append(svg('circle',{cx:p.x+20,cy:p.y-19,r:3.1,class:'marker'}));
    if(t.castle){const points=Array.from({length:10},(_,i)=>{const a=(i*36-90)*Math.PI/180,r=i%2?2.7:6;return `${p.x+19+r*Math.cos(a)},${p.y+18+r*Math.sin(a)}`;}).join(' ');g.append(svg('polygon',{points,class:'castle'}));}
    if(step>=0)g.append(svg('text',{x:p.x-19,y:p.y-18,class:'step'},step+1));board.append(g);
  }
  const centers=selection.map(id=>pos(game.state.tiles.find(t=>t.id===id)));const segments=centers.slice(1).map((b,i)=>{const a=centers[i],length=Math.hypot(b.x-a.x,b.y-a.y),dx=(b.x-a.x)/length*15,dy=(b.y-a.y)/length*15;return `M${a.x+dx},${a.y+dy} L${b.x-dx},${b.y-dy}`;}).join(' ');board.append(svg('path',{class:'path',d:segments}));
}
function renderJokers(){
  $('jokers').replaceChildren();for(const id of selection){if(game.state.tiles.find(t=>t.id===id).letter!=='?')continue;const label=node('label',`Joker ${selection.indexOf(id)+1}`),input=node('input');input.maxLength=1;input.pattern='[A-Za-z]';input.autocomplete='off';input.autocapitalize='characters';input.value=jokers[id]||'';input.setAttribute('aria-label',`Joker at position ${selection.indexOf(id)+1}`);input.oninput=()=>{input.value=input.value.replace(/[^a-z]/gi,'').toUpperCase();jokers[id]=input.value;drawBoard();renderSelection();};label.append(input);$('jokers').append(label);}
}
function selectionHint(error){
  if(pending())return 'Your move is waiting to be confirmed.';if(!selection.length)return Engine.canReenter(game.state,config)?'No territory left? Start on any tile.':'Start on a tile you own.';
  if(selection.some(id=>game.state.tiles.find(t=>t.id===id).letter==='?'&&!jokers[id]))return 'Choose a letter for your joker.';
  if(selection.length<config.minimumWordLength)return `Add ${config.minimumWordLength-selection.length} more ${config.minimumWordLength-selection.length===1?'letter':'letters'}.`;
  return error||'Ready when you are.';
}
function renderSelection(){
  const word=selection.length?Engine.wordForPath(game.state,selection,jokers):'Find your word.';const error=Engine.validatePath(game.state,selection,{...config,dictionaryEnabled:false},true,null,jokers);
  $('word').textContent=word;$('word').classList.toggle('placeholder',!selection.length);$('submit-word').disabled=!canPlay()||!!error;$('clear-word').disabled=!selection.length||busy||!!pending();
  $('selection-help').textContent=preview?'Board preview. Moves are not saved.':selectionHint(error);$('selection-help').classList.toggle('invalid',!!error&&selection.length>=config.minimumWordLength&&!selection.some(id=>game.state.tiles.find(t=>t.id===id).letter==='?'&&!jokers[id]));
  $('score-preview').hidden=!selection.length;
  if(selection.length){const s=Engine.scoreMove(game.state,selection,config);$('score-preview').replaceChildren(node('span',`${s.wordPoints} word points + ${s.territoryGain} land`),icon('info'));$('submit-label').textContent=`Play word · ${s.totalGain}`;}else $('submit-label').textContent='Play word';
  if(busy)$('submit-label').textContent='Saving...';
  $('pending').hidden=!pending();$('pending-message').textContent=busy?'Saving your move...':'Move not confirmed yet. Retry when connected.';$('retry').disabled=busy;
}
function renderGame(){
  const totals=Engine.scoreBreakdown(game.state,config),seat=seatOf(game,user?.id)||1;
  [1,2].forEach(p=>{$(`name-${p}`).textContent=p===seat?'You':game.names?.[p-1]||'Your friend';$(`score-${p}`).textContent=totals[p-1].total;$(`player-score-${p}`).style.order=p===seat?1:3;$(`player-score-${p}`).setAttribute('aria-label',`${p===seat?'Your':game.names?.[p-1]||'Player'} score: ${totals[p-1].total}. View breakdown`);});
  document.querySelector('.turn').style.order=2;
  $('game-heading-name').textContent=preview?'The Sunday table':opponentName(game,user?.id);$('game-heading-subtitle').textContent=game.status==='invited'?'Invitation':isFinished(game)?'Finished game':`Turn ${game.state.turns.reduce((a,b)=>a+b,0)+1}`;
  $('turn').textContent=preview?'Your turn':gameStatus(game,user?.id);$('turn').classList.toggle('waiting',!myTurn()&&!preview);
  const left=Engine.lettersRemaining(game.state,config);$('supply').textContent=isFinished(game)?'Final score':left===0?'Final reply':`${left} letters left`;$('supply-fill').style.width=`${Math.max(0,Math.min(100,left/config.letterBudget*100))}%`;
  $('share').hidden=!invite;$('game-table').hidden=!!invite;
  if(invite){$('share-link').value=`${authRedirect()}?invite=${invite.token}`;$('invite-expiry').textContent=`Available until ${new Date(invite.expires_at).toLocaleDateString(undefined,{month:'short',day:'numeric'})}`;}
  $('composer').hidden=(!myTurn()&&!preview)||isFinished(game)||!!pending()&&!busy;$('waiting-turn').hidden=myTurn()||preview||isFinished(game)||!!pending();$('game-result').hidden=!isFinished(game);
  $('draw-offer').hidden=!game.draw_by||game.draw_by===user?.id||game.status!=='active';
  $('board-context').textContent=highlightLast?'Last word highlighted':preview?'DESIGN PREVIEW':`You play ${seat===1?'sage':'walnut'}`;
  if(isFinished(game)){$('result-title').textContent=game.status==='completed'?gameStatus(game,user?.id)+'.':game.status==='abandoned'?'A game left unfinished.':'Invitation cancelled.';$('result-description').textContent=game.status==='completed'?`${totals[seat-1].total} to ${totals[seat===1?1:0].total}. A little word, a little world.`:'This game does not count towards your record.';}
  const last=history[0]?.recap;$('recap').hidden=!last;
  if(last){const copy=node('span'),symbol=node('span',undefined,'recap-symbol');symbol.append(icon('history'));copy.append(node('small','LAST MOVE'),node('strong',last.word?`${game.names[last.player-1]} played ${last.word}`:activityText(last.action,game.names[last.player-1])));$('recap').replaceChildren(symbol,copy,node('span',last.score?`+${last.score.wordPoints}`:''));}
  drawBoard();renderJokers();renderSelection();
}
function choose(id){
  if((!canPlay()&&!preview)||!id||id===selection.at(-1))return;
  if(selection.length>1&&id===selection.at(-2))delete jokers[selection.pop()];
  else {const error=Engine.validatePath(game.state,[...selection,id],config,false);if(error){if(!dragging)status(error,true);return;}selection.push(id);}
  highlightLast=false;focusTile=id;drawBoard();renderJokers();renderSelection();
}
function clearWord(){if(busy||pending())return;selection=[];jokers={};highlightLast=false;renderGame();}
async function sendPending(){
  const command=pending();if(!command||busy)return;const sentGame=game.id,sentUser=user.id,storageKey=pendingKey();busy=true;renderGame();
  try{const result=await api({action:'turn',gameId:sentGame,command});localStorage.removeItem(storageKey);if(user?.id===sentUser){status(result.replayed?'Your earlier move was already saved.':'Move saved.');if(game?.id===sentGame){game=result.game;selection=[];jokers={};if(command.action==='resign'){await showHome();status('You left the game.');}else await openGame(sentGame,true);}}}
  catch(e){if(e.status>=400&&e.status<500&&![401,429].includes(e.status)){localStorage.removeItem(storageKey);if(user?.id===sentUser&&game?.id===sentGame){if(e.code!=='illegal_move'){selection=[];jokers={};}await openGame(sentGame,true).catch(()=>{});}}if(user?.id===sentUser){lastProblem=friendlyError(e);lastRequestId=e.requestId||null;if(!pending())status(lastProblem,true);}}
  finally{busy=false;if(game&&currentView==='game')renderGame();if(refreshQueued)void poll();}
}
async function action(kind){
  if(preview||busy||pending()||game?.status!=='active')return;if(['word','refresh'].includes(kind)&&!canPlay())return;
  const command={operationId:crypto.randomUUID(),revision:game.revision,action:kind,...(kind==='word'?{path:[...selection],jokers:{...jokers}}:{})};
  localStorage.setItem(pendingKey(),JSON.stringify(command));closeSheet();await sendPending();
}
function scoreLines(rows){const container=node('div',undefined,'score-lines');for(const [label,value,total]of rows){const line=node('div',undefined,'score-line'+(total?' total':''));line.append(node('span',label),node('strong',value));container.append(line);}return container;}
function showScore(player){const s=Engine.scoreBreakdown(game.state,config)[player-1];showSheet(player===seatOf(game,user?.id)?'Your score':`${game.names[player-1]}'s score`,[scoreLines([['Word points',s.words],['Current territory',s.territory],['Total',s.total,true]]),node('p','Word points stay yours. Territory points change when tiles are captured.')]);}
function showWordScore(){if(!selection.length)return;const s=Engine.scoreMove(game.state,selection,config);const content=[scoreLines([['Letter points',s.letters],['Length bonus',s.lengthBonus],['New territory',s.territoryGain],['Added to your score',s.totalGain,true]])];if(s.enemyLoss)content.push(node('p',`Your opponent also loses ${s.enemyLoss} territory points.`));showSheet('A good word adds up.',content);}
function showRules(){
  const steps=[['Find a word',`Start on a tile you own. Connect at least ${config.minimumWordLength} letters in any of the eight directions. Use each tile once. No territory left? Start anywhere.`],['Make it yours',`Claim the tiles in your word, including up to ${config.maxEnemyTilesPerWord} enemy tiles. Ordinary tiles score ${config.normalTerritoryPoints} for territory; castles are worth ${config.castlePoints}.`],['Every letter counts','Small numbers are letter points. Longer words earn a bonus. Jokers can be any letter. Ordinary letters in a played word are replaced; jokers stay wild.'],['Take your time',`Both players share ${config.letterBudget} letters. When they run out, Player 2 gets a final reply if needed. The highest final score wins. Refreshing your letters uses your turn.`]];
  const content=steps.map(([title,copy],i)=>{const row=node('div',undefined,'rule-step'),text=node('div');text.append(node('h3',title),node('p',copy));row.append(node('span',i+1,'step-number'),text);return row;});
  const legend=node('div',undefined,'rule-legend');for(const [className,label]of [['owner-dot','Sage player'],['owner-ring','Walnut player']]){const item=node('span');item.append(node('span',undefined,className),node('span',label));legend.append(item);}content.push(legend,act('About the dictionary',showDictionary,'text-button'));showSheet('A little word. A little world.',content);
}
function showDictionary(){const link=node('a','Dictionary license','text-link');link.href='dictionary-license.txt';link.target='_blank';link.rel='noopener';showSheet('Words we play.',[node('p','English words are checked against a fixed Letterpress-derived word list. Listed inflections, slang and repeated words are allowed.'),node('p','The list includes some uncommon, archaic and offensive words. A game keeps the dictionary it started with.'),link]);}
function showHistory(){const list=node('ol',undefined,'move-list');for(const [index,move]of history.entries()){const r=move.recap,item=node('li'),copy=node('div',undefined,'move-copy');copy.append(node('strong',r.word||({refresh:'Letters refreshed',resign:'Resigned',offer_draw:'Draw offered',accept_draw:'Draw accepted',abandon:'Game abandoned'}[r.action]||'Game update')),node('small',`${game.names[r.player-1]} · ${timeAgo(r.at)}`));item.append(node('span',history.length-index,'move-number'),copy,node('span',r.score?`+${r.score.wordPoints}`:'','move-points'));list.append(item);}showSheet('The story so far.',history.length?list:emptyState('The first word is yours.','Played words will appear here.','history'));}
function showRecap(){
  const r=history[0]?.recap;if(!r)return;const content=[node('div',r.word||'Game update','recap-word'),node('div',`${game.names[r.player-1]} · ${timeAgo(r.at)}`,'recap-byline')];
  if(r.score)content.push(scoreLines([['Word points',r.score.wordPoints],['Territory gained',r.score.territoryGain],...(r.score.enemyLoss?[['Opponent territory lost',r.score.enemyLoss]]:[])]));
  if(r.changed?.length){content.push(node('h3','After the word'));const changes=node('div',undefined,'tile-changes');for(const c of r.changed){const chip=node('span',undefined,'tile-change'+(c.before.owner!==c.after.owner?' captured':''));chip.append(node('b',c.before.letter),node('span','→'),node('b',c.after.letter));chip.title=c.before.owner!==c.after.owner?'Captured tile':'Replacement letter';changes.append(chip);}content.push(changes,node('p','Green chips are tiles captured on this turn.','field-hint'));}
  if(r.path?.length)content.push(act('Show word on the board',()=>{highlightLast=true;closeSheet();renderGame();$('board').scrollIntoView({block:'center',behavior:'smooth'});},'secondary full','eye'));
  content.push(act('All moves',showHistory,'text-button full'));showSheet('The last move.',content);
}
function showNewGame(){showSheet('Pull up a chair.',[node('p','Start a game with someone you know.'),act('Invite a friend',createGame,'primary full','user-plus'),act('I have an invitation',showJoin,'secondary full','mail')]);}
function showJoin(){const form=node('form',undefined,'stack-form'),label=node('label','Invitation link or code'),input=node('input');input.id='invite-code';input.autocomplete='off';input.required=true;input.placeholder='Paste your invitation here';label.htmlFor=input.id;const submit=button('Open invitation',null,'primary full','arrow');submit.type='submit';form.append(label,input,submit);form.onsubmit=e=>{e.preventDefault();void run(async()=>{const token=invitationToken(input.value);if(!token)throw Error('Paste a complete invitation link or code.');submit.disabled=true;try{localStorage.setItem('wc-invitation',token);await showInvite();}finally{submit.disabled=false;}});};showSheet('Join a friend.',form);}
async function createGame(){
  if(creating||!user)return;creating=true;$('new-game').disabled=true;closeSheet();
  try{const key=`wc-create:${user.id}`,id=localStorage.getItem(key)||crypto.randomUUID();localStorage.setItem(key,id);const {game:g}=await api({action:'create',gameId:id});localStorage.removeItem(key);await openGame(g.id);}finally{creating=false;$('new-game').disabled=false;}
}
async function copyInvite(){try{await navigator.clipboard.writeText($('share-link').value);status('Invitation copied. Send it to a friend.');}catch{$('share-link').focus();$('share-link').select();status('Select and copy the invitation link.',true);}}
async function shareInvite(){if(navigator.share){try{await navigator.share({title:'A game of Word Conquest',text:'Join me for a game of words.',url:$('share-link').value});}catch(e){if(e.name!=='AbortError')await copyInvite();}}else await copyInvite();}
async function quitGame(){
  if(preview||busy||pending())return;
  if(game.status==='invited'){
    if(!invite||!await ask({title:'Cancel this invitation?',message:'The link will stop working. You can invite someone again whenever you like.',label:'Cancel invitation',cancel:'Keep it',symbol:'mail'}))return;
    busy=true;try{await api({action:'invitation',choice:'cancel',token:invite.token});await showHome();status('Invitation cancelled.');}finally{busy=false;}
  }else if(game.status==='active'&&await ask({title:'Leave this game?',message:'Your friend wins and this counts as a loss. Your game history will stay in Finished.',label:'Leave game',danger:true,symbol:'flag'}))await action('resign');
}
async function confirmAction(kind){
  const cost=Math.max(config.refreshMinimumLetterCost,game.state.tiles.filter(t=>t.owner===game.state.player&&t.letter!=='?').length);
  const options={refresh:{title:'Fresh letters?',message:`Replace your ordinary owned letters. This uses your turn and ${cost} letters from the shared supply.`,label:'Refresh letters',symbol:'refresh'},offer_draw:{title:'Call it a draw?',message:'Your friend can accept the offer. You can both keep playing until then.',label:'Offer draw',symbol:'handshake'},accept_draw:{title:'Share the honours?',message:'This ends the game as a draw for both players.',label:'Accept draw',symbol:'handshake'},abandon:{title:'Close this inactive game?',message:'After 30 days without a turn, you can close a game without a win or loss.',label:'Close game',symbol:'hourglass'}};
  if(await ask(options[kind]))await action(kind);
}
function showGameMenu(){
  const list=node('div',undefined,'settings-list');list.append(row('Move history','history',showHistory),row('How to play','book',showRules));
  if(game.status==='active'&&!preview){
    const refresh=row('Refresh letters','refresh',()=>confirmAction('refresh'),{note:'Replace your letters instead of playing a word'});refresh.disabled=!canPlay();list.append(refresh);
    if(game.draw_by===user?.id){const offered=row('Draw offered','handshake',()=>{}, {note:'Waiting for your friend'});offered.disabled=true;list.append(offered);}else list.append(row(game.draw_by?'Accept draw':'Offer a draw','handshake',()=>confirmAction(game.draw_by?'accept_draw':'offer_draw')));
    if(Date.now()-Date.parse(game.last_play_at)>=30*86400000)list.append(row('Close inactive game','hourglass',()=>confirmAction('abandon')));
    list.append(row('Leave game','flag',quitGame,{danger:true}));
  }
  if(game.status==='invited')list.append(row('Cancel invitation','close',quitGame));showSheet('At this table.',list);
}
async function account({route=true}={}){
  if(!user)return;const ticket=++navigation,actor=user.id;if(!homeData)await fetchHome();if(ticket!==navigation||actor!==user?.id||!homeData)return;++gameLoad;screen('account',{route});
  const profile=homeData.profile;$('profile-name').textContent=profile.display_name;$('profile-email').textContent=user.email||'';$('profile-avatar').textContent=profile.display_name.slice(0,1).toUpperCase();renderPush();$('statistics').replaceChildren(node('p','Loading your record...','record-note'));
  const {statistics}=await api({action:'stats'});if(user?.id!==actor||currentView!=='account')return;$('statistics').replaceChildren();
  const entries=Object.entries(statistics);if(!entries.length)entries.push(['',{wins:0,losses:0,draws:0,highestFinalScore:0,bestTurn:0,bestWord:''}]);
  for(const [version,s]of entries){if(entries.length>1)$('statistics').append(node('p',version.startsWith('autumn-v1')?'Standard English':'Earlier rules','record-note'));const grid=node('div',undefined,'stats-grid');for(const [label,count]of [['Wins',s.wins],['Draws',s.draws],['Losses',s.losses]]){const item=node('div',undefined,'stat');item.append(node('strong',count),node('span',label));grid.append(item);}$('statistics').append(grid);if(s.bestWord){const best=node('div',undefined,'best-word');best.append(icon('award'),node('span','Best word'),node('strong',`${s.bestWord} · ${s.bestTurn}`));$('statistics').append(best,node('p',`Highest final score: ${s.highestFinalScore}`,'record-note'));}else $('statistics').append(node('p','Your first finished game starts your record.','record-note'));}
}
function editProfile(){const form=node('form',undefined,'stack-form'),label=node('label','Display name'),input=node('input');input.id='display-name';label.htmlFor=input.id;input.maxLength=40;input.required=true;input.autocomplete='nickname';input.value=homeData.profile.display_name;const save=button('Save name',null,'primary full','check');save.type='submit';form.append(label,input,save);form.onsubmit=e=>{e.preventDefault();void run(async()=>{save.disabled=true;try{const name=input.value.trim();if(!name)throw Error('Add a name for your friends to see.');await api({action:'profile',name,emailNotifications:homeData.profile.email_notifications});homeData.profile.display_name=name;closeSheet();await account({route:false});status('Your name is updated.');}finally{save.disabled=false;}});};showSheet('What should we call you?',form);}
function showPush(){const enabled=push.preferred();showSheet('Game notifications.',[node('p',enabled?'This phone will let you know when a game needs you.':'A quiet nudge when it is your turn. You can change this anytime.'),act(enabled?'Turn off notifications':'Enable notifications',async()=>{const b=$('sheet-content').querySelector('button');b.disabled=true;try{if(enabled){await push.disable();status('Notifications are off on this phone.');}else await push.enable();closeSheet();renderPush();}finally{b.disabled=false;}},'primary full',enabled?'bell':'check')]);}
function showPrivacy(){
  const list=node('div',undefined,'settings-list');list.append(row('How your data is used','shield',showDataInfo),row('Dictionary & word list','book',showDictionary));
  if(user)list.append(row('Download my data','download',exportData),row('Delete my account','trash',showDelete,{danger:true}));
  const contact=node('p',cfg.operatorName&&cfg.supportEmail?`${cfg.operatorName} · ${cfg.supportEmail}`:'Need a hand? Contact the friend who invited you.');const content=[contact,list];
  if(lastProblem){content.push(node('p',`Last issue: ${lastProblem}`,'menu-note'));if(lastRequestId)content.push(act('Copy support reference',async()=>{await navigator.clipboard.writeText(lastRequestId);status('Support reference copied.');},'text-button'));}
  showSheet('Privacy & your account.',content);
}
function showDataInfo(){showSheet('A private little table.',[node('p','Only your opponents can see your shared games and display name. Your email is used for signing in and recovering your account.'),node('p','Supabase stores games and accounts. Resend sends account emails. Optional Android notifications use Google Firebase Cloud Messaging with a device token and game reference.'),node('p','There are no ads, public profile search or analytics trackers. Account deletion removes your login, profile and private inbox. Shared history stays anonymized for your opponents; backups expire under the hosting provider\'s retention policy.')]);}
async function exportData(){const data=await api({action:'export'}),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),link=node('a');link.href=url;link.download='word-conquest-data.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);closeSheet();status('Your data export is ready.');}
function showDelete(){
  const form=node('form',undefined,'stack-form'),label=node('label','Type DELETE to confirm'),input=node('input');input.id='delete-confirmation';input.autocomplete='off';input.required=true;input.pattern='DELETE';label.htmlFor=input.id;const remove=button('Permanently delete account',null,'primary danger full','trash');remove.type='submit';form.append(label,input,remove);
  form.onsubmit=e=>{e.preventDefault();void run(async()=>{remove.disabled=true;try{if(input.value!=='DELETE')return;await api({action:'delete_account',confirmation:'DELETE'});const actor=user.id;for(const key of Object.keys(localStorage))if(key.startsWith(`wc-pending:${actor}:`)||key===`wc-create:${actor}`)localStorage.removeItem(key);await db.auth.signOut();closeSheet();status('Your account has been deleted.');}finally{remove.disabled=false;}});};
  showSheet('Leave Word Conquest?',[node('p','This permanently removes your account, profile and private updates. Active games close without counting as wins or losses. Opponents keep anonymized shared history.'),node('p','For your protection, sign in again within ten minutes before deleting your account.'),form]);
}
function setAuthMode(mode){
  authMode=mode;const signup=mode==='signup',forgot=mode==='recover';
  $('auth-heading').replaceChildren();if(signup)$('auth-heading').textContent='Your seat at the table.';else if(forgot)$('auth-heading').textContent='Let us get you back in.';else $('auth-heading').append(document.createTextNode('Your next good word'),node('br'),document.createTextNode('is waiting.'));
  $('auth-intro').textContent=signup?'Invite a friend. See where the words take you.':forgot?'We will email you a link to reset your password.':'A friendly game, at your own pace.';
  $('password-label').hidden=forgot;$('password-field').hidden=forgot;$('password').required=!forgot;$('password').minLength=signup?12:1;$('password').autocomplete=signup?'new-password':'current-password';$('password-hint').hidden=!signup;$('recover').hidden=signup;
  $('auth-submit').replaceChildren(node('span',signup?'Create account':forgot?'Send reset link':'Sign in'),icon('arrow'));
  $('auth-switch-text').textContent=signup?'Already have an account?':forgot?'Remembered it?':'New here?';$('signup').textContent=signup||forgot?'Sign in':'Create an account';
}
$('auth-form').onsubmit=e=>{e.preventDefault();void run(async()=>{
  if(authBusy)return;authBusy=true;$('auth-submit').disabled=true;
  try{const email=$('email').value.trim(),password=$('password').value;
    if(authMode==='recover'){const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:authRedirect()});if(error)throw error;showSheet('Check your inbox.',[node('p','If an account uses that address, a password reset link will arrive shortly.'),act('Back to sign in',()=>{closeSheet();setAuthMode('signin');},'primary full')]);}
    else if(authMode==='signup'){const {data,error}=await db.auth.signUp({email,password,options:{emailRedirectTo:authRedirect()}});if(error)throw error;if(!data.session){$('password').value='';setAuthMode('signin');showSheet('One last step.',[node('p','Open the confirmation email, then come back here to sign in.'),act('Got it',closeSheet,'primary full','check')]);}}
    else {const {error}=await db.auth.signInWithPassword({email,password});if(error)throw error;}
  }finally{authBusy=false;$('auth-submit').disabled=false;}
});};
$('signup').onclick=()=>setAuthMode(authMode==='signin'?'signup':'signin');$('recover').onclick=()=>setAuthMode('recover');
$('show-password').onclick=()=>{const showing=$('password').type==='password';$('password').type=showing?'text':'password';$('show-password').setAttribute('aria-label',showing?'Hide password':'Show password');};
$('recovery-form').onsubmit=e=>{e.preventDefault();void run(async()=>{const submit=e.currentTarget?.querySelector('button')||$('recovery-form').querySelector('button');submit.disabled=true;try{const {error}=await db.auth.updateUser({password:$('new-password').value});if(error)throw error;recovering=false;authReady=true;$('new-password').value='';await showHome();status('Password updated.');await openNotification();}finally{submit.disabled=false;}});};
$('retry-load').onclick=()=>run(async()=>{await showHome(false,{route:false});authReady=true;await showInvite();});
$('home-button').onclick=$('back').onclick=$('result-home').onclick=()=>run(()=>user?showHome():screen(configured?'auth':'setup',{route:false}));
$('brand').onclick=e=>{e.preventDefault();void run(()=>user?showHome():screen(configured?'auth':'setup',{route:false}));};
$('activity-button').onclick=()=>run(()=>showActivity());$('account-button').onclick=()=>run(()=>account());
$('active-games').onclick=()=>{filter='active';renderHome();};$('finished-games').onclick=()=>{filter='finished';renderHome();};
$('new-game').onclick=showNewGame;$('edit-profile').onclick=editProfile;$('push-settings').onclick=showPush;
$('help-button').onclick=showRules;for(const b of document.querySelectorAll('[data-sheet]'))b.onclick=()=>b.dataset.sheet==='rules'?showRules():showPrivacy();
$('game-menu').onclick=showGameMenu;$('share-invite').onclick=()=>run(shareInvite);$('copy-invite').onclick=()=>run(copyInvite);$('cancel-invite').onclick=()=>run(quitGame);
$('player-score-1').onclick=()=>showScore(1);$('player-score-2').onclick=()=>showScore(2);$('score-preview').onclick=showWordScore;$('recap').onclick=showRecap;
$('accept-draw').onclick=()=>run(()=>confirmAction('accept_draw'));
$('signout').onclick=()=>run(async()=>{await push.disable(false);notificationGame=null;await db.auth.signOut();game=null;homeData=null;selection=[];$('password').value='';status('Signed out.');});
$('read-inbox').onclick=()=>run(async()=>{await api({action:'read_notifications'});await fetchHome();renderActivity();status('All caught up.');});
$('submit-word').onclick=()=>run(()=>action('word'));$('retry').onclick=()=>run(sendPending);$('clear-word').onclick=clearWord;
$('zoom').onclick=()=>{const expanded=$('board').classList.toggle('enlarged');$('zoom').setAttribute('aria-pressed',expanded);$('zoom').setAttribute('aria-label',expanded?'Fit board':'Enlarge board');$('zoom').replaceChildren(icon(expanded?'shrink':'expand'));};
const tileAt=(x,y)=>document.elementFromPoint(x,y)?.closest('[data-id]')?.dataset.id;
$('board').onpointerdown=e=>{if(e.button!==0)return;const id=tileAt(e.clientX,e.clientY);if(!id)return;e.preventDefault();dragging=true;$('board').setPointerCapture(e.pointerId);choose(id);};
$('board').onpointermove=e=>{if(dragging)choose(tileAt(e.clientX,e.clientY));};
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('board').addEventListener(event,()=>{dragging=false;});
$('board').onkeydown=e=>{
  const id=e.target.closest('[data-id]')?.dataset.id;if(!id)return;
  if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(id);$('board').querySelector(`[data-id="${id}"]`)?.focus();}
  else if(e.key==='Escape'){e.preventDefault();clearWord();$('board').querySelector(`[data-id="${id}"]`)?.focus();}
  else if(e.key==='Backspace'){e.preventDefault();if(canPlay()||preview){delete jokers[selection.pop()];drawBoard();renderJokers();renderSelection();$('board').querySelector(`[data-id="${id}"]`)?.focus();}}
  else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const tile=game.state.tiles.find(t=>t.id===id),[dq,dr]={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];const next=game.state.tiles.find(t=>t.q===tile.q+dq&&t.r===tile.r+dr);if(next){focusTile=next.id;drawBoard();$('board').querySelector(`[data-id="${next.id}"]`)?.focus();}}
};
$('preview-button').onclick=()=>{preview=true;game={id:'preview',state:Engine.newGame(config),status:'active',players:[],names:['You','Alex'],revision:0};history=[];invite=null;selection=[];jokers={};screen('game',{route:false});renderGame();};
async function poll(){
  if(polling||busy||!user||document.hidden||recovering)return;polling=true;refreshQueued=false;
  try{if(currentView==='game'&&!preview)await openGame(game.id,true);else if(currentView==='home')await showHome(true);else if(currentView==='activity'){await fetchHome();renderActivity();}offlineNotice(!navigator.onLine);}
  catch{offlineNotice(true,'Could not refresh. Reconnect to get the latest turn.');}
  finally{polling=false;if(refreshQueued)void poll();}
}
if(native){void push.initialize().catch(()=>{});void App.addListener('appStateChange',({isActive})=>{if(isActive){void poll();void push.restore().catch(()=>{});}});void App.addListener('backButton',()=>{if(closeTopDialog())return;if(currentView!=='home'&&user)void run(()=>showHome());else void App.minimizeApp();});}
window.addEventListener('popstate',()=>run(async()=>{if(!user)return;closeSheet();const route=new URLSearchParams(location.search);if(route.get('game'))await openGame(route.get('game'),false,{route:false});else if(route.get('view')==='account')await account({route:false});else if(route.get('view')==='activity')await showActivity({route:false});else await showHome(false,{route:false});}));
window.addEventListener('online',()=>run(poll));window.addEventListener('offline',()=>offlineNotice());window.addEventListener('focus',()=>run(poll));document.addEventListener('visibilitychange',()=>{if(!document.hidden)void run(poll);});setInterval(poll,20000);
if(!db)screen('setup',{route:false});else db.auth.onAuthStateChange((event,session)=>{
  const previousUser=user?.id;user=session?.user||null;setTimeout(()=>run(()=>connectLiveUpdates(session)),0);
  if(event==='PASSWORD_RECOVERY'){authReady=false;recovering=true;screen('recovery',{route:false});return;}
  if(!user){authReady=false;homeData=null;++navigation;++gameLoad;++homeLoad;screen('auth',{route:false});return;}
  if(recovering||!['SIGNED_IN','INITIAL_SESSION'].includes(event)||(previousUser===user.id&&currentView!=='auth'))return;
  setTimeout(()=>run(async()=>{if(recovering)return;await showHome(false,{route:false});const invited=await showInvite();authReady=true;if(notificationGame)await openNotification();else if(launchGame&&!invited)await openGame(launchGame,false,{route:false});else if(!invited&&params.get('view')==='account')await account({route:false});else if(!invited&&params.get('view')==='activity')await showActivity({route:false});void push.restore().catch(()=>{});}),0);
});
