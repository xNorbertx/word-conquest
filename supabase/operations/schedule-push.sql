-- Apply after the push migration and provisioning wc_push_secret in Supabase Vault.
-- Re-running updates the named job. No function invocation while the queue is idle.
select cron.schedule('wc-push-retry','* * * * *', $job$
  select net.http_post(
    url:='https://aumiyyjsdqdazzmdmprl.supabase.co/functions/v1/push',
    headers:=jsonb_build_object('Content-Type','application/json',
      'Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='wc_push_secret')),
    body:='{}'::jsonb,timeout_milliseconds:=15000
  ) where exists (
    select 1 from public.push_deliveries where done_at is null and next_attempt_at<=now()
  );
$job$);
