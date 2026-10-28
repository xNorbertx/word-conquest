import fs from 'node:fs';
import Engine from '../../../server/engine.mjs';
import {configFor} from '../../../server/rules.mjs';
import {opening,arrange} from './placement.mjs';
const rng=seed=>{let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};};
const profiles=JSON.parse(fs.readFileSync('work/edges/profiles.json','utf8'));
export function trieFor(words){const root={next:{}};for(const word of Object.keys(words)){let n=root;for(const ch of word)n=n.next[ch]??=( {next:{}});n.word=word;}return root;}
export function measure(tiles,trie){
  const graph=tiles.map(t=>tiles.flatMap((n,i)=>Engine.adjacent(t,n)?[i]:[]));
  const edges=graph.map(n=>n.length<8),all=new Set(),onEdge=new Set(),bySide=[new Set(),new Set()],cover=tiles.map(()=>new Set());
  let visits=0;const seen=new Uint8Array(tiles.length),path=[];
  function dfs(i,node,jokers,start){
    if(seen[i])return;
    if(tiles[i].letter==='?'&&jokers===1)return; // common, approachable words with at most one joker
    const next=tiles[i].letter==='?'?Object.values(node.next):[node.next[tiles[i].letter]].filter(Boolean);
    seen[i]=1;path.push(i);
    for(const n of next){
      visits++;
      if(n.word){all.add(n.word);cover[start].add(n.word);if(path.some(k=>edges[k]))onEdge.add(n.word);if(tiles[start].owner)bySide[tiles[start].owner-1].add(n.word);}
      if(path.length<7)for(const k of graph[i])dfs(k,n,jokers+(tiles[i].letter==='?'?1:0),start);
    }
    seen[i]=0;path.pop();
  }
  for(let i=0;i<tiles.length;i++)dfs(i,trie,0,i);
  const edgeCounts=cover.filter((_,i)=>edges[i]&&tiles[i].letter!=='?').map(s=>s.size);
  const innerCounts=cover.filter((_,i)=>!edges[i]&&tiles[i].letter!=='?').map(s=>s.size);
  const mean=a=>a.reduce((s,n)=>s+n,0)/a.length;
  return {edge:mean(edgeCounts),inner:mean(innerCounts),deadEdges:edgeCounts.filter(n=>n===0).length/edgeCounts.length,all:all.size,edgeWords:onEdge.size,side1:bySide[0].size,side2:bySide[1].size,visits};
}
const variants={baseline:null,letters:{letter:4,pair:0},pairs:{letter:0,pair:4},combined:{letter:2,pair:4},balanced:{letter:0,pair:2,inner:1},category:{letter:0,pair:4,sameCategory:true},balancedCategory:{letter:0,pair:2,inner:1,sameCategory:true},diverse:{letter:0,pair:2,inner:1,diverse:true},diverseCategory:{letter:0,pair:2,inner:1,sameCategory:true,diverse:true}};
if(process.argv[1]?.endsWith('evaluate.mjs')){
const count=Number(process.argv[2]||24),offset=Number(process.argv[3]||1000),requested=process.argv[4];
const results={count,offset,variants,language:{}};
for(const [lang,version] of [['en','autumn-v5'],['sv','autumn-sv-v4'],['nl','autumn-nl-v1']]){
  const config=configFor(version),words=JSON.parse(fs.readFileSync(`work/edges/${lang}-words.json`,'utf8')),trie=trieFor(words),rows={};
  for(const [name,option] of Object.entries(variants)){
    if(requested&&name!=='baseline'&&name!==requested)continue;
    const sample=[];const start=performance.now();
    for(let seed=offset;seed<offset+count;seed++){
      const state=Engine.newGame(config,rng(seed));
      if(option)opening(state.tiles,profiles[lang],config,option);
      sample.push({seed,...measure(state.tiles,trie)});
    }
    rows[name]=sample;const average=Object.fromEntries(Object.keys(sample[0]).filter(k=>k!=='seed').map(k=>[k,+(sample.reduce((s,n)=>s+n[k],0)/sample.length).toFixed(2)]));
    console.log(lang,name,JSON.stringify(average),Math.round(performance.now()-start)+'ms');
  }
  results.language[lang]=rows;
}
fs.writeFileSync(`work/edges/results-${offset}-${requested||'all'}.json`,JSON.stringify(results,null,2)+'\n');
}
