/* Pure game logic. Randomness is injectable for reproducible experiments/tests. */
const WordConquest = (() => {
  const distance = (a,b) => Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r));
  const adjacent = (a,b) => distance(a,b)===1;
  const isVowel = value => 'AEIOU'.includes(value);
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
      const rank=t=>Math.min(...starts.map(a=>distance(a,t))) + (castles.length?Math.min(...castles.map(a=>distance(a,t))):0);
      castleCandidates.sort((a,b)=>rank(b.tile)-rank(a.tile) || a.tie-b.tie);
      const tile=castleCandidates.shift().tile;
      castles.push(tile,mirror(tile));
    }
    castles.forEach(t=>t.castle=true);
    if(config.mirrorStartingBoard)tiles.filter(t=>t.q<0).forEach(t=>mirror(t).letter=t.letter);
    const jokers=[];
    if(config.jokerCount>=2)jokers.push(anchor,mirror(anchor));
    if(config.jokerCount%2) {
      const centerline=tiles.filter(t=>t.q===0 && !t.castle && !t.owner);
      if(centerline.length)jokers.push(centerline[Math.floor(random()*centerline.length)]);
    }
    const jokerCandidates=tiles.filter(t=>t.q<0 && !t.owner && !t.castle).map(tile=>({tile,tie:random()}));
    while(jokers.length+2<=config.jokerCount && jokerCandidates.length) {
      const rank=t=>jokers.length?Math.min(...jokers.map(a=>distance(a,t))):0;
      jokerCandidates.sort((a,b)=>rank(b.tile)-rank(a.tile) || a.tie-b.tie);
      const tile=jokerCandidates.shift().tile;
      jokers.push(tile,mirror(tile));
    }
    jokers.forEach(t=>t.letter='?');
    // Default opening: a joker, a vowel and a consonant for each player.
    const regularStart=region.filter(t=>t.letter!=='?');
    regularStart.slice(0,2).forEach((t,i)=>{
      t.letter=letter(config,random,value=>isVowel(value)===(i===0));
      mirror(t).letter=config.mirrorStartingBoard?t.letter:letter(config,random,value=>isVowel(value)===(i===0));
    });
    return tiles;
  }
  const newGame=(config,random)=>({tiles:generateBoard(config,random),player:1,turns:[0,0],log:[],over:false});
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
  const scores=(state,config)=>[1,2].map(player=>state.tiles.filter(t=>t.owner===player).reduce((n,t)=>n+(t.castle?config.castlePoints:config.normalTerritoryPoints),0));
  function advanceTurn(state,config) {
    state.turns[state.player-1]++;
    state.over=state.turns.every(n=>n>=config.turnsPerPlayer);
    if(!state.over)state.player=3-state.player;
  }
  function refreshLetters(tiles,ids,config,random=Math.random) {
    const selected=new Set(ids), previous=new Map(tiles.map(t=>[t.id,t.letter]));
    const next=tiles.map(t=>selected.has(t.id) && t.letter!=='?'
      ? {...t,letter:letter(config,random,value=>value!==t.letter)} : t);
    const refreshed=next.filter(t=>selected.has(t.id) && t.letter!=='?');
    // A fresh batch of 2+ letters always includes a vowel and a consonant.
    if(refreshed.length>=2)for(const vowel of [true,false]) {
      if(!refreshed.some(t=>isVowel(t.letter)===vowel)) {
        const tile=refreshed[Math.floor(random()*refreshed.length)];
        tile.letter=letter(config,random,value=>isVowel(value)===vowel && value!==previous.get(tile.id));
      }
    }
    return {tiles:next,refreshed:refreshed.map(t=>t.id)};
  }
  function submit(state,ids,config,dictionary=null,jokerLetters={},random=Math.random) {
    const error=validatePath(state,ids,config,true,dictionary,jokerLetters);
    if(error)return {error};
    const captured=capturedTiles(state,ids);
    const move={type:'word',player:state.player,word:wordForPath(state,ids,jokerLetters),captured:captured.length,
      enemy:captured.filter(t=>t.owner!==0).length,castles:captured.filter(t=>t.castle).length};
    const claimed=state.tiles.map(t=>ids.includes(t.id)?{...t,owner:state.player}:t);
    const updated=config.refreshUsedLetters?refreshLetters(claimed,ids,config,random):{tiles:claimed,refreshed:[]};
    move.refreshed=updated.refreshed.length;
    const next={...state,tiles:updated.tiles,turns:[...state.turns],log:[move,...state.log]};
    advanceTurn(next,config);
    return {state:next,captured:captured.map(t=>t.id),refreshed:updated.refreshed};
  }
  function refreshTurn(state,config,random=Math.random) {
    if(state.over)return {error:'The game has ended. Start a new game.'};
    if(!config.allowRefreshTurn)return {error:'Refreshing is disabled.'};
    const ids=state.tiles.filter(t=>t.owner===state.player && t.letter!=='?').map(t=>t.id);
    if(!ids.length)return {error:'No ordinary owned letters to refresh. Play a word instead.'};
    const updated=refreshLetters(state.tiles,ids,config,random);
    const move={type:'refresh',player:state.player,refreshed:updated.refreshed.length};
    const next={...state,tiles:updated.tiles,turns:[...state.turns],log:[move,...state.log]};
    advanceTurn(next,config);
    return {state:next,captured:[],refreshed:updated.refreshed};
  }
  return {distance,adjacent,generateBoard,newGame,canReenter,wordForPath,validatePath,capturedTiles,scores,advanceTurn,refreshLetters,submit,refreshTurn};
})();
if(typeof module!=='undefined')module.exports=WordConquest;
