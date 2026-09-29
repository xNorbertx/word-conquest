export function notificationHandler(db, env) {
  return async req => {
    if(req.method!=='POST' || !env.secret || req.headers.get('Authorization')!==`Bearer ${env.secret}`)
      return new Response('Unauthorized',{status:401});
    if(!env.apiKey || !env.from || !env.appUrl) return new Response('Email not configured',{status:503});
    const {data:events,error}=await db.from('notifications').select('*').is('emailed_at',null)
      .lte('next_attempt_at',new Date().toISOString()).lt('attempts',6).order('id').limit(20);
    if(error)return new Response('Queue unavailable',{status:503});
    let sent=0,failed=0;
    for(const event of events) {
      const {data:profile,error:profileError}=await db.from('profiles').select('email_notifications,deleting').eq('id',event.user_id).maybeSingle();
      if(profileError){failed++;continue;}
      if(!profile?.email_notifications || profile.deleting) {
        await db.from('notifications').update({emailed_at:new Date().toISOString()}).eq('id',event.id);continue;
      }
      const {data,error:userError}=await db.auth.admin.getUserById(event.user_id);
      if(userError || !data.user?.email){failed++;continue;}
      // Provider idempotency is bounded to 24 hours; retries stop inside that window.
      if(Date.now()-Date.parse(event.created_at)>23*3600000) {
        await db.from('notifications').update({attempts:6}).eq('id',event.id);failed++;continue;
      }
      try {
        const response=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(10000),
          headers:{Authorization:`Bearer ${env.apiKey}`,'Content-Type':'application/json','Idempotency-Key':`wc-${env.namespace || new URL(env.appUrl).host}-${event.id}`},
          body:JSON.stringify({from:env.from,to:[data.user.email],subject:'Word Conquest · game update',
            text:`There is an update to your Word Conquest game.\n\n${env.appUrl}?game=${event.game_id}\n\nTurn off email reminders in Account settings.`})});
        if(!response.ok)throw new Error('delivery');
        const updated=await db.from('notifications').update({emailed_at:new Date().toISOString(),attempts:event.attempts+1}).eq('id',event.id);
        if(updated.error)throw new Error('receipt'); sent++;
      } catch {
        failed++;
        await db.from('notifications').update({attempts:event.attempts+1,next_attempt_at:new Date(Date.now()+Math.min(3600,60*2**event.attempts)*1000).toISOString()}).eq('id',event.id);
      }
    }
    console.log(JSON.stringify({notificationBatch:true,sent,failed}));
    return Response.json({sent,failed});
  };
}
