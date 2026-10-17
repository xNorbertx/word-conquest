// Offline study only. No live service access or production rule changes.
import Engine from '../../../server/engine.mjs';
import {config as current} from '../../../server/rules.mjs';
import {enumerate as search,makeTrie,rng,hash} from '../balance/lab.mjs';
export {Engine,makeTrie,rng,hash};
export const variants=[
 {id:'current',name:'Current rules',land:'ownership',timing:'round'},
 {id:'proposal',name:'Your proposal',land:'capture',timing:'defended'},
 {id:'first_claim',name:'First-claim territory',land:'once',timing:'defended'},
 {id:'castles_only',name:'Words + defended castles',land:'none',timing:'defended'}
];
export const letterGroups=[{letters:'AEILNORSTU',points:1},{letters:'DG',points:2},{letters:'BCMP',points:3},{letters:'FHKVWY',points:4},{letters:'JQXZ',points:5}];
export function config(v){return v.id==='current'?current:{...current,normalTerritoryPoints:0,castlePoints:0,centerCastlePoints:0,castleIncome:null,wordScoring:{letterGroups,jokerPoints:0,lengthBonuses:[0,0,0,0,0,0,1,3,5],extraLetterBonus:2}};}
export const centre=t=>t.q===0&&t.r===0;
export const rate=t=>t.castle?(centre(t)?4:2):0;
export const value=t=>t.castle?(centre(t)?5:3):1;
export const components=['letters','bonus','ordinary','castleValue','sideIncome','centreIncome'];
export function newState(v,seed,flip=false){
 const s=Engine.newGame(current,rng(seed));
 // Same exact board for all rules, with starter swapped in the paired game.
 if(flip){s.player=3-s.player;s.startingPlayer=s.player;}
 s.book=[1,2].map(p=>({letters:0,bonus:0,ordinary:['capture','once'].includes(v.land)?s.tiles.filter(t=>t.owner===p&&!t.castle).length:0,sideIncome:0,centreIncome:0,recapturePoints:0}));
 s.claims=s.tiles.map(t=>t.owner?1<<(t.owner-1):0);return s;
}
export function breakdown(s,v){return [1,2].map(p=>{
 const b=s.book[p-1],owned=s.tiles.filter(t=>t.owner===p);
 const parts={letters:b.letters,bonus:b.bonus,ordinary:v.land==='ownership'?owned.filter(t=>!t.castle).length:b.ordinary,castleValue:v.land==='ownership'?owned.filter(t=>t.castle).reduce((n,t)=>n+value(t),0):0,sideIncome:b.sideIncome,centreIncome:b.centreIncome};
 return {...parts,total:components.reduce((n,k)=>n+parts[k],0)};
});}
export const totals=(s,v)=>breakdown(s,v).map(b=>b.total);
export function apply(s,m,v,random,dictionary){
 const c=config(v),ids=m?.path.map(i=>s.tiles[i].id),jokers={};
 m?.path.forEach((i,j)=>{if(s.tiles[i].letter==='?')jokers[s.tiles[i].id]=m.word[j].toUpperCase();});
 const result=m?Engine.submit(s,ids,c,dictionary,jokers,random):Engine.refreshTurn(s,c,random);
 if(result.error)throw Error(result.error);
 const n=result.state,p=s.player,e=3-p;n.book=s.book.map(b=>({...b}));n.claims=[...s.claims];
 if(m){
  const scored=Engine.scoreMove(s,ids,c);if(scored.wordPoints!==m.wordPoints)throw Error('Enumerated word score mismatch');
  n.book[p-1].letters+=scored.letters;n.book[p-1].bonus+=scored.lengthBonus;
  for(const i of m.path){const t=s.tiles[i];if(t.owner===p)continue;
   const seen=!!(s.claims[i]&(1<<(p-1)));
   if(!t.castle&&(v.land==='capture'||v.land==='once'&&!seen)){n.book[p-1].ordinary++;if(seen)n.book[p-1].recapturePoints++;}
   n.claims[i]|=1<<(p-1);
  }
 }
 const roundComplete=n.turns[0]===n.turns[1];
 for(const t of n.tiles){if(!t.castle||!t.owner)continue;
  if(v.timing==='round'?!roundComplete:t.owner!==e)continue;
  n.book[t.owner-1][centre(t)?'centreIncome':'sideIncome']+=rate(t);
 }
 const a=totals(s,v),b=totals(n,v);
 for(let i=0;i<2;i++)if(v.id!=='current'&&b[i]<a[i])throw Error('Experimental score deduction');
 for(let i=0;i<2;i++)if(n.wordPoints[i]!==n.book[i].letters+n.book[i].bonus)throw Error('Word accounting mismatch');
 if(v.id==='current'&&Engine.scores(n,c).some((x,i)=>x!==b[i]))throw Error('Production baseline mismatch');
 // The production log is not needed in research state; keep only the receipt.
 n.log=n.log.slice(0,1);return n;
}
export function enumerate(s,v,trie,model='main',seed=0){
 const f=search(s,config(v),{},trie,{noticed:false,limit:5000000});if(f.cutoff)throw Error('Search cutoff');
 if(model!=='exhaustive'){
  const count=model==='sparse'?8:12,penalty=model==='sparse'?.7:.35,rank=new Map();
  for(const m of f.moves)if(!rank.has(m.word)){
   const weight=10**(.35*(m.frequency-3.5))*Math.exp(-penalty*(m.word.length-4));
   const u=(hash(`notice/${seed}/${s.player}/${s.turns.join(',')}/${m.word}`)+1)/4294967297;rank.set(m.word,-Math.log(u)/weight);
  }
  const keep=new Set([...rank].sort((a,b)=>a[1]-b[1]).slice(0,count).map(x=>x[0]));f.moves=f.moves.filter(m=>keep.has(m.word));
 }
 for(const m of f.moves){
  m.land=0;m.incomeSwing=0;m.castleCapture=0;m.recapture=0;
  for(const i of m.path){const t=s.tiles[i];if(t.owner===s.player)continue;
   const enemy=!!t.owner,seen=!!(s.claims[i]&(1<<(s.player-1)));
   if(v.land==='ownership')m.land+=value(t)*(enemy?2:1);
   else if(!t.castle&&(v.land==='capture'||v.land==='once'&&!seen))m.land++;
   if(!t.castle&&seen)m.recapture++;
   if(t.castle){m.castleCapture++;m.incomeSwing+=rate(t)*(enemy?2:1);}
  }
 }
 return f;
}
export function merit(s,m,v,policy='balanced'){
 const tie=.00001*m.frequency;
 if(policy==='words')return m.wordPoints+.0001*m.land+tie;
 const remaining=Math.max(0,120-s.lettersUsed),nextRounds=Math.min(1.5,Math.max(0,(remaining-m.path.length)/12));
 // A last move gets exact terminal accounting, avoiding imaginary future rent.
 const final=remaining<=m.path.length&&s.turns[s.player-1]+1===s.turns[2-s.player];
 let paymentChange=0;
 if(v.timing==='round'&&s.turns[s.player-1]+1===s.turns[2-s.player])paymentChange=m.incomeSwing;
 if(v.timing==='defended')for(const i of m.path){const t=s.tiles[i];if(t.castle&&t.owner===3-s.player)paymentChange+=rate(t);}
 const future=final?0:nextRounds*m.incomeSwing;
 if(policy==='castle')return m.wordPoints+.5*m.land+paymentChange+2*future+tie;
 if(policy==='tempo'){
  const net=s.tiles.reduce((n,t)=>n+rate(t)*(t.owner===s.player?1:t.owner?-1:0),0);
  return (m.wordPoints+m.land+paymentChange+future+(final?0:net))/m.path.length+tie;
 }
 return m.wordPoints+m.land+paymentChange+future+(final?0:.25*m.jokerSwing)+tie;
}
export function choose(s,moves,v,policy='balanced'){let best=null,score=-Infinity;for(const m of moves){const x=merit(s,m,v,policy);if(x>score){best=m;score=x;}}return best;}
function potential(s,p){return s.tiles.reduce((n,t)=>n+rate(t)*(t.owner===p?1:t.owner?-1:0),0);}
export function plan(s,moves,v,trie,model,seed){
 if(!moves.length)return null;
 const candidates=[],add=m=>{if(m&&!candidates.some(c=>c.path.join(',')===m.path.join(',')&&c.word===m.word))candidates.push(m);};
 add(choose(s,moves,v));add(choose(s,moves,v,'words'));add(choose(s,moves,v,'castle'));add(choose(s,moves,v,'tempo'));
 let best=null,bestScore=-Infinity;
 for(const m of candidates){let score=0;
  for(let k=0;k<2;k++){
   const random=rng(hash(`plan/${seed}/${s.turns.join(',')}/${k}`));let n=apply(s,m,v,random,trie.words);
   if(!n.over){const replies=enumerate(n,v,trie,model,hash(`${seed}/reply/${k}`));n=apply(n,choose(n,replies.moves,v),v,random,trie.words);}
   const t=totals(n,v);score+=t[s.player-1]-t[2-s.player]+(n.over?0:Math.min(1,(120-n.lettersUsed)/12)*potential(n,s.player));
  }
  if(score>bestScore){bestScore=score;best=m;}
 }
 return best;
}
