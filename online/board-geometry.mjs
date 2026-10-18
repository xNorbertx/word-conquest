// Castle silhouettes share ordinary tiles' footprint and interaction targets.
export function tilePoints(tile){
  const x=tile.q*64,y=tile.r*64;
  if(!tile.castle)return Array.from({length:8},(_,i)=>{const a=(45*i+22.5)*Math.PI/180;return `${x+32*Math.cos(a)},${y+32*Math.sin(a)}`;}).join(' ');
  const crown=tile.q===0&&tile.r===0?0:9;
  return [[0,0],[23,0],[23,16],[38,16],[38,crown],[62,crown],[62,16],[77,16],[77,0],[100,0],[100,76],[76,100],[24,100],[0,76]]
    .map(([u,v])=>`${x+(u-50)*.58},${y+(v-50)*.58}`).join(' ');
}

export function castleLabel(tile,config){
  const centre=tile.q===0&&tile.r===0,name=centre?'Centre castle':'Side castle';
  if(config.scoringMode==='defended-final')return `${name}: +${centre?config.castleIncome.center:config.castleIncome.side} after surviving an opponent’s turn; 1 point at the finish`;
  const value=centre?(config.centerCastlePoints??config.castlePoints):config.castlePoints;
  return `${name}: ${config.castleIncome?`+${centre?config.castleIncome.center:config.castleIncome.side} each round, `:''}${value} territory points`;
}
