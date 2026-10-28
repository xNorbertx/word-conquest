const {test,before}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let createJokerKeyboard,canAssignJoker,jokerKeyRows,closeTopDialog,closeSheet;
before(async()=>{
 ({createJokerKeyboard,canAssignJoker,jokerKeyRows}=await import('../online/joker-keyboard.mjs'));
 ({closeTopDialog,closeSheet}=await import('../online/ui.js'));
});
// Tests real controller behavior with a small DOM adapter; no layout claims.
class Element {
 constructor(tag){this.tag=tag;this.children=[];this.attributes={};this.events={};this.style={};this.classList={toggle:(name,on)=>{const names=new Set((this.className||'').split(' ').filter(Boolean));on?names.add(name):names.delete(name);this.className=[...names].join(' ');}};}
 set textContent(value){this.text=String(value);this.children=[];}get textContent(){return(this.text||'')+this.children.map(c=>c.textContent).join('');}
 append(...children){this.children.push(...children);}replaceChildren(...children){this.text='';this.children=children;}
 setAttribute(k,v){this.attributes[k]=String(v);}getAttribute(k){return this.attributes[k];}
 addEventListener(name,fn){(this.events[name]??=[]).push(fn);}emit(name,extra={}){const e={key:'',target:this,detail:0,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...extra};for(const fn of this.events[name]||[]){fn(e);if(e.stopped)break;}return e;}
 querySelector(tag){for(const c of this.children){if(c.tag===tag)return c;const found=c.querySelector(tag);if(found)return found;}return null;}
 get lastElementChild(){return this.children.at(-1);}getBoundingClientRect(){return{left:0,top:0,right:0,bottom:0,width:0,height:0};}
 showModal(){this.open=true;}close(){this.open=false;this.emit('close');}focus(){document.activeElement=this;}
}
function setup(alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ',{two=false}={}){
 const body=new Element('body');
 const lookup=(predicate,el=body)=>{if(predicate(el))return el;for(const c of el.children){const found=lookup(predicate,c);if(found)return found;}};
 global.document={body,createElement:t=>new Element(t),getElementById:id=>lookup(el=>el.id===id),createElementNS:(_,t)=>new Element(t)};
 const main=new Element('dialog');main.id='sheet';body.append(main);const confirm=new Element('dialog');confirm.id='confirm-dialog';body.append(confirm);
 const controller=createJokerKeyboard(),find=name=>lookup(el=>el.className?.split(' ').includes(name)),dialog=find('joker-keyboard');
 let valid=true,accept=true;const saved={},tiles=[{id:'a',letter:'C'},{id:'j',letter:'?'},{id:'k',letter:two?'?':'T'}],path=['a','j','k'];
 const open=(tileId='j',side='sage')=>controller.open({side,tileId,tiles,path,assignments:{...saved},alphabet,valid:()=>valid,onCommit:(id,value)=>{if(!accept)return false;saved[id]=value;return true;}});
 const keys=()=>find('joker-keyboard-pad').children.flatMap(row=>row.children);
 return {controller,find,dialog,body,saved,open,keys,invalidate(){valid=false;},reject(){accept=false;},choose(letter){keys().find(key=>key.textContent===letter).onclick();}};
}
test('tap immediately assigns a letter; there is no confirmation, instruction copy or text field',()=>{
 const f=setup();f.open();assert.equal(f.keys().length,26);assert.equal(f.dialog.getAttribute('aria-label'),'Joker letter');
 assert(!f.body.querySelector('input'));assert(!f.body.querySelector('h2'));assert(!/Use letter|Make it yours|Tap a letter|Complete your word/.test(f.body.textContent));
 f.choose('M');assert.deepEqual(f.saved,{j:'M'});assert.equal(f.controller.active,false);assert(!f.body.className.includes('joker-picking'));
 f.open();assert.equal(f.keys().find(key=>key.textContent==='M').getAttribute('aria-pressed'),'true');f.dialog.emit('cancel');assert.deepEqual(f.saved,{j:'M'});
});
test('QWERTY rows contain every permitted letter once; Swedish extras stay distinct',()=>{
 const english='ABCDEFGHIJKLMNOPQRSTUVWXYZ',swedish=english+'ÅÄÖ';
 assert.deepEqual(jokerKeyRows(english).map(row=>row.join('')),['QWERTYUIOP','ASDFGHJKL','ZXCVBNM']);
 assert.deepEqual(jokerKeyRows(swedish)[0],['Å','Ä','Ö']);
 for(const alphabet of [english,swedish]){
  assert.deepEqual(jokerKeyRows(alphabet).flat().sort(),[...alphabet].sort());
  for(const letter of alphabet){const f=setup(alphabet);f.open();f.choose(letter);assert.equal(f.saved.j,letter);assert.equal(f.controller.active,false);}
 }
});
test('two jokers advance automatically without reopening; stale buttons cannot select the next joker',()=>{
 const f=setup(undefined,{two:true});f.open();const old=f.keys().find(key=>key.textContent==='A');f.choose('M');
 assert.equal(f.controller.active,true);assert.deepEqual(f.saved,{j:'M'});assert.equal(f.find('current').getAttribute('aria-label'),'Joker at position 3, blank');
 old.onclick();assert.deepEqual(f.saved,{j:'M'});f.choose('T');assert.deepEqual(f.saved,{j:'M',k:'T'});assert.equal(f.controller.active,false);
});
test('word slots can be edited independently and closing preserves already assigned letters',()=>{
 const f=setup(undefined,{two:true});f.open();f.choose('M');f.find('joker-keyboard-word').children[1].onclick();
 assert.equal(f.find('current').getAttribute('aria-label'),'Joker at position 2, M');f.choose('A');assert.deepEqual(f.saved,{j:'A'});
 f.dialog.emit('cancel');assert.deepEqual(f.saved,{j:'A'});f.open('k');f.choose('T');f.open('j');f.choose('O');assert.deepEqual(f.saved,{j:'O',k:'T'});
});
test('physical keys select directly; arrows only move focus; modifiers, repeats and IME events do not assign',()=>{
 const f=setup('ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ',{two:true});f.open();
 for(const key of ['End','ArrowRight','Home','ArrowLeft','ArrowRight'])f.dialog.emit('keydown',{key});assert.deepEqual(f.saved,{});
 for(const extra of [{ctrlKey:true},{metaKey:true},{altKey:true},{repeat:true},{isComposing:true}])f.dialog.emit('keydown',{key:'a',...extra});assert.deepEqual(f.saved,{});
 f.dialog.emit('keydown',{key:'å'});assert.deepEqual(f.saved,{j:'Å'});f.dialog.emit('keydown',{key:'å',repeat:true});assert.deepEqual(f.saved,{j:'Å'});f.dialog.emit('keydown',{key:'ö'});assert.deepEqual(f.saved,{j:'Å',k:'Ö'});
 const en=setup();en.open();en.dialog.emit('keydown',{key:'Å'});assert.deepEqual(en.saved,{});
});
test('invalid game or rejected assignment closes the picker without changing either joker',()=>{
 const f=setup();f.open();f.invalidate();f.choose('A');assert.deepEqual(f.saved,{});assert.equal(f.controller.active,false);
 const rejected=setup();rejected.open();rejected.reject();rejected.choose('A');assert.deepEqual(rejected.saved,{});assert.equal(rejected.controller.active,false);
 const refresh=setup();refresh.open();refresh.invalidate();refresh.controller.validate();assert.equal(refresh.controller.active,false);
});
test('closed or replaced sessions ignore late buttons and late close events preserve a newly opened dialog',()=>{
 const f=setup(undefined,{two:true});f.open();const stale=f.keys()[0];f.controller.close();stale.onclick();assert.deepEqual(f.saved,{});
 f.open();const replaced=f.keys()[0];f.open('k');replaced.onclick();assert.deepEqual(f.saved,{});
 f.dialog.emit('close');assert.equal(f.controller.active,true);f.choose('S');assert.deepEqual(f.saved,{k:'S'});
});
test('Android Back and app navigation close the keyboard and release background scroll',()=>{
 const f=setup();f.open();assert(f.body.className.includes('joker-picking'));assert.equal(closeTopDialog(),true);assert(!f.dialog.open);assert(!f.body.className.includes('joker-picking'));
 f.open();closeSheet();assert.equal(f.controller.active,false);assert(!f.body.className.includes('joker-picking'));assert.deepEqual(f.saved,{});
});
test('assignment guard rejects another game, revision, deselected/replaced joker and non-editable states',()=>{
 const snapshot={gameId:'g',revision:3,tileId:'j'},current={gameId:'g',revision:3,editable:true,path:['j'],tiles:[{id:'j',letter:'?'}]};
 assert.equal(canAssignJoker(snapshot,current),true);for(const override of [{gameId:'h'},{revision:4},{editable:false},{path:[]},{tiles:[{id:'j',letter:'A'}]}])assert.equal(canAssignJoker(snapshot,{...current,...override}),false);
});
test('board gesture opens the picker only after release; cancellation does not open it; selected jokers edit',()=>{
 const source=fs.readFileSync('online/app.js','utf8'),board=new Element('svg');board.setPointerCapture=()=>{};board.hasPointerCapture=()=>true;board.releasePointerCapture=()=>{};
 const opened=[],chosen=[];const c={$:()=>board,dragging:false,preview:false,canPlay:()=>true,tileAt:x=>x,selection:['j'],game:{state:{tiles:[{id:'j',letter:'?'},{id:'a',letter:'A'}]}},choose:id=>chosen.push(id),openJoker:id=>opened.push(id),openPendingJoker:()=>opened.push('pending')};
 vm.createContext(c);vm.runInContext(source.slice(source.indexOf('let boardGesture='),source.indexOf("$('board').onkeydown=")),c);
 const down=id=>board.onpointerdown({button:0,clientX:id,pointerId:1,preventDefault(){}});
 down('j');assert.deepEqual(opened,[]);assert.deepEqual(chosen,[]);board.emit('pointerup',{pointerId:1});assert.deepEqual(opened,['j']);
 down('a');board.emit('pointercancel',{pointerId:1});board.emit('pointerup',{pointerId:1});assert.deepEqual(opened,['j']);
 down('a');board.onpointermove({clientX:'j',pointerId:1});assert.deepEqual(opened,['j']);board.emit('pointerup',{pointerId:1});assert.deepEqual(opened,['j','pending']);
});
test('touch capture transfer and unrelated fingers cannot suppress the automatic joker picker',()=>{
 const source=fs.readFileSync('online/app.js','utf8');
 for(const selected of [false,true])for(const event of ['tile-transfer','other-pointer-loss','other-pointer-cancel']){
  const board=new Element('svg');board.setPointerCapture=()=>{};board.hasPointerCapture=()=>true;board.releasePointerCapture=()=>{};
  const opened=[],chosen=[],c={$:()=>board,dragging:false,preview:false,canPlay:()=>true,tileAt:x=>x,selection:selected?['j']:[],game:{state:{tiles:[{id:'j',letter:'?'}]}},choose:id=>chosen.push(id),openJoker:id=>opened.push(id),openPendingJoker:()=>opened.push('pending')};
  vm.createContext(c);vm.runInContext(source.slice(source.indexOf('let boardGesture='),source.indexOf("$('board').onkeydown=")),c);
  board.onpointerdown({button:0,clientX:'j',pointerId:1,pointerType:'touch',preventDefault(){}});
  if(event==='tile-transfer')board.emit('lostpointercapture',{pointerId:1,target:new Element('polygon')});
  else board.emit(event==='other-pointer-loss'?'lostpointercapture':'pointercancel',{pointerId:2});
  assert.deepEqual(opened,[]);board.emit('pointerup',{pointerId:1});assert.deepEqual(opened,[selected?'j':'pending']);
  board.emit('lostpointercapture',{pointerId:1});board.emit('pointerup',{pointerId:1});assert.equal(opened.length,1);
  assert.deepEqual(chosen,selected?[]:['j']);
 }
});
test('genuine board capture loss cancels the gesture without opening a picker',()=>{
 const board=new Element('svg'),opened=[];board.setPointerCapture=()=>{};board.hasPointerCapture=()=>true;board.releasePointerCapture=()=>{};
 const c={$:()=>board,dragging:false,preview:false,canPlay:()=>true,tileAt:x=>x,selection:[],game:{state:{tiles:[{id:'j',letter:'?'}]}},choose(){},openJoker:()=>opened.push('edit'),openPendingJoker:()=>opened.push('pending')};
 const source=fs.readFileSync('online/app.js','utf8');vm.createContext(c);vm.runInContext(source.slice(source.indexOf('let boardGesture='),source.indexOf("$('board').onkeydown=")),c);
 board.onpointerdown({button:0,clientX:'j',pointerId:1,preventDefault(){}});board.emit('lostpointercapture',{pointerId:1});board.emit('pointerup',{pointerId:1});assert.deepEqual(opened,[]);
});
test('production board redraw keeps touched groups and polygons connected while updating selection, letters and ownership',()=>{
 class Svg extends Element{
  constructor(tag){super(tag);this.dataset={};}
  setAttribute(k,v){super.setAttribute(k,v);if(k==='data-id')this.dataset.id=v;if(k==='class')this.className=v;}
  matches(s){return s==='text:not(.value)'?this.tag==='text'&&!this.className?.split(' ').includes('value'):s.startsWith('.')?this.className?.split(' ').includes(s.slice(1)):this.tag===s;}
  querySelector(s){return this.querySelectorAll(s)[0]||null;}
  querySelectorAll(s){return this.children.flatMap(c=>[...(c.matches(s)?[c]:[]),...c.querySelectorAll(s)]);}
  append(...children){for(const child of children){if(child.parent)child.remove();child.parent=this;}super.append(...children);}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);this.parent=null;}
  replaceChildren(...children){for(const c of this.children)c.parent=null;this.children=[];this.append(...children);}
 }
 const board=new Svg('svg'),svg=(tag,attrs={},text)=>{const e=new Svg(tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;return e;};
 const game={id:'g',state:{tiles:[{id:'j',q:0,r:0,letter:'?',owner:1,castle:false},{id:'a',q:1,r:0,letter:'A',owner:0,castle:true}]}},context={$:()=>board,svg,game,history:[],selection:[],jokers:{},availableTiles:(_s,path)=>new Set(path.length?['a']:['j']),user:{id:'me'},seatOf:()=>1,focusTile:null,preview:false,canPlay:()=>true,highlightLast:false,config:{},tilePoints:t=>t.id,castleLabel:()=>'Castle',Engine:{letterValue:l=>l==='?'?0:1}};
 const source=fs.readFileSync('online/app.js','utf8');vm.createContext(context);vm.runInContext(source.slice(source.indexOf('const pos='),source.indexOf('function openJoker(')),context);context.canPlay=()=>true;
 context.drawBoard();const group=board.querySelectorAll('.tile')[0],polygon=group.querySelector('polygon'),letter=group.querySelector('text:not(.value)'),line=board.querySelector('.path');
 context.selection=['j'];context.drawBoard();assert.equal(board.querySelectorAll('.tile')[0],group);assert.equal(group.querySelector('polygon'),polygon);assert.equal(group.parent,board);assert.equal(polygon.parent,group);assert.equal(group.getAttribute('aria-pressed'),'true');assert.equal(group.querySelector('.step').textContent,'1');assert.equal(group.querySelector('.next-outline'),null);assert.ok(board.querySelectorAll('.tile')[1].querySelector('.next-outline'));
 context.jokers.j='Å';context.drawBoard();assert.equal(group.querySelector('text:not(.value)'),letter);assert.equal(letter.textContent,'Å');assert.equal(board.querySelector('.path'),line);
 game.state.tiles[0].owner=2;context.selection=[];context.drawBoard();assert.ok(group.className.includes('owner2'));assert.equal(group.querySelector('.step'),null);assert.equal(letter.textContent,'');assert.equal(group.querySelector('polygon'),polygon);
 game.state.tiles=game.state.tiles.slice(0,1);context.drawBoard();assert.equal(board.querySelectorAll('.tile').length,1);assert.equal(board.querySelectorAll('.path').length,1);
});

