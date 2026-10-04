// Offline research only. This module never writes production games or changes pinned rules.
import Engine from '../../../server/versions/engine-v1.mjs';
import base from '../../../server/versions/rules-v2.mjs';
export const rng=seed=>{let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};};
export const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
function nonRareLetter(c,random){const entries=Object.entries(c.letterWeights).filter(([l])=>!c.letterBalance.rare.includes(l));let roll=random()*entries.reduce((n,[,w])=>n+w,0);for(const [l,w]of entries){roll-=w;if(roll<0)return l;}return entries.at(-1)[0];}
const flat={...base.wordScoring,lengthBonuses:[0,0,0,0,1,2,3,4,5],extraLetterBonus:2};
export const variants=[
 {id:'baseline',name:'Current unlimited captures'},
 {id:'classic',name:'Classic three-capture cap',rules:{maxEnemyTilesPerWord:3}},
 {id:'land2',name:'Land 2 / castles 5',rules:{normalTerritoryPoints:2,castlePoints:5}},
 {id:'castles6',name:'Castles worth 6',rules:{castlePoints:6}},
 {id:'flat_words',name:'Gentler length bonus',rules:{wordScoring:flat}},
 {id:'income_all',name:'Every held tile earns 1',income:{kind:'all',rate:1}},
 {id:'income_cap4',name:'Holding income capped at 4',income:{kind:'all',rate:1,cap:4}},
 {id:'income_castles',name:'Held castles earn 2',income:{kind:'castle',rate:2}},
 {id:'income_delayed',name:'Castles earn 3 after two rounds',income:{kind:'castle',rate:3,delay:2}},
 {id:'jokers2',name:'Two home jokers',rules:{jokerCount:2}},
 {id:'jokers4',name:'Four spread jokers',rules:{jokerCount:4}},
 {id:'jokers8',name:'Eight spread jokers',rules:{jokerCount:8}},
 {id:'jokers_frontier',name:'Six jokers, neutral ones near centre',jokerLayout:'frontier'},
 {id:'jokers_neutral',name:'Four central jokers, none at home',rules:{jokerCount:0},jokerLayout:'neutral'},
 {id:'one_joker',name:'At most one joker per word',maxJokers:1},
 {id:'vowels42',name:'Vowel target 42%',rules:{letterBalance:{...base.letterBalance,vowelShare:.42}}},
 {id:'small_board',name:'45-tile board',rules:{boardRadius:3,cornerCut:1}},
 {id:'long_game',name:'160-letter budget',rules:{letterBudget:160}},
 {id:'frontier_refresh',name:'Only captured letters refresh',captureRefresh:true},
 {id:'middle_castles',name:'Three central castles worth 5',rules:{castleCount:3,castlePoints:5},castleLayout:'middle'},
 {id:'castle_majority',name:'12-point central-castle majority',rules:{castleCount:3},castleLayout:'middle',majorityBonus:12},
 {id:'combo_land4',name:'Land 2 / castles 5 + four jokers',rules:{normalTerritoryPoints:2,castlePoints:5,jokerCount:4}},
 {id:'combo_hold4',name:'Castle holding + four jokers',rules:{jokerCount:4},income:{kind:'castle',rate:2}},
 {id:'settled',name:'Territory matures after a held round',matureTerritory:true},
 {id:'jokers_bridges',name:'Six spaced bridge jokers',jokerLayout:'bridges'},
 {id:'land_bridges',name:'Land 2 / castles 5 + bridge jokers',rules:{normalTerritoryPoints:2,castlePoints:5},jokerLayout:'bridges'},
 {id:'castle_claim',name:'Castle hold earns 3 once per player',income:{kind:'castle',rate:3,once:true}},
 {id:'castle_income_cap2',name:'Held castles earn 1, capped at 2',income:{kind:'castle',rate:1,cap:2}},
 {id:'small4',name:'45-tile board with four jokers',rules:{boardRadius:3,cornerCut:1,jokerCount:4}},
 {id:'fixed_rounds',name:'12 rounds instead of letter budget',rules:{endCondition:'turns',turnsPerPlayer:12}},
 {id:'joker_burn',name:'Jokers become letters after use',jokerBurn:true},
 {id:'two_jokers_max',name:'At most two jokers per word',maxJokers:2},
 {id:'combo_central',name:'Central castles + four frontier jokers',rules:{jokerCount:0,castleCount:3,castlePoints:5},jokerLayout:'neutral',castleLayout:'middle'},
];
export function config(v){return {...structuredClone(base),dictionaryEnabled:true,...structuredClone(v.rules||{})};}
export function newState(v,seed,mirror=false){
 const c=config(v),random=rng(seed),s=Engine.newGame(c,random);
 if(v.castleLayout==='middle')s.tiles.forEach(t=>t.castle=t.q===0&&[-2,0,2].includes(t.r));
 if(v.jokerLayout){
  s.tiles.forEach(t=>{if(t.letter==='?'&&(!t.owner||v.jokerLayout==='neutral'))t.letter=nonRareLetter(c,random);});
  const coords=v.jokerLayout==='bridges'?['-2,-2','2,-2','-2,2','2,2']:v.jokerLayout==='frontier'?['-1,-2','1,-2','-1,2','1,2']:['-1,-1','1,-1','-1,1','1,1'];
  coords.forEach(id=>{s.tiles.find(t=>t.id===id).letter='?';});
 }
 if(mirror){const old=new Map(s.tiles.map(t=>[t.id,{...t}]));s.tiles=s.tiles.map(t=>{const source=old.get(`${-t.q},${t.r}`);return {...source,id:t.id,q:t.q,r:t.r,owner:source.owner?3-source.owner:0};});}
 s.claims=s.tiles.map(()=>[false,false]);s.income=[0,0];s.ages=s.tiles.map(()=>0);s.roundOwners=s.tiles.map(t=>t.owner);s.roundBroken=s.tiles.map(()=>false);
 return s;
}
export function totals(s,c,v){const a=Engine.scores(s,c).map((x,i)=>x+(s.income?.[i]||0));if(v.matureTerritory)s.tiles.forEach((t,i)=>{if(t.owner&&s.ages[i]>=1)a[t.owner-1]+=t.castle?2:1;});if(s.over&&v.majorityBonus){const n=[1,2].map(p=>s.tiles.filter(t=>t.castle&&t.owner===p).length);if(n[0]>s.tiles.filter(t=>t.castle).length/2)a[0]+=v.majorityBonus;if(n[1]>s.tiles.filter(t=>t.castle).length/2)a[1]+=v.majorityBonus;}return a;}
export function apply(s,move,v,random,dictionary){
 const c=config(v);if(move&&move.path.filter(i=>s.tiles[i].letter==='?').length>(v.maxJokers??Infinity))throw Error('Too many jokers');
 const ids=move?.path.map(i=>s.tiles[i].id),jokers={};if(move)move.path.forEach((i,n)=>{if(s.tiles[i].letter==='?')jokers[s.tiles[i].id]=move.word[n].toUpperCase();});
 const result=move?Engine.submit(s,ids,v.captureRefresh?{...c,refreshUsedLetters:false}:c,dictionary,jokers,random):Engine.refreshTurn(s,c,random);
 if(result.error)throw Error(result.error);
 const n=result.state;
 if(move&&v.captureRefresh){const refreshed=Engine.refreshLetters(n.tiles,result.captured,c,random);n.tiles=refreshed.tiles;n.log[0].refreshed=refreshed.refreshed.length;}
 if(move&&v.jokerBurn){const used=move.path.filter(i=>s.tiles[i].letter==='?').map(i=>s.tiles[i].id);n.tiles=n.tiles.map(t=>used.includes(t.id)?{...t,letter:'!'}:t);n.tiles=Engine.refreshLetters(n.tiles,used,c,random).tiles;}
 n.claims=(s.claims||s.tiles.map(()=>[false,false])).map(a=>[...a]);n.income=[...s.income];n.ages=[...s.ages];n.roundOwners=[...s.roundOwners];n.roundBroken=s.roundBroken.map((b,i)=>b||s.tiles[i].owner!==n.tiles[i].owner);
 if(s.player===2){
  const earned=[0,0];n.tiles.forEach((t,i)=>{n.ages[i]=t.owner&&t.owner===s.roundOwners[i]&&!n.roundBroken[i]?s.ages[i]+1:0;
   if(v.income&&t.owner&&n.ages[i]>=(v.income.delay||1)&&(v.income.kind==='all'||t.castle)&&(!v.income.once||!s.claims[i][t.owner-1])){earned[t.owner-1]+=v.income.rate;if(v.income.once)n.claims[i][t.owner-1]=true;}});
  if(v.income)for(let i=0;i<2;i++)n.income[i]+=Math.min(v.income.cap??Infinity,earned[i]);
  n.roundOwners=n.tiles.map(t=>t.owner);n.roundBroken=n.tiles.map(()=>false);
 }
 return n;
}
export function makeTrie(frequency,minFrequency=3.5,maxLength=9){
 const root={next:Object.create(null),word:null},words=new Set();
 for(const [word,f] of Object.entries(frequency)){if(f<minFrequency||word.length>maxLength)continue;words.add(word);let n=root;for(const letter of word.toUpperCase())n=n.next[letter]??=( {next:Object.create(null),word:null});n.word=word;n.frequency=f;}
 return {root,words,maxLength,minFrequency};
}
export function graph(s){return s.tiles.map(t=>s.tiles.flatMap((a,i)=>Engine.adjacent(t,a)?[i]:[]));}
export function enumerate(s,c,v,trie,{limit=2000000,noticed=false,noticeSeed=0}={}){
 const neighbors=graph(s),tiles=s.tiles,seen=new Uint8Array(tiles.length),path=[],out=[],unique=new Set();let visits=0,cutoff=false;
 const own=tiles.some(t=>t.owner===s.player),values=tiles.map(t=>Engine.letterValue(t.letter,c)),min=c.minimumWordLength;
 function visit(i,node,enemy,jokers,points,land,castleSwing,jokerSwing){
  if(++visits>limit){cutoff=true;return;}const tile=tiles[i],isJoker=tile.letter==='?';
  if(seen[i]||(tile.owner&&tile.owner!==s.player&&enemy>=c.maxEnemyTilesPerWord)||(isJoker&&jokers>=(v.maxJokers??Infinity)))return;
  const branches=isJoker?Object.entries(node.next):node.next[tile.letter]?[[tile.letter,node.next[tile.letter]]]:[];if(!branches.length)return;
  seen[i]=1;path.push(i);
  const en=enemy+(tile.owner&&tile.owner!==s.player?1:0),jk=jokers+Number(isJoker),wp=points+values[i],tv=tile.castle?c.castlePoints:c.normalTerritoryPoints;
  const delta=tile.owner===s.player?0:tile.owner?2:1,ls=land+delta*tv+(v.matureTerritory&&tile.owner&&tile.owner!==s.player&&s.ages[i]>=1?(tile.castle?2:1):0),cs=castleSwing+(tile.castle?delta:0),js=jokerSwing+(isJoker?delta:0);
  for(const [letter,next]of branches){
   if(next.word&&path.length>=min){
    unique.add(next.word);
    out.push({word:next.word,frequency:next.frequency,path:[...path],wordPoints:wp+Engine.lengthBonus(path.length,c),land:ls,enemy:en,castleSwing:cs,jokerSwing:js,jokers:jk});
   }
   if(path.length<trie.maxLength)for(const j of neighbors[i]){visit(j,next,en,jk,wp,ls,cs,js);if(cutoff)break;}
   if(cutoff)break;
  }
  path.pop();seen[i]=0;
 }
 for(let i=0;i<tiles.length;i++){if(!own||tiles[i].owner===s.player)visit(i,trie.root,0,0,0,0,0,0);if(cutoff)break;}
 let moves=out;
 if(noticed){const ranked=new Map();for(const m of out)if(!ranked.has(m.word)){const weight=10**(.35*(m.frequency-3.5))*Math.exp(-.7*(m.word.length-4));const u=(hash(`${noticeSeed}/${s.player}/${s.turns?.join(',')}/${m.word}`)+1)/4294967297;ranked.set(m.word,-Math.log(u)/weight);}const noticedWords=new Set([...ranked].sort((a,b)=>a[1]-b[1]).slice(0,8).map(x=>x[0]));moves=out.filter(m=>noticedWords.has(m.word));}
 return {moves,words:unique.size,noticedWords:new Set(moves.map(m=>m.word)).size,visits,cutoff};
}
function incomeSwing(s,m,v){
 if(!v.income)return 0;
 const before=[0,0];s.tiles.forEach((t,i)=>{if(t.owner&&(v.income.kind==='all'||t.castle)&&(!v.income.once||!s.claims[i][t.owner-1]))before[t.owner-1]+=v.income.rate;});
 const after=[...before];for(const i of m.path){const t=s.tiles[i];if(t.owner===s.player||v.income.kind==='castle'&&!t.castle)continue;if(t.owner&&(!v.income.once||!s.claims[i][t.owner-1]))after[t.owner-1]-=v.income.rate;if(!v.income.once||!s.claims[i][s.player-1])after[s.player-1]+=v.income.rate;}
 const cap=v.income.cap??Infinity,p=s.player-1,e=1-p;
 return (Math.min(cap,after[p])-Math.min(cap,before[p]))-(Math.min(cap,after[e])-Math.min(cap,before[e]));
}
export function merit(s,m,v,policy='balanced'){
 if(policy==='words')return m.wordPoints+.001*m.land+.00001*m.frequency;
 if(policy==='tempo'){let net=0;if(v.income){const potential=[0,0];for(const t of s.tiles)if(t.owner&&(v.income.kind==='all'||t.castle))potential[t.owner-1]+=v.income.rate;net=Math.min(v.income.cap??Infinity,potential[s.player-1])-Math.min(v.income.cap??Infinity,potential[2-s.player]);}return (m.wordPoints+m.land+2*incomeSwing(s,m,v)+net)/m.path.length;}
 if(policy==='land')return m.land+.25*m.wordPoints+.3*m.castleSwing+.2*m.jokerSwing;
 const roundsLeft=Math.max(0,((v.rules?.letterBudget??base.letterBudget)-s.lettersUsed)/12),horizon=Math.min(2,Math.max(0,roundsLeft-(v.income?.delay||1)+.5));
 return m.wordPoints+m.land+(v.matureTerritory?m.path.reduce((sum,i)=>sum+(s.tiles[i].owner!==s.player?(s.tiles[i].castle?1:.5):0),0):0)+horizon*incomeSwing(s,m,v)+.4*m.jokerSwing+.25*m.castleSwing+(v.majorityBonus?m.castleSwing*v.majorityBonus/3*Math.min(1,(s.lettersUsed+12)/(v.rules?.letterBudget??base.letterBudget)):0)+.00001*m.frequency;
}
export function choose(s,moves,v,policy='balanced'){
 let best=null,bestValue=-Infinity;for(const m of moves){const score=merit(s,m,v,policy);if(score>bestValue){bestValue=score;best=m;}}return best;
}
export function tradeoff(moves){
 if(!moves.length)return {maxWord:0,exists:false};
 let maxWord=0;for(const m of moves)maxWord=Math.max(maxWord,m.wordPoints);let topLand=-Infinity;
 for(const m of moves)if(m.wordPoints===maxWord)topLand=Math.max(topLand,m.land);
 return {maxWord,exists:moves.some(m=>m.wordPoints<=maxWord-2&&m.land>=topLand+3),topLand};
}
export {Engine};
