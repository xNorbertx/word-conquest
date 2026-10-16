import legacy from './versions/engine-v1.mjs';
import castles from './versions/engine-v2.mjs';
import swedish from './versions/engine-sv-v2.mjs';
import {newGame,generateBoard} from './versions/opening-v4.mjs';
const engine=config=>config.language==='sv'?swedish:config.castleIncome?castles:legacy;
export default {...legacy,
  newGame:(config,random)=>(config.jokerPlacement?newGame:engine(config).newGame)(config,random),
  generateBoard:(config,random)=>(config.jokerPlacement?generateBoard:engine(config).generateBoard)(config,random),
  validatePath:(state,ids,config,...args)=>engine(config).validatePath(state,ids,config,...args),
  scoreMove:(state,ids,config)=>engine(config).scoreMove(state,ids,config),
  scoreBreakdown:(state,config)=>engine(config).scoreBreakdown(state,config),
  scores:(state,config)=>engine(config).scores(state,config),
  submit:(state,ids,config,...args)=>engine(config).submit(state,ids,config,...args),
  refreshTurn:(state,config,random)=>engine(config).refreshTurn(state,config,random),
  castleIncomePerRound:(state,config)=>config.castleIncome?castles.castleIncomePerRound(state,config):[0,0]
};
