import {Capacitor} from '@capacitor/core';
import {PushNotifications} from '@capacitor/push-notifications';

export function createPushControls({api,getUser,onOpen,onUpdate,onStatus}){
  const available=Capacitor.getPlatform()==='android';
  let initialized=null,registration=null,deviceId=null,chain=Promise.resolve();
  const key=id=>`wc-push-enabled:${id}`;
  const preferred=()=>!!getUser() && localStorage.getItem(key(getUser().id))==='true';
  const serial=fn=>{const job=chain.then(fn);chain=job.catch(()=>{});return job;};
  function device(){
    if(!deviceId){deviceId=localStorage.getItem('wc-push-device') || crypto.randomUUID();localStorage.setItem('wc-push-device',deviceId);}
    return deviceId;
  }
  async function initialize(){
    if(!available)return;
    if(!initialized)initialized=(async()=>{
      await PushNotifications.createChannel({id:'game_updates',name:'Game updates',description:'Turns, invitation responses and completed games',importance:4,visibility:0});
      await PushNotifications.addListener('registration',({value})=>{
        if(registration){const r=registration;registration=null;r.resolve(value);}
      });
      await PushNotifications.addListener('registrationError',()=>{
        if(registration){const r=registration;registration=null;r.reject(Error('Notifications could not connect. Please try again.'));}
      });
      await PushNotifications.addListener('pushNotificationReceived',()=>onUpdate());
      await PushNotifications.addListener('pushNotificationActionPerformed',({notification})=>{
        const id=notification.data?.gameId;
        if(typeof id==='string' && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id))onOpen(id);
      });
    })();
    return initialized;
  }
  async function token(){
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{registration=null;reject(Error('Notification setup timed out. Please retry.'));},15000);
      registration={resolve:t=>{clearTimeout(timer);resolve(t);},reject:e=>{clearTimeout(timer);reject(e);}};
      PushNotifications.register().catch(e=>{registration?.reject(e);registration=null;});
    });
  }
  const enable=()=>serial(async()=>{
    if(!available || !getUser())return;
    const actor=getUser().id;await initialize();
    let permission=await PushNotifications.checkPermissions();
    if(permission.receive==='prompt' || permission.receive==='prompt-with-rationale')permission=await PushNotifications.requestPermissions();
    if(permission.receive!=='granted')throw Error('Allow notifications for Word Conquest in Android Settings to enable game alerts.');
    const value=await token();if(getUser()?.id!==actor)return;
    await api({action:'push_device',deviceId:device(),token:value,enabled:true});
    localStorage.setItem(key(actor),'true');onStatus('Game notifications are enabled on this phone.');
  });
  const disable=(forget=true)=>serial(async()=>{
    if(!available)return;
    const actor=getUser()?.id;
    if(actor && localStorage.getItem('wc-push-device'))await api({action:'push_device',deviceId:device(),enabled:false});
    if(actor && forget)localStorage.removeItem(key(actor));
    await PushNotifications.unregister();await PushNotifications.removeAllDeliveredNotifications();
  });
  async function restore(){
    if(!available || !getUser())return;await initialize();
    if(!preferred())return;
    if((await PushNotifications.checkPermissions()).receive!=='granted'){await disable();return;}
    await enable();
  }
  return {available,preferred,initialize,enable,disable,restore};
}
