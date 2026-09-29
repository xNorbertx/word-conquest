const Engine = WordConquest, config = GAME_CONFIG;
const $ = id => document.getElementById(id);
let state = Engine.newGame(config), path = [], jokerLetters = {}, dragging = false, activePointer = null;
// Optional adapter: supply a Set of lowercase words before this script and enable the config flag.
const dictionary = window.WORD_DICTIONARY || null;
const svgNS = 'http://www.w3.org/2000/svg';
const position = t => ({x:64*t.q,y:64*t.r});
function svgElement(tag, attrs, text) {
  const el=document.createElementNS(svgNS,tag);
  Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
  if (text!==undefined) el.textContent=text;
  return el;
}
function drawBoard(captured=[]) {
  const board=$('board'); board.replaceChildren();
  const positions=state.tiles.map(position), xs=positions.map(p=>p.x), ys=positions.map(p=>p.y);
  board.setAttribute('viewBox',`${Math.min(...xs)-38} ${Math.min(...ys)-40} ${Math.max(...xs)-Math.min(...xs)+76} ${Math.max(...ys)-Math.min(...ys)+80}`);
  state.tiles.forEach(t=>{
    const p=position(t), index=path.indexOf(t.id);
    const displayLetter=t.letter==='?' && index>=0 ? (jokerLetters[t.id] || '?') : t.letter;
    const g=svgElement('g',{'data-id':t.id,class:`tile owner${t.owner}${t.castle?' castle':''}${t.letter==='?'?' joker':''}${index>=0?' selected':''}${captured.includes(t.id)?' captured':''}`,tabindex:state.over?-1:0,role:'button','aria-label':`${t.letter==='?'?'Joker '+displayLetter:t.letter}, ${t.owner?'Player '+t.owner:'neutral'}${t.castle?', castle':''}, tile ${t.id}`,'aria-pressed':index>=0});
    const points=Array.from({length:8},(_,i)=>{const a=(45*i+22.5)*Math.PI/180;return `${p.x+33*Math.cos(a)},${p.y+33*Math.sin(a)}`;}).join(' ');
    g.append(svgElement('polygon',{points}),svgElement('text',{x:p.x,y:p.y-2},displayLetter));
    g.append(svgElement('text',{x:p.x,y:p.y+18,class:'badge'},index>=0?`${index+1}${t.castle?' · ♜':t.letter==='?'?' · ?':''}`:t.castle?'♜':t.owner?`P${t.owner}`:''));
    board.append(g);
  });
  const points=path.map(id=>position(state.tiles.find(t=>t.id===id))).map(p=>`${p.x},${p.y}`).join(' ');
  board.append(svgElement('polyline',{points,class:'path-line'}));
}
function selectionChanged() {
  $('word').textContent=path.length?Engine.wordForPath(state,path,jokerLetters):'—';
  const captured=Engine.capturedTiles(state,path), castles=captured.filter(t=>t.castle).length;
  $('preview').textContent=path.length?`${path.length} letters · captures ${captured.length} territories${castles?` including ${castles} castle${castles>1?'s':''}`:''}`:'Start on your color. Trace a word.';
  $('submit').disabled=!!Engine.validatePath(state,path,config,true,dictionary,jokerLetters);
  $('cancel').disabled=!path.length;
}
function renderJokers() {
  $('jokers').replaceChildren();
  path.forEach((id,index)=> {
    if (state.tiles.find(t=>t.id===id).letter!=='?') return;
    const label=document.createElement('label'), input=document.createElement('input');
    label.textContent=`? Letter ${index+1}`;
    input.type='text'; input.maxLength=1; input.pattern='[A-Za-z]'; input.autocomplete='off';
    input.autocapitalize='characters'; input.spellcheck=false; input.placeholder='A–Z';
    input.setAttribute('aria-label',`Letter for joker at position ${index+1}`);
    input.value=jokerLetters[id] || '';
    input.addEventListener('input',()=> {
      input.value=input.value.replace(/[^a-z]/gi,'').toUpperCase();
      jokerLetters[id]=input.value; drawBoard(); selectionChanged();
      $('status').textContent='';
    });
    label.append(input); $('jokers').append(label);
  });
  $('joker-help').hidden=!$('jokers').childElementCount;
}
function render(captured=[]) {
  drawBoard(captured); renderJokers(); selectionChanged();
  const scores=Engine.scores(state,config);
  [1,2].forEach(p=>{ $('score'+p).textContent=scores[p-1]; $('turns'+p).textContent=`${state.turns[p-1]} / ${config.turnsPerPlayer} turns played`; $('p'+p).classList.toggle('active',!state.over && state.player===p); });
  $('turn').textContent=state.over?(scores[0]===scores[1]?`It's a draw!`:`Player ${scores[0]>scores[1]?1:2} wins!`):`Player ${state.player}’s turn`;
  $('round').textContent=state.over?'Game complete':`Turn ${state.turns[state.player-1]+1} of ${config.turnsPerPlayer}`;
  $('log').replaceChildren();
  if (!state.log.length) { const li=document.createElement('li'); li.className='empty'; li.textContent='The map is yours to contest.'; $('log').append(li); }
  state.log.forEach(move=>{ const li=document.createElement('li'), title=document.createElement('strong'), detail=document.createElement('small'); title.textContent=`Player ${move.player}: ${move.word}`; detail.textContent=`Captured ${move.captured} territor${move.captured===1?'y':'ies'}${move.castles?` · ${move.castles} castle${move.castles>1?'s':''}`:''}`; li.append(title,detail); $('log').append(li); });
}
function choose(id) {
  if (state.over || !id || id===path.at(-1)) return;
  if (path.length>1 && id===path.at(-2)) delete jokerLetters[path.pop()];
  else { const error=Engine.validatePath(state,[...path,id],config,false); if(error){$('status').textContent=error;return;} path.push(id); }
  $('status').textContent=''; drawBoard(); renderJokers(); selectionChanged();
}
const tileAt = (x,y) => document.elementFromPoint(x,y)?.closest('[data-id]')?.dataset.id;
$('board').addEventListener('pointerdown',e=>{if(e.button!==0 || activePointer!==null)return; const id=tileAt(e.clientX,e.clientY);if(!id)return;e.preventDefault();activePointer=e.pointerId;dragging=true;$('board').setPointerCapture(e.pointerId);choose(id);});
$('board').addEventListener('pointermove',e=>{if(dragging && e.pointerId===activePointer)choose(tileAt(e.clientX,e.clientY));});
function stopDrag(){dragging=false;activePointer=null;}
$('board').addEventListener('pointerup',stopDrag); $('board').addEventListener('pointercancel',stopDrag); $('board').addEventListener('lostpointercapture',stopDrag);
$('board').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();const id=e.target.dataset.id;choose(id);Array.from($('board').querySelectorAll('[data-id]')).find(el=>el.dataset.id===id)?.focus();}});
$('cancel').addEventListener('click',()=>{path=[];jokerLetters={};$('status').textContent='';drawBoard();renderJokers();selectionChanged();});
$('submit').addEventListener('click',()=>{
  const result=Engine.submit(state,path,config,dictionary,jokerLetters);
  if(result.error){$('status').textContent=result.error;return;}
  const player=state.player;state=result.state;path=[];jokerLetters={};render(result.captured);
  $('status').textContent=state.over?`${$('turn').textContent} Final score: ${Engine.scores(state,config).join(' – ')}.`:`Player ${player} captured ${result.captured.length} territories. Pass to Player ${state.player}.`;
});
$('reset').addEventListener('click',()=>{if(state.log.length && !state.over && !window.confirm('End this game and generate a new board?'))return;state=Engine.newGame(config);path=[];jokerLetters={};stopDrag();$('status').textContent='New map. Player 1 begins.';render();});
$('dictionary').textContent=config.dictionaryEnabled?'Dictionary validation enabled.':'DEVELOPMENT MODE · Dictionary validation is OFF. Any valid path of 3+ letters counts.';
$('castle-value').textContent=config.castlePoints;
$('rules').textContent=`Start on your territory. Move in any of 8 directions, including diagonals across the small gaps. Connect at least ${config.minimumWordLength} letters without repeating a tile. Use up to ${config.maxEnemyTilesPerWord} enemy tile per word. Every neutral or enemy tile you use becomes yours. Normal territory is worth ${config.normalTerritoryPoints} point; castles are worth ${config.castlePoints}. Each player gets ${config.turnsPerPlayer} turns.`;
render();
