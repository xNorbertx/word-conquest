import legacy from './versions/engine-v1.mjs';
import castles from './versions/engine-v2.mjs';
const engine=config=>config.castleIncome?castles:legacy;
export default {...legacy,
  newGame:(config,random)=>engine(config).newGame(config,random),
  scoreMove:(state,ids,config)=>engine(config).scoreMove(state,ids,config),
  scoreBreakdown:(state,config)=>engine(config).scoreBreakdown(state,config),
  scores:(state,config)=>engine(config).scores(state,config),
  submit:(state,ids,config,...args)=>engine(config).submit(state,ids,config,...args),
  refreshTurn:(state,config,random)=>engine(config).refreshTurn(state,config,random),
  castleIncomePerRound:(state,config)=>config.castleIncome?castles.castleIncomePerRound(state,config):[0,0]
};
