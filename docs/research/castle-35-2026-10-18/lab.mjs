// Research only. The prior study and live scoring remain untouched.
import * as base from '../scoring-2026-10-18/lab.mjs';
export const {Engine,makeTrie,rng,hash,config,newState}=base;
export const rate=(t,v)=>t.castle?(t.q===0&&t.r===0?(v?.centreRate??4):(v?.sideRate??2)):0;
export const variants=[
 {id:'no_territory',name:'Words + defended castles',land:'none',timing:'defended',endTerritory:false,sideRate:2,centreRate:4},
 {id:'final_territory',name:'Plus final territory',land:'none',timing:'defended',endTerritory:true,sideRate:2,centreRate:4},
 {id:'final_territory_35',name:'Final territory + castles 3/5',land:'none',timing:'defended',endTerritory:true,sideRate:3,centreRate:5}
];
export const components=['letters','bonus','sideIncome','centreIncome','finalTerritory'];
export const holdings=(s,p)=>s.tiles.filter(t=>t.owner===p).length;
export function breakdown(s,v){return base.breakdown(s,v).map((b,i)=>{
 const finalTerritory=v.endTerritory&&s.over?holdings(s,i+1):0;
 return {letters:b.letters,bonus:b.bonus,sideIncome:b.sideIncome,centreIncome:b.centreIncome,finalTerritory,total:b.total+finalTerritory};
});}
export const totals=(s,v)=>breakdown(s,v).map(x=>x.total);
export const projected=(s,v)=>base.totals(s,v).map((x,i)=>x+(v.endTerritory?holdings(s,i+1):0));
export function apply(s,m,v,random,dictionary){
 const n=base.apply(s,m,v,random,dictionary);
 // Base adapter pays 2/4 to the surviving defender. Add only the rate difference.
 for(const t of n.tiles)if(t.castle&&t.owner===3-s.player)n.book[t.owner-1][t.q===0&&t.r===0?'centreIncome':'sideIncome']+=rate(t,v)-base.rate(t);
 const a=totals(s,v),b=totals(n,v);
 if(b.some((x,i)=>x<a[i]))throw Error('Score deduction');
 if(!n.over&&breakdown(n,v).some(b=>b.finalTerritory!==0))throw Error('Premature territory payment');
 if(n.over&&v.endTerritory&&breakdown(n,v).some((b,i)=>b.finalTerritory!==holdings(n,i+1)))throw Error('Final ownership mismatch');
 return n;
}
export function enumerate(s,v,trie,model='main',seed=0){
 const f=base.enumerate(s,v,trie,model,seed);
 for(const m of f.moves){m.incomeSwing=m.path.reduce((n,i)=>{const t=s.tiles[i];return n+(t.owner===s.player?0:rate(t,v)*(t.owner?2:1));},0);}
 for(const m of f.moves)m.endSwing=m.path.reduce((n,i)=>n+(s.tiles[i].owner===s.player?0:s.tiles[i].owner?2:1),0);
 return f;
}
// How much of today's extra territory is expected to survive to the finish.
// These three fixed schedules are tested, not fitted to the results.
export function weight(s,m,schedule='ramp'){
 const final=s.lettersUsed+m.path.length>=120&&s.turns[s.player-1]+1===s.turns[2-s.player];
 if(final||schedule==='full')return 1;
 if(schedule==='late')return s.lettersUsed>=90?1:0;
 return .25+.75*Math.min(1,(s.lettersUsed+m.path.length)/120)**2;
}
function baseMerit(s,m,v,policy='balanced'){
 const tie=.00001*m.frequency;
 if(policy==='words')return m.wordPoints+.0001*m.land+tie;
 const remaining=Math.max(0,120-s.lettersUsed),nextRounds=Math.min(1.5,Math.max(0,(remaining-m.path.length)/12));
 // A last move gets exact terminal accounting, avoiding imaginary future rent.
 const final=remaining<=m.path.length&&s.turns[s.player-1]+1===s.turns[2-s.player];
 let paymentChange=0;
 if(v.timing==='round'&&s.turns[s.player-1]+1===s.turns[2-s.player])paymentChange=m.incomeSwing;
 if(v.timing==='defended')for(const i of m.path){const t=s.tiles[i];if(t.castle&&t.owner===3-s.player)paymentChange+=rate(t,v);}
 const future=final?0:nextRounds*m.incomeSwing;
 if(policy==='castle')return m.wordPoints+.5*m.land+paymentChange+2*future+tie;
 if(policy==='tempo'){
  const net=s.tiles.reduce((n,t)=>n+rate(t,v)*(t.owner===s.player?1:t.owner?-1:0),0);
  return (m.wordPoints+m.land+paymentChange+future+(final?0:net))/m.path.length+tie;
 }
 return m.wordPoints+m.land+paymentChange+future+(final?0:.25*m.jokerSwing)+tie;
}

export function merit(s,m,v,policy='balanced',schedule='ramp'){
 const ordinary=baseMerit(s,m,v,policy);if(!v.endTerritory)return ordinary;
 if(policy==='words')return ordinary+.0001*m.endSwing;
 const end=weight(s,m,schedule)*m.endSwing;
 return ordinary+(policy==='tempo'?end/m.path.length:policy==='castle'?.5*end:end);
}
export function choose(s,moves,v,policy='balanced',schedule='ramp'){
 let best=null,score=-Infinity;for(const m of moves){const x=merit(s,m,v,policy,schedule);if(x>score){best=m;score=x;}}return best;
}
export function plan(s,moves,v,trie,model,seed,schedule='ramp'){
 if(!v.endTerritory)return base.plan(s,moves,v,trie,model,seed);
 if(!moves.length)return null;
 const candidates=[],add=m=>{if(m&&!candidates.some(c=>c.path.join(',')===m.path.join(',')&&c.word===m.word))candidates.push(m);};
 for(const policy of ['balanced','words','castle','tempo'])add(choose(s,moves,v,policy,schedule));
 let best=null,bestScore=-Infinity;
 for(const m of candidates){let score=0;for(let k=0;k<2;k++){
  const random=rng(hash(`plan/${seed}/${s.turns.join(',')}/${k}`));let n=apply(s,m,v,random,trie.words);
  if(!n.over){const replies=enumerate(n,v,trie,model,hash(`${seed}/reply/${k}`));n=apply(n,choose(n,replies.moves,v,'balanced',schedule),v,random,trie.words);}
  const t=totals(n,v),income=n.tiles.reduce((n,t)=>n+rate(t,v)*(t.owner===s.player?1:t.owner?-1:0),0);
  const future=n.over?0:Math.min(1,(120-n.lettersUsed)/12)*income+weight(n,{path:[]},schedule)*(holdings(n,s.player)-holdings(n,3-s.player));
  score+=t[s.player-1]-t[2-s.player]+future;
 }if(score>bestScore){bestScore=score;best=m;}}
 return best;
}
