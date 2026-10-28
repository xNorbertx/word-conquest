const {test,before}=require('node:test'),assert=require('node:assert/strict');
let Engine,configFor,availableTiles;
before(async()=>{({default:Engine}=await import('../server/engine.mjs'));({configFor}=await import('../server/rules.mjs'));({availableTiles}=await import('../online/available-tiles.mjs'));});
const rng=seed=>{let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};};
const versions=[['autumn-v5','autumn-v6'],['autumn-sv-v4','autumn-sv-v5'],['autumn-nl-v1','autumn-nl-v2']];
const letters=tiles=>tiles.map(t=>t.letter).sort().join('');
test('new language placements preserve sampled letters, every category position, castles, jokers and fairness budgets',()=>{
  let differences=0;
  for(const [oldVersion,version] of versions)for(let seed=40;seed<70;seed++){
    const c=configFor(version),old=Engine.newGame(configFor(oldVersion),rng(seed)),next=Engine.newGame(c,rng(seed));
    assert.equal(letters(next.tiles),letters(old.tiles));assert.equal(next.startingPlayer,old.startingPlayer);
    next.tiles.forEach((tile,i)=>{const previous=old.tiles[i];assert.deepEqual({...tile,letter:null},{...previous,letter:null});assert.equal(Engine.letterType(tile.letter,c),Engine.letterType(previous.letter,c));assert.equal(tile.letter==='?',previous.letter==='?');if(tile.letter!==previous.letter)differences++;});
    for(const side of [-1,0,1])for(const band of ['base','near','outer']){
      const subset=tiles=>tiles.filter(t=>Math.sign(t.q)===side&&Engine.openingBand(t,tiles)===band);
      assert.equal(letters(subset(next.tiles)),letters(subset(old.tiles)));
    }
    assert.deepEqual(Engine.newGame(c,rng(seed)),next);
    assert.deepEqual(c.wordScoring,configFor(oldVersion).wordScoring);
  }
  assert(differences>100);
});
test('word replacements and refresh only rearrange replaced tiles; scores, costs and ownership match the previous engine',()=>{
  for(const [oldVersion,version] of versions)for(let seed=1;seed<=12;seed++){
    const oldConfig=configFor(oldVersion),c=configFor(version),state=Engine.newGame(c,rng(seed));
    // A valid owned-to-neighbour path, validated against a deliberately tiny dictionary.
    const path=[state.tiles.find(t=>t.owner===state.player).id];
    while(path.length<6){const last=state.tiles.find(t=>t.id===path.at(-1));path.push(state.tiles.find(t=>!path.includes(t.id)&&Engine.adjacent(t,last)).id);}
    const jokers=Object.fromEntries(path.map(id=>[id,'A'])),word=Engine.wordForPath(state,path,jokers),dictionary=new Set([word.toLowerCase()]);
    const before=structuredClone(state);
    for(const kind of ['word','refresh']){
      const play=(cfg)=>kind==='word'?Engine.submit(state,path,cfg,dictionary,jokers,rng(seed+100)):Engine.refreshTurn(state,cfg,rng(seed+100));
      const a=play(oldConfig),b=play(c);assert(!b.error);assert.deepEqual(b.refreshed,a.refreshed);
      assert.deepEqual({...b.state,tiles:null},{...a.state,tiles:null});assert.deepEqual(Engine.scores(b.state,c),Engine.scores(a.state,oldConfig));
      assert.equal(letters(b.state.tiles),letters(a.state.tiles));
      for(const tile of b.state.tiles){const previous=state.tiles.find(t=>t.id===tile.id),original=a.state.tiles.find(t=>t.id===tile.id);assert.equal(Engine.letterType(tile.letter,c),Engine.letterType(original.letter,c));if(!b.refreshed.includes(tile.id))assert.deepEqual(tile,original);else assert.notEqual(tile.letter,previous.letter);}
    }
    assert.deepEqual(state,before);
  }
});
test('illegal words cannot refresh letters or award points; finished and refresh-disabled games stay blocked',()=>{
  const c=configFor('autumn-v6'),s=Engine.newGame(c,rng(10)),before=structuredClone(s);
  assert(Engine.submit(s,[],c,new Set()).error);assert(Engine.refreshTurn({...s,over:true},c).error);assert(Engine.refreshTurn(s,{...c,allowRefreshTurn:false}).error);assert.deepEqual(s,before);
});
test('available starts, extension tiles and reentry obey the saved rules without restricting undo',()=>{
  const c=configFor('autumn-v6'),s=Engine.newGame(c,rng(33)),start=s.tiles.find(t=>t.owner===s.player);
  assert.deepEqual([...availableTiles(s,[],c)],[...s.tiles.filter(t=>t.owner===s.player).map(t=>t.id)]);
  const next=[...availableTiles(s,[start.id],c)];assert(next.length);assert(!next.includes(start.id));assert(next.every(id=>Engine.adjacent(start,s.tiles.find(t=>t.id===id))));
  const second=next[0],extended=availableTiles(s,[start.id,second],c);assert(!extended.has(start.id));assert(!extended.has(second));
  assert.equal(availableTiles(s,[start.id,second],c,false).size,0);assert.equal(availableTiles({...s,over:true},[],c).size,0);
  const displaced={...s,tiles:s.tiles.map(t=>({...t,owner:t.owner===s.player?0:t.owner}))};assert.equal(availableTiles(displaced,[],c).size,s.tiles.length);assert.equal(availableTiles(displaced,[],{...c,allowReentry:false}).size,0);
});
test('legacy capture caps and invalid/stale paths do not show misleading next tiles',()=>{
  const c=configFor('autumn-v1'),tiles=Array.from({length:6},(_,i)=>({id:String(i),q:i,r:0,owner:i?2:1,letter:'A'})),s={tiles,player:1,over:false};
  assert.equal(availableTiles(s,['0','1','2','3'],c).size,0);
  assert.deepEqual([...availableTiles(s,['0','1','2','3'],configFor('autumn-v6'))],['4']);
  assert.equal(availableTiles(s,['0','missing'],c).size,0);assert.equal(availableTiles(s,['0','2'],c).size,0);
});
