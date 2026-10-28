// Research candidate: rearrange an existing pool, never change its letter counts.
const adjacent=(a,b)=>Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r))===1;
export function arrange(tiles,ids,profile,config,{letter=2,pair=4,inner=0,sameCategory=false,diverse=false,passes=3}={},previous=new Map()){
  const selected=new Set(ids), batch=tiles.filter(t=>selected.has(t.id)&&t.letter!=='?');
  const neighbors=new Map(tiles.map(t=>[t,tiles.filter(n=>adjacent(t,n))]));
  const edge=t=>Math.max(0,8-neighbors.get(t).length)/4;
  const quality=()=>{
    let score=0;
    for(const t of tiles){
      if(t.letter==='?')continue;
      const near=neighbors.get(t),type=config.letterBalance.vowels.includes(t.letter)?'vowel':config.letterBalance.rare.includes(t.letter)?'rare':'consonant';
      const vowel=near.some(n=>n.letter==='?'||config.letterBalance.vowels.includes(n.letter));
      if(type!=='vowel'&&!vowel)score-=3;
      if(type==='rare'){if(!vowel)score-=8;if(near.some(n=>config.letterBalance.rare.includes(n.letter)))score-=8;}
      if(!edge(t)&&!inner)continue;
      const letters=diverse?[...new Set(near.map(n=>n.letter))]:near.map(n=>n.letter);
      const supports=letters.map(l=>l==='?'?1:profile.pairs[t.letter]?.[l]||0).sort((a,b)=>b-a);
      score+=edge(t)*letter*(profile.utility[t.letter]||0)+(edge(t)*pair+inner)*supports.slice(0,3).reduce((a,b)=>a+b,0);
    }
    return score;
  };
  let best=quality();
  for(let pass=0;pass<passes;pass++){
    let changed=false;
    for(let i=0;i<batch.length;i++)for(let j=i+1;j<batch.length;j++){
      const a=batch[i],b=batch[j];
      if(sameCategory&&['vowels','flexible','ordinary','rare'].find(k=>config.letterBalance[k].includes(a.letter))!==['vowels','flexible','ordinary','rare'].find(k=>config.letterBalance[k].includes(b.letter)))continue;
      if(a.letter===b.letter||previous.get(a.id)===b.letter||previous.get(b.id)===a.letter)continue;
      [a.letter,b.letter]=[b.letter,a.letter];
      const next=quality();
      if(next>best+1e-9){best=next;changed=true;}else [a.letter,b.letter]=[b.letter,a.letter];
    }
    if(!changed)break;
  }
  return tiles;
}
export function opening(tiles,profile,config,options){
  // Keep both sides' existing category budgets and individual letter pools.
  const band=t=>t.owner?'base':tiles.some(n=>n.owner&&adjacent(t,n))?'near':'outer';
  // Same scan order for mirrored halves avoids a systematic top/bottom bias.
  for(const b of ['base','near','outer'])for(const side of [-1,1])arrange(tiles,tiles.filter(t=>Math.sign(t.q)===side&&band(t)===b).map(t=>t.id),profile,config,options);
  arrange(tiles,tiles.filter(t=>t.q===0).map(t=>t.id),profile,config,options);
  return tiles;
}
