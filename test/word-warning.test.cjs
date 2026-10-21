const {test,before}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
let p;before(async()=>p=await import('../online/presentation.mjs'));
const source=fs.readFileSync(path.join(__dirname,'../online/app.js'),'utf8');
const unknown={status:400,code:'illegal_move',message:'That word is not in the dictionary.'};
function harness(error=unknown,{view='game',afterReject}={}){
 let saved={action:'word',path:['a','b','c'],jokers:{b:'Ä'},revision:3},modal=[],toasts=[];
 const context={user:{id:'self'},game:{id:'g',revision:3,state:{tiles:[]}},currentView:view,selection:['a','b','c'],jokers:{b:'Ä'},busy:false,gameLoad:0,gameFresh:true,refreshQueued:false,scoreMotion:{active:false},lastProblem:null,lastRequestId:null,
  pending:()=>saved,pendingKey:()=> 'pending-g',localStorage:{removeItem:()=>saved=null},Engine:{wordForPath:()=> 'XÄZ'},gameRequests:{reset(){}},renderGame(){},api:async()=>{afterReject?.(context);throw error;},openGame:async()=>{},status:message=>toasts.push(message),showUnknownWord:word=>modal.push(word),friendlyError:p.friendlyError,isUnknownWordError:p.isUnknownWordError};
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf('async function sendPending()'),source.indexOf('async function action(')),context);return{context,modal,toasts,get saved(){return saved;}};
}
test('only a dictionary rejection receives the modal presentation',()=>{
 assert.equal(p.isUnknownWordError(unknown),true);
 for(const e of [undefined,{}, {...unknown,code:'dictionary_unavailable'},{...unknown,message:'Start on your own territory.'}])assert.equal(p.isUnknownWordError(e),false);
});
test('rejected word shows its exact letters, clears pending retry, preserves selection/jokers and never toasts',async()=>{
 const h=harness();await h.context.sendPending();assert.deepEqual(h.modal,['XÄZ']);assert.deepEqual(h.toasts,[]);assert.deepEqual(h.context.selection,['a','b','c']);assert.deepEqual(h.context.jokers,{b:'Ä'});assert.equal(h.saved,null);assert.equal(h.context.busy,false);
});
test('other errors retain their existing presentation and retry handling',async()=>{
 const h=harness({...unknown,message:'Start on your own territory.'});await h.context.sendPending();assert.deepEqual(h.modal,[]);assert.equal(h.toasts.length,1);
 const offline=harness({status:503,code:'unavailable',message:'Offline'});await offline.context.sendPending();assert(offline.saved);assert.deepEqual(offline.modal,[]);assert.deepEqual(offline.toasts,[]);
});
test('late rejection never puts a game modal over another game, screen or account',async()=>{
 for(const afterReject of [c=>c.currentView='home',c=>c.game={id:'different'},c=>c.user={id:'different'}]){const h=harness(unknown,{afterReject});await h.context.sendPending();assert.deepEqual(h.modal,[]);}
});
