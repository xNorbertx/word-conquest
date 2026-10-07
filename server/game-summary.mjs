import {Engine,configFor} from './domain.mjs';
// Only list-screen data crosses the wire; opening a game still loads its saved board.
export function gameSummary(g){
 const rules=configFor(g.rules_version);
 return {id:g.id,players:g.players,names:g.names,status:g.status,revision:g.revision,
  rules_version:g.rules_version,dictionary_version:g.dictionary_version,
  result:g.result,updated_at:g.updated_at,state:{player:g.state.player},
  scores:g.state.tiles?(rules?Engine.scores(g.state,rules):null):g.scores??null};
}
