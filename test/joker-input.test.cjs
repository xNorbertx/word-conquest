const {test,before}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let bind,domain,languages;
before(async()=>{
 ({bindJokerInput:bind}=await import('../online/joker-input.mjs'));
 domain=await import('../server/domain.mjs');languages=await import('../server/languages.mjs');
});
function field(version='autumn-v3',onLetter=()=>{}){
 let value='',writes=0;
 const input={attributes:{},setAttribute(name,value){this.attributes[name]=value;},get value(){return value;},set value(v){value=v;writes++;}};
 bind(input,domain.configFor(version),onLetter);
 return {input,get writes(){return writes;},type(text,composing=false){value=text;input.oninput({isComposing:composing});},emit(name){input['on'+name]();}};
}
test('composing input updates the joker before keyboard commit and survives another tile selection',()=>{
 const jokers={};const f=field('autumn-v3',letter=>{jokers['0,0']=letter;});
 f.emit('compositionstart');f.type('a',true);
 assert.equal(jokers['0,0'],'A');assert.equal(f.input.value,'a');assert.equal(f.writes,0);
 const next=field('autumn-v3',letter=>{jokers['0,0']=letter;});next.input.value=jokers['0,0'];
 assert.equal(next.input.value,'A');
});
test('both composing flags and either final-input ordering preserve keyboard ownership',()=>{
 for(const hasStart of [false,true])for(const finalInputFirst of [false,true]){
  let letter='';const f=field('autumn-v3',v=>letter=v);
  if(hasStart)f.emit('compositionstart');f.type('c',true);
  assert.equal(letter,'C');assert.equal(f.writes,0);
  if(finalInputFirst)f.type('c');f.emit('compositionend');if(!finalInputFirst)f.type('C');
  assert.equal(letter,'C');assert.equal(f.input.value,'C');
 }
 const f=field();f.emit('compositionstart');f.type('b');assert.equal(f.input.value,'b');assert.equal(f.writes,0);
});
test('Swedish combining marks and keyboard replacements update the chosen letter without truncating composition',()=>{
 for(const [raw,expected] of [['a\u030a','Å'],['a\u0308','Ä'],['o\u0308','Ö']]){
  let letter;const f=field('autumn-sv-v1',v=>letter=v);f.emit('compositionstart');
  f.type(raw[0],true);f.type(raw,true);assert.equal(letter,expected);assert.equal(f.input.value,raw);assert.equal(f.writes,0);
  f.emit('compositionend');assert.equal(f.input.value,expected);
  f.emit('compositionstart');f.type('e',true);assert.equal(letter,'E');f.emit('blur');assert.equal(f.input.value,'E');
 }
});
test('ordinary input, paste, deletion and blur/change fallbacks keep a single allowed letter',()=>{
 let letter;const f=field('autumn-v3',v=>letter=v);f.type('t');assert.equal(letter,'T');assert.equal(f.input.value,'T');
 f.type(' 12cat');assert.equal(letter,'C');assert.equal(f.input.value,'C');
 f.type('Å');assert.equal(letter,'');f.type('');assert.equal(letter,'');
 f.input.value='d';f.emit('change');assert.equal(letter,'D');
 f.input.value='e';f.emit('blur');assert.equal(letter,'E');
});
test('two joker fields update independently, including clearing a composing letter',()=>{
 const jokers={};const a=field('autumn-v3',v=>jokers.a=v),b=field('autumn-v3',v=>jokers.b=v);
 a.emit('compositionstart');a.type('c',true);b.emit('compositionstart');b.type('a',true);
 assert.deepEqual(jokers,{a:'C',b:'A'});a.type('',true);assert.deepEqual(jokers,{a:'',b:'A'});
});
test('the actual selection renderer retains composing input and ignores detached field events',()=>{
 const vm=require('node:vm'),fs=require('node:fs');
 const connected=(node,value)=>{node.isConnected=value;for(const child of node.children)connected(child,value);};
 const node=()=>({children:[],isConnected:false,setAttribute(){},append(child){this.children.push(child);connected(child,this.isConnected);},replaceChildren(){for(const child of this.children)connected(child,false);this.children=[];}});
 const container=node();container.isConnected=true;
 const context={$:()=>container,node,bindJokerInput:bind,game:{state:{tiles:[{id:'joker',letter:'?'},{id:'next',letter:'T'}]}},selection:['joker'],jokers:{},config:domain.configFor('autumn-v3'),drawBoard(){},renderSelection(){}};
 const source=fs.readFileSync(require('node:path').join(__dirname,'../online/app.js'),'utf8');
 const renderer=source.slice(source.indexOf('function renderJokers(){'),source.indexOf('function selectionHint('));
 vm.createContext(context);vm.runInContext(renderer+';renderJokers();',context);
 const previous=container.children[0].children[0];previous.oncompositionstart();previous.value='a';previous.oninput({isComposing:true});
 assert.equal(context.jokers.joker,'A');context.selection.push('next');vm.runInContext('renderJokers()',context);
 const current=container.children[0].children[0];assert.equal(current.value,'A');
 previous.value='z';previous.oncompositionend();assert.equal(context.jokers.joker,'A');
 current.value='b';current.oninput({isComposing:false});assert.equal(context.jokers.joker,'B');
 context.selection=[];context.jokers={};vm.runInContext('renderJokers()',context);
 current.value='c';current.onblur();assert.equal(Object.keys(context.jokers).length,0);
});
test('words entered during composition are accepted by authoritative English and Swedish scoring',()=>{
 for(const [version,word,raw] of [['autumn-v3','CAT','a'],['autumn-sv-v1','FÅR','a\u030a']]){
  const config=domain.configFor(version),state=domain.Engine.newGame(config,()=>.3),players=[crypto.randomUUID(),crypto.randomUUID()];
  state.player=1;state.startingPlayer=1;const path=['-1,0','0,0','1,0'];
  path.forEach((id,i)=>Object.assign(state.tiles.find(t=>t.id===id),{letter:i===1?'?':word[i],owner:i===0?1:0}));
  const jokers={},f=field(version,letter=>jokers['0,0']=letter);f.emit('compositionstart');f.type(raw,true);
  assert.equal(domain.Engine.wordForPath(state,path,jokers),word);
  const dictionary=languages.languageForRules(version).dictionary;
  const words=new Set(require(version==='autumn-sv-v1'?'../server/versions/dictionary-sv-v1.json':'../server/versions/dictionary-v1.json'));
  const game={id:crypto.randomUUID(),players,names:['A','B'],revision:0,status:'active',rules_version:version,dictionary_version:dictionary.version,state};
  const result=domain.applyCommand(game,players[0],{action:'word',operationId:crypto.randomUUID(),revision:0,path,jokers},words,dictionary.version,()=>.4);
  assert.equal(result.recap.word,word);assert.equal(result.next.revision,1);assert.equal(result.next.state.tiles.find(t=>t.id==='0,0').letter,'?');
 }
});
