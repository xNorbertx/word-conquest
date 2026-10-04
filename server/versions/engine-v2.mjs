// Immutable v3 implementation. Legacy move legality, words and replacements stay in engine v1.
import Legacy from './engine-v1.mjs';
const center=tile=>tile.q===0&&tile.r===0;
const territoryValue=(tile,config)=>tile.castle?(center(tile)?config.centerCastlePoints:config.castlePoints):config.normalTerritoryPoints;
const castleIncomePerRound=(state,config)=>state.tiles.reduce((earned,tile)=>{
  if(tile.castle&&tile.owner)earned[tile.owner-1]+=center(tile)?config.castleIncome.center:config.castleIncome.side;
  return earned;
},[0,0]);
const closesRound=state=>state.turns[state.player-1]+1===state.turns[2-state.player];
function newGame(config,random=Math.random){
  // Draw once on the trusted server. Persisted state makes create retries keep this choice.
  const startingPlayer=random()<.5?1:2;
  return {...Legacy.newGame(config,random),player:startingPlayer,startingPlayer,castleIncome:[0,0]};
}
function scoreBreakdown(state,config){
  return [1,2].map(player=>{
    const words=state.wordPoints[player-1],territory=state.tiles.filter(t=>t.owner===player).reduce((n,t)=>n+territoryValue(t,config),0);
    const income=state.castleIncome[player-1];
    return {words,territory,income,total:words+territory+income};
  });
}
const scores=(state,config)=>scoreBreakdown(state,config).map(s=>s.total);
function scoreMove(state,ids,config){
  const word=Legacy.scoreMove(state,ids,config),captured=Legacy.capturedTiles(state,ids);
  const territoryGain=captured.reduce((n,t)=>n+territoryValue(t,config),0);
  const enemyLoss=captured.filter(t=>t.owner).reduce((n,t)=>n+territoryValue(t,config),0);
  const incomeAwarded=closesRound(state)?castleIncomePerRound({tiles:state.tiles.map(t=>ids.includes(t.id)?{...t,owner:state.player}:t)},config):[0,0];
  const castleIncome=incomeAwarded[state.player-1];
  return {...word,territoryGain,enemyLoss,castleIncome,incomeAwarded,totalGain:word.wordPoints+territoryGain+castleIncome};
}
function finish(state,result,config,scoring=null){
  if(result.error)return result;
  const next=result.state,roundComplete=closesRound(state),earned=roundComplete?castleIncomePerRound(next,config):[0,0];
  next.castleIncome=state.castleIncome.map((points,i)=>points+earned[i]);
  next.log=[{...next.log[0],...(scoring?{scoring}:{}),income:earned,roundComplete,
    ...(roundComplete?{round:next.turns[0]}:{})},...next.log.slice(1)];
  return result;
}
function submit(state,ids,config,dictionary=null,jokerLetters={},random=Math.random){
  const result=Legacy.submit(state,ids,config,dictionary,jokerLetters,random);
  return finish(state,result,config,result.error?null:scoreMove(state,ids,config));
}
const refreshTurn=(state,config,random=Math.random)=>finish(state,Legacy.refreshTurn(state,config,random),config);
export default {...Legacy,newGame,territoryValue,castleIncomePerRound,scoreMove,scoreBreakdown,scores,submit,refreshTurn};
