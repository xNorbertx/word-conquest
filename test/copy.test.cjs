const {test}=require('node:test'),assert=require('node:assert/strict');
test('help follows the saved scoring version, including real word bonuses and castle timing',async()=>{
 const {rulesSections}=await import('../online/copy.mjs'),{configFor,SUPPORTED_RULES,Engine}=await import('../server/domain.mjs');
 for(const version of SUPPORTED_RULES){
  const config=configFor(version),before=JSON.stringify(config),sections=new Map(rulesSections(config));
  assert(!/undefined|NaN/.test([...sections.values()].join(' ')),version);
  const stated=[...sections.get('Length bonus').matchAll(/(\d+) → \+(\d+)/g)].map(m=>[Number(m[1]),Number(m[2])]);
  assert(stated.length>0,version);
  const state=Engine.newGame(config,()=>.3);
  for(const [length,points]of stated)assert.equal(Engine.scoreMove(state,state.tiles.slice(0,length).map(t=>t.id),config).lengthBonus,points,`${version}, ${length} letters`);
  if(config.scoringMode==='defended-final'){
   assert.deepEqual(stated,[[6,1],[7,3],[8,5]]);assert.match(sections.get('Castles'),/opponent’s word or refresh/);
   assert.match(sections.get('Final territory'),/game end/);assert(!sections.has('Castle income'));
  }else if(config.castleIncome){assert.match(sections.get('Castle income'),/After both players move/);assert(!sections.has('Final territory'));}
  if(Number.isFinite(config.maxEnemyTilesPerWord))assert(sections.get('Captures').includes(`up to ${config.maxEnemyTilesPerWord}`));
  assert.equal(JSON.stringify(config),before,'help must not alter a saved ruleset');
 }
});
