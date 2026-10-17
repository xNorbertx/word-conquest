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
 addEventListener(name,fn){(this.events[name]??=[]).push(fn);}emit(name,extra={}){const e={key:'',preventDefault(){},...extra};for(const fn of this.events[name]||[])fn(e);}
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
 const open=(tileId='j')=>controller.open({tileId,tiles,path,assignments:{...saved},alphabet,valid:()=>valid,onCommit:(id,value)=>{if(!accept)return false;saved[id]=value;return true;}});
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
 down('a');board.emit('pointercancel');board.emit('pointerup',{pointerId:1});assert.deepEqual(opened,['j']);
 down('a');board.onpointermove({clientX:'j',pointerId:1});assert.deepEqual(opened,['j']);board.emit('pointerup',{pointerId:1});assert.deepEqual(opened,['j','pending']);
});
