'use strict';
// Fictional, arithmetically consistent review data. No game/account/API integration.
const concepts = [
  {slug:'01-victory-seal.html',name:'Victory seal',className:'seal'},
  {slug:'02-final-board.html',name:'Final board',className:'map'},
  {slug:'03-the-tally.html',name:'The tally',className:'tally'}
];
const sample = {words:118,length:19,castles:48,territory:29,total:214,opponent:189,best:'CONQUEST',bestLetters:14,bestLength:5};
const icons = {
  arrow:'<path d="M14 5 7 12l7 7M7 12h13"/>',right:'<path d="m10 5 7 7-7 7M4 12h13"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  castle:'<path d="M4 21V5h4v4h3V3h3v6h3V5h4v16H4Z"/><path d="M10 21v-5h5v5"/>',
  word:'<path d="M3 5c3-1 6 0 9 2 3-2 6-3 9-2v14c-3-1-6 0-9 2-3-2-6-3-9-2V5Z M12 7v14"/>',
  length:'<path d="M3 7v10M21 7v10M3 12h18m-6-5 5 5-5 5"/>',
  territory:'<path d="m8 3 8 0 5 5v8l-5 5H8l-5-5V8Z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  controls:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>'
};
const icon = (name,extra='') => `<svg class="icon ${extra}" viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
const seal = () => `<div class="seal-art" aria-hidden="true"><svg viewBox="0 0 92 86"><g class="rays"><path d="M46 2v5M16 11l4 5M4 40h6M76 11l-4 5M82 40h6M17 68l4-4M75 68l-4-4"/></g><path class="seal-tile" d="M30 12h32l14 14v32L62 72H30L16 58V26Z"/><path class="seal-crown" d="M30 56V32h8v8h5V26h7v14h5v-8h8v24H30Z"/><path d="M42 56V47h10v9" fill="none" stroke="var(--own)" stroke-width="1.7"/></svg></div>`;

// 69-tile silhouette, five castles, 29/23 owned tiles and 17 unclaimed.
// The miniature is a result illustration, not a playable generated board.
function board(letters=false) {
  const rows=[5,7,9,9,9,9,9,7,5], all=[];
  rows.forEach((count,r)=>{for(let c=0;c<count;c++)all.push({r,c,x:(9-count)*20+c*40,y:r*40});});
  const ranked=[...all].sort((a,b)=>(a.x+a.y*.22)-(b.x+b.y*.22));
  ranked.forEach((tile,i)=>tile.owner=i<29?'own':i>=46?'other':'');
  const capitals=new Set(['1:1','1:5','4:4','7:1','7:5']);
  const text='CONQUESTLETTERSGARDENCASTLEWORDPLAY';
  return `<svg class="board-svg" viewBox="-3 -7 367 370" aria-hidden="true">${all.map((t,i)=>{
    const castle=capitals.has(`${t.r}:${t.c}`);
    const shape=castle?'M2 3H10V8H16V0H23V8H29V3H36V29L29 36H9L2 29Z':'M9 2H29L37 10V29L29 37H9L1 29V10Z';
    return `<g transform="translate(${t.x} ${t.y})"><path class="tile ${t.owner} ${castle?'castle':''}" d="${shape}"/>${letters?`<text x="19" y="18">${text[i%text.length]}</text><text class="value" x="19" y="31">1</text>`:''}</g>`;
  }).join('')}</svg>`;
}
function total(){return sample.words+sample.length+sample.castles+sample.territory;}
function breakdown(){return `<dl class="breakdown" aria-label="Your points">
  <div style="--key:var(--own)"><dt>${icon('word','stat-icon')}Words</dt><dd>${sample.words}</dd></div>
  <div style="--key:var(--own-fill)"><dt>${icon('length','stat-icon')}Length bonus</dt><dd>${sample.length}</dd></div>
  <div style="--key:var(--gold)"><dt>${icon('castle','stat-icon')}Castles</dt><dd>${sample.castles}</dd></div>
  <div style="--key:var(--other-fill)"><dt>${icon('territory','stat-icon')}Final territory</dt><dd>${sample.territory}</dd></div>
