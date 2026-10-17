const {test,before}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let createTheme;
before(async()=>({createTheme}=await import('../online/theme.mjs')));
function setup(saved,{onChange=()=>{},storageOverride}={}){
 const values=new Map([['wc-pending:person:game','keep'],...(saved==null?[]:[['wc-theme',saved]])]),writes=[];
 const root={dataset:{}},button={setAttribute(k,v){this[k]=v;}},meta={setAttribute(k,v){this[k]=v;}},events={listeners:{},addEventListener(k,fn){this.listeners[k]=fn;}};
 const storage={getItem:k=>values.get(k)||null,setItem(k,v){writes.push(k);values.set(k,v);}};
 const controller=createTheme({root,button,meta,events,storage:storageOverride||(()=>storage),onChange});
 return {root,button,meta,events,storage,values,writes,controller};
}
test('first visit remains light; an explicit saved dark preference restores immediately',()=>{
 for(const stored of [undefined,'light','unexpected']){const f=setup(stored);assert.equal(f.root.dataset.theme,'light');assert.equal(f.button['aria-checked'],'false');assert.equal(f.meta.content,'#f6f3eb');assert.deepEqual(f.writes,[]);}
 const f=setup('dark');assert.equal(f.root.dataset.theme,'dark');assert.equal(f.button['aria-checked'],'true');assert.equal(f.meta.content,'#191d18');
});
test('the account switch changes appearance and saves only the device preference, including toggling back',()=>{
 const f=setup();f.button.onclick();assert.equal(f.root.dataset.theme,'dark');assert.equal(f.values.get('wc-theme'),'dark');assert.equal(setup(f.values.get('wc-theme')).controller.theme,'dark');
 f.button.onclick();assert.equal(f.root.dataset.theme,'light');assert.equal(f.meta.content,'#f6f3eb');assert.equal(f.button['aria-checked'],'false');assert.deepEqual(f.writes,['wc-theme','wc-theme']);assert.equal(f.values.get('wc-pending:person:game'),'keep');
});
test('denied storage and failed writes never prevent changing appearance during the session',()=>{
 for(const storageOverride of [()=>{throw Error('Denied');},()=>({getItem:()=>null,setItem(){throw Error('Full');}})]){
  const f=setup(null,{storageOverride});f.button.onclick();assert.equal(f.controller.theme,'dark');f.button.onclick();assert.equal(f.controller.theme,'light');
 }
});
test('other tabs and back/forward restoration follow the stored setting without echo writes',()=>{
 const f=setup();f.values.set('wc-theme','dark');f.events.listeners.storage({key:'unrelated',storageArea:f.storage});assert.equal(f.controller.theme,'light');
 f.events.listeners.storage({key:'wc-theme',storageArea:{}});assert.equal(f.controller.theme,'light');f.events.listeners.storage({key:'wc-theme',storageArea:f.storage});assert.equal(f.controller.theme,'dark');
 f.values.set('wc-theme','light');f.events.listeners.pageshow({persisted:true});assert.equal(f.controller.theme,'light');f.values.delete('wc-theme');f.events.listeners.storage({key:null,storageArea:f.storage});assert.equal(f.controller.theme,'light');assert.deepEqual(f.writes,[]);
});
test('native chrome updates stay in toggle order and a failed bridge does not break later updates',async()=>{
 const calls=[],releases=[];let active=0,max=0;
 const f=setup(null,{onChange:theme=>{calls.push(theme);max=Math.max(max,++active);return new Promise((resolve,reject)=>releases.push(fail=>{active--;fail?reject(Error('Unavailable')):resolve();}));}});
 f.button.onclick();f.button.onclick();assert.equal(f.controller.theme,'light');
 await new Promise(r=>setImmediate(r));assert.deepEqual(calls,['light']);releases.shift()(true);
 await new Promise(r=>setImmediate(r));assert.deepEqual(calls,['light','dark']);releases.shift()();
 await new Promise(r=>setImmediate(r));assert.deepEqual(calls,['light','dark','light']);releases.shift()();await f.controller.settled();assert.equal(max,1);
});
test('head bootstrap restores the saved palette and browser colour before styles or app rendering',()=>{
 const html=fs.readFileSync('online/index.html','utf8'),match=html.match(/<script id="theme-bootstrap">([\s\S]*?)<\/script>/);assert(match);assert(html.indexOf(match[0])<html.indexOf('<link rel="stylesheet"'));
 for(const saved of ['dark','light','bad',null]){
  const root={dataset:{}},meta={};vm.runInNewContext(match[1],{localStorage:{getItem:k=>{assert.equal(k,'wc-theme');return saved;}},document:{documentElement:root,querySelector:()=>meta}});
  assert.equal(root.dataset.theme,saved==='dark'?'dark':'light');assert.equal(meta.content,saved==='dark'?'#191d18':'#f6f3eb');
 }
 assert.doesNotThrow(()=>vm.runInNewContext(match[1],{get localStorage(){throw Error('Blocked');}}));
});
function luminance(hex){const [r,g,b]=hex.slice(1).match(/../g).map(h=>parseInt(h,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return .2126*r+.7152*g+.0722*b;}
function contrast(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
test('night palette keeps text, small letter values, actions and castle/ownership markers legible',()=>{
 const css=fs.readFileSync('online/online.css','utf8'),dark=css.slice(css.indexOf('/* Night palette:'));
 const values=Object.fromEntries([...dark.matchAll(/(--[\w-]+):\s*(#[\da-f]{6})/g)].map(m=>[m[1],m[2]]));
 const backgrounds=[values['--night-tile'],values['--sage'],values['--walnut'],values['--night-castle'],...dark.matchAll(/--own-fill:(#[\da-f]{6})/g)].map(x=>Array.isArray(x)?x[1]:x);
 for(const bg of backgrounds){for(const fg of [values['--ink'],values['--night-values']])assert(contrast(fg,bg)>=4.5,`${fg} on tile ${bg}`);assert(contrast(values['--night-gold'],bg)>=3);}
 for(const bg of [values['--bg'],values['--paper'],values['--green-soft'],values['--night-walnut-soft']]){
  for(const fg of [values['--ink'],values['--muted'],values['--green'],values['--night-walnut']])assert(contrast(fg,bg)>=4.5,`${fg} on UI ${bg}`);
 }
 for(const bg of [values['--green'],values['--night-walnut'],values['--danger']])assert(contrast(values['--paper'],bg)>=4.5,'Action text');
});
