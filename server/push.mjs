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
        notification:{title:'Word Conquest',body:event.kind==='game complete'?'Your game has finished.':event.kind.startsWith('invitation')?'Your game invitation has an update.':'Your game has an update. It may be your turn.'},
        data:{gameId:event.game_id,eventId:String(event.notification_id)},
        android:{priority:'high',ttl:'86400s',collapse_key:event.game_id,
          notification:{channel_id:'game_updates',tag:`game-${event.game_id}`,icon:'ic_stat_word_conquest',color:'#75866B',visibility:'PRIVATE'}}}})});
    const data=await response.json().catch(()=>({}));
    if(response.ok)return 'sent';
    if(response.status===401)cached=null;
    const code=data.error?.details?.find(d=>d['@type']?.endsWith('FcmError'))?.errorCode;
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
        // Check again after claim, in case the device signed out or switched accounts.
        const {data:device,error}=await db.from('push_devices').select('enabled,user_id,token').eq('id',event.device_id).maybeSingle();
        if(error)throw Error('Device lookup failed');
        outcome=!device?.enabled || device.user_id!==event.recipient || device.token!==event.token?'skipped':await send(event);
      }catch{/* Generic counters only; never log registration tokens or provider credentials. */}
      const {error:finishError}=await db.rpc('wc_push_finish',{p_id:event.delivery_id,p_lease:event.lease_id,p_outcome:outcome,p_token:event.token});
      if(outcome==='sent' && !finishError)sent++;else if(outcome==='retry'||finishError)retried++;
    }));
    return Response.json({processed:events.length,sent,retried});
  };
}
