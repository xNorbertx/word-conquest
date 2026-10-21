const {test,before}=require('node:test'),assert=require('node:assert/strict');
let m;before(async()=>m=await import('../online/score-playback.mjs'));
const event=(kind,player,amount)=>({kind,player,amount,sources:[]});
const plan={totalsBefore:[30,20],castleCaptures:['0,0'],events:[event('word',1,8),event('castles',1,3),event('castles',2,5),event('territory',1,6),event('loss',2,-2)]};
const flush=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
function harness(){
 const rendered=[],settled=[];let completed=0,balance;
 const p=m.createScorePlayback({render(section,signal){rendered.push({section,signal});balance=[...section.totalsBefore];return new Promise((resolve,reject)=>{rendered.at(-1).resolve=resolve;signal.addEventListener('abort',()=>reject(new DOMException('Cancelled','AbortError')),{once:true});});},settle(section){balance=[...section.totalsAfter];settled.push(section.kind);},complete(){completed++;}});
 return{p,rendered,settled,get balance(){return balance;},get completed(){return completed;}};
}
test('word includes length; both castle recipients and legacy territory changes form whole sections',()=>{
 const sections=m.scoreSections(plan);assert.deepEqual(sections.map(s=>s.kind),['word','castles','territory']);
 assert.deepEqual(sections.map(s=>s.totalsAfter),[[38,20],[41,25],[47,23]]);assert.equal(sections[1].events.length,2);assert.equal(sections[2].events.length,2);
 assert.deepEqual(m.scoreSections({...plan,events:[event('word',1,0),event('final-territory',1,20),event('final-territory',2,25)]}).map(s=>s.kind),['word','castles','territory']);
});
test('capture without income is a section with no invented score; empty sections are omitted',()=>{
 assert.deepEqual(m.scoreSections({...plan,events:[event('word',1,8)]}).map(s=>s.totalsAfter),[[38,20],[38,20]]);
 assert.deepEqual(m.scoreSections({...plan,castleCaptures:[],events:[]}),[]);
 assert.deepEqual(m.scoreSections({...plan,castleCaptures:[],events:[event('castles',2,5)]}).map(s=>s.kind),['castles']);
});
test('single skip settles only the current section and starts the next; castle owners skip together',async()=>{
 const h=harness(),playing=h.p.play(plan);assert.equal(h.rendered[0].section.kind,'word');h.p.skipSection();await flush();
 assert.deepEqual(h.settled,['word']);assert.deepEqual(h.balance,[38,20]);assert.equal(h.completed,0);assert.equal(h.rendered[1].section.kind,'castles');
 h.p.skipSection();await flush();assert.deepEqual(h.balance,[41,25]);assert.equal(h.rendered[2].section.kind,'territory');
 h.p.skipSection();await playing;assert.deepEqual(h.balance,[47,23]);assert.equal(h.completed,1);
});
test('double tap across a section boundary finishes immediately and cannot settle aborted work',async()=>{
 const h=harness();let time=100;const taps=m.createScoreTap({section:h.p.skipSection,all:h.p.skipAll,now:()=>time});
 const playing=h.p.play(plan);taps.tap();await flush();assert.equal(h.rendered[1].section.kind,'castles');time+=180;taps.tap();assert.equal(h.completed,1);await playing;assert.deepEqual(h.settled,['word']);
 h.p.skipAll();assert.equal(h.completed,1);
});
test('two clicks in one event turn finish once without accidentally settling the next section',async()=>{
 const h=harness(),playing=h.p.play(plan);const taps=m.createScoreTap({section:h.p.skipSection,all:h.p.skipAll,now:()=>0});taps.tap();taps.tap();await playing;
 assert.equal(h.completed,1);assert.deepEqual(h.settled,[]);assert.equal(h.rendered.length,1);
});
test('separate taps skip separate sections; rapid taps work without relying on mouse click detail',()=>{
 let time=0,sections=0,all=0;const taps=m.createScoreTap({section:()=>sections++,all:()=>all++,now:()=>time});
 assert.equal(taps.remaining,0);taps.tap();assert.equal(taps.remaining,400);time=401;taps.tap();assert.equal(sections,2);assert.equal(all,0);time=600;taps.tap();assert.equal(all,1);time=1001;assert.equal(taps.remaining,0);
});
test('cancel and replacement playback cannot publish obsolete scores or complete the new run',async()=>{
 const h=harness(),old=h.p.play(plan);h.p.cancel();await old;assert.equal(h.completed,0);assert.deepEqual(h.settled,[]);
 const first=h.p.play(plan),second=h.p.play({...plan,events:[event('word',2,10)],castleCaptures:[]});await first;
 assert.equal(h.completed,0);h.p.skipSection();await second;assert.deepEqual(h.balance,[30,30]);assert.equal(h.completed,1);
});
test('natural completion settles all sections once; animation errors restore saved state',async()=>{
 const h=harness(),playing=h.p.play(plan);for(let i=0;i<3;i++){h.rendered[i].resolve();await flush();}await playing;assert.equal(h.completed,1);assert.deepEqual(h.balance,[47,23]);
 let restored=0;const failing=m.createScorePlayback({render(){throw Error('Unsupported animation');},settle(){assert.fail('Broken section should not settle');},complete(){restored++;}});await failing.play(plan);assert.equal(restored,1);
});
