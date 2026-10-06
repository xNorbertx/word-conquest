/* Standalone, offline design prototypes. No accounts, requests, or game mutations. */
(() => {
  'use strict';
  const sample=window.SCORE_DEMO;
  const paths={
    arrow:'M5 12h14m-5-5 5 5-5 5',back:'m14 6-6 6 6 6',more:'M12 5h.01M12 12h.01M12 19h.01',
    replay:'M4 10a8 8 0 1 1 1 7M4 4v6h6',check:'m5 12 4 4L19 6',
    word:'M4 19 10 5h3l6 14M7 14h9',
    castle:'M4 20V9h3V4h3v5h4V4h3v5h3v11H4Zm6 0v-6h4v6',
    territory:'m7 3 10 0 4 4v10l-4 4H7l-4-4V7l4-4ZM8 12h8m-4-4v8',
    capture:'m7 3 10 0 4 4v10l-4 4H7l-4-4V7l4-4ZM8 12h8',
    sparkle:'m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z'
  };
  const icon=(name,extra='')=>`<svg class="icon ${extra}" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]||paths.sparkle}"/></svg>`;
  const signed=n=>n<0?'−'+Math.abs(n):'+'+n;
  const options=[
    {number:1,file:'01-score-ribbon.html',name:'The score ribbon',short:'Ribbon',description:'One calm ribbon, one reward at a time. Each total gathers below your word, then arcs into the right balance.',quality:'Quiet & familiar',caption:'A little movement. A clear destination.'},
    {number:2,file:'02-paper-receipt.html',name:'The paper receipt',short:'Receipt',description:'A small, lasting record of the round. Each line counts up and sends its points home, leaving the breakdown in view.',quality:'Easiest to read back',caption:'The breakdown stays after the motion.'},
    {number:3,file:'03-on-the-board.html',name:'On the board',short:'Board',description:'The board does the explaining. Letters, castles and captured tiles release their own points directly into the balances.',quality:'Most connected to play',caption:'See exactly where every point came from.'},
    {number:4,file:'04-round-reveal.html',name:'The round reveal',short:'Reveal',description:'A short round-end moment. Four tallies build together, then peel away to the two balances in a clear sequence.',quality:'A more celebratory pause',caption:'A bigger moment for a completed round.'}
  ];
  const star=(x,y)=>Array.from({length:10},(_,i)=>{
    const a=(i*36-90)*Math.PI/180,r=i%2?3:6.6;return `${x+Math.cos(a)*r},${y+Math.sin(a)*r}`;
  }).join(' ');
  function board(mini=false){
    return `<svg class="board${mini?' mini-board':''}" viewBox="-295 -295 590 590" role="img" aria-label="Word Conquest board. GARDENS crosses six new tiles, including three held by Ellinor.">${sample.tiles.map(t=>{
      const x=t.q*64,y=t.r*64;
      const poly=Array.from({length:8},(_,i)=>{const a=(i*45+22.5)*Math.PI/180;return `${x+Math.cos(a)*32},${y+Math.sin(a)*32}`;}).join(' ');
      return `<g class="tile owner${t.owner}${sample.path.includes(t.id)?' path-tile':''}" data-tile="${t.id}"><polygon points="${poly}"/><polygon class="selected-outline" points="${poly}"/><text x="${x}" y="${y-2}">${t.letter}</text><text class="value" x="${x}" y="${y+19}">${t.value}</text>${t.owner?`<circle class="marker" cx="${x+20}" cy="${y-19}" r="4.3"/>`:''}${t.castle?`<polygon class="castle" points="${star(x+19,y+18)}"/>`:''}</g>`;
    }).join('')}<path class="word-path" d="${sample.path.slice(1).map((id,i)=>{const [x,y]=sample.path[i].split(',').map(Number),[nx,ny]=id.split(',').map(Number);return `M${x*64+16},${y*64}L${nx*64-16},${ny*64}`;}).join('')}"/></svg>`;
  }
  const header=gallery=>`<header class="site-header"><a class="brand" href="index.html"><span class="brand-mark">W</span>Word Conquest</a>${gallery?'<span class="header-note">A SMALL STUDY IN SCORING</span>':`<a class="header-link" href="index.html">${icon('back')}All four concepts</a>`}</header>`;
  function vignette(n){
    const totals='<div class="mini-totals"><span><i></i>84</span><span>79<i></i></span></div>';
    const path='<svg class="mini-path" viewBox="0 0 230 110"><path d="M165 100Q20 100 5 5"/></svg>';
    let content='';
    if(n===1)content=`${path}<span class="mini-token">+19</span><div class="mini-ribbon"><span>${icon('word')}Word points</span><strong>+19</strong></div>`;
    if(n===2)content=`<div class="mini-receipt">${sample.events.map(e=>`<div><span>${icon(e.icon)}${e.label}</span><strong>${signed(e.amount)}</strong></div>`).join('')}</div>`;
    if(n===3)content=`${board(true)}${path}<span class="mini-float">+4</span><span class="mini-float small">+2</span>`;
    if(n===4)content=`<div class="mini-reveal">${sample.events.map(e=>`<div>${icon(e.icon)}<strong>${signed(e.amount)}</strong></div>`).join('')}</div><span class="mini-round-label">Round six, collected.</span>`;
    return `<div class="vignette" aria-hidden="true">${totals}${content}</div>`;
  }
  if(document.body.dataset.page==='gallery'){
    document.querySelector('#app').innerHTML=`${header(true)}<main class="gallery"><div class="gallery-intro"><p class="eyebrow">Four ways to feel the score</p><h1>Every point,<br>a little moment.</h1><p>The same round. Four different rhythms.<br>Open a concept to watch, slow down and replay.</p></div><div class="gallery-grid">${options.map(o=>`<a class="concept-card" href="${o.file}">${vignette(o.number)}<div class="concept-copy"><div class="concept-topline"><span>0${o.number}</span>${icon('arrow')}</div><h2>${o.name}</h2><p>${o.caption}</p></div></a>`).join('')}</div><footer class="gallery-footer"><span><strong>GARDENS</strong> &nbsp; Word +19 · Castles +6 · Territory +6 · Opponent −3</span><span>Local prototypes · No live game changes</span></footer></main>`;
    return;
  }
  const choice=Number(document.body.dataset.option)||1,opt=options[choice-1];
  const row=(e,i)=>`<div class="receipt-row${e.amount<0?' loss':''}" data-event="${i}">${icon(e.icon)}<span class="receipt-label">${e.label}${i===3?' · Ellinor':''}</span><strong class="receipt-value">${signed(0)}</strong>${icon('check','receipt-tick')}</div>`;
  function stageMarkup(){
    if(choice===1)return '<div class="ribbon"><div class="ribbon-icon"></div><div class="ribbon-copy"><p class="ribbon-label">Your round</p><p class="ribbon-detail">Every point, accounted for</p></div><strong class="ribbon-value">+0</strong></div>';
    if(choice===2)return `<div class="receipt">${sample.events.map(row).join('')}</div>`;
    if(choice===3)return '<div class="board-caption"><span class="caption-icon"></span><span class="board-caption-text">Your round</span><strong class="board-caption-amount">+0</strong></div><p class="board-caption-detail">Follow the points</p>';
    return `<div class="reveal-complete">${icon('sparkle')}<span>Collecting your round</span></div>`;
  }
  function phoneMarkup(){
    return `<div class="game-header"><span class="chrome-icon">${icon('back')}</span><div class="game-heading"><h2>Word Conquest</h2><p>with Ellinor</p></div><span class="chrome-icon">${icon('more')}</span></div><div class="scoreboard">${['Norbert','Ellinor'].map((name,i)=>`<div class="score${i?' walnut':''}" data-player="${i}"><div><span class="player-label"><i class="${i?'owner-ring':'owner-dot'}"></i>${i?'OPPONENT':'<b>YOU</b>'}</span><span class="player-name">${name}</span><span class="player-colour">${i?'Walnut':'Sage'}</span></div><strong class="total" data-value="${sample.before[i]}">${sample.before[i]}</strong><span class="total-glow"></span><span class="score-delta"></span></div>`).join('')}</div><div class="round-line"><span class="round-title">${icon('check')}Round 6 complete</span><span class="round-meta">48 letters left</span></div><div class="board-wrap">${board()}<div class="board-shade"></div></div><div class="word-lockup"><p class="eyebrow">You played</p><p class="played-word">GARDENS</p></div><div class="motion-stage">${stageMarkup()}</div><div class="round-progress" aria-hidden="true">${sample.events.map(()=>'<span></span>').join('')}</div><div class="result-line"><span class="result-caption">Counting the round</span><span class="result-value"></span><span class="result-loss"></span></div><div class="home-indicator" aria-hidden="true"></div><div class="flight-layer" aria-hidden="true"></div>${choice===4?`<div class="reveal"><p class="eyebrow">Round 06</p><h3>GARDENS</h3><div class="reveal-grid">${sample.events.map((e,i)=>`<div class="reveal-cell${e.amount<0?' loss':''}" data-event="${i}">${icon(e.icon)}<strong class="reveal-value">+0</strong><span class="reveal-label">${['Word points','Castle income','Territory gained','Ellinor’s territory'][i]}</span>${icon('check','reveal-tick')}</div>`).join('')}</div><p class="reveal-footer">A good word. A little more kingdom.</p></div>`:''}`;
  }
  document.querySelector('#app').innerHTML=`${header(false)}<main class="demo-layout"><aside class="design-rail"><p class="eyebrow">Motion study / 0${choice}</p><h1>${opt.name}</h1><p class="design-description">${opt.description}</p><span class="design-quality">${opt.quality}</span><nav class="option-nav" aria-label="Animation concepts">${options.map(o=>`<a href="${o.file}" ${o.number===choice?'aria-current="page"':''}><span class="option-no">0${o.number}</span><span>${o.short}</span>${icon('arrow')}</a>`).join('')}</nav><section class="playback" aria-label="Preview controls"><div class="playback-buttons"><button class="replay" type="button">${icon('replay')}Replay round</button><button class="finish" type="button">Show result</button></div><div class="playback-settings"><label>Speed <select id="speed"><option value="1">Normal</option><option value="1.65">Slow motion</option><option value="0.7">Quick</option></select></label><label><input type="checkbox" id="reduced">Reduced motion</label></div><div class="phase-list" aria-label="Animation progress">${['Word','Castles','Your territory','Their territory'].map((s,i)=>`<span class="phase" data-phase="${i}"><i class="phase-dot"></i>${s}</span>`).join('')}</div></section><p class="demo-footnote">Same example in every concept.<br><strong>You: 84 → 115 &nbsp; Ellinor: 79 → 76</strong><br>Castle income pays at the end of a full round.</p></aside><div class="preview-wrap"><section class="phone option-${choice}" aria-label="${opt.name} game preview">${phoneMarkup()}</section><div class="preview-caption"><span>0${choice} / ${opt.name}</span><span>Interactive mockup</span></div></div><p class="sr-only" id="announcement" role="status" aria-live="polite"></p></main>`;

  const phone=document.querySelector('.phone'),reduced=document.querySelector('#reduced');
  reduced.checked=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let controller=null,speed=1,lowMotion=false;
  const $=sel=>phone.querySelector(sel);
  const $$=sel=>Array.from(phone.querySelectorAll(sel));
  function check(signal){if(signal.aborted)throw new DOMException('Cancelled','AbortError');}
  function wait(ms,signal){
    check(signal);
    return new Promise((resolve,reject)=>{
      const abort=()=>{clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));};
      const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},ms*speed);
      signal.addEventListener('abort',abort,{once:true});
    });
  }
  async function animate(el,frames,ms,signal,options={}){
    check(signal);if(lowMotion)return;
    const animation=el.animate(frames,{duration:ms*speed,easing:'cubic-bezier(.22,.68,.18,1)',...options});
    const abort=()=>animation.cancel();signal.addEventListener('abort',abort,{once:true});
    try{await animation.finished;}catch(error){if(!signal.aborted)throw error;}
    finally{signal.removeEventListener('abort',abort);}
    check(signal);
  }
  async function count(el,from,to,ms,signal,format=n=>String(n)){
    check(signal);
    if(lowMotion){el.textContent=format(to);await wait(220,signal);return;}
    const start=performance.now();
    await new Promise((resolve,reject)=>{
      let frame;
      const abort=()=>{cancelAnimationFrame(frame);reject(new DOMException('Cancelled','AbortError'));};
      signal.addEventListener('abort',abort,{once:true});
      function tick(now){
        const t=Math.min(1,(now-start)/(ms*speed)),eased=1-Math.pow(1-t,2);
        el.textContent=format(Math.round(from+(to-from)*eased));
        if(t<1)frame=requestAnimationFrame(tick);
        else{signal.removeEventListener('abort',abort);resolve();}
      }
      frame=requestAnimationFrame(tick);
    });
    check(signal);
  }
  const point=el=>{const a=el.getBoundingClientRect(),p=phone.getBoundingClientRect(),scale=p.width/phone.offsetWidth;return{x:(a.left-p.left+a.width/2)/scale,y:(a.top-p.top+a.height/2)/scale};};
  const tilePoint=id=>{
    const t=sample.tiles.find(t=>t.id===id),b=$('.board').getBoundingClientRect(),p=phone.getBoundingClientRect(),scale=p.width/phone.offsetWidth;
    return{x:(b.left-p.left+(t.q*64+295)/590*b.width)/scale,y:(b.top-p.top+(t.r*64+295)/590*b.height)/scale};
  };
  function highlight(event){
    $$('.tile').forEach(t=>t.classList.remove('highlight','highlight-gold','highlight-loss'));
    let tiles=[];
    if(event.id==='word')tiles=sample.path;
    if(event.id==='castles')tiles=sample.tiles.filter(t=>t.castle&&t.owner===1).map(t=>t.id);
    if(event.id==='territory')tiles=sample.path.filter(id=>sample.tiles.find(t=>t.id===id).owner!==1);
    if(event.id==='opponent')tiles=sample.path.filter(id=>sample.tiles.find(t=>t.id===id).owner===2);
    tiles.forEach(id=>$(`[data-tile="${id}"]`).classList.add(event.id==='castles'?'highlight-gold':event.id==='opponent'?'highlight-loss':'highlight'));
  }
  function conquer(){
    sample.path.forEach(id=>{const el=$(`[data-tile="${id}"]`);el.classList.remove('owner0','owner2');el.classList.add('owner1');});
  }
  function phase(index,complete=false){
    phone.dataset.stage=index;
    document.querySelectorAll('.phase').forEach((el,i)=>{el.classList.toggle('active',!complete&&i===index);el.classList.toggle('complete',complete||i<index);});
    $$('.round-progress span').forEach((el,i)=>{el.classList.toggle('active',!complete&&i===index);el.classList.toggle('complete',complete||i<index);});
  }
  async function flight(from,target,amount,signal,{gold=false,small=false,trail=false,delay=0}={}){
    if(lowMotion)return;
    if(delay)await wait(delay,signal);
    const to=point($(`[data-player="${target}"] .total`));
    const el=document.createElement('span');el.className=`flight-token${amount<0?' loss':''}${gold?' gold':''}${small?' small':''}`;el.textContent=signed(amount);
    el.style.left=from.x+'px';el.style.top=from.y+'px';$('.flight-layer').append(el);
    let line;
    if(trail){
      line=document.createElementNS('http://www.w3.org/2000/svg','svg');line.setAttribute('class','flight-line'+(amount<0?' loss':''));
      line.setAttribute('viewBox',`0 0 ${phone.clientWidth} ${phone.clientHeight}`);
      const path=document.createElementNS(line.namespaceURI,'path');
      path.setAttribute('d',`M${from.x} ${from.y} Q${target?from.x+75:from.x-75} ${to.y+120} ${to.x} ${to.y}`);line.append(path);$('.flight-layer').prepend(line);
    }
    const dx=to.x-from.x,dy=to.y-from.y,bend=target?35:-35;
    await animate(el,[
      {transform:'translate(-50%,-50%) scale(.85)',opacity:0,offset:0},
      {transform:'translate(-50%,-50%) scale(1.1)',opacity:1,offset:.13},
      {transform:`translate(calc(-50% + ${dx*.35+bend}px),calc(-50% + ${dy*.55}px)) scale(1)`,opacity:1,offset:.58},
      {transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.55)`,opacity:0,offset:1}
    ],choice===3?560:650,signal,{easing:'cubic-bezier(.45,0,.35,1)'});
    el.remove();line?.remove();
  }
  async function credit(event,signal){
    check(signal);
    const score=$(`[data-player="${event.target}"]`),total=score.querySelector('.total');
    const from=Number(total.dataset.value),to=from+event.amount;total.dataset.value=to;
    const delta=score.querySelector('.score-delta');delta.textContent=signed(event.amount);
    await Promise.all([
      count(total,from,to,310,signal),
      animate(score,[{transform:'scale(1)'},{transform:'scale(1.035)',offset:.35},{transform:'scale(1)'}],390,signal),
      animate(score.querySelector('.total-glow'),[{opacity:0,transform:'scale(.99)'},{opacity:.5,offset:.25},{opacity:0,transform:'scale(1.055)'}],460,signal),
      animate(delta,[{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)',offset:.2},{opacity:1,offset:.7},{opacity:0,transform:'translateY(-3px)'}],550,signal)
    ]);
  }
  async function ribbonEvent(e,signal){
    const ribbon=$('.ribbon');ribbon.classList.toggle('loss',e.amount<0);
    $('.ribbon-icon').innerHTML=icon(e.icon);$('.ribbon-label').textContent=e.label;$('.ribbon-detail').textContent=e.detail;
    const value=$('.ribbon-value');value.textContent=signed(0);
    await Promise.all([animate(ribbon,[{opacity:0,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}],230,signal),count(value,0,e.amount,560,signal,signed)]);
    await wait(200,signal);
    await flight(point(value),e.target,e.amount,signal,{trail:true,gold:e.id==='castles'});
    await credit(e,signal);
  }
  async function receiptEvent(e,index,signal){
    const row=$(`.receipt-row[data-event="${index}"]`),value=row.querySelector('.receipt-value');
    $$('.receipt-row').forEach(el=>el.classList.remove('active'));row.classList.add('active');
    await count(value,0,e.amount,550,signal,signed);await wait(240,signal);
    await flight(point(value),e.target,e.amount,signal,{gold:e.id==='castles'});
    await credit(e,signal);row.classList.remove('active');row.classList.add('complete');
  }
  function boardSources(e){
    if(e.id==='word')return [
      ...sample.path.map(id=>({id,amount:sample.tiles.find(t=>t.id===id).value})),
      {el:$('.played-word'),amount:10,bonus:true}
    ];
    if(e.id==='castles')return sample.tiles.filter(t=>t.castle&&t.owner===1).map(t=>({id:t.id,amount:t.q===0&&t.r===0?4:2,gold:true}));
    return sample.path.filter(id=>{const t=sample.tiles.find(t=>t.id===id);return e.id==='territory'?t.owner!==1:t.owner===2;}).map(id=>({id,amount:e.id==='opponent'?-1:1}));
  }
  async function boardEvent(e,signal){
    $('.caption-icon').innerHTML=icon(e.icon);$('.board-caption-text').textContent=e.label;
    $('.board-caption').classList.toggle('loss',e.amount<0);
    $('.board-caption-detail').textContent=e.id==='word'?'Letters + length bonus':e.detail;
    const sources=boardSources(e);
    const bubbles=sources.map(s=>{
      const p=s.id?tilePoint(s.id):point(s.el);if(s.bonus)p.y+=18;
      const el=document.createElement('span');el.className=`source-bubble${s.gold?' gold':''}${e.amount<0?' loss':''}${s.bonus?' bonus':''}`;el.style.left=p.x+'px';el.style.top=(p.y-16)+'px';el.textContent='+0';phone.append(el);
      return{...s,p:{x:p.x,y:p.y-16},el};
    });
    await Promise.all([
      count($('.board-caption-amount'),0,e.amount,650,signal,signed),
      ...bubbles.map(b=>count(b.el,0,b.amount,530,signal,n=>signed(n)+(b.bonus?' length':''))),
      ...bubbles.map(b=>animate(b.el,[{opacity:0,transform:'translate(-50%,0) scale(.65)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)'}],340,signal))
    ]);
    await wait(320,signal);
    await Promise.all(bubbles.map(async(b,i)=>{
      await wait(i*65,signal);b.el.remove();await flight(b.p,e.target,b.amount,signal,{small:true,gold:b.gold});
    }));
    await credit(e,signal);
  }
  function stop(){controller?.abort();controller=null;}
  function fitPreview(){
    const wrap=document.querySelector('.preview-wrap');
    const mobile=window.innerWidth<=800,base=mobile?Math.min(390,window.innerWidth-24):390;
    phone.style.width=base+'px';wrap.style.width=base+'px';
    phone.style.zoom='1';
    const available=window.innerHeight-(phone.getBoundingClientRect().top+window.scrollY)-(mobile?155:42);
    const scale=Math.min(1,Math.max(mobile?.78:.62,available/phone.offsetHeight));
    phone.style.zoom=String(scale);wrap.style.width=(base*scale)+'px';
  }
  function reset(){
    stop();phone.innerHTML=phoneMarkup();speed=Number(document.querySelector('#speed').value);lowMotion=reduced.checked;phone.classList.toggle('reduced-motion',lowMotion);phase(0);phone.dataset.playing='true';
    fitPreview();
    document.querySelector('#announcement').textContent='Playing the round preview.';
  }
  function finish(){
    stop();phone.dataset.playing='false';phone.dataset.stage='complete';
    $$('.source-bubble').forEach(el=>el.remove());$('.flight-layer').replaceChildren();
    sample.after.forEach((n,i)=>{const el=$(`[data-player="${i}"] .total`);el.textContent=n;el.dataset.value=n;});
    conquer();$$('.tile').forEach(t=>t.classList.remove('highlight','highlight-gold','highlight-loss'));phase(3,true);phone.dataset.stage='complete';
    $('.result-caption').textContent='Round collected';$('.result-value').textContent='You +31';$('.result-loss').textContent='Ellinor −3';
    if(choice===1){$('.ribbon').className='ribbon is-done';$('.ribbon-icon').innerHTML=icon('check');$('.ribbon-label').textContent='Round collected';$('.ribbon-detail').textContent='Ellinor’s turn';$('.ribbon-value').textContent='+31';}
    if(choice===2)$$('.receipt-row').forEach((r,i)=>{r.classList.remove('active');r.classList.add('complete');r.querySelector('.receipt-value').textContent=signed(sample.events[i].amount);});
    if(choice===3){$('.caption-icon').innerHTML=icon('check');$('.board-caption').classList.remove('loss');$('.board-caption-text').textContent='Round collected';$('.board-caption-amount').textContent='+31';$('.board-caption-detail').textContent='Ellinor’s turn';}
    if(choice===4){$('.reveal').hidden=true;$('.board-shade').style.opacity='0';$('.reveal-complete').innerHTML=`${icon('check')}<strong>+31</strong><span>Round collected</span>`;}
    document.querySelector('#announcement').textContent='Round complete. Word 19, castle income 6, territory gained 6. Your score is 115. Ellinor lost 3 territory points; her score is 76.';
  }
  async function run(){
    reset();controller=new AbortController();const signal=controller.signal;
    try{
      await wait(450,signal);
      if(choice===4){
        $('.board-shade').style.opacity='.7';
        await animate($('.reveal'),[{opacity:0,transform:'translateY(18px) scale(.97)'},{opacity:1,transform:'translateY(0) scale(1)'}],410,signal);
        await Promise.all(sample.events.map(async(e,i)=>{await wait(i*110,signal);await count($(`.reveal-cell[data-event="${i}"] .reveal-value`),0,e.amount,800,signal,signed);}));
        await wait(500,signal);
      }
      for(let i=0;i<sample.events.length;i++){
        check(signal);const event=sample.events[i];phase(i);highlight(event);
        if(event.id==='territory')conquer();
        if(choice===1)await ribbonEvent(event,signal);
        if(choice===2)await receiptEvent(event,i,signal);
        if(choice===3)await boardEvent(event,signal);
        if(choice===4){
          const cell=$(`.reveal-cell[data-event="${i}"]`);cell.classList.add('active');
          $('.reveal-footer').textContent=event.id==='opponent'?'Three tiles change hands.':event.detail;
          await wait(250,signal);await flight(point(cell.querySelector('.reveal-value')),event.target,event.amount,signal,{gold:event.id==='castles'});
          await credit(event,signal);cell.classList.remove('active');cell.classList.add('is-sent');
        }
        await wait(130,signal);
      }
      if(choice===4){
        $('.reveal-footer').textContent='Collected. A little more kingdom.';
        await wait(650,signal);await animate($('.reveal'),[{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.97) translateY(6px)'}],330,signal);
      }
      check(signal);finish();
    }catch(error){if(error.name!=='AbortError'){console.error(error);document.querySelector('#announcement').textContent='Preview interrupted. Use Replay round to try again.';}}
  }
  document.querySelector('.replay').addEventListener('click',run);
  document.querySelector('.finish').addEventListener('click',finish);
  document.querySelector('#speed').addEventListener('change',run);
  reduced.addEventListener('change',run);
  window.addEventListener('pagehide',stop);
  // After resize, reset flight coordinates instead of sending points to stale positions.
  let resizeTimer;
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(phone.dataset.playing==='true')run();else fitPreview();},180);});
  requestAnimationFrame(run);
})();
