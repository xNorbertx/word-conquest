/* Pure game logic: no DOM, timers or browser dependencies. */
const WordConquest = (() => {
  const distance = (a, b) => Math.max(Math.abs(a.q-b.q), Math.abs(a.r-b.r), Math.abs(a.q+a.r-b.q-b.r));
  const adjacent = (a, b) => distance(a,b) === 1;
  function letter(config, random) {
    const weights = Object.entries(config.letterWeights);
    let roll = random() * weights.reduce((sum, [,weight]) => sum+weight, 0);
    for (const [value, weight] of weights) { roll -= weight; if (roll < 0) return value; }
    return weights.at(-1)[0];
  }
  function generateBoard(config, random = Math.random) {
    const tiles = [], radius = config.boardRadius;
    for (let q=-radius; q<=radius; q++) for (let r=-radius; r<=radius; r++) {
      if (Math.abs(q+r)<=radius) tiles.push({id:`${q},${r}`, q,r,letter:letter(config,random),owner:0,castle:false});
    }
    for (const [player, q] of [[1,-radius],[2,radius]]) {
      const anchor = tiles.find(t => t.q===q && t.r===0);
      const region = [anchor];
      while (region.length < config.startingTerritories) {
        const next = tiles.filter(t => !t.owner && !region.includes(t) && region.some(a=>adjacent(a,t)))
          .sort((a,b)=>distance(a,anchor)-distance(b,anchor) || a.r-b.r)[0];
        if (!next) break;
        region.push(next);
      }
      region.forEach(t=>t.owner=player);
    }
    const starts = tiles.filter(t=>t.owner);
    const candidates = tiles.filter(t=>!t.owner).map(t=>({tile:t, clearance:Math.min(...starts.map(a=>distance(a,t))),tie:random()}))
      .sort((a,b)=>b.clearance-a.clearance || a.tie-b.tie);
    const castles=[];
    for (let i=0;i<config.castleCount && candidates.length;i++) {
      candidates.sort((a,b)=> {
        const rank = c => c.clearance + (castles.length ? Math.min(...castles.map(t=>distance(t,c.tile))) : 0);
        return rank(b)-rank(a) || a.tie-b.tie;
      });
      const chosen=candidates.shift().tile; chosen.castle=true; castles.push(chosen);
    }
    return tiles;
  }
  const newGame = (config, random) => ({tiles:generateBoard(config,random),player:1,turns:[0,0],log:[],over:false});
  function validatePath(state, ids, config, complete=true, dictionary=null) {
    if (state.over) return 'The game has ended. Start a new game.';
    const tiles=ids.map(id=>state.tiles.find(t=>t.id===id));
    if (!tiles.length) return 'Start on one of your territories.';
    if (tiles.some(t=>!t)) return 'Unknown territory.';
    if (new Set(ids).size!==ids.length) return 'A hex can only be used once.';
    if (tiles[0].owner!==state.player) return 'Start on one of your territories.';
    if (tiles.some((t,i)=>i>0 && !adjacent(t,tiles[i-1]))) return 'Choose an adjacent hex.';
    if (tiles.filter(t=>t.owner && t.owner!==state.player).length>config.maxEnemyTilesPerWord)
      return `Use at most ${config.maxEnemyTilesPerWord} enemy hex per word.`;
    if (complete && tiles.length<config.minimumWordLength) return `Choose at least ${config.minimumWordLength} letters.`;
    if (complete && config.dictionaryEnabled) {
      if (!dictionary) return 'Dictionary unavailable. Load a word list or disable validation in config.js.';
      if (!dictionary.has(tiles.map(t=>t.letter).join('').toLowerCase())) return 'That word is not in the dictionary.';
    }
    return null;
  }
  const capturedTiles = (state,ids) => state.tiles.filter(t=>ids.includes(t.id) && t.owner!==state.player);
  const scores = (state,config) => [1,2].map(player=>state.tiles.filter(t=>t.owner===player).reduce((n,t)=>n+(t.castle?config.castlePoints:config.normalTerritoryPoints),0));
  function advanceTurn(state,config) {
    state.turns[state.player-1]++;
    state.over=state.turns.every(n=>n>=config.turnsPerPlayer);
    if (!state.over) state.player=3-state.player;
  }
  function submit(state,ids,config,dictionary=null) {
    const error=validatePath(state,ids,config,true,dictionary);
    if (error) return {error};
    const captured=capturedTiles(state,ids);
    const move={player:state.player,word:ids.map(id=>state.tiles.find(t=>t.id===id).letter).join(''),captured:captured.length,castles:captured.filter(t=>t.castle).length};
    const next={...state,tiles:state.tiles.map(t=>ids.includes(t.id)?{...t,owner:state.player}:t),turns:[...state.turns],log:[move,...state.log]};
    advanceTurn(next,config);
    return {state:next,captured:captured.map(t=>t.id)};
  }
  return {distance,adjacent,generateBoard,newGame,validatePath,capturedTiles,scores,advanceTurn,submit};
})();
if (typeof module !== 'undefined') module.exports = WordConquest;
