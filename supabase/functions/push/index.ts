import {createClient} from 'npm:@supabase/supabase-js@2.57.4';
import {pushHandler} from '../_shared/push.mjs';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
let credentials=null;
try{credentials=JSON.parse(Deno.env.get('FCM_SERVICE_ACCOUNT_JSON') || 'null');}catch{}
Deno.serve(pushHandler(db,{secret:Deno.env.get('PUSH_SECRET'),credentials}));
