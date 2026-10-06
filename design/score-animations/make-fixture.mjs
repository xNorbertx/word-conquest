// This fixture uses the real rules. The mockups themselves work offline via file://.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import Engine from '../../server/engine.mjs';
import {config} from '../../server/rules.mjs';

let seed=4287;
const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const state=Engine.newGame(config,random);
state.player=1;state.startingPlayer=2;state.turns=[5,6];
state.castleIncome=[12,4];
const own=new Set(['-4,0','-3,0','-3,1','-3,2','-2,2','-2,3','-1,2','0,0']);
const enemy=new Set(['1,-2','2,-2','3,-2','2,-1','3,-1','4,-1','3,0','4,0','-2,1','-1,1','0,1']);
state.tiles.forEach(t=>t.owner=own.has(t.id)?1:enemy.has(t.id)?2:0);
const path=[...'GARDENS'].map((letter,i)=>{
  const id=`${i-3},1`;state.tiles.find(t=>t.id===id).letter=letter;return id;
});
state.wordPoints=[0,0];
const territory=Engine.scoreBreakdown(state,config);
state.wordPoints=[84-territory[0].total,79-territory[1].total];
const preview=Engine.scoreMove(state,path,config);
const dictionary=new Set(JSON.parse(fs.readFileSync(new URL('../../server/versions/dictionary-v1.json',import.meta.url),'utf8')));
const result=Engine.submit(state,path,config,dictionary,{},random);
assert.ok(!result.error,result.error);
assert.deepEqual(Engine.scores(state,config),[84,79]);
assert.equal(preview.wordPoints,19);
assert.equal(preview.castleIncome,6);
assert.equal(preview.territoryGain,6);
assert.equal(preview.enemyLoss,3);
assert.deepEqual(Engine.scores(result.state,config),[115,76]);
assert.deepEqual(result.state.log[0].income,[6,0]);
const fixture={word:'GARDENS',round:6,before:[84,79],after:[115,76],path,
  tiles:state.tiles.map(t=>({...t,value:Engine.letterValue(t.letter,config)})),
  events:[
    {id:'word',label:'Word',detail:'GARDENS',amount:19,target:0,icon:'word'},
    {id:'castles',label:'Castle income',detail:'2 + 4 this round',amount:6,target:0,icon:'castle'},
    {id:'territory',label:'Territory gained',detail:'6 new tiles',amount:6,target:0,icon:'territory'},
    {id:'opponent',label:'Territory lost',detail:'Ellinor · 3 tiles',amount:-3,target:1,icon:'capture'}
  ]};
fs.writeFileSync(new URL('./fixture.js',import.meta.url),'// Generated from autumn-v3 by make-fixture.mjs. Fictional players and game.\nwindow.SCORE_DEMO = '+JSON.stringify(fixture,null,2)+';\n');
console.log('Verified: 84 + 19 + 6 + 6 = 115; 79 - 3 = 76. Round income: [6, 0].');
