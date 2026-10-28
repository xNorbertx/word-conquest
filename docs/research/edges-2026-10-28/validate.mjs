import fs from 'node:fs';
import assert from 'node:assert/strict';
import Engine from '../../../server/engine.mjs';
import {configFor} from '../../../server/rules.mjs';
import {trieFor,measure} from './evaluate.mjs';
import {opening} from './placement.mjs';
const rng=seed=>{let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};};
const profiles=JSON.parse(fs.readFileSync('work/edges/profiles.json','utf8')),result={languages:{}};
const sampleMoves=(state,config,trie)=>{
  const {tiles}=state,graph=tiles.map(t=>tiles.flatMap((n,i)=>Engine.adjacent(t,n)?[i]:[])),seen=new Uint8Array(tiles.length),path=[],unique=new Map();
  function visit(i,node,jokers){
    if(seen[i]||(tiles[i].letter==='?'&&jokers===1))return;
    seen[i]=1;path.push(i);
    const next=tiles[i].letter==='?'?Object.values(node.next):[node.next[tiles[i].letter]].filter(Boolean);
    for(const n of next){
      if(n.word){
        const ids=path.map(k=>tiles[k].id),points=Engine.scoreMove(state,ids,config).wordPoints;
        const rank=points+path.filter(k=>tiles[k].castle&&tiles[k].owner!==state.player).length*2+path.filter(k=>tiles[k].owner!==state.player).length*.2;
        if(rank>(unique.get(n.word)?.rank??-1))unique.set(n.word,{word:n.word,ids,rank,edge:path.some(k=>graph[k].length<8)});
      }
      if(path.length<7)for(const j of graph[i])visit(j,n,jokers+(tiles[i].letter==='?'?1:0));
    }
    path.pop();seen[i]=0;
  }
  for(let i=0;i<tiles.length;i++)if(tiles[i].owner===state.player||Engine.canReenter(state,config))visit(i,trie,0);
  return [...unique.values()].sort((a,b)=>b.rank-a.rank||a.word.localeCompare(b.word));
};
for(const [lang,oldVersion,newVersion] of [['en','autumn-v5','autumn-v6'],['sv','autumn-sv-v4','autumn-sv-v5'],['nl','autumn-nl-v1','autumn-nl-v2']]){
  const old=configFor(oldVersion),current=configFor(newVersion),words=JSON.parse(fs.readFileSync(`work/edges/${lang}-words.json`,'utf8'));
  for(let seed=50000;seed<50256;seed++){
    const expected=Engine.newGame(old,rng(seed));opening(expected.tiles,profiles[lang],old,{letter:0,pair:2,inner:1,sameCategory:true,diverse:true});
    assert.deepEqual(Engine.newGame(current,rng(seed)),expected);
  }
  const higher=trieFor(Object.fromEntries(Object.entries(words).filter(([,n])=>n>=4))),sensitivity={baseline:[],new:[]};
  for(let seed=70000;seed<70064;seed++)for(const [name,c] of [['baseline',old],['new',current]])sensitivity[name].push(measure(Engine.newGame(c,rng(seed)).tiles,higher));
  const games={baseline:[],new:[]},trie=trieFor(words),dictionary=new Set(Object.keys(words).map(w=>w.toLowerCase()));
  for(let seed=80000;seed<80012;seed++)for(const [name,c] of [['baseline',old],['new',current]]){
    const random=rng(seed);let state=Engine.newGame(c,random);const turns=[];const began=performance.now();
    while(!state.over&&turns.length<100){
      const moves=sampleMoves(state,c,trie),move=moves[0];
      let outcome;
      if(move){const jokers={};move.ids.forEach((id,i)=>{if(state.tiles.find(t=>t.id===id).letter==='?')jokers[id]=move.word[i];});outcome=Engine.submit(state,move.ids,c,dictionary,jokers,random);}
      else outcome=Engine.refreshTurn(state,c,random);
      assert(!outcome.error,outcome.error);state=outcome.state;
      turns.push({options:moves.length,edgeOptions:moves.filter(m=>m.edge).length,word:move?.word||null,usedEdge:!!move?.edge});
    }
    assert(state.over);games[name].push({seed,turns,score:Engine.scores(state,c),milliseconds:Math.round(performance.now()-began)});
  }
  result.languages[lang]={sensitivity,games};
  console.log(lang,'production identical on 256 held-out boards; 64 higher-frequency board pairs; 24 completed games',Object.fromEntries(Object.entries(games).map(([n,g])=>{const t=g.flatMap(x=>x.turns);return[n,{turns:t.length,options:Math.round(t.reduce((s,x)=>s+x.options,0)/t.length),refresh:t.filter(x=>!x.word).length}];})));
}
fs.writeFileSync('work/edges/validation.json',JSON.stringify(result,null,2)+'\n');
