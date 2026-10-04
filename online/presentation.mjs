export const seatOf=(game,userId)=>game.players.indexOf(userId)+1;
export const isFinished=game=>!['active','invited'].includes(game.status);
export function opponentName(game,userId){const seat=seatOf(game,userId);return game.status==='invited'?'Waiting for a friend':['cancelled','declined'].includes(game.status)?'Invitation to a friend':game.names?.[seat===2?0:1]||'Your friend';}
export function gameStatus(game,userId){
  if(game.status==='active')return game.players[game.state.player-1]===userId?'Your turn':'Their turn';
  if(game.status==='invited')return 'Invitation sent';
  if(game.status==='completed')return game.result==='draw'?'A draw':Number(game.result)===seatOf(game,userId)?'You won':'They won';
  return game.status==='abandoned'?'Abandoned':game.status==='cancelled'?'Cancelled':game.status==='declined'?'Declined':game.status;
}
export function visibleGames(games,userId,filter='active'){
  return games.filter(g=>isFinished(g)===(filter==='finished')).sort((a,b)=>{
    const mine=g=>g.status==='active'&&g.players[g.state.player-1]===userId;
    return Number(mine(b))-Number(mine(a))||Date.parse(b.updated_at)-Date.parse(a.updated_at);
  });
}
export function timeAgo(value,now=Date.now()){
  const timestamp=Date.parse(value);if(!Number.isFinite(timestamp))return '';
  const minutes=Math.max(0,Math.floor((now-timestamp)/60000));
  if(minutes<1)return 'Just now';if(minutes<60)return `${minutes}m ago`;
  const hours=Math.floor(minutes/60);if(hours<24)return `${hours}h ago`;
  const days=Math.floor(hours/24);if(days===1)return 'Yesterday';if(days<7)return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined,{month:'short',day:'numeric'});
}
export function invitationToken(value){
  let token=value.trim();try{if(/^https?:/i.test(token))token=new URL(token).searchParams.get('invite')||'';}catch{return null;}
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)?token:null;
}
export function activityText(kind,name){
  if(kind==='invitation received')return `${name} invited you to play`;
  const labels={word:`${name} played a word`,refresh:`${name} refreshed their letters`,resign:`${name} left the game`,offer_draw:`${name} offered a draw`,accept_draw:'Your game ended in a draw',abandon:'Your game was abandoned','game complete':'Your game has finished','invitation accepted':`Your game with ${name} is ready`,'invitation accept':`Your game with ${name} is ready`,'invitation decline':'Your invitation was declined','invitation cancel':'Your invitation was cancelled','invitation declined':'Your invitation was declined','invitation cancelled':'Your invitation was cancelled'};
  return labels[kind]||'Your game has an update';
}
export function friendlyError(error){
  const social={friend_stale:'This friend request has changed. Refresh Friends and try again.',friend_unavailable:'This player is not available for a new invitation.',friend_cooldown:'Give them a little time. You can send another request tomorrow.',friend_limit:'Your friend request limit has been reached. Try again later.',invitation_pending:'An invitation is already waiting for this friend. Open it from Games.'};
  if(social[error.code])return social[error.code];
  const messages={client_update_required:'Update Word Conquest or open the latest web app to play this game.',stale:'A new turn came in. Your board has been updated.',not_your_turn:'It is your friend\'s turn.',invitation_unavailable:'This invitation is no longer available.',cannot_accept_own_invitation:'This is your invitation. Share it with a friend.',rate_limit:'A little too quick. Try again in a moment.',unauthorized:'Please sign in again to continue.',not_found:'This game is no longer available.',dictionary_unavailable:'Word checking is unavailable. Your turn has not been used.',version_unavailable:'This game needs an update. Please contact your inviter.',ended:'This game has already ended.'};
  if(messages[error.code])return messages[error.code];
  if(['TimeoutError','AbortError','TypeError'].includes(error.name))return 'Could not connect. Please try again.';
  return error.message||'Something went wrong. Please try again.';
}
