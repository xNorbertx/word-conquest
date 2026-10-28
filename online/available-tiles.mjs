import Engine from '../server/engine.mjs';

// Geometry/ownership hints only: they make no promise about word validity.
export function availableTiles(state,path,config,enabled=true){
  if(!enabled||!state||state.over)return new Set();
  if(path.length&&Engine.validatePath(state,path,config,false))return new Set();
  const used=new Set(path);
  return new Set(state.tiles.filter(t=>!used.has(t.id)&&!Engine.validatePath(state,[...path,t.id],config,false)).map(t=>t.id));
}
