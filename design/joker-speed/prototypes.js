/* Standalone design studies: fictional fixtures, no accounts or network calls. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const all = selector => [...document.querySelectorAll(selector)];
  const icons = {
    back: 'm15 5-7 7 7 7', arrow: 'M5 12h14m-6-6 6 6-6 6',
    close: 'm6 6 12 12M18 6 6 18', reset: 'M4 10a8 8 0 1 1 1 8M4 4v6h6', check: 'm5 12 4 4L19 6'
  };
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[name]}"/></svg>`;
  const logo = '<svg class="monogram" viewBox="0 0 108 108" aria-hidden="true"><path d="M76 33 C58 19 32 29 28 50 C23 74 49 89 72 77 M43 43 L50 68 L59 48 L67 68 L75 43"/></svg>';
  const concepts = [
    {name:'Open lens', file:'01-open-lens.html', short:'See it. Tap it.', description:'Keep the lens. Put the whole alphabet beneath it.', detail:'One tap · Alphabetical order', badge:'Start here'},
    {name:'Word keys', file:'02-word-keys.html', short:'A familiar place for every letter.', description:'A quiet keyboard, built into the word you’re making.', detail:'One tap · Familiar keyboard layout'},
    {name:'Big letters', file:'03-big-letters.html', short:'Less precision. Bigger targets.', description:'Choose a small letter group, then a generous letter tile.', detail:'Two taps · Extra-large choices'}
  ];
  const option = Number(document.body.dataset.option || 0);
  const root = $('#app');
  function artwork(n) {
    const tile = (x,y,w,h,l,selected=false) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w>50?14:7}" fill="${selected?'#d0ddbf':'#fffdf7'}" stroke="${selected?'#65815b':'#d8dbcc'}"/><text x="${x+w/2}" y="${y+h/2+1}" dominant-baseline="middle" text-anchor="middle" font-family="Georgia,serif" font-size="${w>50?32:18}" fill="#385340">${l}</text>`;
    let content = '';
    if(n===1) {
      content = tile(119,15,62,62,'O',true);
      [...'ABCDEFGHIJKLMNOPQR'].forEach((l,i)=>content+=tile(43+(i%6)*37,97+Math.floor(i/6)*35,31,29,l,l==='O'));
    } else if(n===2) {
      [...'WORD'].forEach((l,i)=>content+=tile(67+i*43,20,37,45,l,l==='O'));
      ['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'].forEach((row,r)=>[...row].forEach((l,i)=>content+=tile((300-row.length*26)/2+i*26,95+r*35,22,29,l,l==='O')));
    } else {
      content = tile(32,27,76,59,'K–O',true)+`<path d="M127 57h31m-7-7 7 7-7 7" fill="none" stroke="#9aab8e" stroke-width="2"/>`;
      [...'KLMNO'].forEach((l,i)=>content+=tile(121+(i%3)*51,96+Math.floor(i/3)*53,44,46,l,l==='O'));
    }
    return `<svg viewBox="0 0 300 230" aria-hidden="true">${content}</svg>`;
  }
  if(!option) {
    root.innerHTML = `<header class="gallery-header"><a class="brand" href="index.html">${logo}<span>Word Conquest</span></a><span class="edition">Joker studies / 02</span></header>
      <main class="gallery"><p class="eyebrow">Three faster ways to choose</p><h1>Find your letter.<br>Keep your flow.</h1><p class="intro">The lens felt right. The scrolling didn’t.<br>Try three ways to get straight to your letter.</p>
      <div class="concepts">${concepts.map((c,i)=>`<a class="concept" href="${c.file}"><div class="concept-art">${artwork(i+1)}</div><div class="concept-copy"><div class="concept-title"><span class="number">0${i+1}</span><h2>${c.name}</h2>${c.badge?`<span class="badge">${c.badge}</span>`:''}</div><p>${c.description}</p><div class="concept-meta">${c.detail}</div><div class="try">Try it ${icon('arrow')}</div></div></a>`).join('')}</div><footer class="gallery-footer">English + Svenska · One or two jokers<br>Interactive design previews. Your games stay as they are.</footer></main>`;
    return;
  }
  const concept = concepts[option-1];
  const params = new URLSearchParams(location.search);
  let language = params.get('lang')==='sv'?'sv':'en';
  let two = params.get('two')==='1';
  let assignments = {}, active = null, group = null, played = false, returnId = null;
  const sample = () => window.JOKER_DEMO[language+(two?'2':'1')];
  const alphabet = () => language==='sv'?'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ':'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const groups = () => language==='sv'?['ABCDE','FGHIJ','KLMNO','PQRST','UVWXYZ','ÅÄÖ']:['ABCDE','FGHIJ','KLMNO','PQRST','UVWXYZ'];
  const pending = () => sample().jokers.filter(id=>!assignments[id]);
  const tile = id => sample().tiles.find(t=>t.id===id);
  const word = () => sample().path.map(id=>sample().jokers.includes(id)?assignments[id]||'·':tile(id).letter).join('');
  const valid = () => !pending().length && sample().words.includes(word());
  root.innerHTML = `<main class="demo"><header class="demo-header"><a class="icon-button" href="index.html" aria-label="All designs">${icon('back')}</a><h1>${concept.name}</h1><nav aria-label="Choose design">${concepts.map((c,i)=>`<a data-concept="${i+1}" href="${c.file}" ${i+1===option?'aria-current="page"':''} aria-label="${i+1}. ${c.name}">${i+1}</a>`).join('')}</nav></header>
    <div class="demo-controls"><div class="language" role="group" aria-label="Game language"><button data-language="en">EN</button><button data-language="sv">SV</button></div><button id="two-jokers" aria-pressed="false"><span class="toggle" aria-hidden="true"></span>2 jokers</button><button class="icon-button" data-action="reset" aria-label="Start again">${icon('reset')}</button></div><section id="game" aria-label="Fictional game preview"></section><p class="demo-footnote">Design preview · ${concept.detail}</p></main><div class="sr-only" role="status" aria-live="polite" id="announcement"></div>`;
  const dialog = document.createElement('dialog');
  dialog.className = `picker picker-${option}`;
  dialog.setAttribute('aria-labelledby','picker-title');
  document.body.append(dialog);
  const announce = text => { $('#announcement').textContent=text; };
  function wordSlots(inPicker=false) {
    return sample().path.map(id=>sample().jokers.includes(id)?`<button class="word-joker ${assignments[id]?'assigned':''} ${inPicker&&id===active?'current':''}" data-joker="${id}" aria-label="${assignments[id]?'Change joker '+assignments[id]:'Choose joker '+(sample().jokers.indexOf(id)+1)}" ${played?'disabled':''}>${assignments[id]||'<span class="empty-slot" aria-hidden="true"></span>'}</button>`:`<span class="word-letter">${tile(id).letter}</span>`).join('');
  }
  function board() {
    const s=sample();
    return `<svg class="game-board" viewBox="-295 -295 590 590" role="group" aria-label="Game board. Tap a blank joker or choose a letter below.">${s.tiles.map(t=>{
      const wild=s.jokers.includes(t.id),selected=s.path.includes(t.id),owner=played&&selected?1:t.owner;
      const letter=wild?(assignments[t.id]||''):t.letter==='?'?'':t.letter;
      return `<g class="tile owner${owner} ${selected?'selected':''} ${wild?'joker':''} ${t.castle?'castle':''}" ${wild&&!played?`data-joker="${t.id}" tabindex="0" role="button" aria-label="${assignments[t.id]?'Joker '+assignments[t.id]+', change letter':'Blank joker, choose letter'}"`:''}>
        <polygon points="${t.points}"/>${t.castle?`<path class="battlement" d="M${t.q*64-16} ${t.r*64-29}v-7h7v4h7v-7h7v7h7v-4h7v7"/>`:''}<text x="${t.q*64}" y="${t.r*64+3}">${letter}</text><text class="tile-value" x="${t.q*64}" y="${t.r*64+20}">${wild?0:t.value}</text>${wild?`<rect class="tile-hit" x="${t.q*64-30}" y="${t.r*64-30}" width="60" height="60"/>`:''}</g>`;
    }).join('')}</svg>`;
  }
  function renderGame() {
    all('[data-language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.language===language)));
    $('#two-jokers').setAttribute('aria-pressed',String(two));
    all('[data-concept]').forEach(a=>{ a.href=concepts[Number(a.dataset.concept)-1].file+`?lang=${language}&two=${two?1:0}`; });
    try { history.replaceState(null,'',`?lang=${language}&two=${two?1:0}`); } catch {} // file:// is supported.
    const s=sample();
    $('#game').innerHTML=`<div class="score-row"><div class="score mine"><span><i></i>You</span><strong>${84+(played?s.totalGain:0)}</strong></div><div class="score opponent"><span><i></i>Alex</span><strong>${79-(played?s.enemyLoss:0)}</strong></div></div><div class="turn-row"><strong>${played?'Alex’s turn':'Your turn'}</strong><span>${language==='sv'?'Svenska':'English'} · Round 7</span></div><div class="board-area">${board()}</div><div class="composer"><div class="word" aria-label="Your word ${word()}">${wordSlots()}</div><div class="word-status">${played?'Word played':pending().length?'Tap a blank to choose its letter':valid()?`+${s.totalGain} points`:'Try another letter'}</div><button class="primary" data-action="${played?'reset':pending().length?'choose':'play'}" ${!played&&!pending().length&&!valid()?'disabled':''}>${played?'Try again':pending().length?'Choose a letter':'Play '+word()} ${icon(played?'reset':'arrow')}</button></div>`;
  }
  function key(letter,extra='') {
    return `<button class="letter-key ${extra} ${assignments[active]===letter?'chosen':''}" data-letter="${letter}" aria-label="Choose ${letter}">${letter}</button>`;
  }
  function neighborhood() {
    const center=tile(active);
    return `<div class="lens-stage"><svg viewBox="-135 -57 270 114" aria-hidden="true">${sample().tiles.filter(t=>t.r===center.r&&Math.abs(t.q-center.q)<=2&&t.id!==active).map(t=>`<g transform="translate(${(t.q-center.q)*66} 0)"><rect x="-25" y="-25" width="50" height="50" rx="12" class="neighbor owner${t.owner}"/><text y="8" text-anchor="middle">${t.letter==='?'?(assignments[t.id]||''):t.letter}</text></g>`).join('')}</svg><div class="hero-tile"><span id="hero-letter">${assignments[active]||''}</span><small>0</small></div></div>`;
  }
  function pickerContent() {
    if(option===1) return `${neighborhood()}<div class="picker-word" aria-label="Word preview">${wordSlots(true)}</div><div class="alphabet-grid" role="group" aria-label="Choose a letter">${[...alphabet()].map(l=>key(l)).join('')}</div>`;
    if(option===2) {
      const rows=['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'];
      return `<div class="keyboard-word" aria-label="Word preview">${wordSlots(true)}</div><div class="keyboard" role="group" aria-label="Letter keyboard">${language==='sv'?`<div class="key-row nordic">${[...'ÅÄÖ'].map(l=>key(l)).join('')}</div>`:''}${rows.map(row=>`<div class="key-row">${[...row].map(l=>key(l)).join('')}</div>`).join('')}</div>`;
    }
    return `<div class="group-word" aria-label="Word preview">${wordSlots(true)}</div><div class="group-label">${group!==null?`<button data-action="groups">${icon('back')} All letters</button><span>${groups()[group].at(0)}–${groups()[group].at(-1)}</span>`:'<span>Choose a group</span><span>Then a letter</span>'}</div><div class="group-area">${group!==null?`<div class="big-grid" role="group" aria-label="Letters ${groups()[group]}">${[...groups()[group]].map(l=>key(l,'big-key')).join('')}</div>`:`<div class="group-grid" role="group" aria-label="Letter groups">${groups().map((letters,i)=>`<button class="group-key" data-group="${i}"><strong>${letters.length===3?letters:letters.at(0)+'–'+letters.at(-1)}</strong><span>${letters.length===3?'Swedish letters':[...letters].join(' ')}</span></button>`).join('')}</div>`}</div>`;
  }
  function renderPicker() {
    dialog.innerHTML=`<div class="sheet-handle" aria-hidden="true"></div><header class="picker-heading"><div><span class="picker-kicker">${concept.name}${two?' · Joker '+(sample().jokers.indexOf(active)+1)+' of 2':''}</span><h2 id="picker-title">${option===2?'Complete your word.':'Choose a letter.'}</h2></div><button class="icon-button" data-action="close" aria-label="Close letter picker">${icon('close')}</button></header>${pickerContent()}<p class="picker-hint">${option===3&&group===null?'Big choices. No scrolling.':'Tap a letter to place it.'}</p>`;
    const first=dialog.querySelector('[data-letter].chosen')||dialog.querySelector('[data-letter]')||dialog.querySelector('[data-group]');
    first?.focus({preventScroll:true});
  }
  function open(id) {
    if(played||!sample().jokers.includes(id))return;
    active=id;returnId=id;group=null;
    renderPicker();
    if(!dialog.open){document.body.classList.add('picker-open');dialog.showModal();}
    const first=dialog.querySelector('[data-letter].chosen')||dialog.querySelector('[data-letter]')||dialog.querySelector('[data-group]');
    first?.focus({preventScroll:true});
  }
  function close() {
    if(dialog.open)dialog.close();
    active=null;group=null;document.body.classList.remove('picker-open');
    all('#game .word-joker').find(b=>b.dataset.joker===returnId)?.focus({preventScroll:true});
  }
  function fly(letter,rect,id) {
    const target=all('#game .word-joker').find(b=>b.dataset.joker===id);
    if(!rect||!target||!Element.prototype.animate||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const end=target.getBoundingClientRect(),ghost=document.createElement('span');
    ghost.className='letter-flight';ghost.textContent=letter;
    Object.assign(ghost.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});
    document.body.append(ghost);
    const dx=end.left+end.width/2-rect.left-rect.width/2,dy=end.top+end.height/2-rect.top-rect.height/2;
    ghost.animate([{opacity:1,transform:'translate(0,0) scale(1)'},{opacity:0,transform:`translate(${dx}px,${dy}px) scale(.8)`}],{duration:230,easing:'cubic-bezier(.2,.7,.2,1)'}).finished.catch(()=>{}).finally(()=>ghost.remove());
  }
  function choose(letter,source) {
    if(!active||!alphabet().includes(letter))return;
    const id=active,rect=source?.getBoundingClientRect();
    assignments[id]=letter;
    const next=pending()[0];
    renderGame();
    if(next){active=next;returnId=next;group=null;renderPicker();announce(letter+' placed. Choose the next joker.');}
    else {close();fly(letter,rect,id);announce(letter+' placed. '+word()+'.');}
  }
  function reset(shouldOpen=true) { close();assignments={};played=false;renderGame();if(shouldOpen)open(sample().jokers[0]); }
  function click(e) {
    const b=e.target.closest('button,[data-joker]');
    if(!b||b.disabled)return;
    if(b.dataset.letter)return choose(b.dataset.letter,b);
    if(b.dataset.joker)return open(b.dataset.joker);
    if(b.dataset.group!==undefined){group=Number(b.dataset.group);renderPicker();return;}
    if(b.dataset.language){language=b.dataset.language;reset(false);return;}
    if(b.id==='two-jokers'){two=!two;reset(false);return;}
    switch(b.dataset.action){
      case 'close': close();break;
      case 'groups': group=null;renderPicker();break;
      case 'reset': reset();break;
      case 'choose': open(pending()[0]);break;
      case 'play': if(valid()){played=true;renderGame();announce(word()+' played.');}break;
    }
  }
  document.addEventListener('click',click);
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  dialog.addEventListener('close',()=>{if(!dialog.open){document.body.classList.remove('picker-open');active=null;group=null;}});
  dialog.addEventListener('click',e=>{
    if(e.target!==dialog)return;
    const r=dialog.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();
  });
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey||e.isComposing)return;
    if(dialog.open&&alphabet().includes(e.key.toUpperCase())&&[...e.key].length===1){e.preventDefault();choose(e.key.toUpperCase());}
    else if(!dialog.open&&(e.key==='Enter'||e.key===' ')&&e.target.matches('.tile[data-joker]')){e.preventDefault();open(e.target.dataset.joker);}
  });
  // Mouse hover previews the enlarged tile; touch never waits for a hover/confirmation.
  dialog.addEventListener('pointerover',e=>{
    if(e.pointerType==='touch')return;
    const key=e.target.closest('[data-letter]'),hero=$('#hero-letter');
    if(key&&hero)hero.textContent=key.dataset.letter;
  });
  dialog.addEventListener('pointerleave',()=>{const hero=$('#hero-letter');if(hero)hero.textContent=assignments[active]||'';});
  renderGame();
  open(sample().jokers[0]);
})();
