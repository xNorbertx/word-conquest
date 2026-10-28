// Immutable edge placement; the defended-castle engine still owns legality/scoring.
import defended from './engine-v3.mjs';
import {improveReplacements} from './letter-placement-v1.mjs';
const finish=(before,result,config)=>result.error||!result.refreshed.length?result:{...result,
  state:{...result.state,tiles:improveReplacements(result.state.tiles,result.refreshed,config,before.tiles)}};
export default {...defended,
  submit:(state,ids,config,...args)=>finish(state,defended.submit(state,ids,config,...args),config),
  refreshTurn:(state,config,...args)=>finish(state,defended.refreshTurn(state,config,...args),config),
  refreshLetters:(tiles,ids,config,...args)=>{
    const result=defended.refreshLetters(tiles,ids,config,...args);
    return {...result,tiles:improveReplacements(result.tiles,result.refreshed,config,tiles)};
  }
};
