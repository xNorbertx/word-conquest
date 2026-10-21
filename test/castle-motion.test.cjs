const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),path=require('node:path');
const {buildSync}=require('esbuild');
const source=buildSync({entryPoints:[path.join(__dirname,'../online/score-motion.js')],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;

// A small DOM/animation boundary double: exercise the real asynchronous controller,
// including cancellation, without a server, browser, or altered scoring rules.
function setup({reduced=false,interrupt=false,skipAt,skipAll=false,restoreOnComplete=false}={}){
  const nodes=new Map(),animations=[],events={},documentEvents={};let now=0,completed=0,motion,skipEvent,skipped=false;const phases=new Set();
  const clickShield=()=>{const shield=document.body.children.find(e=>e.classes.has('score-motion-dismiss'));if(!shield)return;skipEvent={preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;}};shield.onclick(skipEvent);};
  class Element{
    constructor(tag='div'){this.tag=tag;this.children=[];this.dataset={};this.attrs={};this.style={};this.textContent='';this.classes=new Set();this.classList={add:(...v)=>v.forEach(x=>this.classes.add(x)),remove:(...v)=>v.forEach(x=>this.classes.delete(x)),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};}
    set textContent(value){this.text=String(value);}get textContent(){return this.text;}
    set className(v){this.classes=new Set(v.split(' '));}get className(){return [...this.classes].join(' ');}
    setAttribute(k,v){this.attrs[k]=v;if(k==='class')this.className=v;}
    append(...elements){for(const e of elements){e.parent=this;this.children.push(e);}}
    replaceChildren(...elements){this.children=[];this.append(...elements);}
    remove(){if(this.parent)this.parent.children=this.parent.children.filter(e=>e!==this);this.parent=null;}
    get isConnected(){return this===document.body||!!this.parent?.isConnected;}
    focus(){document.activeElement=this;}
    querySelectorAll(selector){return this.children.filter(e=>selector==='[data-id]'?e.attrs['data-id']:e.classes.has(selector.slice(1)));}
    querySelector(selector){if(selector.startsWith('[data-id='))return this.children.find(e=>e.attrs['data-id']===selector.slice(10,-2));if(selector==='text:not(.value)')return this.children.find(e=>e.tag==='text'&&!e.classes.has('value'));return this.children.find(e=>selector[0]==='.'?e.classes.has(selector.slice(1)):e.tag===selector);}
    getBoundingClientRect(){return{left:100,top:200,width:50,height:50};}
    animate(frames,{duration}){const phase=$('score-motion').dataset.phase;phases.add(phase);if(phase===skipAt&&!skipped){skipped=true;queueMicrotask(()=>{clickShield();if(skipAll)clickShield();});}animations.push({el:this,frames,duration,phase,ownerStates:$('board').children.map(t=>t.className),score:$('score-1').textContent,bubbles:document.body.children.find(e=>e.classes.has('score-motion-layer'))?.children.length||0});let resolve,reject;const finished=new Promise((a,b)=>{resolve=a;reject=b;});if(!interrupt||duration!==560)queueMicrotask(resolve);else queueMicrotask(()=>motion.cancel());return{finished,cancel:()=>reject(Object.assign(Error('Cancelled'),{name:'AbortError'}))};}
  }
  const document={body:new Element(),hidden:false,getElementById:id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);},createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t),addEventListener:(name,fn)=>documentEvents[name]=fn};
  const window={addEventListener:(name,fn)=>events[name]=fn};
  const $=document.getElementById,media={matches:reduced,addEventListener(){}};
  $('game-table').dataset.seat='1';
  const beforeTiles=[{id:'0,0',q:0,r:0,letter:'D',value:2,owner:2,castle:true}],afterTiles=[{...beforeTiles[0],owner:1}];
  const t=new Element('g');t.setAttribute('data-id','0,0');t.className='tile castle-tile owner2';
  for(const [tag,cls]of [['polygon',''],['text',''],['text','value'],['circle','castle-pulse'],['circle','marker']]){const child=new Element(tag);child.className=cls;t.append(child);}$('board').append(t);
  const context={module:{exports:{}},exports:{},document,window,matchMedia:()=>media,DOMException,AbortController,performance:{now:()=>now},setTimeout:(fn)=>setTimeout(fn,0),clearTimeout,requestAnimationFrame:fn=>setTimeout(()=>{now+=200;fn(now);},0),cancelAnimationFrame:clearTimeout};
  vm.runInNewContext(source,context);motion=context.module.exports.createBoardScoreMotion({onComplete:()=>{completed++;if(restoreOnComplete){plan.totalsAfter.forEach((n,i)=>$('score-'+(i+1)).textContent=String(n));t.classes.delete('owner2');t.classes.add('owner1');}}});
  const plan={player:1,word:'D',path:['0,0'],beforeTiles,afterTiles,totalsBefore:[10,10],totalsAfter:[15,5],castleCaptures:['0,0'],events:[{kind:'territory',player:1,amount:5,sources:[{id:'0,0',amount:5}]},{kind:'loss',player:2,amount:-5,sources:[{id:'0,0',amount:-5}]}]};
  return{motion,plan,$,tile:t,animations,events,documentEvents,document,completed:()=>completed,clickShield,skipEvent:()=>skipEvent,phases};
}
test('castle controller plays one lift and ripple, updates ownership and finishes at the authoritative totals',async()=>{
  const h=setup();await h.motion.play(h.plan,{seat:1,names:['A','B']});
  assert.equal(h.animations.filter(a=>a.duration===560).length,2);assert.ok(h.tile.classes.has('owner1'));assert.equal(h.$('score-1').textContent,'15');assert.equal(h.$('score-2').textContent,'5');assert.equal(h.motion.active,false);assert.equal(h.$('board').inert,false);assert.equal(h.completed(),1);
});
test('reduced motion changes ownership and exact totals without any animation',async()=>{
  const h=setup({reduced:true});await h.motion.play(h.plan,{seat:1,names:['A','B']});assert.equal(h.animations.length,0);assert.ok(h.tile.classes.has('owner1'));assert.equal(h.$('score-1').textContent,'15');assert.equal(h.completed(),1);
});
test('Skip during a castle lift cancels both effects and restores the saved game once',async()=>{
  const h=setup({interrupt:true});await h.motion.play(h.plan,{seat:1,names:['A','B']});assert.equal(h.motion.active,false);assert.equal(h.$('board').inert,false);assert.equal(h.completed(),1);assert.equal(h.$('score-motion').hidden,true);assert.equal(h.document.body.children.length,0);
});
test('resize and backgrounding cancel castle playback cleanly',async()=>{
  for(const event of ['resize','visibilitychange']){const h=setup();const playing=h.motion.play(h.plan,{seat:1,names:['A','B']});if(event==='resize')h.events.resize();else{h.document.hidden=true;h.documentEvents.visibilitychange();}await playing;assert.equal(h.motion.active,false);assert.equal(h.completed(),1);assert.equal(h.document.body.children.length,0);}
});

