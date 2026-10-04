import {pushController} from '../../online/push-controller.mjs';
const scenario=new URLSearchParams(location.search).get('fixture')||'home';
export function createPushControls(options){
  const events={};let blocked=scenario==='push_blocked',fail=scenario==='push_error';
  const controller=pushController({...options,available:scenario.startsWith('push_'),storage:localStorage,
    plugin:{createChannel:async()=>{},addListener:async(name,fn)=>{events[name]=fn;return {remove:async()=>{}};},checkPermissions:async()=>({receive:'granted'}),requestPermissions:async()=>({receive:'granted'}),register:async()=>queueMicrotask(()=>events.registration({value:'fixture-token-123456789012345'})),unregister:async()=>{},removeAllDeliveredNotifications:async()=>{}},
    settings:{status:async()=>({enabled:!blocked,channelBlocked:blocked}),open:async()=>{blocked=false;await controller.restore();}},
    api:async body=>{
      if(body.action==='push_device'){if(fail&&body.enabled){fail=false;throw Error('Could not connect. Please retry.');}return {ok:true};}
      if(body.action==='push_test'){queueMicrotask(()=>events.pushNotificationReceived({data:{test:'true'}}));return {accepted:true};}
      return options.api(body);
    }
  });
  return controller;
}
