import legacy from './versions/engine-v1.mjs';
import defended from './versions/engine-v3.mjs';
import castles from './versions/engine-v2.mjs';
import swedish from './versions/engine-sv-v2.mjs';
import {newGame,generateBoard} from './versions/opening-v4.mjs';
import edge from './versions/engine-v4.mjs';
import * as edgeOpening from './versions/opening-v5.mjs';
const engine=config=>config.edgePlacement?edge:config.scoringMode==='defended-final'?defended:config.language==='sv'?swedish:config.castleIncome?castles:legacy;
export default {...legacy,
  newGame:(config,random)=>{const state=(config.edgePlacement?edgeOpening.newGame:config.jokerPlacement?newGame:engine(config).newGame)(config,random);return config.scoringMode==='defended-final'?{...state,finalTerritory:null}:state;},
  settleFinalTerritory:(state,config)=>config.scoringMode==='defended-final'?defended.settleFinalTerritory(state,config):state,
  generateBoard:(config,random)=>(config.edgePlacement?edgeOpening.generateBoard:config.jokerPlacement?generateBoard:engine(config).generateBoard)(config,random),
  refreshLetters:(tiles,ids,config,...args)=>engine(config).refreshLetters(tiles,ids,config,...args),
  validatePath:(state,ids,config,...args)=>engine(config).validatePath(state,ids,config,...args),
  scoreMove:(state,ids,config)=>engine(config).scoreMove(state,ids,config),
  scoreBreakdown:(state,config)=>engine(config).scoreBreakdown(state,config),
  scores:(state,config)=>engine(config).scores(state,config),
  submit:(state,ids,config,...args)=>engine(config).submit(state,ids,config,...args),
  refreshTurn:(state,config,random)=>engine(config).refreshTurn(state,config,random),
  castleIncomePerRound:(state,config)=>config.castleIncome?castles.castleIncomePerRound(state,config):[0,0]
};
