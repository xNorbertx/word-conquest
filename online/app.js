import {Capacitor} from '@capacitor/core';
import {App} from '@capacitor/app';
import {createClient} from '@supabase/supabase-js';
import {Engine,config} from '../server/domain.mjs';
const $=id=>document.getElementById(id), cfg=window.WC_CONFIG || {};
const configured=!!(cfg.supabaseUrl && cfg.supabaseAnonKey);
const db=configured?createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;
let user=null,game=null,history=[],invite=null,selection=[],jokers={},busy=false,preview=false,recovering=false,dragging=false;
let currentView='auth',homeData=null,polling=false,gameLoad=0;
let liveChannel=null,liveUser=null,refreshQueued=false;
async function connectLiveUpdates(session){
  if(session?.access_token)await db.realtime.setAuth(session.access_token);
  if(session?.user?.id!==user?.id)return;
  if(liveUser===user?.id)return;
  if(liveChannel){void db.removeChannel(liveChannel);liveChannel=null;}
  liveUser=user?.id || null;
  if(!liveUser)return;
  liveChannel=db.channel(`games:${liveUser}`).on('postgres_changes',
    {event:'UPDATE',schema:'public',table:'games'},()=>{refreshQueued=true;void poll();})
    .subscribe(state=>{if(state==='SUBSCRIBED'){refreshQueued=true;void poll();}});
}
const params=new URLSearchParams(location.search);
if(params.get('invite'))localStorage.setItem('wc-invitation',params.get('invite'));
const authRedirect=()=>Capacitor.isNativePlatform()?'https://xnorbertx.github.io/word-conquest/online/':location.origin+location.pathname;
const screens=['setup','auth','recovery','home','account','game'];
const status=(text,error=false)=>{$('connection').textContent=text;$('connection').classList.toggle('error',error);};
function screen(name){currentView=name;for(const id of screens)$(id).hidden=id!==name;}
const pendingKey=()=>`wc-pending:${user?.id}:${game?.id}`;
function pending(){try{return JSON.parse(localStorage.getItem(pendingKey()) || 'null');}catch{return null;}}
function apiError(message,code,statusCode){const e=new Error(message);e.code=code;e.status=statusCode;return e;}
async function api(body) {
  if(!db)throw new Error('The online service has not been configured.');
  const {data:{session},error}=await db.auth.getSession();
  if(error || !session)throw apiError('Sign in to continue.','unauthorized',401);
  const response=await fetch(`${cfg.supabaseUrl}/functions/v1/game-api`,{method:'POST',
    signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json',apikey:cfg.supabaseAnonKey,Authorization:`Bearer ${session.access_token}`},body:JSON.stringify(body)});
  const result=await response.json();
  if(!response.ok)throw apiError(`${result.error || 'Request failed.'}${result.requestId?` Support code: ${result.requestId}`:''}`,result.code,response.status);
  return result;
}
async function run(fn) {try{await fn();}catch(e){status(e.message || 'Connection interrupted. Please retry.',true);}}
function node(tag,text,className){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;}
function button(text,fn,className='secondary'){const n=node('button',text,className);n.onclick=()=>run(fn);return n;}
const title=g=>g.names?.join(' & ') || 'Word Conquest';
function gameStatus(g){if(g.status==='active')return g.players[g.state.player-1]===user?.id?'Your turn':'Waiting for your friend';if(g.status==='completed')return g.result==='draw'?'A shared draw':`${g.names?.[Number(g.result)-1] || 'Player'} won`;return g.status==='invited'?'Invitation waiting':g.status;}
async function showHome(quiet=false){
  if(!user)return;
  const result=await api({action:'home'});homeData=result;
  if(!quiet){++gameLoad;screen('home');params.delete('game');window.history.replaceState(null,'',location.pathname);}
  $('game-list').replaceChildren();
  if(!result.games.length)$('game-list').append(node('p','A fresh page. Invite a friend to begin.','notice'));
  for(const g of result.games){const card=node('article',undefined,'game-card'),copy=node('div');copy.append(node('strong',title(g)),node('p',gameStatus(g)),node('small',`Updated ${new Date(g.updated_at).toLocaleDateString()}`));card.append(copy,button('Open',()=>openGame(g.id)));$('game-list').append(card);}
  $('inbox').replaceChildren();
  for(const n of result.notifications){const p=node('p');p.append(button(`${n.read_at?'':'● '}${n.kind} · ${new Date(n.created_at).toLocaleDateString()}`,()=>openGame(n.game_id),'quiet'));$('inbox').append(p);}
  if(!result.notifications.length)$('inbox').append(node('p','All quiet for now.'));
  if(!quiet)status('Your saved games are up to date.');
}
async function showInvite(){
  const token=localStorage.getItem('wc-invitation');if(!token || !user)return;
  const result=await api({action:'invitation',choice:'preview',token});
  const i=result.invitation,available=i.status==='invited' && Date.parse(i.expires_at)>Date.now();
  $('invitation').hidden=false;$('invite-description').textContent=available?`${i.host} invited you to a game. Accept before ${new Date(i.expires_at).toLocaleDateString()}.`:'This invitation is no longer available.';
  $('accept-invite').disabled=!available;$('decline-invite').disabled=!available;
  if(!available)localStorage.removeItem('wc-invitation');
}
async function decideInvite(choice){const result=await api({action:'invitation',choice,token:localStorage.getItem('wc-invitation')});localStorage.removeItem('wc-invitation');$('invitation').hidden=true;if(choice==='accept' && result.game.status==='active')await openGame(result.game.id);else {await showHome();status(`Invitation ${result.game.status}.`);}}
async function openGame(id,quiet=false){
  const request=quiet?gameLoad:++gameLoad;
  const result=await api({action:'game',gameId:id});
  if(request!==gameLoad)return;
  if(quiet && (currentView!=='game' || game?.id!==id))return;
  if(game?.id===id && game.revision>result.game.revision)return;
  const changed=!game || game.id!==id || game.revision!==result.game.revision;
  preview=false;game=result.game;history=result.history;invite=result.invitation;
  if(changed){selection=[];jokers={};}
  if(!quiet){screen('game');window.history.replaceState(null,'',`?game=${game.id}`);}
  if(changed || !quiet)renderGame();
  if(!quiet)status(pending()?'A saved action needs confirmation. Retry it before making another move.':'Saved board loaded.');
}
const pos=t=>({x:t.q*64,y:t.r*64});
function svg(tag,attrs,text){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;}
function canPlay(){return !preview && game?.status==='active' && game.players[game.state.player-1]===user?.id && !busy && !pending();}
function drawBoard(){
  const board=$('board');board.replaceChildren();board.setAttribute('viewBox','-295 -295 590 590');
  const last=history[0]?.recap;
  for(const t of game.state.tiles){const p=pos(t),step=selection.indexOf(t.id),letter=t.letter==='?' && step>=0?(jokers[t.id] || '?'):t.letter;
    const g=svg('g',{'data-id':t.id,role:'button',tabindex:0,'aria-pressed':step>=0,
      'aria-label':`${letter}, ${t.owner?`Player ${t.owner}`:'neutral'}, ${Engine.letterValue(t.letter,config)} points${t.castle?', castle':''}, ${t.id}`,
      class:`tile owner${t.owner}${step>=0?' selected':''}${last?.path?.includes(t.id)?' last-move':''}`});
    const points=Array.from({length:8},(_,i)=>{const a=(45*i+22.5)*Math.PI/180;return `${p.x+32*Math.cos(a)},${p.y+32*Math.sin(a)}`;}).join(' ');
    g.append(svg('polygon',{points}),svg('text',{x:p.x,y:p.y-2},letter),svg('text',{x:p.x,y:p.y+18,class:'value'},`${Engine.letterValue(t.letter,config)}${t.castle?' ★':''}`));
    if(t.owner)g.append(svg('text',{x:p.x+19,y:p.y-18,class:'marker'},t.owner===1?'●':'○'));
    if(step>=0)g.append(svg('text',{x:p.x-18,y:p.y-18,class:'step'},step+1));board.append(g);
  }
  board.append(svg('polyline',{class:'path',points:selection.map(id=>pos(game.state.tiles.find(t=>t.id===id))).map(p=>`${p.x},${p.y}`).join(' ')}));
}
function renderJokers(){
  $('jokers').replaceChildren();for(const id of selection){if(game.state.tiles.find(t=>t.id===id).letter!=='?')continue;
    const label=node('label',`Joker ${selection.indexOf(id)+1}`),input=document.createElement('input');input.maxLength=1;input.pattern='[A-Za-z]';input.autocomplete='off';input.value=jokers[id]||'';input.setAttribute('aria-label',`Joker at position ${selection.indexOf(id)+1}`);
    input.oninput=()=>{input.value=input.value.replace(/[^a-z]/gi,'').toUpperCase();jokers[id]=input.value;drawBoard();renderSelection();};label.append(input);$('jokers').append(label);
  }
}
function renderSelection(){
  $('word').textContent=selection.length?Engine.wordForPath(game.state,selection,jokers):'—';
  const error=Engine.validatePath(game.state,selection,{...config,dictionaryEnabled:false},true,null,jokers);
  $('submit-word').disabled=!canPlay() || !!error;
  $('clear-word').disabled=busy || !!pending();
  if(selection.length){const s=Engine.scoreMove(game.state,selection,config);$('score-preview').textContent=`${s.letters} letters + ${s.lengthBonus} length + ${s.territoryGain} territory = ${s.totalGain}${s.enemyLoss?` · opponent −${s.enemyLoss}`:''}`;$('submit-word').textContent=`Play word · ${s.totalGain}`;}
  else {$('score-preview').textContent='Find a word, claim a little territory.';$('submit-word').textContent='Play word';}
  $('selection-help').textContent=preview?'Visual preview only. No game is saved.':!canPlay()?pending()?'Your saved action is awaiting confirmation.':gameStatus(game):error || 'The server checks the dictionary before accepting your word.';
  $('refresh').disabled=!canPlay();
  const cost=Math.max(config.refreshMinimumLetterCost,game.state.tiles.filter(t=>t.owner===game.state.player && t.letter!=='?').length);
  $('refresh').textContent=`↻ Refresh letters · uses ${cost}`;
  $('pending').hidden=!pending();$('pending').textContent=busy?'Sending saved action… Do not assume it is accepted yet.':'Not yet confirmed. Retry sends the same saved action safely.';$('retry').hidden=!pending();$('retry').disabled=busy;
}
function renderGame(){
  const totals=Engine.scoreBreakdown(game.state,config);
  [1,2].forEach(p=>{$(`name-${p}`).textContent=`${game.names?.[p-1] || 'Friend'} · ${p===1?'●':'○'}`;$(`score-${p}`).textContent=totals[p-1].total;$(`breakdown-${p}`).textContent=`${totals[p-1].words} word + ${totals[p-1].territory} land`;});
  $('turn').textContent=preview?'A quiet Sunday':gameStatus(game);
  $('supply').textContent=game.state.over?'Game complete':Engine.lettersRemaining(game.state,config)===0?'Player 2’s final reply':`${Engine.lettersRemaining(game.state,config)} letters left`;
  $('game-label').textContent=preview?'DESIGN PREVIEW':`Turn ${game.state.turns.reduce((a,b)=>a+b,0)+1}`;
  $('game-id').textContent=preview?'Preview — no online game':'Support reference: '+game.id;
  $('share').hidden=!invite;if(invite)$('share-link').value=`${Capacitor.isNativePlatform()?'https://xnorbertx.github.io/word-conquest/online/':location.origin+location.pathname}?invite=${invite.token}`;
  $('quit-game').hidden=preview || !['invited','active'].includes(game.status);
  $('quit-game').disabled=busy || !!pending();
  $('quit-game').textContent=game.status==='invited'?'Cancel game':'Quit game';
  $('accept-draw').hidden=!game.draw_by || game.draw_by===user?.id;
  for(const id of ['offer-draw','accept-draw','resign','abandon'])$(id).disabled=preview || game.status!=='active' || busy || !!pending();
  $('offer-draw').disabled ||= !!game.draw_by;
  $('recap').replaceChildren();const last=history[0]?.recap;
  if(last){$('recap').append(node('h3',last.word?`${game.names[last.player-1]} played ${last.word}`:`${game.names[last.player-1]} · ${last.action.replaceAll('_',' ')}`));
    if(last.score)$('recap').append(node('p',`${last.score.wordPoints} word points + ${last.score.territoryGain} territory. Opponent lost ${last.score.enemyLoss}.`));
    if(last.path?.length)$('recap').append(node('small','Dashed tiles show the last word’s path: '+last.path.join(' → ')));
    if(last.changed?.length){const d=node('details'),s=node('summary','Captures & replaced letters');d.append(s,node('p',last.changed.map(c=>`${c.id}: ${c.before.letter} → ${c.after.letter}${c.before.owner!==c.after.owner?` (owner ${c.before.owner||'neutral'} → ${c.after.owner})`:''}`).join('; ')));$('recap').append(d);}
  }else $('recap').append(node('p','The map is yours to contest.'));
  $('history').replaceChildren();for(const move of history){const r=move.recap;$('history').append(node('li',`${game.names[r.player-1]} · ${r.word || r.action.replaceAll('_',' ')}${r.score?` · ${r.score.wordPoints} word points`:''} · ${new Date(r.at).toLocaleString()}`));}
  drawBoard();renderJokers();renderSelection();
}
function choose(id){
  if((!canPlay() && !preview) || !id || id===selection.at(-1))return;
  if(selection.length>1 && id===selection.at(-2))delete jokers[selection.pop()];
  else {const error=Engine.validatePath(game.state,[...selection,id],config,false);if(error){status(error,true);return;}selection.push(id);}
  drawBoard();renderJokers();renderSelection();
}
async function sendPending(){
  const command=pending();if(!command || busy)return;
  const sentGame=game.id,sentUser=user.id,storageKey=pendingKey();busy=true;renderGame();
  try{
    const result=await api({action:'turn',gameId:sentGame,command});
    localStorage.removeItem(storageKey);
    if(user?.id===sentUser){
      status(`Accepted and saved${result.replayed?' — your earlier action was already received':''}.`);
      if(game?.id===sentGame){game=result.game;selection=[];jokers={};if(command.action==='resign'){await showHome();status('You quit the game. Invite a friend to start a new one.');}else await openGame(sentGame,true);}
    }
  }catch(e){
    // Only a definitive rejection lets the player compose a new operation.
    if(e.status>=400 && e.status<500 && ![401,429].includes(e.status)){
      localStorage.removeItem(storageKey);
      if(user?.id===sentUser && game?.id===sentGame){selection=[];jokers={};await openGame(sentGame,true).catch(()=>{});}
    }
    if(user?.id===sentUser)status(e.message || 'Connection interrupted. Your action is saved here; retry to confirm it.',true);
  }finally{busy=false;if(game && currentView==='game')renderGame();if(refreshQueued)void poll();}
}
async function action(kind){
  if(preview || busy || pending())return;
  const command={operationId:crypto.randomUUID(),revision:game.revision,action:kind,
    ...(kind==='word'?{path:[...selection],jokers:{...jokers}}:{})};
  // Persist BEFORE sending. Storage failure must stop the request.
  localStorage.setItem(pendingKey(),JSON.stringify(command));await sendPending();
}
async function account(){
  if(!user)return;screen('account');const {profile}=await api({action:'home'});$('display-name').value=profile.display_name;$('email-notifications').checked=profile.email_notifications;
  const {statistics}=await api({action:'stats'});$('statistics').replaceChildren();
  if(!Object.keys(statistics).length)$('statistics').append(node('p','Finish a game to begin your record.'));
  for(const [version,s]of Object.entries(statistics)){const d=node('div');d.append(node('p',`${s.wins} wins · ${s.losses} losses · ${s.draws} draws`),node('p',`Highest final score ${s.highestFinalScore}. Best word ${s.bestWord || '—'} · ${s.bestTurn} word points.`),node('small',version));$('statistics').append(d);}
}
$('auth-form').onsubmit=e=>{e.preventDefault();run(async()=>{const {error}=await db.auth.signInWithPassword({email:$('email').value,password:$('password').value});if(error)throw error;});};
$('signup').onclick=()=>run(async()=>{if(!$('auth-form').reportValidity())return;const {error}=await db.auth.signUp({email:$('email').value,password:$('password').value,options:{emailRedirectTo:authRedirect()}});if(error)throw error;status('Check your email to confirm your account, then sign in.');});
$('recover').onclick=()=>run(async()=>{if(!$('email').reportValidity())return;const {error}=await db.auth.resetPasswordForEmail($('email').value,{redirectTo:authRedirect()});if(error)throw error;status('If an account exists, a recovery email will arrive shortly.');});
$('recovery-form').onsubmit=e=>{e.preventDefault();run(async()=>{const {error}=await db.auth.updateUser({password:$('new-password').value});if(error)throw error;recovering=false;$('new-password').value='';await showHome();status('Password updated.');});};
$('home-button').onclick=$('back').onclick=()=>run(()=>user?showHome():screen(configured?'auth':'setup'));
$('account-button').onclick=()=>run(account);
$('accept-invite').onclick=()=>run(()=>decideInvite('accept'));$('decline-invite').onclick=()=>run(()=>decideInvite('decline'));
$('invite-code-form').onsubmit=e=>{e.preventDefault();run(async()=>{localStorage.setItem('wc-invitation',$('invite-code').value.trim());await showInvite();});};
$('create-game').onclick=()=>run(async()=>{
  $('create-game').disabled=true;try{const key=`wc-create:${user.id}`,id=localStorage.getItem(key)||crypto.randomUUID();localStorage.setItem(key,id);const {game:g}=await api({action:'create',gameId:id});localStorage.removeItem(key);await openGame(g.id);}finally{$('create-game').disabled=false;}
});
async function quitGame(){
  if(preview || busy || pending())return;
  if(game.status==='invited'){
    if(!invite || !confirm('Cancel this waiting game? Your invitation link will stop working.'))return;
    busy=true;renderGame();
    try{await api({action:'invitation',choice:'cancel',token:invite.token});await showHome();status('Game cancelled. Invite a friend to start a new one.');}
    finally{busy=false;if(currentView==='game')renderGame();}
  }else if(game.status==='active' && confirm('Quit this game? Your opponent wins and this counts as a loss.'))await action('resign');
}
$('quit-game').onclick=$('cancel-invite').onclick=()=>run(quitGame);
$('copy-invite').onclick=()=>run(async()=>{await navigator.clipboard.writeText($('share-link').value);status('Private invitation link copied.');});
$('profile-form').onsubmit=e=>{e.preventDefault();run(async()=>{await api({action:'profile',name:$('display-name').value,emailNotifications:$('email-notifications').checked});status('Preferences saved.');});};
$('signout').onclick=()=>run(async()=>{await db.auth.signOut();game=null;selection=[];$('password').value='';status('Signed out. Unconfirmed actions remain saved for this account.');});
$('export').onclick=()=>run(async()=>{const data=await api({action:'export'}),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=node('a');a.href=url;a.download='word-conquest-data.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Your data export is ready.');});
$('delete-account').onclick=()=>run(async()=>{if($('delete-confirmation').value!=='DELETE'){status('Type DELETE to confirm.',true);return;}await api({action:'delete_account',confirmation:'DELETE'});for(const key of Object.keys(localStorage))if(key.startsWith(`wc-pending:${user.id}:`) || key===`wc-create:${user.id}`)localStorage.removeItem(key);await db.auth.signOut();status('Your account was deleted. Shared game history is anonymized.');});
$('read-inbox').onclick=()=>run(async()=>{await api({action:'read_notifications'});await showHome(true);});
$('submit-word').onclick=()=>run(()=>action('word'));$('retry').onclick=()=>run(sendPending);
$('clear-word').onclick=()=>{selection=[];jokers={};renderGame();};
for(const [id,kind,message] of [['refresh','refresh','Replace your ordinary owned letters and spend this turn?'],['resign','resign','Resign this game? This counts as a loss.'],['offer-draw','offer_draw','Offer your friend a draw?'],['accept-draw','accept_draw','Accept this draw and end the game?'],['abandon','abandon','Abandon this game? Available after 30 days without a turn; no result is counted.']])$(id).onclick=()=>run(async()=>{if(confirm(message))await action(kind);});
$('zoom').onclick=()=>{$('board').classList.toggle('enlarged');$('zoom').textContent=$('board').classList.contains('enlarged')?'Fit board':'Enlarge board';};
const tileAt=(x,y)=>document.elementFromPoint(x,y)?.closest('[data-id]')?.dataset.id;
$('board').onpointerdown=e=>{if(e.button!==0)return;const id=tileAt(e.clientX,e.clientY);if(!id)return;e.preventDefault();dragging=true;$('board').setPointerCapture(e.pointerId);choose(id);};
$('board').onpointermove=e=>{if(dragging)choose(tileAt(e.clientX,e.clientY));};
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('board').addEventListener(event,()=>{dragging=false;});
$('board').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();const id=e.target.dataset.id;choose(id);[...$('board').querySelectorAll('[data-id]')].find(n=>n.dataset.id===id)?.focus();}};
$('preview-button').onclick=()=>{preview=true;game={id:'preview',state:Engine.newGame(config),status:'active',players:[],names:['You','Alex'],revision:0};history=[];invite=null;selection=[];jokers={};screen('game');renderGame();status('Design preview only — connect the service for saved online play.');};
async function poll(){if(polling || busy || !user || document.hidden || recovering)return;polling=true;refreshQueued=false;try{if(currentView==='game')await openGame(game.id,true);else if(currentView==='home')await showHome(true);}catch{status('Unable to refresh. Your last loaded board remains visible; reconnect before playing.',true);}finally{polling=false;if(refreshQueued)void poll();}}
if(Capacitor.isNativePlatform()){
  void App.addListener('appStateChange',({isActive})=>{if(isActive)void poll();});
  void App.addListener('backButton',()=>{if(currentView!=='home' && user)void run(()=>showHome());else void App.minimizeApp();});
}
window.addEventListener('online',()=>run(poll));window.addEventListener('offline',()=>status('Offline. Accepted moves stay saved. A pending move must be retried when connected.',true));window.addEventListener('focus',()=>run(poll));document.addEventListener('visibilitychange',()=>{if(!document.hidden)run(poll);});setInterval(poll,20000);
$('privacy-contact').textContent=cfg.operatorName && cfg.supportEmail?`Operated by ${cfg.operatorName}. Support and privacy: ${cfg.supportEmail}`:'Private friend pilot. For help, contact the person who invited you.';
if(!db){screen('setup');status('Online service not connected. The original prototype is still available.');}
else {
  db.auth.onAuthStateChange((event,session)=>{
    const previousUser=user?.id;user=session?.user || null;setTimeout(()=>run(()=>connectLiveUpdates(session)),0);
    if(event==='PASSWORD_RECOVERY'){recovering=true;screen('recovery');return;}
    if(!user){screen('auth');$('invitation').hidden=true;status('Sign in to return to your games.');return;}
    if(recovering || !['SIGNED_IN','INITIAL_SESSION'].includes(event) || (previousUser===user.id && currentView!=='auth'))return;
    // Avoid nested Auth operations inside Supabase's synchronous auth callback.
    setTimeout(()=>run(async()=>{if(recovering)return;await showHome();await showInvite();if(params.get('game') && $('invitation').hidden)await openGame(params.get('game'));}),0);
  });
}
