// Resolve the immutable receipt for this event, never the game's latest move.
export async function turnDetails(db,event){
  if(!['word','refresh','game complete'].includes(event.kind))return null;
  const read=async query=>{const {data,error}=await query;if(error)throw Error('Turn notification lookup failed');return data;};
  const notification=await read(db.from('notifications').select('revision').eq('id',event.notification_id).eq('game_id',event.game_id).eq('user_id',event.recipient).maybeSingle());
  if(!notification)return null;
  const operation=await read(db.from('operations').select('actor,recap').eq('game_id',event.game_id).eq('revision',notification.revision).maybeSingle());
  const recap=operation?.recap;
  if(!operation || operation.actor===event.recipient || !['word','refresh'].includes(recap?.action) || (event.kind!=='game complete' && recap.action!==event.kind))return null;
  const profile=await read(db.from('profiles').select('display_name,deleting').eq('id',operation.actor).maybeSingle());
  const name=!profile||profile.deleting?'Your opponent':profile.display_name.replace(/[\p{C}\s]+/gu,' ').trim().slice(0,40)||'Your opponent';
  return {name,action:recap.action,points:recap.score?.totalGain};
}

export function notificationBody(event){
  if(event.kind==='test')return 'Notifications are working on this phone.';
  const turn=event.turn,ending=event.kind==='game complete'?'Game finished.':'Your turn.';
  if(turn?.action==='word'){
    const points=Number.isSafeInteger(turn.points)&&turn.points>=0?` for ${turn.points} ${turn.points===1?'point':'points'}`:'';
    return `${turn.name} played a turn${points}. ${ending}`;
  }
  if(turn?.action==='refresh')return `${turn.name} refreshed their letters. ${ending}`;
  if(event.kind==='game complete')return 'Your game has finished.';
  if(event.kind.startsWith('invitation'))return 'Your game invitation has an update.';
  return 'Your game has an update. It may be your turn.';
}

const encode=value=>btoa(typeof value==='string'?value:String.fromCharCode(...new Uint8Array(value))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
export function firebaseSender(credentials, fetcher=fetch) {
  let cached=null;
  async function accessToken(){
    if(cached && cached.until>Date.now()+60000)return cached.token;
    if(credentials?.type!=='service_account' || !/^[a-z0-9-]+$/.test(credentials.project_id))throw Error('Invalid Firebase configuration');
    const now=Math.floor(Date.now()/1000);
    const unsigned=encode(JSON.stringify({alg:'RS256',typ:'JWT'}))+'.'+encode(JSON.stringify({
      iss:credentials.client_email,scope:'https://www.googleapis.com/auth/firebase.messaging',
      aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
    const pem=credentials.private_key.replace(/-----[^-]+-----|\s/g,'');
    const key=await crypto.subtle.importKey('pkcs8',Uint8Array.from(atob(pem),c=>c.charCodeAt(0)),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
    const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(unsigned));
    const response=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',signal:AbortSignal.timeout(10000),
      body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:unsigned+'.'+encode(signature)})});
    const data=await response.json();
    if(!response.ok || !data.access_token)throw Error('Firebase authorization failed');
    cached={token:data.access_token,until:Date.now()+Number(data.expires_in)*1000};return cached.token;
  }
  return async (event,{validateOnly=false}={})=>{
    const bearer=await accessToken();
    const response=await fetcher(`https://fcm.googleapis.com/v1/projects/${credentials.project_id}/messages:send`,{
      method:'POST',signal:AbortSignal.timeout(10000),headers:{Authorization:`Bearer ${bearer}`,'Content-Type':'application/json'},
      body:JSON.stringify({validate_only:validateOnly,message:{token:event.token,
        notification:{title:'Word Conquest',body:notificationBody(event)},
        data:event.kind==='test'?{test:'true'}:{gameId:event.game_id,eventId:String(event.notification_id)},
        android:{priority:'high',ttl:'86400s',collapse_key:event.kind==='test'?'notification-test':event.game_id,
          notification:{channel_id:'game_updates',tag:event.kind==='test'?'notification-test':`game-${event.game_id}`,icon:'ic_stat_word_conquest',color:'#75866B',visibility:'PRIVATE'}}}})});
    const data=await response.json().catch(()=>({}));
    if(response.ok)return 'sent';
    if(response.status===401)cached=null;
    const code=data.error?.details?.find(d=>d['@type']?.endsWith('FcmError'))?.errorCode;
    console.warn(JSON.stringify({pushProviderStatus:response.status,code:/^[A-Z_]{1,64}$/.test(code||data.error?.status||'')?(code||data.error.status):'unknown'}));
    // INVALID_ARGUMENT can also mean our payload/config is wrong: do not destroy tokens for that.
    return code==='UNREGISTERED'?'invalid_token':'retry';
  };
}

export function pushHandler(db,{secret,credentials},send=firebaseSender(credentials)){
  return async req=>{
    if(req.method!=='POST' || !secret || req.headers.get('Authorization')!==`Bearer ${secret}`)return new Response('Unauthorized',{status:401});
    if(!credentials?.private_key)return new Response('Push not configured',{status:503});
    const {data:events,error}=await db.rpc('wc_push_claim');
    if(error)return new Response('Queue unavailable',{status:503});
    let sent=0,retried=0;
    await Promise.all(events.map(async event=>{
      let outcome='retry';
      try{
        const turn=await turnDetails(db,event);
        // Check immediately before sending, in case the device signed out or switched accounts.
        const {data:device,error}=await db.from('push_devices').select('enabled,user_id,token').eq('id',event.device_id).maybeSingle();
        if(error)throw Error('Device lookup failed');
        outcome=!device?.enabled || device.user_id!==event.recipient || device.token!==event.token?'skipped':await send({...event,turn});
      }catch{/* Generic counters only; never log registration tokens or provider credentials. */}
      const {error:finishError}=await db.rpc('wc_push_finish',{p_id:event.delivery_id,p_lease:event.lease_id,p_outcome:outcome,p_token:event.token});
      if(outcome==='sent' && !finishError)sent++;else if(outcome==='retry'||finishError)retried++;
    }));
    return Response.json({processed:events.length,sent,retried});
  };
}
