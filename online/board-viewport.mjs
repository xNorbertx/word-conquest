// Zoom is a bounded viewport: drag to pan, tap to choose. Fit mode keeps word dragging.
export function createBoardViewport({viewport,board,button,icon,onTap,getFocus,stamp,enabled=()=>true}){
  let expanded=false,gesture=null,size=0,width=0,height=0;
  const clamp=(n,max)=>Math.max(0,Math.min(Math.max(0,max),n));
  function position(x,y){
    viewport.scrollLeft=clamp(x,viewport.scrollWidth-viewport.clientWidth);
    viewport.scrollTop=clamp(y,viewport.scrollHeight-viewport.clientHeight);
  }
  function cancel(){
    const id=gesture?.pointerId;gesture=null;viewport.classList.remove('panning');
    if(id!=null&&viewport.hasPointerCapture(id))viewport.releasePointerCapture(id);
  }
  function resize(focus){
    if(!expanded)return;
    const w=viewport.clientWidth,h=viewport.clientHeight;if(!w||!h)return;
    const centre=focus||{x:size?(viewport.scrollLeft+width/2)/size:.5,y:size?(viewport.scrollTop+height/2)/size:.5};
    size=Math.max(660,Math.min(w,h)*1.8);width=w;height=h;
    board.style.width=size+'px';board.style.height=size+'px';
    position(centre.x*size-w/2,centre.y*size-h/2);
  }
  function setZoom(value){
    cancel();expanded=!!value;
    viewport.classList.toggle('zoomed',expanded);board.classList.toggle('enlarged',expanded);
    button.setAttribute('aria-pressed',String(expanded));button.setAttribute('aria-label',expanded?'Fit board':'Enlarge board');
    button.replaceChildren(icon(expanded?'shrink':'expand'));
    if(expanded)resize(getFocus?.()||{x:.5,y:.5});
    else {board.style.removeProperty('width');board.style.removeProperty('height');position(0,0);size=width=height=0;}
  }
  const tileAt=e=>e.target.closest?.('[data-id]')?.dataset.id;
  function down(e){
    if(!expanded||!enabled()||e.button!==0||e.isPrimary===false)return;
    e.preventDefault();e.stopPropagation();cancel();
    gesture={pointerId:e.pointerId,x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop,tile:tileAt(e),stamp:stamp(),moved:false};
    viewport.setPointerCapture(e.pointerId);
  }
  function move(e){
    if(!gesture||gesture.pointerId!==e.pointerId)return;
    e.preventDefault();e.stopPropagation();
    const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
    if(!gesture.moved&&Math.hypot(dx,dy)<7)return;
    gesture.moved=true;viewport.classList.add('panning');position(gesture.left-dx,gesture.top-dy);
  }
  function up(e){
    if(!gesture||gesture.pointerId!==e.pointerId)return;
    e.preventDefault();e.stopPropagation();
    const previous=gesture;cancel();
    if(!previous.moved&&Math.hypot(e.clientX-previous.x,e.clientY-previous.y)<7&&previous.tile&&previous.stamp===stamp()&&enabled())onTap(previous.tile);
  }
  viewport.addEventListener('pointerdown',down,true);viewport.addEventListener('pointermove',move,true);viewport.addEventListener('pointerup',up,true);
  for(const event of ['pointercancel','lostpointercapture'])viewport.addEventListener(event,cancel);
  viewport.addEventListener('focusin',e=>{
    if(!expanded||!e.target.closest?.('[data-id]'))return;
    const tile=e.target.getBoundingClientRect(),box=viewport.getBoundingClientRect(),margin=8;
    const dx=tile.left<box.left+margin?tile.left-box.left-margin:tile.right>box.right-margin?tile.right-box.right+margin:0;
    const dy=tile.top<box.top+margin?tile.top-box.top-margin:tile.bottom>box.bottom-margin?tile.bottom-box.bottom+margin:0;
    position(viewport.scrollLeft+dx,viewport.scrollTop+dy);
  });
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>resize()).observe(viewport);
  button.onclick=()=>setZoom(!expanded);
  return {setZoom,resize,get expanded(){return expanded;}};
}
