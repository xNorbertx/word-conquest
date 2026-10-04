import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { createHandler } from '../_shared/api.mjs';
import { firebaseSender } from '../_shared/push.mjs';
let credentials=null;
try{credentials=JSON.parse(Deno.env.get('FCM_SERVICE_ACCOUNT_JSON') || 'null');}catch{}
const sendTestPush=credentials?firebaseSender(credentials):undefined;
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const origins=(Deno.env.get('APP_ORIGIN') || '').split(',').map(x=>x.trim()).filter(Boolean);
const wakePush=()=>{
  const secret=Deno.env.get('PUSH_SECRET');if(!secret)return;
  EdgeRuntime.waitUntil(fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/push`,{
    method:'POST',signal:AbortSignal.timeout(15000),headers:{Authorization:`Bearer ${secret}`}
  }).then(r=>r.body?.cancel()).catch(()=>{}));
};
Deno.serve(createHandler(db,{origins,wakePush,sendTestPush}));
