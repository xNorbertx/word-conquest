// Autumn v3: recurring castle income, differentiated final value, random starting player.
import base from './rules-v2.mjs';
export default Object.freeze({...base,centerCastlePoints:5,
  castleIncome:Object.freeze({side:2,center:4}),randomStartingPlayer:true});
