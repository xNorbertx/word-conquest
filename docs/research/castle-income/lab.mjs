// Offline castle-income experiment. Production rules and the previous study stay unchanged.
import * as base from '../balance/lab.mjs';
export const {rng,hash,Engine,makeTrie}=base;
export const variant=(id,sideRate,centerRate,sideEnd=3,centerEnd=5,timing='boundary')=>({id,sideRate,centerRate,sideEnd,centerEnd,timing});
export const variants=[
 variant('current',0,0,3,3),variant('end_only',0,0),variant('center_only',0,1),
 variant('flat_one',1,1),variant('example',1,2),variant('central_three',1,3),
 variant('strong',2,3),variant('double',2,4),variant('high',3,5),
 variant('low_end',1,2,1,3),variant('high_end',1,2,5,8),variant('no_end',1,2,0,0),
 ...['flat_one','example','double','high'].map(id=>({flat_one:variant(id+'_held',1,1,3,5,'held'),example:variant(id+'_held',1,2,3,5,'held'),double:variant(id+'_held',2,4,3,5,'held'),high:variant(id+'_held',3,5,3,5,'held')})[id])
];
export const isCenter=t=>t.q===0&&t.r===0;
export const rate=(t,v)=>!t.castle?0:isCenter(t)?v.centerRate:v.sideRate;
export const value=(t,v)=>!t.castle?1:isCenter(t)?v.centerEnd:v.sideEnd;
export const config=v=>base.config({rules:{castlePoints:v.sideEnd}});
export function newState(v,seed,mirror=false){
 const s=base.newState({rules:{castlePoints:v.sideEnd}},seed,mirror);
 s.sideIncome=[0,0];s.centerIncome=[0,0];return s;
}
export function breakdown(s,v){return [1,2].map(p=>{
 const owned=s.tiles.filter(t=>t.owner===p);
 const words=s.wordPoints[p-1],ordinary=owned.filter(t=>!t.castle).length,
 sideEnd=owned.filter(t=>t.castle&&!isCenter(t)).length*v.sideEnd,
 centerEnd=owned.filter(t=>t.castle&&isCenter(t)).length*v.centerEnd,
 sideIncome=s.sideIncome[p-1],centerIncome=s.centerIncome[p-1];
 return {words,ordinary,sideEnd,centerEnd,sideIncome,centerIncome,total:words+ordinary+sideEnd+centerEnd+sideIncome+centerIncome};
});}
export const totals=(s,v)=>breakdown(s,v).map(x=>x.total);
export function apply(s,m,v,random,dictionary){
 const n=base.apply(s,m,{rules:{castlePoints:v.sideEnd}},random,dictionary);
 n.sideIncome=[...s.sideIncome];n.centerIncome=[...s.centerIncome];
 if(s.player===2)for(let i=0;i<n.tiles.length;i++){
  const t=n.tiles[i];if(!t.castle||!t.owner||(v.timing==='held'&&n.ages[i]<1))continue;
  (isCenter(t)?n.centerIncome:n.sideIncome)[t.owner-1]+=rate(t,v);
 }
 n.income=n.sideIncome.map((x,i)=>x+n.centerIncome[i]);return n;
}
export function enumerate(s,v,trie,options){
 const f=base.enumerate(s,config(v),{},trie,options);
 for(const m of f.moves){
  m.land=0;m.incomeSwing=0;
  for(const i of m.path){const t=s.tiles[i];const delta=t.owner===s.player?0:t.owner?2:1;m.land+=delta*value(t,v);m.incomeSwing+=delta*rate(t,v);}
 }
 return f;
}
export function merit(s,m,v,policy='balanced'){
 if(policy==='words')return m.wordPoints+.001*m.land+.00001*m.frequency;
 const roundsLeft=Math.max(0,(120-s.lettersUsed)/12);
 const horizon=Math.min(2,roundsLeft+(v.timing==='boundary'?.5:-.5));
 const income=Math.max(0,horizon)*m.incomeSwing;
 if(policy==='castle')return m.wordPoints+.5*m.land+2*income+.3*m.castleSwing+.4*m.jokerSwing;
 if(policy==='tempo'){
  const net=s.tiles.reduce((n,t)=>n+(t.owner===s.player?1:t.owner?-1:0)*rate(t,v),0);
  return (m.wordPoints+m.land+income+net)/m.path.length;
 }
 return m.wordPoints+m.land+income+.4*m.jokerSwing+.25*m.castleSwing+.00001*m.frequency;
}
export function choose(s,moves,v,policy){
 let best=null,score=-Infinity;for(const m of moves){const x=merit(s,m,v,policy);if(x>score){score=x;best=m;}}return best;
}
