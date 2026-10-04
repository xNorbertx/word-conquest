// Autumn v2: unlimited opponent captures along a legal word path.
// All other rules remain the immutable v1 defaults.
import base from './rules-v1.mjs';
export default Object.freeze({...base,maxEnemyTilesPerWord:Infinity});
