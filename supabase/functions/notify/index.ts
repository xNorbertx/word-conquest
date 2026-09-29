import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { notificationHandler } from '../_shared/notify.mjs';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve(notificationHandler(db,{secret:Deno.env.get('NOTIFY_SECRET'),apiKey:Deno.env.get('RESEND_API_KEY'),from:Deno.env.get('MAIL_FROM'),appUrl:Deno.env.get('APP_URL'),namespace:new URL(Deno.env.get('SUPABASE_URL')!).hostname}));