test('a double click anywhere skips all phases immediately, consumes both clicks and guards click-through',async()=>{
  for(const reduced of [false,true]){
    const h=setup({reduced,restoreOnComplete:true});const focus=h.document.createElement('button');h.document.body.append(focus);focus.focus();
    const playing=h.motion.play(h.plan,{seat:1,names:['A','B']});
    const shield=h.document.body.children.find(e=>e.classes.has('score-motion-dismiss'));
    assert.equal(shield.tag,'button');assert.equal(shield.type,'button');
    assert.equal(shield.attrs['aria-label'],'Skip this scoring section. Double-tap to skip all.');assert.equal(h.document.activeElement,shield);
    assert.equal(shield.onpointerdown,undefined,'shield must survive until the completed click to prevent click-through');
    h.clickShield();assert.equal(h.motion.active,true);h.clickShield();
    assert.equal(h.skipEvent().prevented,true);assert.equal(h.skipEvent().stopped,true);
    assert.equal(h.motion.active,false);assert.equal(h.$('score-1').textContent,'15');assert.equal(h.$('score-2').textContent,'5');
    assert.ok(h.tile.classes.has('owner1'));assert.equal(shield.isConnected,true);h.clickShield();
    assert.equal(h.$('board').inert,false);assert.equal(h.$('score-motion').hidden,true);
    await playing;assert.equal(h.completed(),1);assert.equal(h.animations.length,0);
    await new Promise(resolve=>setTimeout(resolve,5));assert.deepEqual(h.document.body.children,[focus]);assert.equal(h.document.activeElement,focus);
  }
});
for(const phase of ['word','capture','castles','final-territory'])test(`double tap during ${phase} ends the whole sequence, including final scores for both players`,async()=>{
  const h=setup({skipAt:phase,skipAll:true,restoreOnComplete:true});
  h.plan.events=[{kind:'word',player:1,amount:4},{kind:'castles',player:2,amount:3},{kind:'final-territory',player:1,amount:2},{kind:'final-territory',player:2,amount:1}].map(e=>({...e,sources:[{id:'0,0',amount:e.amount}]}));
  h.plan.totalsAfter=[16,14];
  await h.motion.play(h.plan,{seat:1,names:['A','B']});
  assert.equal(h.skipEvent().prevented,true);assert.equal(h.skipEvent().stopped,true);
  await new Promise(resolve=>setTimeout(resolve,5));assert.equal(h.motion.active,false);assert.equal(h.completed(),1);assert.equal(h.document.body.children.length,0);
  assert.equal(h.$('score-1').textContent,'16');assert.equal(h.$('score-2').textContent,'14');
  assert.equal([...h.phases].at(-1),phase,'no later phase starts after the skip');
});
test('Escape skips and a replaced replay does not remove its successor shield',async()=>{
  const h=setup();const first=h.motion.play(h.plan,{seat:1,names:['A','B']});
  const old=h.document.body.children.find(e=>e.classes.has('score-motion-dismiss'));
  const second=h.motion.play(h.plan,{seat:1,names:['A','B']});await first;
  assert.equal(old.isConnected,false);assert.equal(h.motion.active,true);assert.equal(h.completed(),0);
  const shield=h.document.body.children.find(e=>e.classes.has('score-motion-dismiss'));
  assert.notEqual(shield,old);let prevented=false,stopped=false;
  shield.onkeydown({key:'Escape',preventDefault(){prevented=true;},stopPropagation(){stopped=true;}});
  await second;assert.ok(prevented&&stopped);assert.equal(h.completed(),1);assert.equal(h.document.body.children.length,0);
});