</dl>`;}
function composition(){return `<div class="score-composition" aria-hidden="true">${[sample.words,sample.length,sample.castles,sample.territory].map(n=>`<span style="flex:${n}"></span>`).join('')}</div>`;}
function bestWord(tiles=false){return `<section class="best-word" aria-label="Your best word">
  <div class="best-word-head"><span>Best word</span><strong>${sample.bestLetters+sample.bestLength} pts</strong></div>
  ${tiles?`<div class="word-tiles" aria-label="${sample.best}">${[...sample.best].map(l=>`<span aria-hidden="true">${l}</span>`).join('')}</div>`:`<p class="best-word-name">${sample.best}</p>`}
  <p class="best-word-detail">${sample.bestLetters} pts + ${sample.bestLength} bonus</p></section>`;}

const params=new URLSearchParams(location.search);
const root=document.documentElement;
root.dataset.theme=params.get('theme')==='dark'?'dark':'light';
root.dataset.side=params.get('side')==='walnut'?'walnut':'sage';
const number=Number(document.body.dataset.concept||0);
let outcome=['win','loss','draw'].includes(params.get('outcome'))?params.get('outcome'):'win';
const title=()=>outcome==='win'?'You won!':outcome==='draw'?'A draw.':'Alex won.';
const otherTotal=()=>outcome==='win'?sample.opponent:outcome==='draw'?total():231;
const scorePair=()=>`<div class="result-scores"><div class="self"><div class="score">${total()}</div><p class="score-player">You</p></div><span class="score-divider" aria-hidden="true"></span><div class="opponent"><div class="score">${otherTotal()}</div><p class="score-player">Alex</p></div></div>`;
function resultContents(){
  const heading=`<h1 id="result-title" class="result-heading" tabindex="-1">${title()}</h1>`;
  if(number===1)return `<header class="seal-hero">${seal()}${heading}${scorePair()}</header><div class="card-body">${breakdown()}${bestWord()}</div>`;
  if(number===2)return `<header class="map-hero">${heading}<div class="map-scoreline"><strong>${total()}</strong><i>–</i><span>${otherTotal()}</span></div><p class="map-names">You &nbsp;·&nbsp; Alex</p><div class="map-art">${board()}</div></header><div class="card-body">${breakdown()}${bestWord(true)}</div>`;
  return `<header class="tally-hero"><p class="eyebrow">Word Conquest</p>${heading}<div class="tally-total"><strong>${total()}</strong><div class="tally-against"><b>${otherTotal()}</b>Alex</div></div></header><div class="card-body">${composition()}${breakdown()}${bestWord()}</div>`;
}
function gallery(){
  const miniLines=`<div class="mini-lines"><p>Words<b>118</b></p><p>Length bonus<b>19</b></p><p>Castles<b>48</b></p><p>Final territory<b>29</b></p></div><div class="mini-best">CONQUEST <small>· 19</small></div>`;
  const images=[`<div class="mini-card">${seal()}<h2>You won!</h2><p class="mini-score">214 <small>– 189</small></p>${miniLines}</div>`,
    `<div class="mini-card mini-map-card"><h2>You won!</h2><p class="mini-score">214 <small>– 189</small></p><div class="mini-map">${board()}</div>${miniLines}</div>`,
    `<div class="mini-card mini-tally"><div class="mini-tally-head"><h2>You won!</h2><strong>214</strong></div>${composition()}${miniLines}</div>`];
  const descriptions=['A castle seal, a clear result and a quiet score breakdown. A little fan of tile-shaped confetti.','Your finished board is the centrepiece. Small score tiles and your best word, spelled out.','A bold score, then the four parts that built it. A short shower of sage, walnut and gold.'];
  document.querySelector('#gallery-cards').innerHTML=concepts.map((c,i)=>`<a class="concept-tile" href="${c.slug}" aria-label="Open ${i+1}. ${c.name}"><div class="mini-stage" aria-hidden="true">${images[i]}</div><div class="concept-caption"><small>0${i+1}</small><h2>${c.name}${icon('right')}</h2><p>${descriptions[i]}</p></div></a>`).join('');
  document.querySelector('#gallery-theme').addEventListener('click',()=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';});
}

let raf=0,burstNumber=0;
function stopConfetti(){cancelAnimationFrame(raf);raf=0;const canvas=document.querySelector('#confetti');if(canvas){canvas.hidden=true;canvas.getContext('2d')?.clearRect(0,0,canvas.width,canvas.height);}}
function celebrate(){
  stopConfetti();
  if(outcome!=='win'||matchMedia('(prefers-reduced-motion: reduce)').matches||document.hidden)return;
  const canvas=document.querySelector('#confetti'),ctx=canvas.getContext('2d');if(!ctx)return;
  const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);canvas.hidden=false;
  canvas.dataset.bursts=String(++burstNumber);
  const palette=['#b9cba4','#d8c4a8','#bf964e','#fff6da','#6a8660'];
  const particles=Array.from({length:number===3?65:56},(_,i)=>{
    const side=i%2?1:-1,rain=number===3;
    return {x:rain?Math.random()*w:w*.5+side*w*.28,y:rain?-30-Math.random()*h*.35:h*.45,
      vx:rain?(Math.random()-.5)*70:-side*(70+Math.random()*160),vy:rain?70+Math.random()*70:-(200+Math.random()*220),
      r:Math.random()*6.28,spin:(Math.random()-.5)*8,size:4+Math.random()*4,
      color:palette[i%palette.length],tile:i%4===0};
  });
  let start=0,previous=0;
  const frame=now=>{
    if(!start){start=now;previous=now;}const elapsed=(now-start)/1000,dt=Math.min((now-previous)/1000,.04);previous=now;
    if(elapsed>3.4||!document.querySelector('#result-dialog').open){stopConfetti();return;}
    ctx.clearRect(0,0,w,h);ctx.globalAlpha=Math.min(1,(3.4-elapsed)/.8);
    for(const p of particles){p.vy+=170*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=p.spin*dt;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.scale(1,Math.cos(elapsed*4+p.r)*.35+.65);ctx.fillStyle=p.color;
      if(p.tile){ctx.beginPath();for(let n=0;n<8;n++){const a=Math.PI/8+n*Math.PI/4;const x=Math.cos(a)*p.size,y=Math.sin(a)*p.size;n?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();}
      else ctx.fillRect(-p.size/2,-p.size,p.size,p.size*1.7);ctx.restore();}
    raf=requestAnimationFrame(frame);
  };raf=requestAnimationFrame(frame);
}
function game(){
  const c=concepts[number-1];
  document.querySelector('#game').innerHTML=`<header class="game-header"><a class="icon-button" href="index.html" aria-label="Back to designs">${icon('arrow')}</a><div><h1>Alex</h1><p>English · Finished</p></div></header><div class="game-scores"><div>You <b>${total()}</b></div><div>Alex <b id="opponent-score">${otherTotal()}</b></div></div><div class="game-finished"><span>Game finished</span><span>27 October</span></div><div class="game-board">${board(true)}</div><div class="game-actions"><button class="primary" id="view-result">View result</button></div><footer class="game-footer"><a href="index.html">${icon('arrow')}</a><span>Sample game · Design ${number}</span><button class="text-button" id="replay-outside">Replay win</button></footer>`;
  const dialog=document.querySelector('#result-dialog');
  dialog.innerHTML=`<nav class="review-nav" aria-label="Design previews"><a href="index.html">${icon('arrow')}Designs</a><span>0${number} · ${c.name}</span><div class="concept-links">${concepts.map((v,i)=>`<a href="${v.slug}" ${i+1===number?'aria-current="page"':''} aria-label="Design ${i+1}: ${v.name}">${i+1}</a>`).join('')}</div></nav>
  <article class="result-card ${c.className}"><button class="icon-button close-result" aria-label="Close result">${icon('close')}</button><div id="result-content"></div><footer class="card-actions"><button class="primary" id="view-board">View board${icon('right')}</button></footer></article>
  <details class="review-tools"><summary><span>${icon('controls')}</span><span>Preview controls</span><span class="review-state" id="review-state">First reveal</span></summary><div class="preview-controls"><label>Your colour<select id="side"><option value="sage">Green</option><option value="walnut">Brown</option></select></label><label>Theme<select id="theme"><option value="light">Light</option><option value="dark">Dark</option></select></label><label>Result<select id="outcome"><option value="win">Win</option><option value="loss">Loss</option><option value="draw">Draw</option></select></label></div><div class="preview-actions"><button id="replay">Replay win</button><button id="reopen">Reopen result</button></div><p class="preview-note">Fictional game. Reopening keeps the stats and skips the confetti.</p></details><canvas id="confetti" class="confetti" aria-hidden="true" hidden></canvas>`;
  function update(){document.querySelector('#result-content').innerHTML=resultContents();document.querySelector('#opponent-score').textContent=otherTotal();}
  function open(first=false){stopConfetti();update();if(!dialog.open)dialog.showModal();document.querySelector('#review-state').textContent=first?'First reveal':'Reopened';document.querySelector('#result-title').focus({preventScroll:true});if(first)celebrate();}
  function close(){stopConfetti();dialog.close();document.querySelector('#view-result').focus({preventScroll:true});}
  document.querySelector('.close-result').addEventListener('click',close);
  document.querySelector('#view-board').addEventListener('click',close);
  document.querySelector('#view-result').addEventListener('click',()=>open(false));
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  for(const id of ['replay','replay-outside'])document.querySelector('#'+id).addEventListener('click',()=>{outcome='win';document.querySelector('#outcome').value=outcome;open(true);});
  document.querySelector('#reopen').addEventListener('click',()=>open(false));
  for(const key of ['side','theme']){const select=document.querySelector('#'+key);select.value=root.dataset[key];select.addEventListener('change',()=>{root.dataset[key]=select.value;stopConfetti();});}
  document.querySelector('#outcome').value=outcome;
  document.querySelector('#outcome').addEventListener('change',e=>{outcome=e.target.value;open(false);});
  const motion=matchMedia('(prefers-reduced-motion: reduce)');motion.addEventListener('change',stopConfetti);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopConfetti();});
  addEventListener('resize',stopConfetti);addEventListener('pagehide',stopConfetti);
  let seen=false;try{seen=sessionStorage.getItem(`wc-endgame-preview-${number}`)==='seen';sessionStorage.setItem(`wc-endgame-preview-${number}`,'seen');}catch{/* Private mode still supports the in-page reopen flow. */}
  open(params.get('mode')!=='reopen'&&!seen);
}
if(total()!==sample.total)throw Error('Preview score mismatch');
if(number)game();else gallery();
