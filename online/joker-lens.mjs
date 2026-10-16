import {node,button,svg} from './ui.js';
import {tilePoints} from './board-geometry.mjs';

const STEP=52;
export const lensIndex=(scrollLeft,length)=>Math.max(0,Math.min(length-1,Math.round(scrollLeft/STEP)));
export function canAssignJoker(snapshot,current){
  return !!current && current.editable && snapshot.gameId===current.gameId && snapshot.revision===current.revision
    && current.path.includes(snapshot.tileId) && current.tiles.some(t=>t.id===snapshot.tileId&&t.letter==='?');
}

// A draft remains local to this dialog until confirmed. No keyboard/IME is involved.
export function createJokerLens(){
  const dialog=node('dialog',undefined,'sheet joker-lens');dialog.id='joker-lens';dialog.setAttribute('aria-labelledby','joker-lens-title');
  document.body.append(dialog);
  let session=null,rail=null,index=0,options=[],letters=[],hero,word,confirm;
  const close=()=>{session=null;if(dialog.open)dialog.close();};
  dialog.addEventListener('close',()=>{if(!dialog.open)session=null;});
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();});
  function paint(){
    if(!session)return;
    const candidate=letters[index];hero.textContent=candidate;confirm.lastElementChild.textContent='Use '+candidate;
    options.forEach((option,i)=>{option.setAttribute('aria-selected',i===index);option.tabIndex=i===index?0:-1;});
    word.replaceChildren(...session.path.map(id=>{
      const tile=session.tiles.find(t=>t.id===id),value=id===session.tileId?candidate:tile.letter==='?'?(session.assignments[id]||''):tile.letter;
      const slot=node('span',value,id===session.tileId?'lens-current':tile.letter==='?'?'lens-other-joker':'');
      if(!value)slot.setAttribute('aria-label','Unassigned joker');return slot;
    }));
  }
  function select(next,{focus=false}={}){
    index=Math.max(0,Math.min(letters.length-1,next));rail.scrollTo({left:index*STEP,behavior:'instant'});paint();
    if(focus)options[index].focus({preventScroll:true});
  }
  function sync(){if(!session)return;index=lensIndex(rail.scrollLeft,letters.length);paint();}
  function commit(){
    if(!session)return;sync();const active=session,candidate=letters[index];
    if(!active.valid()){close();return;}
    const from=hero.getBoundingClientRect();close();active.onCommit(candidate);
    const target=document.getElementById('board')?.querySelector(`[data-id="${active.tileId}"]`),to=target?.getBoundingClientRect();
    if(to?.width && !matchMedia('(prefers-reduced-motion: reduce)').matches){
      const flying=node('span',candidate,'lens-flight');document.body.append(flying);
      Object.assign(flying.style,{left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px'});
      const animation=flying.animate([{opacity:1,transform:'translate(0,0) scale(1)'},{opacity:0,transform:`translate(${to.left+to.width/2-from.left-from.width/2}px,${to.top+to.height/2-from.top-from.height/2}px) scale(.42)`}],{duration:330,easing:'cubic-bezier(.2,.8,.2,1)'});
      animation.finished.catch(()=>{}).finally(()=>flying.remove());
    }
    target?.focus({preventScroll:true});
  }
  function open(next){
    close();if(!next.valid())return;session=next;letters=[...next.alphabet];index=Math.max(0,letters.indexOf(next.assignments[next.tileId]||'A'));
    const header=node('div',undefined,'sheet-header'),title=node('h2','Make it yours.');title.id='joker-lens-title';
    const dismiss=button('Close',close,'icon-button','close');dismiss.setAttribute('aria-label','Close letter picker');dismiss.querySelector('span').hidden=true;header.append(title,dismiss);
    const content=node('div',undefined,'lens-content'),stage=node('div',undefined,'lens-stage'),tile=next.tiles.find(t=>t.id===next.tileId);
    const nearby=svg('svg',{viewBox:`${tile.q*64-98} ${tile.r*64-98} 196 196`,class:'lens-neighborhood','aria-hidden':'true'});
    for(const t of next.tiles.filter(t=>Math.max(Math.abs(t.q-tile.q),Math.abs(t.r-tile.r))<=1)){
      const g=svg('g',{class:'lens-neighbor owner'+t.owner});g.append(svg('polygon',{points:tilePoints(t)}),svg('text',{x:t.q*64,y:t.r*64+5},t.letter==='?'?'':t.letter));nearby.append(g);
    }
    const bigTile=node('div',undefined,'lens-tile');hero=node('strong');bigTile.append(hero,node('small','0'));stage.append(nearby,bigTile);
    word=node('div',undefined,'lens-word');word.setAttribute('aria-label','Word preview');
    const picker=node('div',undefined,'lens-picker'),window=node('div',undefined,'lens-window');window.setAttribute('aria-hidden','true');
    rail=node('div',undefined,'lens-rail');rail.setAttribute('role','listbox');rail.setAttribute('aria-label','Joker letter');rail.setAttribute('aria-orientation','horizontal');
    options=letters.map((letter,i)=>{const option=button(letter,()=>select(i,{focus:true}),'lens-letter');option.setAttribute('role','option');rail.append(option);return option;});
    rail.addEventListener('scroll',sync,{passive:true});
    rail.addEventListener('keydown',e=>{
      const nextIndex=e.key==='ArrowRight'?index+1:e.key==='ArrowLeft'?index-1:e.key==='Home'?0:e.key==='End'?letters.length-1:letters.indexOf(e.key.toUpperCase());
      if(nextIndex<0&&!['ArrowLeft'].includes(e.key))return;
      if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)||letters.includes(e.key.toUpperCase())){e.preventDefault();select(nextIndex,{focus:true});}
    });
    picker.append(window,rail);
    const controls=node('div',undefined,'lens-controls'),previous=button('Previous letter',()=>select(index-1),'icon-button','back'),nextLetter=button('Next letter',()=>select(index+1),'icon-button','chevron');
    for(const control of [previous,nextLetter]){control.setAttribute('aria-label',control.textContent);control.querySelector('span').hidden=true;}
    confirm=button('Use letter',commit,'primary lens-use');controls.append(previous,confirm,nextLetter);
    content.append(stage,word,picker,controls);dialog.replaceChildren(header,content);paint();dialog.showModal();select(index,{focus:true});
  }
  return {open,close,validate(){if(session&&!session.valid())close();},get active(){return !!session;}};
}
