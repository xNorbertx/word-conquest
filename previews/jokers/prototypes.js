/* Offline interaction studies. No accounts, network requests or saved games. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
  const paths={back:'m15 5-7 7 7 7',arrow:'M5 12h14m-6-6 6 6-6 6',close:'m6 6 12 12M18 6 6 18',reset:'M4 10a8 8 0 1 1 1 8M4 4v6h6',check:'m5 12 4 4L19 6',left:'m14 7-5 5 5 5',right:'m10 7 5 5-5 5'};
  const icon=name=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]||paths.arrow}"/></svg>`;
  const markPaths={asterisk:'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9',infinity:'M12 12C8 5 3 7 3 12s5 7 9 0c4-7 9-5 9 0s-5 7-9 0Z',stack:'M7 5V3h13v14h-2M4 7h12v14H4zM8 11h4m-4 6h4m-2-6v6'};
  const mark=(name,extra='')=>`<svg class="wild-mark ${extra}" viewBox="0 0 24 24" aria-hidden="true"><path d="${markPaths[name]}"/></svg>`;
  const logo=`<svg class="monogram" viewBox="0 0 108 108" aria-hidden="true"><path d="M76 33 C58 19 32 29 28 50 C23 74 49 89 72 77" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M43 43 L50 68 L59 48 L67 68 L75 43" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const concepts=[
    {id:1,name:'Tile bloom',file:'01-tile-bloom.html',symbol:'asterisk',description:'A small circle of letters blooms from the tile. Choose one and it settles straight onto the board.',note:'Tap a letter. Open A–Z for the full alphabet.',benefit:'The choice stays where your eyes already are.',cost:'A small part of the board is covered while you choose.'},
    {id:2,name:'Word dock',file:'02-word-dock.html',symbol:'infinity',description:'The joker becomes a slot in your word. A quiet letter pad slides in below it, within easy thumb reach.',note:'Pick a letter below the word. Two jokers advance automatically.',benefit:'The quickest route through a word with two jokers.',cost:'The board makes a little room for the letter pad.'},
    {id:3,name:'Letter lens',file:'03-letter-lens.html',symbol:'stack',description:'Bring the tile closer. Slide through the alphabet, see the letter in your word, then place it.',note:'Swipe the alphabet or tap a letter, then choose Use letter.',benefit:'An unhurried, tactile way to explore a choice.',cost:'One extra confirmation; faraway letters take more swiping.'}
  ];
  const header=()=>`<header class="studio-header"><a class="studio-brand" href="index.html">${logo}Word Conquest</a><span class="studio-meta">Joker studies · 01—03</span></header>`;
  function art(id){
    const tile=(x,y,l,fill='#ede9dc')=>`<rect x="${x}" y="${y}" width="48" height="48" rx="12" fill="${fill}" stroke="#c1c9b5"/><text x="${x+24}" y="${y+32}" font-family="Georgia" font-size="26" text-anchor="middle" fill="#385340">${l}</text>`;
    let svg='';
    if(id===1){svg=tile(126,91,'','#385340')+`<g transform="translate(138 103)" stroke="#fffdf7" stroke-width="2" fill="none" stroke-linecap="round"><path d="${markPaths.asterisk}"/></g>`;for(const [i,l]of [...'AEIOUY'].entries()){const a=(i*60-90)*Math.PI/180,x=150+81*Math.cos(a),y=115+81*Math.sin(a);svg+=`<circle cx="${x}" cy="${y}" r="22" fill="#fffdf7" stroke="#d5dccb"/><text x="${x}" y="${y+8}" font-family="Georgia" font-size="23" text-anchor="middle" fill="#385340">${l}</text>`;}}
    if(id===2){svg=tile(40,39,'W')+tile(96,39,'∞','#d0debf')+tile(152,39,'R')+tile(208,39,'D');svg+=`<path d="M106 97h28" stroke="#385340" stroke-width="2"/><rect x="24" y="120" width="252" height="96" rx="16" fill="#e1e8d8"/>`;[...'ABCDEFGHIJKLMN'].forEach((l,i)=>{const x=36+i%7*34,y=130+Math.floor(i/7)*38;svg+=`<rect x="${x}" y="${y}" width="28" height="32" rx="6" fill="#fffdf7"/><text x="${x+14}" y="${y+22}" font-family="Georgia" font-size="17" text-anchor="middle" fill="#385340">${l}</text>`;});}
    if(id===3){svg=tile(49,60,'W')+tile(203,60,'R')+`<rect x="111" y="45" width="78" height="78" rx="22" fill="#c6d5b4" stroke="#57724a" stroke-width="2"/><text x="150" y="98" font-family="Georgia" font-size="48" text-anchor="middle" fill="#385340">O</text><rect x="128" y="155" width="44" height="49" rx="11" fill="#dfe8d4" stroke="#a7bb93"/>`;[...'LMNOPQR'].forEach((l,i)=>svg+=`<text x="${42+i*36}" y="187" font-family="Georgia" font-size="${l==='O'?28:22}" text-anchor="middle" fill="${l==='O'?'#385340':'#909782'}">${l}</text>`);}
    return `<svg viewBox="0 0 300 240" aria-hidden="true">${svg}</svg>`;
  }
  const root=$('#app'),variant=Number(document.body.dataset.option);
  if(!variant){root.innerHTML=header()+`<main class="gallery"><div class="gallery-intro"><div><p class="eyebrow">Three ways to choose</p><h1>One tile.<br>Every possibility.</h1></div><p>Less form filling. More word finding.<br>Three playable ideas for a joker that belongs on the board.</p></div><div class="concepts">${concepts.map(c=>`<a class="concept-card" href="${c.file}"><div class="concept-art">${art(c.id)}</div><div class="concept-copy"><div class="concept-top"><span class="concept-number">0${c.id}</span><h2>${c.name}</h2></div><p>${c.benefit}</p><div class="concept-link">Try the prototype ${icon('arrow')}</div></div></a>`).join('')}</div><footer class="gallery-footer"><p>Same board. Three interactions. <strong>No keyboard needed.</strong></p><p>English + Svenska · One or two jokers · Three interchangeable symbols</p></footer></main>`;return;}
  const concept=concepts[variant-1],params=new URLSearchParams(location.search);
  let language=params.get('lang')==='sv'?'sv':'en',two=params.get('two')==='1';
  let symbol=Object.hasOwn(markPaths,params.get('symbol'))?params.get('symbol'):concept.symbol;
  let letters={},active=null,candidate='',expanded=false,played=false,pulse=null,railTimer=0,returnFocus=null;
  let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sample=()=>window.JOKER_DEMO[language+(two?'2':'1')];
  const alphabet=()=>language==='sv'?'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ':'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const pending=()=>sample().jokers.filter(id=>!letters[id]);
  const word=()=>sample().path.map(id=>sample().jokers.includes(id)?letters[id]||'·':sample().tiles.find(t=>t.id===id).letter).join('');
  const valid=()=>!pending().length&&sample().words.includes(word());
  const point=id=>{const t=sample().tiles.find(t=>t.id===id);return{x:(t.q*64+295)/590,y:(t.r*64+295)/590};};
  root.innerHTML=header()+`<main class="study"><aside class="study-notes"><a class="all-concepts" href="index.html">${icon('back')}All concepts</a><p class="eyebrow">Interaction 0${variant}</p><h1>${concept.name}</h1><p class="study-description">${concept.description}</p><p class="interaction-note">${concept.note}</p><div class="study-controls"><div class="control-row"><span>Language</span><div class="segmented" role="group" aria-label="Game language"><button data-language="en">English</button><button data-language="sv">Svenska</button></div></div><div class="control-row"><label><input id="two-jokers" type="checkbox">Two jokers</label></div><div class="control-row"><span>Tile mark</span><div class="segmented symbol-controls" role="group" aria-label="Joker symbol">${Object.keys(markPaths).map(s=>`<button data-symbol="${s}" aria-label="${s==='asterisk'?'Asterisk':s==='infinity'?'Infinity':'Layered tiles'}">${mark(s)}</button>`).join('')}</div></div><div class="control-row"><label><input id="reduced-motion" type="checkbox">Less motion</label></div><button class="reset" data-action="reset">${icon('reset')}Start again</button></div><nav class="study-pager" aria-label="Prototype">${concepts.map(c=>`<a data-concept="${c.id}" href="${c.file}" ${c.id===variant?'aria-current="page"':''}>0${c.id}</a>`).join('')}</nav><p class="prototype-note">${concept.cost}<br><br>Design demo · Fixed word path, fictional game.<br>Choose letters, edit them, and play the sample turn.</p></aside><div class="phone-wrap"><section id="phone" class="phone variant-${variant}" aria-label="${concept.name} playable prototype"></section><p class="phone-caption">0${variant} / ${concept.name} · Interactive study</p></div></main><div class="sr-only" role="status" aria-live="polite" id="announcement"></div>`;
  const phone=$('#phone');
  function controls(){
    all('[data-language]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.language===language));
    all('[data-symbol]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.symbol===symbol));
    $('#two-jokers').checked=two;$('#reduced-motion').checked=reduced;document.body.classList.toggle('motion-off',reduced);
    all('[data-concept]').forEach(a=>{a.href=concepts[Number(a.dataset.concept)-1].file+`?lang=${language}&two=${two?1:0}`;});
    try{history.replaceState(null,'',`?lang=${language}&two=${two?1:0}&symbol=${symbol}`);}catch{} // Also works from file://.
  }
  function board(){
    const s=sample();
    const path=s.path.map(id=>s.tiles.find(t=>t.id===id));
    const links=path.slice(1).map((b,i)=>{const a=path[i];return`M${a.q*64+17} ${a.r*64}L${b.q*64-17} ${b.r*64}`;}).join(' ');
    return `<svg class="game-board" viewBox="-295 -295 590 590" role="group" aria-label="Game board. Select a joker to choose its letter.">${s.tiles.map(t=>{
      const selected=s.path.includes(t.id),wild=s.jokers.includes(t.id),value=wild?letters[t.id]:t.letter,chosen=!!value&&wild;
      const label=wild?`Joker ${s.jokers.indexOf(t.id)+1}${value?': '+value:', choose a letter'}`:'';
      const ownership=played&&selected?1:t.owner;
      return `<g class="tile owner${ownership}${selected?' selected':''}${t.castle?' castle':''}${wild?' joker':''}${active===t.id?' active-joker':''}${pulse===t.id?' board-pulse':''}" ${wild&&!played?`data-joker="${t.id}" role="button" tabindex="0" aria-label="${label}" aria-haspopup="dialog" aria-expanded="${active===t.id}"`:'aria-hidden="true"'}><polygon points="${t.points}"/>${selected?`<text class="path-step" x="${t.q*64-19}" y="${t.r*64-18}">${s.path.indexOf(t.id)+1}</text>`:''}${wild&&!value?`<g transform="translate(${t.q*64-14} ${t.r*64-19}) scale(1.17)">${mark(symbol)}</g>`:t.letter==='?'&&!wild?`<g transform="translate(${t.q*64-12} ${t.r*64-17})">${mark(symbol)}</g>`:`<text x="${t.q*64}" y="${t.r*64+3}">${value}</text>`}<text class="tile-value" x="${t.q*64}" y="${t.r*64+20}">${wild?0:t.value}</text>${chosen?`<g class="small-wild" transform="translate(${t.q*64+13} ${t.r*64-24}) scale(.42)">${mark(symbol)}</g>`:''}${wild&&!played?`<rect class="tile-hit" x="${t.q*64-30}" y="${t.r*64-30}" width="60" height="60" rx="12"/>`:''}</g>`;
    }).join('')}<path class="selection-path" d="${links}"/></svg>`;
  }
  function wordSlots(){return sample().path.map(id=>sample().jokers.includes(id)?`<button class="word-joker ${letters[id]?'chosen':''} ${active===id?'active':''}" data-joker="${id}" aria-label="${letters[id]?'Change joker '+letters[id]:'Choose joker letter'}" aria-haspopup="dialog" aria-expanded="${active===id}">${letters[id]||mark(symbol)}</button>`:`<span>${sample().tiles.find(t=>t.id===id).letter}</span>`).join('');}
  const grid=()=>`<div class="letter-grid" role="group" aria-label="Alphabet">${[...alphabet()].map(l=>`<button class="letter-key" data-letter="${l}" aria-label="Choose ${l}" aria-pressed="${letters[active]===l}">${l}</button>`).join('')}</div>`;
  const closeButton=()=>`<button class="icon-button" data-action="close" aria-label="Close letter picker">${icon('close')}</button>`;
  function bloom(){
    if(!active)return'';
    if(expanded)return`<div class="bloom-layer chooser" role="dialog" aria-label="Choose a joker letter"><div class="alphabet-popover"><div class="picker-heading"><h2>Any letter.</h2>${closeButton()}</div>${grid()}</div></div>`;
    const quick=language==='sv'?'AEIOUÅÄÖ':'AEIOUYRS';
    return `<div class="bloom-layer chooser" role="dialog" aria-label="Choose a joker letter"><div class="bloom-shell"><div class="bloom-core">${letters[active]||mark(symbol)}</div>${[...quick].map((l,i)=>{const angle=(i*45-90)*Math.PI/180;return`<button class="bloom-key ${letters[active]===l?'chosen':''}" style="--x:${Math.cos(angle)*89}px;--y:${Math.sin(angle)*89}px" data-letter="${l}" aria-label="Choose ${l}">${l}</button>`;}).join('')}<button class="bloom-all" data-action="expand">${language==='sv'?'A–Ö':'A–Z'} · All letters</button><button class="bloom-close" data-action="close" aria-label="Close letter picker">${icon('close')}</button></div></div>`;
  }
  function dock(){return active?`<section class="word-dock chooser" role="dialog" aria-label="Choose a joker letter"><div class="picker-heading"><h2>${pending().length>1?'Choose your letters':'Choose a letter'}</h2><button class="done" data-action="close">Done</button></div>${grid()}</section>`:'';}
  function lensWord(){return sample().path.map(id=>id===active?`<strong>${candidate}</strong>`:sample().jokers.includes(id)?letters[id]||'·':sample().tiles.find(t=>t.id===id).letter).join('');}
  function lens(){
    const s=sample(),t=s.tiles.find(t=>t.id===active);
    const context=s.tiles.filter(n=>Math.abs(n.q-t.q)<=1&&Math.abs(n.r-t.r)<=1&&n.id!==t.id).map(n=>`<g transform="translate(${(n.q-t.q)*57} ${(n.r-t.r)*57})"><rect x="-24" y="-24" width="48" height="48" rx="12" fill="${n.owner===1?'#c6d1b5':n.owner===2?'#cfbdac':'#efecdf'}" stroke="#c3c6b8"/><text y="8" text-anchor="middle" font-family="Georgia" font-size="24" fill="#526048">${n.letter==='?'?'·':n.letter}</text></g>`).join('');
    return `<div class="lens-overlay" data-backdrop><section class="lens-sheet chooser" role="dialog" aria-modal="true" aria-label="Choose a joker letter"><div class="sheet-handle"></div><div class="picker-heading"><h2>Make it yours.</h2>${closeButton()}</div><div class="lens-context"><svg viewBox="-130 -85 260 170" aria-hidden="true">${context}</svg><div class="lens-tile"><span class="lens-letter">${candidate}</span><small>0</small></div></div><div class="lens-word" aria-hidden="true">${lensWord()}</div><div class="rail-wrap"><div class="rail-window"></div><div class="letter-rail" role="group" aria-label="Swipe or choose a letter">${[...alphabet()].map(l=>`<button class="rail-letter" data-preview="${l}" aria-label="Preview ${l}" aria-pressed="${candidate===l}">${l}</button>`).join('')}</div></div><div class="rail-controls"><button class="icon-button" data-step="-1" aria-label="Previous letter">${icon('left')}</button><span>Slide to choose</span><button class="icon-button" data-step="1" aria-label="Next letter">${icon('right')}</button></div><button class="play" data-action="use" style="margin-top:15px">Use ${candidate}${icon('check')}</button></section></div>`;
  }
  function render(){
    clearTimeout(railTimer);controls();phone.classList.toggle('choosing',!!active);
    const s=sample(),remaining=pending().length,can=valid(),label=remaining?`Choose ${remaining===1?'a letter':'two letters'}`:can?`${s.wordPoints} word + ${s.territoryGain} territory`:'Try another letter';
    phone.innerHTML=`<div class="game-surface" ${active&&variant===3?'inert':''}><header class="appbar"><a href="index.html" class="icon-button" aria-label="Back to concepts">${icon('back')}</a><div class="app-title">Alex<span class="app-subtitle">${language==='sv'?'Svenska':'English'} · Round 7</span></div><span class="small-brand">${logo}</span></header><div class="scores"><div class="score-card mine"><span class="score-name"><i class="dot"></i>You</span><span class="score-value">${84+(played?s.totalGain:0)}</span></div><div class="score-card"><span class="score-name"><i class="dot opponent"></i>Alex</span><span class="score-value">${79-(played?s.enemyLoss:0)}</span></div></div><div class="turn-row"><strong>${played?"Alex’s turn":'Your turn'}</strong><span>48 letters left</span></div><div class="board-area">${board()}${variant===1?bloom():''}</div><section class="composer" aria-label="Your word">${played?`<div class="afterword">${icon('check')}<h2>${word()} played.</h2><p>+${s.totalGain} points</p><button data-action="reset">Try again ${icon('reset')}</button></div>`:`<div class="word-row"><div style="width:36px"></div><div class="word" aria-label="Selected word ${word()}">${wordSlots()}</div><button class="icon-button" data-action="clear" aria-label="Clear joker letters">${icon('reset')}</button></div><p class="word-note">${label}</p>${variant===2?dock():''}<button class="play" data-action="play" ${can?'':'disabled'}>${can?`Play ${word()} · +${s.totalGain}`:'Choose your joker'+(two?'s':'')}${icon('arrow')}</button>`}</section><div class="mini-legend">${mark(symbol)}<span>Any letter · 0 letter points</span></div></div>${active&&variant===3?lens():''}`;
    if(variant===1&&active&&!expanded){const area=$('.board-area'),shell=$('.bloom-shell'),p=point(active),w=area.clientWidth,size=w<300?260:266;shell.style.left=Math.max(0,Math.min(w-size,p.x*w-size/2))+'px';shell.style.top=Math.max(0,Math.min(w-size-39,p.y*w-size/2))+'px';}
    if(variant===3&&active){const rail=$('.letter-rail');rail.scrollLeft=[...alphabet()].indexOf(candidate)*52;rail.addEventListener('scroll',()=>{clearTimeout(railTimer);railTimer=setTimeout(()=>{if(active&&$('.letter-rail')===rail)previewLetter(alphabet()[Math.max(0,Math.min(alphabet().length-1,Math.round(rail.scrollLeft/52)))],false);},65);});}
    pulse=null;
  }
  function announce(text){$('#announcement').textContent=text;}
  function focusChoice(){const target=variant===3?$('.rail-letter[aria-pressed="true"]'):$('.chooser [data-letter]');target?.focus({preventScroll:true});}
  function open(id,focus=true){if(played)return;active=id;expanded=false;candidate=letters[id]||sample().solution[sample().path.indexOf(id)];returnFocus=id;render();if(focus)focusChoice();}
  function close(){active=null;expanded=false;render();all('[data-joker]').find(n=>n.dataset.joker===returnFocus)?.focus({preventScroll:true});}
  function fly(letter,rect,id){
    if(reduced||!rect||!Element.prototype.animate)return;
    const target=all('.tile[data-joker]').find(n=>n.dataset.joker===id);if(!target)return;const end=target.getBoundingClientRect();
    const ghost=document.createElement('span');ghost.className='letter-flight';ghost.textContent=letter;ghost.style.left=rect.left+rect.width/2-22.5+'px';ghost.style.top=rect.top+rect.height/2-22.5+'px';document.body.append(ghost);
    const dx=end.left+end.width/2-rect.left-rect.width/2,dy=end.top+end.height/2-rect.top-rect.height/2;
    ghost.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx}px,${dy}px) scale(.65)`,opacity:0}],{duration:360,easing:'cubic-bezier(.2,.7,.2,1)'}).finished.then(()=>ghost.remove(),()=>ghost.remove());
  }
  function choose(letter,source){
    if(!active||!alphabet().includes(letter))return;const id=active,rect=source?.getBoundingClientRect();letters[id]=letter;pulse=id;
    const next=variant===2?pending()[0]:null;active=next||null;candidate=next?sample().solution[sample().path.indexOf(next)]:'';expanded=false;render();
    fly(letter,rect,id);announce(`Joker set to ${letter}. ${pending().length?'Choose the next joker.':word()}`);
    if(next)focusChoice();else all('.word-joker').find(n=>n.dataset.joker===id)?.focus({preventScroll:true});
  }
  function previewLetter(letter,scroll=true){
    if(!active||!alphabet().includes(letter))return;candidate=letter;$('.lens-letter').textContent=letter;$('.lens-word').innerHTML=lensWord();$('[data-action="use"]').innerHTML=`Use ${letter}${icon('check')}`;
    all('[data-preview]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.preview===letter));
    if(scroll)$('.letter-rail').scrollTo({left:[...alphabet()].indexOf(letter)*52,behavior:reduced?'instant':'smooth'});
    announce(`Preview ${letter}`);
  }
  function reset(){letters={};played=false;open(sample().jokers[0],false);announce('Demo restarted. Choose a joker letter.');}
  document.addEventListener('click',e=>{
    if(e.target.matches('[data-backdrop]')){close();return;}
    const b=e.target.closest('[data-joker],[data-letter],[data-preview],[data-language],[data-symbol],[data-step],[data-action]');if(!b)return;
    if(b.dataset.joker){open(b.dataset.joker);return;}
    if(b.dataset.letter){choose(b.dataset.letter,b);return;}
    if(b.dataset.preview){previewLetter(b.dataset.preview);return;}
    if(b.dataset.language){language=b.dataset.language;reset();return;}
    if(b.dataset.symbol){symbol=b.dataset.symbol;render();return;}
    if(b.dataset.step){const i=[...alphabet()].indexOf(candidate),n=Math.max(0,Math.min(alphabet().length-1,i+Number(b.dataset.step)));previewLetter(alphabet()[n]);return;}
    switch(b.dataset.action){
      case'close':close();break;
      case'expand':expanded=true;render();focusChoice();break;
      case'use':choose(candidate,$('.lens-tile'));break;
      case'clear':case'reset':reset();break;
      case'play':if(valid()){played=true;active=null;render();announce(`${word()} played. ${sample().totalGain} points.`);}break;
    }
  });
  $('#two-jokers').addEventListener('change',e=>{two=e.target.checked;reset();});
  $('#reduced-motion').addEventListener('change',e=>{reduced=e.target.checked;controls();});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&active){e.preventDefault();close();return;}
    const tile=e.target.closest('.tile[data-joker]');if(tile&&['Enter',' '].includes(e.key)){e.preventDefault();open(tile.dataset.joker);return;}
    if(variant===3&&active&&e.key==='Tab'){const buttons=all('.lens-sheet button');const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    if(variant===3&&active&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();previewLetter(alphabet()[Math.max(0,Math.min(alphabet().length-1,[...alphabet()].indexOf(candidate)+(e.key==='ArrowLeft'?-1:1)))]);}
  });
  let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(variant===1&&active)render();},120);});
  reset();
})();
