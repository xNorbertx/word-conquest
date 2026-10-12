const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),path=require('node:path');
const {buildSync}=require('esbuild');
const source=buildSync({entryPoints:[path.join(__dirname,'../online/score-motion.js')],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;

// A small DOM/animation boundary double: exercise the real asynchronous controller,
// including cancellation, without a server, browser, or altered scoring rules.
function setup({reduced=false,interrupt=false}={}){
  const nodes=new Map(),animations=[],events={},documentEvents={};let now=0,completed=0,motion;
  class Element{
    constructor(tag='div'){this.tag=tag;this.children=[];this.dataset={};this.attrs={};this.style={};this.textContent='';this.classes=new Set();this.classList={add:(...v)=>v.forEach(x=>this.classes.add(x)),remove:(...v)=>v.forEach(x=>this.classes.delete(x)),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};}
    set className(v){this.classes=new Set(v.split(' '));}get className(){return [...this.classes].join(' ');}
    setAttribute(k,v){this.attrs[k]=v;if(k==='class')this.className=v;}
    append(...elements){for(const e of elements){e.parent=this;this.children.push(e);}}
    replaceChildren(...elements){this.children=[];this.append(...elements);}
    remove(){if(this.parent)this.parent.children=this.parent.children.filter(e=>e!==this);}
    querySelectorAll(selector){return this.children.filter(e=>selector==='[data-id]'?e.attrs['data-id']:e.classes.has(selector.slice(1)));}
    querySelector(selector){if(selector.startsWith('[data-id='))return this.children.find(e=>e.attrs['data-id']===selector.slice(10,-2));if(selector==='text:not(.value)')return this.children.find(e=>e.tag==='text'&&!e.classes.has('value'));return this.children.find(e=>selector[0]==='.'?e.classes.has(selector.slice(1)):e.tag===selector);}
    getBoundingClientRect(){return{left:100,top:200,width:50,height:50};}
    animate(frames,{duration}){animations.push({el:this,frames,duration});let resolve,reject;const finished=new Promise((a,b)=>{resolve=a;reject=b;});if(!interrupt||duration!==560)queueMicrotask(resolve);else queueMicrotask(()=>motion.cancel());return{finished,cancel:()=>reject(Object.assign(Error('Cancelled'),{name:'AbortError'}))};}
  }
  const document={body:new Element(),hidden:false,getElementById:id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);},createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t),addEventListener:(name,fn)=>documentEvents[name]=fn};
  const window={addEventListener:(name,fn)=>events[name]=fn};
  const $=document.getElementById,media={matches:reduced,addEventListener(){}};
  $('game-table').dataset.seat='1';
  const beforeTiles=[{id:'0,0',q:0,r:0,letter:'D',value:2,owner:2,castle:true}],afterTiles=[{...beforeTiles[0],owner:1}];
  const t=new Element('g');t.setAttribute('data-id','0,0');t.className='tile castle-tile owner2';
  for(const [tag,cls]of [['polygon',''],['text',''],['text','value'],['circle','castle-pulse'],['circle','marker']]){const child=new Element(tag);child.className=cls;t.append(child);}$('board').append(t);
  const context={module:{exports:{}},exports:{},document,window,matchMedia:()=>media,DOMException,AbortController,performance:{now:()=>now},setTimeout:(fn)=>setTimeout(fn,0),clearTimeout,requestAnimationFrame:fn=>setTimeout(()=>{now+=200;fn(now);},0),cancelAnimationFrame:clearTimeout};
  vm.runInNewContext(source,context);motion=context.module.exports.createBoardScoreMotion({onComplete:()=>completed++});
  const plan={player:1,word:'D',path:['0,0'],beforeTiles,afterTiles,totalsBefore:[10,10],totalsAfter:[15,5],castleCaptures:['0,0'],events:[{kind:'territory',player:1,amount:5,sources:[{id:'0,0',amount:5}]},{kind:'loss',player:2,amount:-5,sources:[{id:'0,0',amount:-5}]}]};
  return{motion,plan,$,tile:t,animations,events,documentEvents,document,completed:()=>completed};
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
