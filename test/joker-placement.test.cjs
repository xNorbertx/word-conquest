const {test,before}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');let d,l;
before(async()=>{d=await import('../server/domain.mjs');l=await import('../server/languages.mjs');});
const random=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
function layout(state){
 const jokers=state.tiles.filter(t=>t.letter==='?'),castles=state.tiles.filter(t=>t.castle&&t.q!==0);
 assert.equal(jokers.length,6);for(const owner of [1,2])assert.equal(jokers.filter(t=>t.owner===owner).length,1);
 const neutral=jokers.filter(t=>!t.owner);assert.equal(neutral.length,4);assert.equal(neutral.some(t=>t.castle),false);
 for(const castle of castles){const nearby=neutral.filter(t=>d.Engine.adjacent(t,castle));assert.equal(nearby.length,1);assert.equal(Math.sign(nearby[0].r),Math.sign(castle.r));}
 for(const tile of neutral){assert.equal(neutral.filter(t=>t.q===-tile.q&&t.r===tile.r).length,1);assert.equal(d.Engine.openingBand(tile,state.tiles),'outer');assert.ok(jokers.filter(j=>j.id!==tile.id).every(j=>d.Engine.distance(tile,j)>1));}
 for(const band of ['base','near','outer']){const counts=side=>state.tiles.filter(t=>Math.sign(t.q)===side&&t.letter!=='?'&&d.Engine.openingBand(t,state.tiles)===band).reduce((n,t)=>{const type=d.Engine.letterType(t.letter,d.configFor(state.language==='sv'?'autumn-sv-v2':'autumn-v4'));n[type]=(n[type]||0)+1;return n;},{});assert.deepEqual(counts(-1),counts(1));}
}
test('800 seeded English/Swedish boards have one spaced joker per corner castle, equal access and varied positions',()=>{
 for(const version of ['autumn-v4','autumn-sv-v2']){const c=d.configFor(version),seen=new Map();for(let seed=1;seed<=400;seed++){
  const state=d.Engine.newGame(c,random(seed));state.language=c.language;layout(state);for(const t of state.tiles.filter(t=>t.letter==='?'&&!t.owner)){const quadrant=Math.sign(t.q)+','+Math.sign(t.r);if(!seen.has(quadrant))seen.set(quadrant,new Set());seen.get(quadrant).add(t.id);}
 }assert.equal(seen.size,4);for(const positions of seen.values())assert.ok(positions.size>=3,'Randomized offsets in every corner');}
});
test('new opening defaults are pinned by language; old version generation is byte-for-byte unchanged',async()=>{
 assert.equal(l.LANGUAGES.en.rulesVersion,'autumn-v4');assert.equal(l.LANGUAGES.sv.rulesVersion,'autumn-sv-v3');
 for(const [version,file] of [['autumn-v1','engine-v1'],['autumn-v2','engine-v1'],['autumn-v3','engine-v2'],['autumn-sv-v1','engine-sv-v2']]){
  const engine=(await import('../server/versions/'+file+'.mjs')).default,c=d.configFor(version);for(const seed of [1,81,999])assert.deepEqual(d.Engine.newGame(c,random(seed)),engine.newGame(c,random(seed)));
 }
});
test('new openings remain deterministic and support both starters, including edge random values',()=>{
 for(const version of ['autumn-v4','autumn-sv-v2']){const c=d.configFor(version);assert.deepEqual(d.Engine.newGame(c,random(42)),d.Engine.newGame(c,random(42)));
 for(const roll of [0,.49999,.5,.999999]){const state=d.Engine.newGame(c,()=>roll);assert.equal(state.startingPlayer,roll<.5?1:2);assert.equal(state.player,state.startingPlayer);}
 }
});
test('English and Swedish chosen joker letters are scored by the server and remain jokers after play',()=>{
 for(const [version,word] of [['autumn-v4','CAT'],['autumn-sv-v2','FÅR']]){
 const c=d.configFor(version),state=d.Engine.newGame(c,random(4)),players=[crypto.randomUUID(),crypto.randomUUID()],path=['-1,0','0,0','1,0'];state.player=1;state.startingPlayer=1;
 path.forEach((id,i)=>Object.assign(state.tiles.find(t=>t.id===id),{letter:i===1?'?':word[i],owner:i===0?1:0}));
 const dictionary=l.languageForRules(version).dictionary,words=new Set(require('../server/versions/'+(version.includes('sv')?'dictionary-sv-v1':'dictionary-v1')+'.json'));
 const game={id:crypto.randomUUID(),players,revision:0,status:'active',rules_version:version,dictionary_version:dictionary.version,state};
 const command={action:'word',operationId:crypto.randomUUID(),revision:0,path,jokers:{'0,0':word[1]}};
 const result=d.applyCommand(game,players[0],command,words,dictionary.version,random(5));assert.equal(result.recap.word,word);assert.equal(result.next.state.tiles.find(t=>t.id==='0,0').letter,'?');assert.equal(d.Engine.letterValue('?',c),0);
 assert.throws(()=>d.applyCommand(game,players[0],{...command,jokers:{}},words,dictionary.version),/joker/i);
 }
});