function wordFixture(h){
  const before=[{id:'0,0',q:0,r:0,letter:'C',value:3,owner:1},{id:'1,0',q:1,r:0,letter:'?',value:0,owner:2},{id:'2,0',q:2,r:0,letter:'T',value:2,owner:0}];
  const Element=h.tile.constructor;h.$('board').replaceChildren();
  for(const t of before){const el=new Element('g');el.setAttribute('data-id',t.id);el.className='tile owner'+t.owner;for(const [tag,cls]of [['polygon',''],['text',''],['text','value']]){const child=new Element(tag);child.className=cls;el.append(child);}h.$('board').append(el);}
  Object.assign(h.plan,{word:'CAT',path:before.map(t=>t.id),beforeTiles:before,afterTiles:before.map(t=>({...t,owner:1,letter:'Z'})),castleCaptures:[],totalsAfter:[18,10],events:[{kind:'word',player:1,amount:8,sources:[...before.map(t=>({id:t.id,amount:t.value})),{bonus:true,amount:3}]}]});
}
test('word points travel one letter at a time, including joker ownership, with the bonus strictly last',async()=>{
 const h=setup();wordFixture(h);await h.motion.play(h.plan,{seat:1,names:['A','B']});
 const arrivals=h.animations.filter(a=>a.duration===240);assert.equal(arrivals.length,4);assert.deepEqual(arrivals.map(a=>a.phase),['word','word','word','length']);
 assert.deepEqual(arrivals.map(a=>String(a.score)),['10','13','13','15']);assert.ok(arrivals.every(a=>a.bubbles===1),'only one letter or bonus bubble exists');
 assert.ok(arrivals[0].ownerStates[1].includes('owner2'));assert.ok(arrivals[1].ownerStates[1].includes('owner1'));assert.ok(arrivals[1].ownerStates[2].includes('owner0'));assert.ok(arrivals[2].ownerStates[2].includes('owner1'));
 assert.equal(h.$('score-1').textContent,'18');assert.equal(String(h.$('score-2').textContent),'10');assert.equal(h.completed(),1);
});
test('the length bonus can be skipped with the same full-screen tap',async()=>{
 const h=setup({skipAt:'length',restoreOnComplete:true});wordFixture(h);await h.motion.play(h.plan,{seat:1,names:['A','B']});assert.equal(h.motion.active,false);assert.equal(h.completed(),1);assert.equal(h.$('score-1').textContent,'18');await new Promise(resolve=>setTimeout(resolve,5));assert.equal(h.document.body.children.length,0);
});
test('reduced-motion word playback changes every tile and reaches exact totals without flights',async()=>{
 const h=setup({reduced:true});wordFixture(h);await h.motion.play(h.plan,{seat:1,names:['A','B']});assert.equal(h.animations.length,0);assert.equal(h.$('score-1').textContent,'18');assert.ok(h.$('board').children.every(t=>t.classes.has('owner1')));assert.equal(h.completed(),1);
});

for(const phase of ['word','capture','castles'])test(`one tap during ${phase} proceeds through the remaining sections`,async()=>{
 const h=setup({skipAt:phase,restoreOnComplete:true});
 h.plan.events=[{kind:'word',player:1,amount:4},{kind:'castles',player:2,amount:3},{kind:'final-territory',player:1,amount:2},{kind:'final-territory',player:2,amount:1}].map(e=>({...e,sources:[{id:'0,0',amount:e.amount}]}));
 h.plan.totalsAfter=[16,14];await h.motion.play(h.plan,{seat:1,names:['A','B']});
 assert(h.skipEvent().prevented&&h.skipEvent().stopped);assert(h.phases.has('final-territory'));assert.equal(h.completed(),1);
 assert.equal(h.$('score-1').textContent,'16');assert.equal(h.$('score-2').textContent,'14');
});
