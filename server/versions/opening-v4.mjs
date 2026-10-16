// Immutable castle-neighbor opening, shared by English v4 and Swedish v2.
  const distance = (a,b) => Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r));
  const adjacent = (a,b) => distance(a,b)===1;
  const letterType=(value,config)=>['vowels','flexible','ordinary','rare'].find(type=>config.letterBalance[type].includes(value));
  function shuffled(values,random) {
    const result=[...values];
    for(let i=result.length-1;i>0;i--) { const j=Math.floor(random()*(i+1)); [result[i],result[j]]=[result[j],result[i]]; }
    return result;
  }
  // Shared category quotas; letters and positions are sampled independently.
  function categoryPlan(count,config,random,allowRare=true) {
    const balance=config.letterBalance;
    if(!count)return [];
    if(count===1) {
      const roll=random();
      return [roll<balance.vowelShare?'vowels':roll<balance.vowelShare+balance.flexibleShare?'flexible':'ordinary'];
    }
    const vowels=Math.max(1,Math.min(count-1,Math.round(count*balance.vowelShare)));
    const flexible=Math.max(1,Math.min(count-vowels,Math.round(count*balance.flexibleShare)));
    const remaining=count-vowels-flexible;
    const rare=allowRare && count>=balance.rareMinBatch && random()<balance.rareBatchChance
      ? Math.min(remaining,Math.floor(count*balance.rareMaxShare),1):0;
    return [...Array(vowels).fill('vowels'),...Array(flexible).fill('flexible'),
      ...Array(remaining-rare).fill('ordinary'),...Array(rare).fill('rare')];
  }
  function placeLetters(tiles,batch,plan,config,random,previous=new Map()) {
    if(!batch.length)return;
    const values=shuffled(plan,random).map(type=>letter(config,random,value=>config.letterBalance[type].includes(value)));
    let best=null,bestCost=Infinity;
    for(let attempt=0;attempt<config.letterBalance.placementAttempts;attempt++) {
      const candidate=shuffled(values,random).map((value,i)=>value===previous.get(batch[i].id)
        ? letter(config,random,next=>letterType(next,config)===letterType(value,config) && next!==value):value);
      const letters=new Map(batch.map((t,i)=>[t.id,candidate[i]]));
      const valueAt=t=>letters.get(t.id) || t.letter;
      let cost=0;
      for(const tile of batch) {
        const value=valueAt(tile), type=letterType(value,config), neighbors=tiles.filter(t=>adjacent(t,tile));
        const vowelAccess=neighbors.some(t=>valueAt(t)==='?' || letterType(valueAt(t),config)==='vowels');
        if(type!=='vowels' && !vowelAccess)cost+=3;
        if(type==='rare') {
          if(!vowelAccess)cost+=8;
          if(neighbors.some(t=>letterType(valueAt(t),config)==='rare'))cost+=8;
        }
      }
      if(cost<bestCost){best=candidate;bestCost=cost;}
      if(!cost)break;
    }
    batch.forEach((tile,i)=>tile.letter=best[i]);
  }
  const openingBand=(tile,tiles)=>tile.owner?'base':tiles.some(t=>t.owner && adjacent(tile,t))?'near':'outer';
  function letter(config,random=Math.random,accept=()=>true) {
    const weights=Object.entries(config.letterWeights).filter(([value,weight])=>weight>0 && accept(value));
    if (!weights.length) throw new Error('Letter distribution needs vowels and consonants.');
    let roll=random()*weights.reduce((sum,[,weight])=>sum+weight,0);
    for (const [value,weight] of weights) { roll-=weight; if(roll<0)return value; }
    return weights.at(-1)[0];
  }
  function generateBoard(config,random=Math.random) {
    const tiles=[], radius=config.boardRadius;
    for(let q=-radius;q<=radius;q++) for(let r=-radius;r<=radius;r++) {
      if(Math.abs(q)+Math.abs(r)>2*radius-config.cornerCut)continue;
      tiles.push({id:`${q},${r}`,q,r,letter:letter(config,random),owner:0,castle:false});
    }
    const mirror=t=>tiles.find(a=>a.q===-t.q && a.r===t.r);
    // Grow one connected starting region; reflect its exact shape for the other player.
    const anchor=tiles.find(t=>t.q===-radius && t.r===0), region=[anchor];
    while(region.length<config.startingTerritories) {
      const next=tiles.filter(t=>t.q<0 && !region.includes(t) && region.some(a=>adjacent(a,t)))
        .sort((a,b)=>distance(a,anchor)-distance(b,anchor) || a.r-b.r || a.q-b.q)[0];
      if(!next)break;
      region.push(next);
    }
    region.forEach(t=>{t.owner=1;mirror(t).owner=2;});
    const starts=tiles.filter(t=>t.owner);
    const castles=[];
    if(config.castleCount%2) {
      const center=tiles.find(t=>t.q===0 && t.r===0);
      if(center && !center.owner)castles.push(center);
    }
    const castleCandidates=tiles.filter(t=>!t.owner && t.q<0).map(tile=>({tile,tie:random()}));
    while(castles.length+2<=config.castleCount && castleCandidates.length) {
      const pair=Math.floor(castles.length/2);
      const target={q:-Math.max(1,Math.floor(radius/2)),r:(pair%2===0?-1:1)*Math.max(1,radius-1)};
      const rank=t=>Math.min(...starts.map(a=>distance(a,t))) + (castles.length?Math.min(...castles.map(a=>distance(a,t))):0);
      castleCandidates.sort((a,b)=>distance(a.tile,target)-distance(b.tile,target) || rank(b.tile)-rank(a.tile) || a.tie-b.tie);
      const tile=castleCandidates.shift().tile;
      castles.push(tile,mirror(tile));
    }
    castles.forEach(t=>t.castle=true);
    const jokers=[];
    if(config.jokerCount>=2) {
      const first=shuffled(region,random)[0];
      const other=shuffled(tiles.filter(t=>t.owner===2 && t.id!==mirror(first).id),random)[0] || mirror(first);
      jokers.push(first,other);
    }
    // One neutral joker beside each side castle. Reflect each pair so access
    // from the two starting regions stays equal; vary the offsets every game.
    // Keep these jokers outside the starting neighborhood and in separate corners.
    const sideCastles=castles.filter(t=>t.q<0);
    if(config.jokerCount!==2+sideCastles.length*2)
      throw new Error('Castle-neighbor openings need two base jokers and one per side castle.');
    for(const castle of sideCastles) {
      const candidates=tiles.filter(t=>t.q<0 && Math.sign(t.r)===Math.sign(castle.r)
        && !t.owner && !t.castle && adjacent(t,castle) && openingBand(t,tiles)==='outer'
        && [t,mirror(t)].every(a=>jokers.every(j=>distance(a,j)>1)));
      if(!candidates.length)throw new Error('No balanced joker position beside castle.');
      const chosen=shuffled(candidates,random)[0];
      jokers.push(chosen,mirror(chosen));
    }
    jokers.forEach(t=>t.letter='?');
    // Match category counts separately at the base, in its immediate neighborhood,
    // and in the remaining half. No shared letters or shared shuffle sequence.
    for(const band of ['base','near','outer']) {
      const batches=[-1,1].map(side=>tiles.filter(t=>Math.sign(t.q)===side && t.letter!=='?' && openingBand(t,tiles)===band));
      const plan=categoryPlan(batches[0].length,config,random,band==='outer');
      batches.forEach(batch=>placeLetters(tiles,batch,batch.length===plan.length?plan:categoryPlan(batch.length,config,random,band==='outer'),config,random));
    }
    const center=tiles.filter(t=>t.q===0 && t.letter!=='?');
    placeLetters(tiles,center,categoryPlan(center.length,config,random),config,random);
    return tiles;
  }

export {generateBoard};
export function newGame(config,random=Math.random){
  const startingPlayer=random()<.5?1:2;
  return {tiles:generateBoard(config,random),player:startingPlayer,startingPlayer,turns:[0,0],wordPoints:[0,0],castleIncome:[0,0],lettersUsed:0,log:[],over:false};
}
