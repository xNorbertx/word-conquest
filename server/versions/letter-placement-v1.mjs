// Immutable, language-specific placement. Profile data: CC BY-SA 4.0, see EDGE-LETTERS-NOTICE.txt.
import profiles from './edge-profiles-v1.json' with {type:'json'};
const adjacent=(a,b)=>Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r))===1;

function layout(tiles,config){
  const profile=profiles[config.language||'en'];
  if(!profile)throw Error('Missing letter-placement language profile.');
  const neighbors=tiles.map(t=>tiles.flatMap((n,i)=>adjacent(t,n)?[i]:[]));
  const category=value=>['vowels','flexible','ordinary','rare'].find(k=>config.letterBalance[k].includes(value));
  const quality=i=>{
    if(tiles[i].letter==='?')return 0;
    const support=[...new Set(neighbors[i].map(n=>tiles[n].letter))]
      .map(letter=>letter==='?'?1:profile.pairs[tiles[i].letter][letter]).sort((a,b)=>b-a);
    // Every tile benefits; a missing neighbour increases the priority of its support.
    return (1+Math.max(0,8-neighbors[i].length)/2)*support.slice(0,3).reduce((a,b)=>a+b,0);
  };
  return {tiles,neighbors,category,quality};
}
function arrange(context,ids,previous=new Map()){
  const {tiles,neighbors,category,quality}=context,selected=new Set(ids);
  const batch=tiles.flatMap((t,i)=>selected.has(t.id)&&t.letter!=='?'?[i]:[]);
  const swaps=[];
  for(let a=0;a<batch.length;a++)for(let b=a+1;b<batch.length;b++){
    const i=batch[a],j=batch[b];
    // Categories never move. This preserves vowel access, rare-letter spacing,
    // starting-side budgets and all sampled letter counts.
    if(category(tiles[i].letter)!==category(tiles[j].letter))continue;
    swaps.push({i,j,affected:[...new Set([i,j,...neighbors[i],...neighbors[j]])]});
  }
  for(let pass=0;pass<3;pass++){
    let changed=false;
    for(const {i,j,affected} of swaps){
      const a=tiles[i],b=tiles[j];
      if(a.letter===b.letter||previous.get(a.id)===b.letter||previous.get(b.id)===a.letter)continue;
      const before=affected.reduce((sum,k)=>sum+quality(k),0);
      [a.letter,b.letter]=[b.letter,a.letter];
      const after=affected.reduce((sum,k)=>sum+quality(k),0);
      if(after>before+1e-9)changed=true;else [a.letter,b.letter]=[b.letter,a.letter];
    }
    if(!changed)break;
  }
}
export function improveOpening(tiles,config){
  const context=layout(tiles,config);
  const band=t=>t.owner?'base':tiles.some(n=>n.owner&&adjacent(t,n))?'near':'outer';
  for(const b of ['base','near','outer'])for(const side of [-1,1])
    arrange(context,tiles.filter(t=>Math.sign(t.q)===side&&band(t)===b).map(t=>t.id));
  arrange(context,tiles.filter(t=>t.q===0).map(t=>t.id));
  return tiles;
}
export function improveReplacements(tiles,ids,config,previous){
  if(ids.length<2)return tiles;
  const selected=new Set(ids),next=tiles.map(t=>selected.has(t.id)?{...t}:t);
  arrange(layout(next,config),ids,new Map(previous.map(t=>[t.id,t.letter])));
  return next;
}
