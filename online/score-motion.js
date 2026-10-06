import {$,node,svg,icon} from './ui.js';

const signed=n=>n<0?'−'+Math.abs(n):'+'+n;
export function createBoardScoreMotion({onComplete}){
  let controller=null,active=false,layer=null,started=0;
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const check=signal=>{if(signal.aborted)throw new DOMException('Cancelled','AbortError');};
  const wait=(ms,signal)=>new Promise((resolve,reject)=>{
    check(signal);const abort=()=>{clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));};
    const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},ms);
    signal.addEventListener('abort',abort,{once:true});
  });
  async function animate(el,frames,duration,signal){
    check(signal);if(media.matches||!el.animate)return;
    const animation=el.animate(frames,{duration,easing:'cubic-bezier(.35,0,.25,1)'}),abort=()=>animation.cancel();
    signal.addEventListener('abort',abort,{once:true});
    try{await animation.finished;}catch(error){if(!signal.aborted)throw error;}finally{signal.removeEventListener('abort',abort);}
    check(signal);
  }
  async function count(el,from,to,ms,signal,format=signed){
    check(signal);if(media.matches){el.textContent=format(to);return;}
    const start=performance.now();
    await new Promise((resolve,reject)=>{
      let frame;const abort=()=>{cancelAnimationFrame(frame);reject(new DOMException('Cancelled','AbortError'));};
      signal.addEventListener('abort',abort,{once:true});
      const tick=now=>{const t=Math.min(1,(now-start)/ms);el.textContent=format(Math.round(from+(to-from)*(1-(1-t)**2)));
        if(t<1)frame=requestAnimationFrame(tick);else{signal.removeEventListener('abort',abort);resolve();}};
      frame=requestAnimationFrame(tick);
    });check(signal);
  }
  const centre=el=>{const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};};
  const tile=id=>$('board').querySelector(`[data-id="${id}"]`);
  const sourcePoint=s=>s.bonus?centre($('motion-word')):centre(tile(s.id).querySelector('polygon'));
  function paint(tiles,plan){
    const path=plan.path;
    for(const t of tiles){const el=tile(t.id);if(!el)continue;
      el.classList.remove('owner0','owner1','owner2','your-tile','selected','last-move','motion-source','motion-castle','motion-loss');el.classList.add(`owner${t.owner}`);
      if(t.owner===Number($('game-table').dataset.seat))el.classList.add('your-tile');
      el.classList.toggle('motion-word-tile',path.includes(t.id));
      el.querySelector('text:not(.value)').textContent=t.letter==='?'&&path.includes(t.id)?plan.word[path.indexOf(t.id)]||'?':t.letter;
      el.querySelector('.value').textContent=plan.beforeTiles.find(b=>b.id===t.id).value;
      el.querySelector('.step')?.remove();el.querySelector('.marker')?.remove();
      if(t.owner)el.append(svg('circle',{cx:t.q*64+20,cy:t.r*64-19,r:4.3,class:'marker'}));
    }
    const points=path.map(id=>tiles.find(t=>t.id===id)).filter(Boolean);
    $('board').querySelector('.path')?.setAttribute('d',points.slice(1).map((b,i)=>{const a=points[i],d=Math.hypot(b.q-a.q,b.r-a.r),dx=(b.q-a.q)/d*15,dy=(b.r-a.r)/d*15;return `M${a.q*64+dx},${a.r*64+dy}L${b.q*64-dx},${b.r*64-dy}`;}).join(' '));
  }
  function cancel(restore=true){
    const wasActive=active;active=false;controller?.abort();controller=null;layer?.remove();layer=null;
    $('game-table').classList.remove('is-scoring');$('board').inert=false;$('score-motion').hidden=true;
    if(wasActive&&restore)onComplete();
  }
  async function fly(b,player,signal,delay){
    await wait(delay,signal);const target=centre($('score-'+player)),dx=target.x-b.p.x,dy=target.y-b.p.y;
    await animate(b.el,[{transform:'translate(-50%,-50%) scale(1)',opacity:1},
      {transform:`translate(calc(-50% + ${dx*.4}px),calc(-50% + ${dy*.55}px)) scale(1.05)`,opacity:1,offset:.55},
      {transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.45)`,opacity:0}],520,signal);
    b.el.remove();
  }
  async function play(plan,{seat,names}){
    cancel(false);controller=new AbortController();const signal=controller.signal;active=true;started=performance.now();
    $('game-table').classList.add('is-scoring');$('score-motion').hidden=false;$('board').inert=true;
    $('game-table').dataset.motionPlayer=plan.player;
    $('game-table').classList.toggle('score-reduced',media.matches);
    layer=node('div',undefined,'score-motion-layer');layer.setAttribute('aria-hidden','true');document.body.append(layer);
    $('motion-word').textContent=plan.word||'Fresh letters';$('motion-byline').textContent=plan.player===seat?'You played':names[plan.player-1];
    $('motion-skip').onclick=()=>cancel();$('motion-status').textContent='';
    const balances=[...plan.totalsBefore];balances.forEach((n,i)=>$('score-'+(i+1)).textContent=n);
    paint(plan.beforeTiles,plan);
    try{
      await wait(100,signal);
      for(const e of plan.events){
        check(signal);$('score-motion').dataset.phase=e.kind;$('score-motion').dataset.player=e.player;
        $('game-table').dataset.motionTarget=e.player;
        if(e.kind==='castles'||e.kind==='territory')paint(plan.afterTiles.map(t=>{const old=plan.beforeTiles.find(b=>b.id===t.id);return{...t,letter:old.letter,owner:e.kind==='castles'&&!t.castle?old.owner:t.owner};}),plan);
        for(const el of $('board').querySelectorAll('.tile'))el.classList.remove('motion-source','motion-castle','motion-loss');
        const label={word:'Word points',castles:'Castle income',territory:'Territory gained',loss:'Territory lost'}[e.kind];
        const player=e.player===seat?'You':names[e.player-1];
        $('motion-label').textContent=label;$('motion-recipient').textContent=player;
        $('motion-symbol').replaceChildren(icon({word:'book',castles:'castle',territory:'territory',loss:'capture'}[e.kind]));
        $('motion-tally').textContent='+0';$('score-motion').dataset.side=e.player===1?'sage':'walnut';
        const bubbles=e.sources.map(s=>{
          if(s.id)tile(s.id)?.classList.add(e.kind==='castles'?'motion-castle':e.kind==='loss'?'motion-loss':'motion-source');
          const p=sourcePoint(s);p.y-=s.bonus?-18:14;
          const el=node('span','+0',`score-point side-${e.player}${e.kind==='castles'?' gold':''}${s.bonus?' bonus':''}`);
          el.style.left=p.x+'px';el.style.top=p.y+'px';layer.append(el);return{...s,el,p};
        });
        await Promise.all([count($('motion-tally'),0,e.amount,510,signal),...bubbles.map(b=>count(b.el,0,b.amount,440,signal,n=>signed(n)+(b.bonus?' length':''))),
          ...bubbles.map(b=>animate(b.el,[{opacity:0,transform:'translate(-50%,0) scale(.7)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)'}],260,signal))]);
        await wait(media.matches?420:230,signal);
        await Promise.all(bubbles.map((b,i)=>fly(b,e.player,signal,media.matches?0:Math.min(i*40,280))));
        const old=balances[e.player-1];balances[e.player-1]+=e.amount;
        await Promise.all([count($('score-'+e.player),old,balances[e.player-1],280,signal,String),
          animate($('player-score-'+e.player),[{transform:'scale(1)'},{transform:'scale(1.035)',offset:.35},{transform:'scale(1)'}],330,signal)]);
        await wait(100,signal);
      }
      check(signal);cancel();
      $('motion-status').textContent=`${plan.word||'Round complete'}. You: ${plan.totalsAfter[seat-1]} points. ${names[2-seat]}: ${plan.totalsAfter[2-seat]} points.`;
    }catch(error){if(error.name!=='AbortError')cancel();}
  }
  // The real saved state wins immediately if layout or app visibility changes.
  window.addEventListener('resize',()=>{if(active)cancel();});
  window.addEventListener('scroll',()=>{if(active&&performance.now()-started>=100)cancel();},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
  media.addEventListener('change',()=>{if(active)cancel();});
  return{play,cancel,get active(){return active;}};
}
