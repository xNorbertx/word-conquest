import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { createHandler } from '../_shared/api.mjs';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const origins=(Deno.env.get('APP_ORIGIN') || '').split(',').map(x=>x.trim()).filter(Boolean);
Deno.serve(createHandler(db,{origins}));
