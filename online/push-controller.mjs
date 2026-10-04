// Platform-independent notification lifecycle; the native adapter is in push.js.
export function pushController({available,plugin,settings,storage,api,getUser,onOpen,onUpdate,onStatus=()=>{},onChange=()=>{},now=Date.now,timeoutMs=15000}){
  let initialized=null,registration=null,chain=Promise.resolve(),owner=null,state='off',problem='';
  const key=id=>'wc-push-enabled:'+id;
  const preferred=()=>!!getUser()&&storage.getItem(key(getUser().id))==='true';
  const snapshot=()=>({state:owner===getUser()?.id?state:'off',problem:owner===getUser()?.id?problem:'',preferred:preferred()});
  const change=(next,message='',actor=getUser()?.id)=>{if(actor!==getUser()?.id)return;owner=actor;state=next;problem=message;onChange(snapshot());};
  const serial=fn=>{const job=chain.then(fn);chain=job.catch(()=>{});return job;};
  function device(){let id=storage.getItem('wc-push-device');if(!id){id=crypto.randomUUID();storage.setItem('wc-push-device',id);}return id;}
  async function initialize(){
    if(!available)return;
    if(!initialized)initialized=(async()=>{
      const handles=[];
      try{
        await plugin.createChannel({id:'game_updates',name:'Game updates',description:'Turns, invitation responses and completed games',importance:4,visibility:0});
        handles.push(await plugin.addListener('registration',({value})=>{
          if(registration){const pending=registration;registration=null;pending.resolve(value);}
          else if(preferred()&&snapshot().state==='ready'){const actor=getUser().id;void serial(async()=>{if(actor!==getUser()?.id||!preferred())return;await api({action:'push_device',deviceId:device(),token:value,enabled:true});change('ready','',actor);}).catch(()=>change('error','Could not reconnect notifications. Try again.',actor));}
        }));
        handles.push(await plugin.addListener('registrationError',()=>{
          const pending=registration;registration=null;pending?.reject(Error('Notifications could not connect to Google. Check your connection and try again.'));
        }));
        handles.push(await plugin.addListener('pushNotificationReceived',notification=>{
          if(!getUser()||!preferred())return;
          if(notification.data?.test==='true')onStatus('Test notification received on this phone.');
          else {onUpdate();onStatus('A game has an update. Check Activity or your games.');}
        }));
        handles.push(await plugin.addListener('pushNotificationActionPerformed',({notification})=>{
          if(notification.data?.test==='true'){onStatus('Test notification received on this phone.');return;}
          const id=notification.data?.gameId;if(typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id))onOpen(id);
        }));
      }catch(e){await Promise.all(handles.map(h=>h?.remove()));initialized=null;throw e;}
    })();
    return initialized;
  }
  function token(){
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{registration=null;reject(Error('Notification setup timed out. Check your connection and retry.'));},timeoutMs);
      const pending={resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}};
      registration=pending;
      plugin.register().catch(e=>{if(registration===pending){registration=null;pending.reject(e);}});
    });
  }
  async function connect(requestPermission=false){
    if(!available||!getUser())return;
    const actor=getUser().id;change('connecting','',actor);
    try{
      await initialize();
      let permission=await plugin.checkPermissions();
      if(requestPermission&&['prompt','prompt-with-rationale'].includes(permission.receive))permission=await plugin.requestPermissions();
      if(actor!==getUser()?.id)return;
      const system=await settings.status();
      if(permission.receive!=='granted'||!system.enabled||system.channelBlocked){
        if(storage.getItem('wc-push-device'))await api({action:'push_device',deviceId:device(),enabled:false});
        change('blocked','Allow Word Conquest and Game updates in Android notification settings.',actor);return;
      }
      const value=await token();if(actor!==getUser()?.id||!preferred())return;
      await api({action:'push_device',deviceId:device(),token:value,enabled:true});
      if(actor!==getUser()?.id)return;
      storage.removeItem('wc-push-snooze:'+actor);change('ready','',actor);
      if(requestPermission)onStatus('Game notifications are connected on this phone.');
    }catch(e){change('error',e.message||'Notifications could not connect. Please retry.',actor);throw e;}
  }
  const enable=()=>serial(async()=>{if(!available||!getUser())return;storage.setItem(key(getUser().id),'true');await connect(true);});
  const restore=()=>serial(async()=>{if(!available||!getUser())return;if(!preferred()){change('off');return;}await connect(false);});
  const disable=(forget=true)=>serial(async()=>{
    if(!available)return;const actor=getUser()?.id;
    if(actor&&storage.getItem('wc-push-device'))await api({action:'push_device',deviceId:device(),enabled:false});
    if(actor&&forget){storage.setItem(key(actor),'false');storage.setItem('wc-push-snooze:'+actor,String(now()+7*86400000));}
    await plugin.unregister();await plugin.removeAllDeliveredNotifications();change('off','',actor);
  });
  function shouldPrompt(){return available&&!!getUser()&&snapshot().state!=='ready'&&snapshot().state!=='connecting'&&Number(storage.getItem('wc-push-snooze:'+getUser().id)||0)<=now();}
  function snooze(){if(getUser())storage.setItem('wc-push-snooze:'+getUser().id,String(now()+7*86400000));onChange(snapshot());}
  const openSettings=()=>settings.open();
  const test=()=>serial(async()=>{if(snapshot().state!=='ready')throw Error('Connect notifications before sending a test.');await api({action:'push_test',deviceId:device()});return true;});
  return {available,preferred,snapshot,initialize,enable,disable,restore,shouldPrompt,snooze,openSettings,test};
}
