/* Pure game logic. Randomness is injectable for reproducible experiments/tests. */
const WordConquest = (() => {
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
    if(config.jokerCount%2) {
      const centerline=tiles.filter(t=>t.q===0 && !t.castle && !t.owner);
      if(centerline.length)jokers.push(centerline[Math.floor(random()*centerline.length)]);
    }
    const reach=t=>Math.min(...starts.filter(a=>a.owner===(t.q<0?1:2)).map(a=>distance(a,t)));
    while(jokers.length+2<=config.jokerCount) {
      const available=tiles.filter(t=>t.q!==0 && !t.owner && !t.castle && !jokers.includes(t));
      const left=shuffled(available.filter(t=>t.q<0),random).sort((a,b)=>
        Math.min(...jokers.map(t=>distance(t,b)),99)-Math.min(...jokers.map(t=>distance(t,a)),99));
      const first=left.find(t=>available.some(a=>a.q>0 && reach(a)===reach(t)));
      if(!first)break;
      const right=shuffled(available.filter(t=>t.q>0 && reach(t)===reach(first)),random);
      const other=right.find(t=>t.id!==mirror(first).id) || right[0];
      jokers.push(first,other);
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
  const newGame=(config,random)=>({tiles:generateBoard(config,random),player:1,turns:[0,0],wordPoints:[0,0],lettersUsed:0,log:[],over:false});
  const canReenter=(state,config)=>config.allowReentry && !state.tiles.some(t=>t.owner===state.player);
  const wordForPath=(state,ids,jokerLetters={})=>ids.map(id=>{
    const tile=state.tiles.find(t=>t.id===id);
    return tile.letter==='?'?(jokerLetters[id] || '?'):tile.letter;
  }).join('');
  function validatePath(state,ids,config,complete=true,dictionary=null,jokerLetters={}) {
    if(state.over)return 'The game has ended. Start a new game.';
    const tiles=ids.map(id=>state.tiles.find(t=>t.id===id));
    if(!tiles.length)return canReenter(state,config)?'You have no territory. Start on any tile.':'Start on one of your territories.';
    if(tiles.some(t=>!t))return 'Unknown territory.';
    if(new Set(ids).size!==ids.length)return 'A tile can only be used once.';
    if(tiles[0].owner!==state.player && !canReenter(state,config))return 'Start on one of your territories.';
    if(tiles.some((t,i)=>i>0 && !adjacent(t,tiles[i-1])))return 'Choose an adjacent tile (diagonals count).';
    if(tiles.filter(t=>t.owner && t.owner!==state.player).length>config.maxEnemyTilesPerWord)
      return `Use at most ${config.maxEnemyTilesPerWord} enemy tiles per word.`;
    if(complete && tiles.length<config.minimumWordLength)return `Choose at least ${config.minimumWordLength} letters.`;
    if(complete && tiles.some(t=>t.letter==='?' && !/^[A-Z]$/.test(jokerLetters[t.id] || '')))
      return 'Choose one letter from A–Z for each joker.';
    if(complete && config.dictionaryEnabled) {
      if(!dictionary)return 'Dictionary unavailable. Load a word list or disable validation in config.js.';
      if(!dictionary.has(wordForPath(state,ids,jokerLetters).toLowerCase()))return 'That word is not in the dictionary.';
    }
    return null;
  }
  const capturedTiles=(state,ids)=>state.tiles.filter(t=>ids.includes(t.id) && t.owner!==state.player);
  const territoryValue=(tile,config)=>tile.castle?config.castlePoints:config.normalTerritoryPoints;
  const letterValue=(value,config)=>value==='?'?config.wordScoring.jokerPoints:
    (config.wordScoring.letterGroups.find(group=>group.letters.includes(value))?.points ?? 0);
  function lengthBonus(length,config) {
    const bonuses=config.wordScoring.lengthBonuses, last=bonuses.length-1;
    return length<=last?bonuses[length]:bonuses[last]+(length-last)*config.wordScoring.extraLetterBonus;
  }
  // Preview and submission share this calculation, using letters BEFORE refresh.
  function scoreMove(state,ids,config) {
    const tiles=ids.map(id=>state.tiles.find(t=>t.id===id));
    const letters=tiles.reduce((sum,t)=>sum+letterValue(t.letter,config),0);
    const bonus=lengthBonus(ids.length,config);
    const captured=capturedTiles(state,ids);
    const territoryGain=captured.reduce((sum,t)=>sum+territoryValue(t,config),0);
    const enemyLoss=captured.filter(t=>t.owner!==0).reduce((sum,t)=>sum+territoryValue(t,config),0);
    return {letters,lengthBonus:bonus,wordPoints:letters+bonus,territoryGain,enemyLoss,totalGain:letters+bonus+territoryGain};
  }
  const scoreBreakdown=(state,config)=>[1,2].map(player=>{
    const words=state.wordPoints?.[player-1] || 0;
    const territory=state.tiles.filter(t=>t.owner===player).reduce((sum,t)=>sum+territoryValue(t,config),0);
    return {words,territory,total:words+territory};
  });
  const scores=(state,config)=>scoreBreakdown(state,config).map(score=>score.total);
  const lettersRemaining=(state,config)=>Math.max(0,config.letterBudget-(state.lettersUsed || 0));
  function advanceTurn(state,config,letterCost=0) {
    state.lettersUsed=(state.lettersUsed || 0)+letterCost;
    state.turns[state.player-1]++;
    state.over=config.endCondition==='letters'
      ? lettersRemaining(state,config)===0 && state.turns[0]===state.turns[1]
      : state.turns.every(n=>n>=config.turnsPerPlayer);
    if(!state.over)state.player=3-state.player;
  }
  function refreshLetters(tiles,ids,config,random=Math.random) {
    const selected=new Set(ids), previous=new Map(tiles.map(t=>[t.id,t.letter]));
    const next=tiles.map(t=>selected.has(t.id) && t.letter!=='?'?{...t}:t);
    const refreshed=next.filter(t=>selected.has(t.id) && t.letter!=='?');
    placeLetters(next,refreshed,categoryPlan(refreshed.length,config,random),config,random,previous);
    return {tiles:next,refreshed:refreshed.map(t=>t.id)};
  }
  function submit(state,ids,config,dictionary=null,jokerLetters={},random=Math.random) {
    const error=validatePath(state,ids,config,true,dictionary,jokerLetters);
    if(error)return {error};
    const captured=capturedTiles(state,ids);
    const scoring=scoreMove(state,ids,config);
    const move={type:'word',player:state.player,word:wordForPath(state,ids,jokerLetters),captured:captured.length,
      enemy:captured.filter(t=>t.owner!==0).length,castles:captured.filter(t=>t.castle).length,scoring,letterCost:ids.length};
    const claimed=state.tiles.map(t=>ids.includes(t.id)?{...t,owner:state.player}:t);
    const updated=config.refreshUsedLetters?refreshLetters(claimed,ids,config,random):{tiles:claimed,refreshed:[]};
    move.refreshed=updated.refreshed.length;
    const wordPoints=[...(state.wordPoints || [0,0])];
    wordPoints[state.player-1]+=scoring.wordPoints;
    const next={...state,tiles:updated.tiles,wordPoints,turns:[...state.turns],log:[move,...state.log]};
    advanceTurn(next,config,move.letterCost);
    return {state:next,captured:captured.map(t=>t.id),refreshed:updated.refreshed};
  }
  function refreshTurn(state,config,random=Math.random) {
    if(state.over)return {error:'The game has ended. Start a new game.'};
    if(!config.allowRefreshTurn)return {error:'Refreshing is disabled.'};
    const ids=state.tiles.filter(t=>t.owner===state.player && t.letter!=='?').map(t=>t.id);
    if(!ids.length)return {error:'No ordinary owned letters to refresh. Play a word instead.'};
    const updated=refreshLetters(state.tiles,ids,config,random);
    const move={type:'refresh',player:state.player,refreshed:updated.refreshed.length,letterCost:Math.max(config.refreshMinimumLetterCost,updated.refreshed.length)};
    const next={...state,tiles:updated.tiles,turns:[...state.turns],log:[move,...state.log]};
    advanceTurn(next,config,move.letterCost);
    return {state:next,captured:[],refreshed:updated.refreshed};
  }
  return {distance,adjacent,letterType,openingBand,generateBoard,newGame,canReenter,wordForPath,validatePath,capturedTiles,letterValue,lengthBonus,scoreMove,scoreBreakdown,scores,lettersRemaining,advanceTurn,refreshLetters,submit,refreshTurn};
})();
if(typeof module!=='undefined')module.exports=WordConquest;
