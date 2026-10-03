-- Tokens are service-only; clients register through the authenticated game API.
create table public.push_devices (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique check(length(token) between 20 and 4096),
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
create table public.push_deliveries (
  id bigint generated always as identity primary key,
  notification_id bigint not null references public.notifications(id) on delete cascade,
  device_id uuid not null references public.push_devices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  lease uuid,
  done_at timestamptz,
  outcome text,
  unique(notification_id,device_id)
);
create index push_due on public.push_deliveries(next_attempt_at) where done_at is null;
alter table public.push_devices enable row level security;
alter table public.push_deliveries enable row level security;
revoke all on public.push_devices, public.push_deliveries from anon, authenticated;
grant all on public.push_devices, public.push_deliveries to service_role;
grant usage,select on sequence public.push_deliveries_id_seq to service_role;

create function public.wc_push_register(p_actor uuid,p_device uuid,p_token text,p_enabled boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
  perform pg_advisory_xact_lock(hashtext(p_actor::text));
  if exists(select 1 from profiles where id=p_actor and deleting) then raise exception 'account_deleting'; end if;
  if not p_enabled then
    update push_devices set enabled=false,updated_at=now() where id=p_device and user_id=p_actor;
    return;
  end if;
  if length(p_token) not between 20 and 4096 then raise exception 'invalid_token'; end if;
  if (select count(*) from push_devices where user_id=p_actor and id<>p_device)>=10 then raise exception 'device_limit'; end if;
  -- Token rotation/account switching cannot leave a token attached to two accounts.
  delete from push_devices where token=p_token and id<>p_device;
  insert into push_devices(id,user_id,token) values(p_device,p_actor,p_token)
  on conflict(id) do update set user_id=p_actor,token=p_token,enabled=true,updated_at=now();
end $$;

create function public.wc_push_enqueue() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  insert into push_deliveries(notification_id,device_id,user_id)
    select new.id,id,new.user_id from push_devices where user_id=new.user_id and enabled;
  return new;
end $$;
create trigger enqueue_android_push after insert on public.notifications
for each row execute function public.wc_push_enqueue();

create function public.wc_push_claim() returns table(
  delivery_id bigint, lease_id uuid, attempt integer, notification_id bigint,
  device_id uuid, recipient uuid, token text, game_id uuid, kind text
) language plpgsql security definer set search_path=public as $$
begin
  -- No backlog replay after opt-out, logout, account change, deletion or reading.
  update push_deliveries q set done_at=now(),outcome='skipped'
  where q.done_at is null and (q.attempts>=6 or not exists(
    select 1 from push_devices d join notifications n on n.id=q.notification_id
      join profiles p on p.id=q.user_id
    where d.id=q.device_id and d.user_id=q.user_id and d.enabled and not p.deleting
      and n.read_at is null and n.created_at>now()-interval '24 hours'));
  return query
  with due as (
    select q.id from push_deliveries q where q.done_at is null and q.next_attempt_at<=now()
    order by q.id for update skip locked limit 20
  ), claimed as (
    update push_deliveries q set attempts=q.attempts+1,lease=gen_random_uuid(),
      next_attempt_at=now()+interval '2 minutes'
    from due where q.id=due.id returning q.*
  )
  select q.id,q.lease,q.attempts,q.notification_id,q.device_id,q.user_id,d.token,n.game_id,n.kind
  from claimed q join push_devices d on d.id=q.device_id join notifications n on n.id=q.notification_id;
end $$;

create function public.wc_push_finish(p_id bigint,p_lease uuid,p_outcome text,p_token text)
returns void language plpgsql security definer set search_path=public as $$
declare q push_deliveries;
begin
  select * into q from push_deliveries where id=p_id and lease=p_lease for update;
  if not found or q.done_at is not null then return; end if;
  if p_outcome not in ('sent','invalid_token','retry','skipped') then raise exception 'invalid_outcome'; end if;
  update push_deliveries set done_at=case when p_outcome='retry' and attempts<6 then null else now() end,
    outcome=p_outcome, next_attempt_at=now()+make_interval(secs=>least(3600,30*power(2,attempts)::integer))
    where id=p_id;
  if p_outcome='invalid_token' then
    update push_devices set enabled=false where id=q.device_id and user_id=q.user_id and token=p_token;
  end if;
end $$;
revoke all on function public.wc_push_register(uuid,uuid,text,boolean),public.wc_push_enqueue(),public.wc_push_claim(),public.wc_push_finish(bigint,uuid,text,text) from public,anon,authenticated;
grant execute on function public.wc_push_register(uuid,uuid,text,boolean),public.wc_push_claim(),public.wc_push_finish(bigint,uuid,text,text) to service_role;
