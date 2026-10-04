import {Capacitor,registerPlugin} from '@capacitor/core';
import {PushNotifications} from '@capacitor/push-notifications';
import {pushController} from './push-controller.mjs';
const NotificationSettings=registerPlugin('NotificationSettings');
export function createPushControls(options){
  return pushController({...options,available:Capacitor.getPlatform()==='android',plugin:PushNotifications,settings:NotificationSettings,storage:localStorage});
}
