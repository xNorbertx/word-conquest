import {$,node,icon,svg,closeSheet} from './ui.js';
import Engine from '../server/engine.mjs';
import {endgameSummary,createEndgameStore} from './endgame.mjs';
import {friendlyError} from './presentation.mjs';

export function createEndgameResult({getContext,getMoves,isAnimating,storage,namespace='',rematch,openRematch}){
  const dialog=$('endgame-dialog'),store=createEndgameStore(storage,{namespace}),media=matchMedia('(prefers-reduced-motion: reduce)');
  let shown=null,request=0,frame=0,timer=0,confettiFrame=0,rematchRequest=0;
  const identity=c=>c?.actor&&c.game?`${c.actor}/${c.game.id}/${c.game.revision}`:null;
  const eligible=c=>c?.visible&&!c.preview&&c.game?.status==='completed'&&c.game.players.includes(c.actor)&&['1','2','draw'].includes(c.game.result);
  function stopConfetti(){cancelAnimationFrame(confettiFrame);confettiFrame=0;$('endgame-confetti').hidden=true;}
  function celebrate(){
    stopConfetti();if(media.matches||document.hidden)return;
    const canvas=$('endgame-confetti'),ctx=canvas.getContext('2d');if(!ctx)return;
    const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);canvas.hidden=false;
    const colours=['#b9cba4','#d8c4a8','#bf964e','#fff6da','#6a8660'];
    const particles=Array.from({length:56},(_,i)=>{const side=i%2?1:-1;return{x:w*.5+side*w*.28,y:h*.45,vx:-side*(70+Math.random()*160),vy:-(200+Math.random()*220),r:Math.random()*6.28,spin:(Math.random()-.5)*8,size:4+Math.random()*4,colour:colours[i%colours.length],tile:i%4===0};});
    let start=0,previous=0;
    const tick=now=>{
      if(!start){start=now;previous=now;}const elapsed=(now-start)/1000,dt=Math.min((now-previous)/1000,.04);previous=now;
      if(elapsed>3.4||!dialog.open){stopConfetti();return;}
      ctx.clearRect(0,0,w,h);ctx.globalAlpha=Math.min(1,(3.4-elapsed)/.8);
      for(const p of particles){p.vy+=170*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=p.spin*dt;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.scale(1,Math.cos(elapsed*4+p.r)*.35+.65);ctx.fillStyle=p.colour;
        if(p.tile){ctx.beginPath();for(let n=0;n<8;n++){const a=Math.PI/8+n*Math.PI/4,x=Math.cos(a)*p.size,y=Math.sin(a)*p.size;n?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();}
        else ctx.fillRect(-p.size/2,-p.size,p.size,p.size*1.7);ctx.restore();}
      confettiFrame=requestAnimationFrame(tick);
    };confettiFrame=requestAnimationFrame(tick);
  }
  const seal=svg('svg',{viewBox:'0 0 92 86','aria-hidden':'true'});
  seal.append(svg('path',{class:'endgame-rays',d:'M46 2v5M16 11l4 5M4 40h6M76 11l-4 5M82 40h6M17 68l4-4M75 68l-4-4'}),svg('path',{class:'endgame-seal-tile',d:'M30 12h32l14 14v32L62 72H30L16 58V26Z'}),svg('path',{class:'endgame-crown',d:'M30 56V32h8v8h5V26h7v14h5v-8h8v24H30Z'}),svg('path',{class:'endgame-door',d:'M42 56V47h10v9'}));
  $('endgame-seal').append(seal);
  function renderDetails(summary,config){
    const rows=[['Words','book',summary?.words],['Length bonus','arrow',summary?.bonus],['Castles','castle',summary?.castles],[config.scoringMode==='defended-final'?'Final territory':'Territory','territory',summary?.territory]];
    const list=$('endgame-breakdown');list.replaceChildren();list.setAttribute('aria-busy',String(!summary));
    for(const [label,symbol,amount] of rows){const row=node('div'),term=node('dt'),value=node('dd',amount==null?'—':String(amount));term.append(icon(symbol),node('span',label));row.append(term,value);list.append(row);}
    const best=summary?.best;
    $('endgame-best-word').textContent=best?.word||(summary?'No words played':'—');
    $('endgame-best-points').textContent=best?`${best.points} pts`:'';
    $('endgame-best-detail').textContent=best?`${best.letters} pts + ${best.bonus} bonus`:'';
  }
  async function details(c,stamp){
    const ticket=++request,cached=store.get(c.actor,c.game);
    renderDetails(cached,c.config);$('endgame-status').hidden=!!cached;$('endgame-status').textContent='Loading scores…';$('endgame-retry').hidden=true;
    if(cached)return;
    try{
      const moves=await getMoves();
      if(ticket!==request||identity(getContext())!==stamp||!dialog.open)return;
      const summary=moves&&endgameSummary(c.game,c.actor,c.config,moves);
      if(!summary)throw Error('Incomplete score history');
      store.save(c.actor,c.game,summary);renderDetails(summary,c.config);$('endgame-status').hidden=true;
    }catch{
      if(ticket!==request||identity(getContext())!==stamp||!dialog.open)return;
      $('endgame-breakdown').setAttribute('aria-busy','false');$('endgame-status').textContent='Could not load detailed scores.';$('endgame-status').hidden=false;$('endgame-retry').hidden=false;
    }
  }
  function show({automatic=false}={}){
    const c=getContext();if(!eligible(c)||isAnimating())return;
    const seat=c.game.players.indexOf(c.actor)+1,won=c.game.result===String(seat),stamp=identity(c);
    // Cache-first manual reopening is quiet. Only a confirmed server result can
    // claim a celebration. Claim before playback to survive background/close.
    const first=c.fresh&&store.claim(c.actor,c.game);
    shown=stamp;closeSheet();$('toast').hidden=true;
    ++rematchRequest;$('endgame-rematch').hidden=!rematch||c.game.players.length!==2||!c.game.players.every(Boolean);
    $('endgame-rematch').disabled=false;$('endgame-rematch-label').textContent='Rematch';$('endgame-rematch-error').hidden=true;
    dialog.dataset.side=seat===1?'sage':'walnut';dialog.dataset.outcome=won?'win':c.game.result==='draw'?'draw':'loss';
    $('endgame-title').textContent=won?'You won!':c.game.result==='draw'?'A draw.':'You lost.';
    const totals=Engine.scores(c.game.state,c.config);
    $('endgame-own-score').textContent=totals[seat-1];$('endgame-other-score').textContent=totals[2-seat];$('endgame-opponent').textContent=c.game.names?.[2-seat]||'Opponent';
    void details(c,stamp);
    if(!dialog.open)dialog.showModal();dialog.scrollTop=0;$('endgame-title').focus({preventScroll:true});
    if(automatic&&first&&won)celebrate();
  }
  function close(){++request;++rematchRequest;stopConfetti();if(dialog.open)dialog.close();if(getContext()?.visible)$('result-view')?.focus({preventScroll:true});}
  $('endgame-rematch').onclick=async()=>{
    const c=getContext();if(!eligible(c)||$('endgame-rematch').disabled)return;
    const stamp=identity(c),ticket=++rematchRequest;
    const current=()=>ticket===rematchRequest&&identity(getContext())===stamp&&dialog.open;
    $('endgame-rematch').disabled=true;$('endgame-rematch-label').textContent='Inviting…';$('endgame-rematch-error').hidden=true;
    try{const result=await rematch(c.actor,c.game.id);if(current()){close();openRematch(result.game.id);}}
    catch(error){if(current()){$('endgame-rematch-error').textContent=error.code==='rematch_unavailable'?'Rematch unavailable.':friendlyError(error);$('endgame-rematch-error').hidden=false;}}
    finally{if(current()){$('endgame-rematch').disabled=false;$('endgame-rematch-label').textContent='Rematch';}}
  };
  function schedule(){
    cancelAnimationFrame(frame);clearTimeout(timer);
    frame=requestAnimationFrame(()=>{
      const c=getContext();if(!eligible(c)||!c.fresh||shown===identity(c)||isAnimating()||document.hidden||document.querySelector('dialog[open]'))return;
      // A final scoring double-tap must never become a tap on the result card.
      if(document.querySelector('.score-motion-dismiss')){timer=setTimeout(schedule,450);return;}
      show({automatic:true});
    });
  }
  $('endgame-close').onclick=$('endgame-board').onclick=close;
  $('endgame-retry').onclick=()=>{const c=getContext();if(eligible(c))void details(c,identity(c));};
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  dialog.addEventListener('close',()=>{++request;++rematchRequest;stopConfetti();});
  for(const d of document.querySelectorAll('dialog'))d.addEventListener('close',schedule);
  media.addEventListener('change',stopConfetti);window.addEventListener('resize',stopConfetti);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopConfetti();else schedule();});
  return {show,schedule,leave(){++request;shown=null;cancelAnimationFrame(frame);clearTimeout(timer);stopConfetti();if(dialog.open)dialog.close();},clear:()=>store.clear()};
}
