const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),path=require('node:path'),{buildSync}=require('esbuild');
const source=buildSync({entryPoints:[path.join(__dirname,'../online/move-history.js')],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const move=n=>({revision:n,recap:{action:'word',player:1,word:n===3?'LONGSWEDISHWORD':'GARDENS',at:new Date().toISOString(),score:{letters:9,lengthBonus:3,wordPoints:12},income:[0,5],incomeTiming:'defended'}});
function setup(api){
 const nodes=new Map();
 class El{
  constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.hidden=false;this.disabled=false;this._text='';this.className='';}
  set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(x=>x.textContent).join('');}
  append(...children){for(const c of children){c.parent=this;this.children.push(c);}}
  replaceChildren(...children){for(const c of this.children)c.parent=null;this.children=[];this._text='';this.append(...children);}
  setAttribute(k,v){this.attrs[k]=String(v);}
  get isConnected(){return this.root||!!this.parent?.isConnected;}
  querySelectorAll(){return [];}
  showModal(){this.open=true;}close(){this.open=false;}
 }
 const document={getElementById:id=>{if(!nodes.has(id)){const el=new El('div');el.root=true;nodes.set(id,el);}return nodes.get(id);},createElement:t=>new El(t),createElementNS:(_,t)=>new El(t)};
 const context={module:{exports:{}},exports:{},document,console,Date};vm.runInNewContext(source,context);
 let user={id:'a'},game={id:'g',revision:3,names:['Alice','Björn'],players:['a','b']},moves=[move(3)],preview=false,stopped=0,replayed=0;
 const controller=context.module.exports.createMoveHistory({api,getUser:()=>user,getGame:()=>game,getMoves:()=>moves,isPreview:()=>preview,stopMotion:()=>stopped++,replay:()=>replayed++,canReplay:()=>!preview});
 const $=document.getElementById,walk=(el,p)=>[...(p(el)?[el]:[]),...el.children.flatMap(c=>walk(c,p))];
 return{controller,$,walk,stopped:()=>stopped,replayed:()=>replayed,changeUser:v=>user=v,changeGame:v=>game=v,setPreview:()=>{preview=true;moves=[];},button:label=>walk($('sheet-content'),e=>e.tag==='button'&&e.textContent.includes(label))[0]};
}
test('last-move history popup uses aligned score columns, recipient rows and no tile-change recap',async()=>{
 const h=setup(async()=>({history:[move(3),move(2)],hasMore:false,nextBefore:2}));h.controller.show();await tick();
 assert.equal(h.$('sheet-title').textContent,'Move history');assert.equal(h.stopped(),1);
 const header=h.walk(h.$('sheet-content'),e=>e.scope==='col');assert.deepEqual(header.map(e=>e.textContent),['Move','Word','Length','Castles','Total']);assert.equal(header[2].attrs['aria-label'],'Length bonus');
 const rows=h.walk(h.$('sheet-content'),e=>e.tag==='tr'&&e.className);assert.equal(rows.length,4);assert.equal(rows[0].children.at(-1).textContent,'+12');assert.equal(rows[1].children.at(-1).textContent,'+5');assert.ok(rows[1].textContent.includes('Björn'));assert.ok(rows[0].textContent.includes('You'));
 assert.ok(!h.$('sheet-content').textContent.includes('After the word'));assert.ok(!h.$('sheet-content').textContent.includes('Show word on the board'));assert.equal(h.button('Older moves').hidden,true);h.button('Replay points').onclick();assert.equal(h.replayed(),1);
});
test('prefetched history renders immediately on opening and reopening without another request',async()=>{
 let calls=0;const h=setup(async()=>{calls++;return{history:[move(3),move(2)],hasMore:false,nextBefore:2};});h.controller.warm();await tick();h.controller.show();assert.equal(h.walk(h.$('sheet-content'),e=>e.className.startsWith('history-move')).length,2);h.controller.show();await tick();assert.equal(calls,1);
});
test('offline history retains its latest move and Retry fills the popup without losing that row',async()=>{
 let calls=0;const h=setup(async()=>{if(++calls===1)throw Error('offline');return{history:[move(3),move(2)],hasMore:false,nextBefore:2};});h.controller.show();await tick();assert.ok(h.$('sheet-content').textContent.includes('Could not load moves.'));assert.ok(h.$('sheet-content').textContent.includes('LONGSWEDISHWORD'));h.button('Retry').onclick();await tick();assert.equal(h.walk(h.$('sheet-content'),e=>e.className.startsWith('history-move')).length,2);assert.equal(h.button('Older moves').hidden,true);
});
test('late history responses cannot replace another sheet or a different account view',async()=>{
 for(const change of ['sheet','user']){let resolve;const h=setup(()=>new Promise(r=>resolve=r));h.controller.show();if(change==='sheet')h.$('sheet-content').replaceChildren();else{h.changeUser({id:'b'});h.controller.reset();}resolve({history:[move(3),move(2)],hasMore:false,nextBefore:2});await tick();assert.equal(h.walk(h.$('sheet-content'),e=>e.className.startsWith('history-move')).length,change==='sheet'?0:1);}
});
test('practice history is an empty popup without a network request or replay action',()=>{
 const h=setup(()=>{throw Error('Unexpected request');});h.setPreview();h.controller.show();assert.ok(h.$('sheet-content').textContent.includes('No moves yet.'));assert.equal(h.button('Replay points'),undefined);
});

test('failed background history prefetch runs once per revision and opening still retries',async()=>{
 let calls=0;const h=setup(async()=>{calls++;throw Error('offline');});h.controller.warm();await tick();h.controller.warm();await tick();assert.equal(calls,1);h.controller.show();await tick();assert.equal(calls,2);assert.ok(h.button('Retry'));
});