test('opening release cannot dismiss the modal or click a key on Android; the next deliberate tap works',()=>{
 const f=setup();f.open();
 // Pointerdown happened on the board, pointerup opened this modal; WebView's
 // subsequent compatibility click is retargeted to the new backdrop or key.
 for(const target of [f.dialog,f.keys()[0]]){
  const e=f.dialog.emit('click',{target,detail:1,clientX:100,clientY:100});
  if(!e.prevented&&target!==f.dialog)target.onclick();
  assert.equal(e.prevented,true);assert.equal(f.controller.active,true);assert.deepEqual(f.saved,{});
 }
 f.dialog.emit('pointerdown');const e=f.dialog.emit('click',{target:f.keys()[0],detail:1});
 assert(!e.prevented);f.keys()[0].onclick();assert.equal(f.controller.active,false);assert.deepEqual(f.saved,{j:'Q'});
});
test('fresh backdrop taps close the picker; cancelled gestures and old openers cannot close a reopened picker',()=>{
 const f=setup();f.open();f.dialog.emit('pointerdown');f.dialog.emit('pointercancel');
 assert.equal(f.dialog.emit('click',{detail:1,clientX:100,clientY:100}).prevented,true);assert(f.controller.active);
 f.dialog.emit('pointerdown');f.open();assert.equal(f.dialog.emit('click',{detail:1,clientX:100,clientY:100}).prevented,true);
 f.dialog.emit('pointerdown');f.dialog.emit('click',{detail:1,clientX:100,clientY:100});assert(!f.controller.active);
 f.open();f.dialog.emit('click',{detail:0,clientX:100,clientY:100});assert(!f.controller.active,'assistive click still works');
});

test('picker uses the playing side, retains it between jokers, and resets when opening another game',()=>{
 const f=setup(undefined,{two:true});f.open('j','walnut');assert.equal(f.dialog.getAttribute('data-side'),'walnut');
 f.choose('M');assert.equal(f.dialog.getAttribute('data-side'),'walnut');assert(f.controller.active);f.choose('T');
 f.open('j','sage');assert.equal(f.dialog.getAttribute('data-side'),'sage');f.dialog.emit('cancel');
 f.open('j','walnut');assert.equal(f.dialog.getAttribute('data-side'),'walnut');
});
