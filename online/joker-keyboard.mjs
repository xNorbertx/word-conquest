import {node,button} from './ui.js';

const KEY_ROWS=['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'];
export function jokerKeyRows(alphabet){
  const letters=[...new Set([...alphabet])],standard=KEY_ROWS.join('');
  return [letters.filter(letter=>!standard.includes(letter)),...KEY_ROWS.map(row=>[...row].filter(letter=>letters.includes(letter)))].filter(row=>row.length);
}
export function canAssignJoker(snapshot,current){
  return !!current && current.editable && snapshot.gameId===current.gameId && snapshot.revision===current.revision
    && current.path.includes(snapshot.tileId) && current.tiles.some(t=>t.id===snapshot.tileId&&t.letter==='?');
}

// Letter buttons commit immediately. There is no text input, IME or draft to confirm.
export function createJokerKeyboard(){
  const dialog=node('dialog',undefined,'sheet joker-keyboard');dialog.id='joker-keyboard';dialog.setAttribute('aria-label','Joker letter');
  document.body.append(dialog);
  let session=null,keys=[],pointerStartedHere=false;
  const lock=on=>document.body.classList.toggle('joker-picking',on);
  const target=id=>document.getElementById('board')?.querySelector(`[data-id="${id}"]`);
  function close(){
    const id=session?.tileId;session=null;
    if(dialog.open)dialog.close();lock(false);
    if(id)target(id)?.focus({preventScroll:true});
  }
  dialog.addEventListener('close',()=>{if(!dialog.open){session=null;lock(false);}});
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  dialog.addEventListener('pointerdown',()=>{pointerStartedHere=true;},true);
  dialog.addEventListener('pointercancel',()=>{pointerStartedHere=false;},true);
  // Android may retarget the release's compatibility click to the newly opened
  // modal. Only a fresh gesture inside this modal may select or dismiss it.
  // Keyboard/assistive clicks have detail=0 and remain usable.
  dialog.addEventListener('click',e=>{
    const fresh=e.detail===0||pointerStartedHere;pointerStartedHere=false;
    if(!fresh){e.preventDefault();e.stopImmediatePropagation();}
  },true);
  dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();});
  function valid(active){return dialog.open && session===active && active.valid(active.tileId);}
  function focusKey(){(keys.find(key=>key.getAttribute('aria-pressed')==='true')||keys[0])?.focus({preventScroll:true});}
  function selectTile(id,active){
    if(!valid(active)){if(session===active)close();return;}
    if(!active.path.includes(id)||!active.tiles.some(t=>t.id===id&&t.letter==='?')||!active.valid(id))return;
    session={...active,tileId:id};paint();focusKey();
  }
  function fly(letter,from,id){
    const to=target(id)?.getBoundingClientRect();
    if(!from?.width||!to?.width||typeof Element.prototype.animate!=='function'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const flying=node('span',letter,'joker-letter-flight');flying.setAttribute('data-side',dialog.getAttribute('data-side'));document.body.append(flying);
    Object.assign(flying.style,{left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px'});
    flying.animate([{opacity:1,transform:'translate(0,0) scale(1)'},{opacity:0,transform:`translate(${to.left+to.width/2-from.left-from.width/2}px,${to.top+to.height/2-from.top-from.height/2}px) scale(.7)`}],{duration:230,easing:'cubic-bezier(.2,.8,.2,1)'}).finished.catch(()=>{}).finally(()=>flying.remove());
  }
  function commit(letter,source,active){
    // Old buttons, repeated keys, closed dialogs and stale games cannot assign a letter.
    if(session!==active)return;
    if(!valid(active)){close();return;}
    if(!active.alphabet.includes(letter))return;
    const from=source?.getBoundingClientRect();
    if(active.onCommit(active.tileId,letter)===false){close();return;}
    if(session!==active)return;
    const assignments={...active.assignments,[active.tileId]:letter};
    const next=active.path.find(id=>active.tiles.some(t=>t.id===id&&t.letter==='?')&&!assignments[id]);
    if(next&&active.valid(next)){
      session={...active,assignments,tileId:next};paint();focusKey();
    }else {close();fly(letter,from,active.tileId);}
  }
  function paint(){
    const active=session;
    const header=node('div',undefined,'joker-keyboard-header');
    const dismiss=button('',close,'icon-button','close');dismiss.setAttribute('aria-label','Close letter picker');dismiss.querySelector('span').hidden=true;header.append(dismiss);
    const word=node('div',undefined,'joker-keyboard-word');word.setAttribute('role','group');word.setAttribute('aria-label','Selected word');
    active.path.forEach((id,index)=>{
      const tile=active.tiles.find(t=>t.id===id);
      if(tile.letter!=='?'){word.append(node('span',tile.letter,'joker-fixed-letter'));return;}
      const value=active.assignments[id]||'';
      const slot=button(value,()=>selectTile(id,active),'joker-word-slot'+(id===active.tileId?' current':'')+(value?' assigned':''));
      slot.setAttribute('aria-label',`Joker at position ${index+1}${value?', '+value:', blank'}`);slot.setAttribute('aria-pressed',id===active.tileId);
      if(!value)slot.lastElementChild.className='joker-blank';word.append(slot);
    });
    const keyboard=node('div',undefined,'joker-keyboard-pad');keyboard.setAttribute('role','group');keyboard.setAttribute('aria-label','Letters');
    keys=[];
    for(const letters of jokerKeyRows(active.alphabet)){
      const extra=letters.some(letter=>!KEY_ROWS.join('').includes(letter));
      const row=node('div',undefined,'joker-key-row'+(extra?' extra':'')+(letters.join('')==='ZXCVBNM'?' lower':''));
      for(const letter of letters){
        const key=button(letter,()=>commit(letter,key,active),'joker-key');key.setAttribute('aria-label','Choose '+letter);key.setAttribute('aria-pressed',active.assignments[active.tileId]===letter);keys.push(key);row.append(key);
      }
      keyboard.append(row);
    }
    dialog.replaceChildren(header,word,keyboard);
  }
  dialog.addEventListener('keydown',e=>{
    if(!session||e.ctrlKey||e.metaKey||e.altKey||e.isComposing||e.repeat)return;
    const letter=e.key.toUpperCase();
    if([...e.key].length===1&&session.alphabet.includes(letter)){e.preventDefault();commit(letter,null,session);return;}
    const at=keys.indexOf(document.activeElement);
    if(at<0)return;
    const index=e.key==='Home'?0:e.key==='End'?keys.length-1:e.key==='ArrowLeft'?Math.max(0,at-1):e.key==='ArrowRight'?Math.min(keys.length-1,at+1):-1;
    if(index>=0){e.preventDefault();keys[index].focus({preventScroll:true});}
  });
  function open(next){
    if(!next.valid(next.tileId)){close();return;}
    dialog.setAttribute('data-side',next.side==='walnut'?'walnut':'sage');
    pointerStartedHere=false;session={...next,path:[...next.path],assignments:{...next.assignments}};
    paint();if(!dialog.open)dialog.showModal();lock(true);focusKey();
  }
  return {open,close,validate(){if(session&&(!dialog.open||!session.valid(session.tileId)))close();},get active(){return !!session&&dialog.open;}};
}
