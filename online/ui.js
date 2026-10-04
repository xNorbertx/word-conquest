export const $=id=>document.getElementById(id);
const paths={
 friends:['M15 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0','M2 21v-2a7 6 0 0 1 14 0v2','M18 3a4 4 0 0 1 0 8','M19 14a6 5 0 0 1 3 5v2'],search:['M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0','m15 15 6 6'],
 back:['m14 6-6 6 6 6'],arrow:['M4 12h15','m13 6 6 6-6 6'],chevron:['m9 6 6 6-6 6'],close:['m6 6 12 12','m18 6-12 12'],plus:['M12 5v14','M5 12h14'],more:['M5 12h.01','M12 12h.01','M19 12h.01'],grid:['M4 4h6v6H4z','M14 4h6v6h-6z','M4 14h6v6H4z','M14 14h6v6h-6z'],bell:['M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9','M10 21h4'],user:['M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0','M4 21v-2a8 6 0 0 1 16 0v2'],help:['M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5','M12 17h.01','M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0'],book:['M12 5C9 3 5 3 2 4v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-7-1-10 1v15'],shield:['m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6z','m8 12 3 3 5-6'],logout:['M10 4H4v16h6','M10 12h12','m17 7 5 5-5 5'],edit:['m15 4 5 5','m3 21 5-1L21 7a2.8 2.8 0 0 0-4-4L4 16z'],check:['m5 12 4 4L19 6'],'check-all':['m3 12 4 4L17 6','m12 16 9-10'],share:['M12 16V3','m7 8 5-5 5 5','M5 12v8h14v-8'],copy:['M9 9h11v12H9z','M5 15H3V3h11v2'],eye:['M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12','M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0'],lock:['M5 10h14v12H5z','M8 10V6a4 4 0 0 1 8 0v4'],expand:['M8 3H3v5','M16 3h5v5','M21 16v5h-5','M8 21H3v-5'],shrink:['M3 8h5V3','M16 3v5h5','M21 16h-5v5','M8 21v-5H3'],undo:['M3 10h10a7 7 0 0 1 0 14','m8 5-5 5 5 5'],refresh:['M20 7a8 8 0 0 0-14-2L3 8','M3 3v5h5','M4 17a8 8 0 0 0 14 2l3-3','M21 21v-5h-5'],hourglass:['M6 3h12','M6 21h12','M7 3v4l5 5-5 5v4','M17 3v4l-5 5 5 5v4'],award:['M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0','m8 11-2 10 6-3 6 3-2-10'],flag:['M4 22V3','M4 3c5-5 10 5 16 0v11c-6 5-11-5-16 0'],handshake:['m3 6 4-3 5 3 5-3 4 3-4 10-4 4-4-1-6-9','m12 6-5 5 2 2 4-3 5 5'],history:['M3 10a9 9 0 1 1 1 7','M3 3v7h7','M12 7v5l3 2'],info:['M12 11v6','M12 7h.01','M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0'],download:['M12 3v12','m7 10 5 5 5-5','M4 17v4h16v-4'],trash:['M3 6h18','M9 6V3h6v3','m5 6 1 15h12l1-15','M10 10v7','M14 10v7'],'user-plus':['M11 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0','M1 21v-2a7 6 0 0 1 14 0v2','M19 6v8','M15 10h8'],mail:['M3 5h18v14H3z','m3 5 9 8 9-8'],leaf:['M20 3C9 0 2 7 5 15c8 6 16-1 15-12Z','M3 21 15 9']
};
export function svg(tag,attrs={},text){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value]of Object.entries(attrs))n.setAttribute(key,value);if(text!==undefined)n.textContent=text;return n;}
export function icon(name){const n=svg('svg',{viewBox:'0 0 24 24',class:'icon','aria-hidden':'true',focusable:'false'});for(const d of paths[name]||paths.info)n.append(svg('path',{d}));return n;}
export function hydrateIcons(root=document){for(const el of root.querySelectorAll('[data-icon]'))el.replaceChildren(icon(el.dataset.icon));}
export function node(tag,text,className){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;}
export function button(label,handler,className='secondary',symbol){const n=node('button',undefined,className);n.type='button';if(symbol)n.append(icon(symbol));n.append(node('span',label));n.onclick=handler;return n;}
export function setting(label,symbol,handler,{note,danger=false}={}){const n=button('',handler,'settings-row'+(danger?' danger':''));n.replaceChildren(icon(symbol));const copy=node('span',label);if(note)copy.append(node('small',note));n.append(copy,icon('chevron'));return n;}
let toastTimer;
export function notify(message,error=false){
  clearTimeout(toastTimer);
  if(error&&$('sheet').open){let alert=$('sheet-content').querySelector('.form-alert');if(!alert){alert=node('p',undefined,'form-alert');alert.setAttribute('role','alert');$('sheet-content').prepend(alert);}alert.textContent=message;alert.scrollIntoView({block:'nearest'});return;}
  $('toast-text').textContent=message;$('toast').classList.toggle('error',error);$('toast').firstElementChild.replaceWith(icon(error?'info':'check'));$('toast').hidden=false;
  if(!error)toastTimer=setTimeout(()=>$('toast').hidden=true,4000);
}
export function closeSheet(){if($('sheet').open)$('sheet').close();}
export function showSheet(title,content){
  $('sheet-title').textContent=title;$('sheet-content').replaceChildren(...(Array.isArray(content)?content:[content]));hydrateIcons($('sheet-content'));
  if(!$('sheet').open)$('sheet').showModal();$('sheet-content').scrollTop=0;
}
let confirmResolve=null;
export function ask({title,message,label='Confirm',cancel='Keep playing',danger=false,symbol='help'}){
  closeSheet();$('confirm-title').textContent=title;$('confirm-message').textContent=message;$('confirm-ok').textContent=label;$('confirm-ok').classList.toggle('danger',danger);$('confirm-cancel').textContent=cancel;$('confirm-icon').replaceChildren(icon(symbol));$('confirm-dialog').showModal();return new Promise(resolve=>confirmResolve=resolve);
}
function finishConfirm(answer){$('confirm-dialog').close();const resolve=confirmResolve;confirmResolve=null;resolve?.(answer);}
export function initUI(){hydrateIcons();$('close-sheet').onclick=closeSheet;$('dismiss-toast').onclick=()=>$('toast').hidden=true;$('confirm-cancel').onclick=()=>finishConfirm(false);$('confirm-ok').onclick=()=>finishConfirm(true);$('confirm-dialog').addEventListener('cancel',e=>{e.preventDefault();finishConfirm(false);});for(const d of [$('sheet'),$('confirm-dialog')])d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){if(d===$('sheet'))closeSheet();else finishConfirm(false);}});}
export function closeTopDialog(){if($('confirm-dialog').open){finishConfirm(false);return true;}if($('sheet').open){closeSheet();return true;}return false;}
export function emptyState(title,copy,symbol='leaf'){const box=node('div',undefined,'empty-state'),art=node('div',undefined,'empty-art');art.append(icon(symbol));box.append(art,node('h2',title),node('p',copy));return box;}
