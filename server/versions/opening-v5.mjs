import {generateBoard as previous,newGame as previousGame} from './opening-v4.mjs';
import {improveOpening} from './letter-placement-v1.mjs';
export const generateBoard=(config,random)=>improveOpening(previous(config,random),config);
export function newGame(config,random){
  const state=previousGame(config,random);
  return {...state,tiles:improveOpening(state.tiles,config)};
}
