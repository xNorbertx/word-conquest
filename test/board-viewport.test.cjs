const {test,before}=require('node:test'),assert=require('node:assert/strict');
let createBoardViewport;
before(async()=>({createBoardViewport}=await import('../online/board-viewport.mjs')));
function fixture(w=366,h=330){
 const classes=new Set(),events={};let generation='game/1',allowed=true,captured=null;const taps=[];
 const board={style:{removeProperty(key){delete this[key];}},classList:{toggle(){}}};
 const viewport={clientWidth:w,clientHeight:h,scrollLeft:0,scrollTop:0,
  get scrollWidth(){return parseFloat(board.style.width)||this.clientWidth;},get scrollHeight(){return parseFloat(board.style.height)||this.clientHeight;},
  classList:{toggle(n,v){v?classes.add(n):classes.delete(n);},add(n){classes.add(n);},remove(n){classes.delete(n);}},
  addEventListener(n,fn){events[n]=fn;},setPointerCapture(id){captured=id;},hasPointerCapture(id){return captured===id;},releasePointerCapture(){captured=null;},
  getBoundingClientRect(){return{left:0,top:0,right:this.clientWidth,bottom:this.clientHeight};}
 };
 const button={setAttribute(k,v){this[k]=v;},replaceChildren(){}};
 const control=createBoardViewport({viewport,board,button,icon:()=>null,onTap:id=>taps.push(id),getFocus:()=>null,stamp:()=>generation,enabled:()=>allowed});
 const event=(name,x=100,y=100,extra={})=>{const e={pointerId:1,button:0,isPrimary:true,clientX:x,clientY:y,target:{closest:()=>({dataset:{id:'tile'}})},preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},...extra};events[name](e);return e;};
 return{control,viewport,board,button,taps,event,classes,changeGame(){generation='game/2';},disable(){allowed=false;}};
}
test('zoom starts centred, stays bounded and resets both axes and the accessible toggle',()=>{
 const f=fixture();f.button.onclick();assert.equal(f.control.expanded,true);assert.equal(f.button['aria-pressed'],'true');assert.equal(f.button['aria-label'],'Fit board');
 assert.equal(f.viewport.scrollLeft,147);assert.equal(f.viewport.scrollTop,165);
 f.button.onclick();assert.equal(f.viewport.scrollLeft,0);assert.equal(f.viewport.scrollTop,0);assert.equal(f.board.style.width,undefined);assert.equal(f.button['aria-label'],'Enlarge board');
});
test('drag can reach all four corners on short, tall and landscape phone viewports without choosing tiles',()=>{
 for(const [w,h]of [[296,240],[351,310],[366,550],[406,370],[360,140]]){
  const f=fixture(w,h);f.control.setZoom(true);
  for(const [x,y,left,top]of [[2000,2000,0,0],[-2000,2000,1,0],[-2000,-2000,1,1],[2000,-2000,0,1]]){
   f.event('pointerdown');f.event('pointermove',x,y);f.event('pointerup',x,y);
   assert.equal(f.viewport.scrollLeft,left*(f.viewport.scrollWidth-w));assert.equal(f.viewport.scrollTop,top*(f.viewport.scrollHeight-h));
  }
  assert.deepEqual(f.taps,[]);
 }
});
test('zoom taps choose once, small finger jitter is tolerated, and a pan returning to its origin never chooses',()=>{
 const f=fixture();f.control.setZoom(true);
 f.event('pointerdown');f.event('pointermove',103,101);f.event('pointerup',103,101);assert.deepEqual(f.taps,['tile']);
 f.event('pointerdown');f.event('pointermove',120,100);f.event('pointermove',100,100);f.event('pointerup');assert.deepEqual(f.taps,['tile']);assert(!f.classes.has('panning'));
 // Missing intermediate move events must not turn a long drag into a tap.
 f.event('pointerdown');f.event('pointerup',180,100);assert.deepEqual(f.taps,['tile']);
});
test('fit mode leaves existing word drags alone; zoom consumes gestures before tile selection',()=>{
 const f=fixture();assert(!f.event('pointerdown').stopped);f.control.setZoom(true);assert(f.event('pointerdown').stopped);assert(f.event('pointermove',140,140).stopped);assert(f.event('pointerup',140,140).stopped);
});
test('cancelled, stale-game, disabled and secondary-pointer taps do not change the word',()=>{
 for(const event of ['pointercancel','lostpointercapture']){const f=fixture();f.control.setZoom(true);f.event('pointerdown');f.event(event);f.event('pointerup');assert.deepEqual(f.taps,[]);}
 const f=fixture();f.control.setZoom(true);f.event('pointerdown');f.changeGame();f.event('pointerup');assert.deepEqual(f.taps,[]);
 f.event('pointerdown');f.disable();f.event('pointerup');assert.deepEqual(f.taps,[]);
 const other=fixture();other.control.setZoom(true);other.event('pointerdown',100,100,{isPrimary:false,pointerId:2});other.event('pointerup',100,100,{pointerId:2});assert.deepEqual(other.taps,[]);
});
test('empty board margins can pan; zoom reset during a gesture never chooses a tile',()=>{
 const f=fixture();f.control.setZoom(true);f.event('pointerdown',100,100,{target:{closest:()=>null}});f.event('pointermove',-900,-900);assert.equal(f.viewport.scrollTop,330);f.control.setZoom(false);f.event('pointerup',-900,-900);assert.deepEqual(f.taps,[]);assert.equal(f.viewport.scrollTop,0);
});
test('resizing retains the viewed centre and a selected corner is clamped to reachable bounds',()=>{
 const f=fixture(350,300);f.control.setZoom(true);f.viewport.clientWidth=400;f.viewport.clientHeight=500;f.control.resize();
 assert.equal(f.viewport.scrollLeft,160);assert.equal(f.viewport.scrollTop,110);
 f.control.resize({x:0,y:1});assert.equal(f.viewport.scrollLeft,0);assert.equal(f.viewport.scrollTop,f.viewport.scrollHeight-500);
});
test('keyboard focus pans inside the viewport to reveal offscreen tiles',()=>{
 const f=fixture();f.control.setZoom(true);f.viewport.scrollLeft=0;f.viewport.scrollTop=0;
 f.event('focusin',0,0,{target:{closest:()=>true,getBoundingClientRect:()=>({left:600,right:650,top:600,bottom:650})}});
 assert.equal(f.viewport.scrollLeft,292);assert.equal(f.viewport.scrollTop,328);
});
