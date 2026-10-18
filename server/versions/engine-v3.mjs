// Immutable defended-castle engine. Reuse versioned legality and replacement algorithms.
import English from './engine-v1.mjs';
import Swedish from './engine-sv-v1.mjs';
const base=config=>config.language==='sv'?Swedish:English;
const territoryCounts=(state,config)=>state.tiles.reduce((n,t)=>{
  if(t.owner)n[t.owner-1]+=config.finalTerritoryPoints;
  return n;
},[0,0]);
// An explicit saved tally distinguishes a completed game from an abandoned one.
function settleFinalTerritory(state,config){
  if(!state.over||state.finalTerritory!=null)return state;
  return {...state,finalTerritory:territoryCounts(state,config)};
}
function scoreBreakdown(state,config){
  const held=territoryCounts(state,config);
  return [0,1].map(i=>({words:state.wordPoints[i],income:state.castleIncome[i],
    territory:state.finalTerritory?.[i]??0,pendingTerritory:state.over?0:held[i],
    total:state.wordPoints[i]+state.castleIncome[i]+(state.finalTerritory?.[i]??0)}));
}
const scores=(state,config)=>scoreBreakdown(state,config).map(s=>s.total);
// Resolve ownership first. Only the non-acting player can earn defence income.
function defendedIncome(after,actor,config){
  const earned=[0,0],defender=3-actor;
  for(const t of after.tiles)if(t.castle&&t.owner===defender)
    earned[defender-1]+=t.q===0&&t.r===0?config.castleIncome.center:config.castleIncome.side;
  return earned;
}
function scoreMove(state,ids,config){
  const word=base(config).scoreMove(state,ids,config);
  const after={...state,turns:[...state.turns],tiles:state.tiles.map(t=>ids.includes(t.id)?{...t,owner:state.player}:t)};
  base(config).advanceTurn(after,config,ids.length);
  const incomeAwarded=defendedIncome(after,state.player,config);
  const finalTerritory=after.over?territoryCounts(after,config):null;
  return {...word,territoryGain:0,enemyLoss:0,castleIncome:0,incomeAwarded,finalTerritory,
    totalGain:word.wordPoints+(finalTerritory?.[state.player-1]??0)};
}
function finish(before,result,config,scoring=null){
  if(result.error)return result;
  const income=defendedIncome(result.state,before.player,config);
  let next={...result.state,castleIncome:before.castleIncome.map((n,i)=>n+income[i])};
  if(next.over)next=settleFinalTerritory(next,config);
  next.log=[{...next.log[0],...(scoring?{scoring}:{}),income,incomeTiming:'defended',
    finalTerritory:next.over?next.finalTerritory:null},...next.log.slice(1)];
  return {...result,state:next};
}
function submit(state,ids,config,dictionary=null,jokerLetters={},random=Math.random){
  const result=base(config).submit(state,ids,config,dictionary,jokerLetters,random);
  return finish(state,result,config,result.error?null:scoreMove(state,ids,config));
}
const refreshTurn=(state,config,random=Math.random)=>finish(state,base(config).refreshTurn(state,config,random),config);
const validatePath=(state,ids,config,...args)=>base(config).validatePath(state,ids,config,...args);
export default {...English,validatePath,scoreMove,scoreBreakdown,scores,submit,refreshTurn,settleFinalTerritory,defendedIncome};
