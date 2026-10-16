const {test,before}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let createJokerLens,canAssignJoker,lensIndex;
before(async()=>({createJokerLens,canAssignJoker,lensIndex}=await import('../online/joker-lens.mjs')));
// Small DOM adapter: tests actual picker/controller behavior, not browser layout.
class Element {
 constructor(tag){this.tag=tag;this.children=[];this.attributes={};this.events={};this.scrollLeft=0;this.style={};}
 set textContent(value){this.text=String(value);this.children=[];}get textContent(){return (this.text||'')+this.children.map(c=>c.textContent).join('');}
 append(...children){this.children.push(...children);}replaceChildren(...children){this.text='';this.children=children;}
 setAttribute(k,v){this.attributes[k]=String(v);}getAttribute(k){return this.attributes[k];}
 addEventListener(name,fn){(this.events[name]??=[]).push(fn);}emit(name,extra={}){const e={key:'',preventDefault(){},...extra};for(const fn of this.events[name]||[])fn(e);}
 querySelector(tag){for(const c of this.children){if(c.tag===tag)return c;const found=c.querySelector(tag);if(found)return found;}return null;}
 get lastElementChild(){return this.children.at(-1);}getBoundingClientRect(){return{left:0,top:0,right:0,bottom:0,width:0,height:0};}
 showModal(){this.open=true;}close(){this.open=false;this.emit('close');}scrollTo({left}){this.scrollLeft=left;}focus(){this.focused=true;}
}
function setup(alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ'){
 const body=new Element('body');global.document={body,createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t),getElementById:()=>null};
 const controller=createJokerLens(),find=(className,el=body)=>{if(el.className?.split(' ').includes(className))return el;for(const c of el.children){const r=find(className,c);if(r)return r;}};
 let valid=true;const saved={},tiles=[{id:'a',q:-1,r:0,letter:'C',owner:1},{id:'j',q:0,r:0,letter:'?',owner:0},{id:'k',q:1,r:0,letter:'?',owner:0}];
 const open=(tileId='j')=>controller.open({tileId,tiles,path:['a','j','k'],assignments:{...saved},alphabet,valid:()=>valid,onCommit:v=>saved[tileId]=v});
 return {controller,find,body,saved,open,invalidate(){valid=false;},choose(letter){const rail=find('lens-rail');rail.children.find(e=>e.textContent===letter).onclick();},use(){find('lens-use').onclick();}};
}
test('letter choice is a draft until confirmed; reopening starts from the saved letter and cancel preserves it',()=>{
 const f=setup();f.open();assert.equal(f.find('lens-rail').children.length,26);f.choose('M');assert.deepEqual(f.saved,{});f.use();assert.equal(f.saved.j,'M');assert.equal(f.controller.active,false);
 f.open();assert.equal(f.find('lens-tile').children[0].textContent,'M');f.choose('Z');f.body.children[0].emit('cancel');assert.equal(f.saved.j,'M');assert.equal(f.controller.active,false);
});
test('swiping and immediately confirming uses the actual rail position, including Swedish letters',()=>{
 const f=setup('ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ');for(const letter of ['Å','Ä','Ö']){f.open();f.find('lens-rail').scrollLeft=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ'].indexOf(letter)*52;f.use();assert.equal(f.saved.j,letter);}
 assert.equal(lensIndex(-80,29),0);assert.equal(lensIndex(9999,29),28);assert.equal(lensIndex(27,29),1);
});
test('keyboard navigation is bounded, supports letters and updates the accessible selection',()=>{
 const f=setup();f.open();const rail=f.find('lens-rail');for(const [key,letter] of [['End','Z'],['ArrowRight','Z'],['Home','A'],['ArrowLeft','A'],['ArrowRight','B'],['x','X']]){
  rail.emit('keydown',{key});assert.equal(f.find('lens-tile').children[0].textContent,letter);assert.equal(rail.children.filter(o=>o.getAttribute('aria-selected')==='true').length,1);
 }f.use();assert.equal(f.saved.j,'X');
});
test('multiple jokers retain independent assignments and late confirmation cannot edit an invalid game',()=>{
 const f=setup();f.open('j');f.choose('A');f.use();f.open('k');f.choose('T');f.use();assert.deepEqual(f.saved,{j:'A',k:'T'});
 f.open('j');f.choose('Z');f.invalidate();f.use();assert.deepEqual(f.saved,{j:'A',k:'T'});assert.equal(f.controller.active,false);
});
test('a game refresh closes an invalid lens and a previous dialog close event cannot cancel a new one',()=>{
 const f=setup();f.open();f.open('k');f.body.children[0].emit('close');assert.equal(f.controller.active,true);f.invalidate();f.controller.validate();assert.equal(f.controller.active,false);
});
test('assignment guard rejects another game, revision, deselected/replaced joker and non-editable states',()=>{
 const snapshot={gameId:'g',revision:3,tileId:'j'},current={gameId:'g',revision:3,editable:true,path:['j'],tiles:[{id:'j',letter:'?'}]};
 assert.equal(canAssignJoker(snapshot,current),true);for(const override of [{gameId:'h'},{revision:4},{editable:false},{path:[]},{tiles:[{id:'j',letter:'A'}]}])assert.equal(canAssignJoker(snapshot,{...current,...override}),false);
});
test('board gesture opens the lens only after release; cancellation does not open it; tapping a selected joker edits it',()=>{
 const source=fs.readFileSync('online/app.js','utf8'),board=new Element('svg');board.setPointerCapture=()=>{};board.hasPointerCapture=()=>true;board.releasePointerCapture=()=>{};
 const opened=[],chosen=[];const c={$:()=>board,dragging:false,preview:false,canPlay:()=>true,tileAt:x=>x,selection:['j'],game:{state:{tiles:[{id:'j',letter:'?'},{id:'a',letter:'A'}]}},choose:id=>chosen.push(id),openJoker:id=>opened.push(id),openPendingJoker:()=>opened.push('pending')};
 vm.createContext(c);vm.runInContext(source.slice(source.indexOf('let boardGesture='),source.indexOf("$('board').onkeydown=")),c);
 const down=id=>board.onpointerdown({button:0,clientX:id,pointerId:1,preventDefault(){}});
 down('j');assert.deepEqual(opened,[]);assert.deepEqual(chosen,[]);board.emit('pointerup',{pointerId:1});assert.deepEqual(opened,['j']);
 down('a');board.emit('pointercancel');board.emit('pointerup',{pointerId:1});assert.deepEqual(opened,['j']);
 down('a');board.onpointermove({clientX:'j',pointerId:1});assert.deepEqual(opened,['j']);board.emit('pointerup',{pointerId:1});assert.deepEqual(opened,['j','pending']);
});
