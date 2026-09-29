-- All game mutations are service-only. Browser clients cannot write game state.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Player' check (char_length(display_name) between 1 and 40),
  email_notifications boolean not null default false,
  deleting boolean not null default false
);
create table public.games (
  id uuid primary key,
  players uuid[] not null,
  state jsonb not null,
  revision integer not null default 0 check (revision >= 0),
  rules_version text not null,
  dictionary_version text not null,
  status text not null default 'invited' check (status in ('invited','active','completed','abandoned','cancelled','declined','expired')),
  result text check (result in ('1','2','draw')),
  draw_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_play_at timestamptz not null default now(),
  check (cardinality(players) between 1 and 2)
);
create index games_players on public.games using gin(players);
create table public.invitations (
  game_id uuid primary key references public.games(id),
  token uuid unique not null,
  expires_at timestamptz not null default now() + interval '7 days'
);
create table public.operations (
  game_id uuid not null references public.games(id),
  operation_id uuid not null,
  actor uuid not null,
  fingerprint text not null,
  revision integer not null,
  recap jsonb not null,
  primary key(game_id,operation_id),
  unique(game_id,revision)
);
create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.games(id),
  revision integer not null,
  kind text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  emailed_at timestamptz,
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  unique(user_id,game_id,revision)
);
create table public.request_limits (
  actor uuid primary key references auth.users(id) on delete cascade,
  window_at timestamptz not null default now(),
  requests integer not null default 0
);
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.invitations enable row level security;
alter table public.operations enable row level security;
alter table public.notifications enable row level security;
alter table public.request_limits enable row level security;
create policy own_profile on public.profiles for select to authenticated using (id = auth.uid());
create policy participant_games on public.games for select to authenticated using (auth.uid() = any(players));
create policy participant_history on public.operations for select to authenticated using (
  exists(select 1 from public.games g where g.id=game_id and auth.uid()=any(g.players))
);
create policy own_inbox on public.notifications for select to authenticated using (user_id=auth.uid());
grant select on public.profiles,public.games,public.operations,public.notifications to authenticated;
revoke all on public.invitations,public.request_limits from anon,authenticated;
revoke insert,update,delete on public.profiles,public.games,public.operations,public.notifications from anon,authenticated;
grant all on public.profiles,public.games,public.invitations,public.operations,public.notifications,public.request_limits to service_role;
grant usage,select on sequence public.notifications_id_seq to service_role;

create function public.wc_rate_limit(p_actor uuid) returns boolean
language plpgsql security definer set search_path=public as $$
declare n integer;
begin
  insert into request_limits(actor,requests) values(p_actor,1)
  on conflict(actor) do update set
    requests=case when request_limits.window_at < now()-interval '1 minute' then 1 else request_limits.requests+1 end,
    window_at=case when request_limits.window_at < now()-interval '1 minute' then now() else request_limits.window_at end
  returning requests into n;
  return n <= 120;
end $$;

create function public.wc_create(p_actor uuid,p_id uuid,p_token uuid,p_state jsonb,p_rules text,p_dictionary text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare g games; n integer;
begin
  perform pg_advisory_xact_lock(hashtext(p_actor::text));
  if exists(select 1 from profiles where id=p_actor and deleting) then raise exception 'account_deleting'; end if;
  select * into g from games where id=p_id;
  if found then
    if g.players[1]<>p_actor then raise exception 'forbidden'; end if;
    return to_jsonb(g);
  end if;
  select count(*) into n from games where p_actor=any(players) and status in ('invited','active');
  if n>=30 then raise exception 'game_limit'; end if;
  insert into games(id,players,state,rules_version,dictionary_version)
    values(p_id,array[p_actor],p_state,p_rules,p_dictionary) returning * into g;
  insert into invitations(game_id,token) values(p_id,p_token);
  return to_jsonb(g);
end $$;

create function public.wc_invitation(p_actor uuid,p_token uuid,p_action text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare g games; i invitations;
begin
  -- Same lock order as account deletion: actor, then games ordered by ID.
  perform pg_advisory_xact_lock(hashtext(p_actor::text));
  if exists(select 1 from profiles where id=p_actor and deleting) then raise exception 'account_deleting'; end if;
  select * into i from invitations where token=p_token;
  if not found then raise exception 'invitation_unavailable'; end if;
  select * into g from games where id=i.game_id for update;
  if p_action='preview' then
    return jsonb_build_object('id',g.id,'status',g.status,'expires_at',i.expires_at,
      'host',coalesce((select display_name from profiles where id=g.players[1]),'Player'));
  end if;
  if g.status='active' and p_action='accept' and p_actor=any(g.players) then return to_jsonb(g); end if;
  if g.status<>'invited' then raise exception 'invitation_unavailable'; end if;
  if i.expires_at < now() then
    update games set status='expired',revision=revision+1,updated_at=now() where id=g.id returning * into g;
    return to_jsonb(g);
  end if;
  if p_action='cancel' then
    if p_actor<>g.players[1] then raise exception 'forbidden'; end if;
    update games set status='cancelled',revision=revision+1,updated_at=now() where id=g.id returning * into g;
  elsif p_action in ('accept','decline') then
    if p_actor=g.players[1] then raise exception 'cannot_accept_own_invitation'; end if;
    if p_action='accept' then
      if (select count(*) from games where p_actor=any(players) and status in ('invited','active'))>=30 then raise exception 'game_limit'; end if;
      update games set players=array[g.players[1],p_actor],status='active',revision=revision+1,last_play_at=now(),updated_at=now()
      where id=g.id returning * into g;
      insert into notifications(user_id,game_id,revision,kind) values(p_actor,g.id,g.revision,'invitation accepted');
    else
      update games set status='declined',revision=revision+1,updated_at=now() where id=g.id returning * into g;
    end if;
    insert into notifications(user_id,game_id,revision,kind) values(g.players[1],g.id,g.revision,'invitation '||p_action);
  else raise exception 'invalid_action'; end if;
  return to_jsonb(g);
end $$;

create function public.wc_commit(p_actor uuid,p_game uuid,p_operation uuid,p_fingerprint text,p_expected integer,p_next jsonb,p_recap jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare g games; receipt operations; recipient uuid;
begin
  select * into g from games where id=p_game for update;
  if not found or not coalesce(p_actor=any(g.players),false) then raise exception 'forbidden'; end if;
  if exists(select 1 from profiles where id=p_actor and deleting) then raise exception 'account_deleting'; end if;
  select * into receipt from operations where game_id=p_game and operation_id=p_operation;
  if found then
    if receipt.actor<>p_actor or receipt.fingerprint<>p_fingerprint then raise exception 'idempotency_conflict'; end if;
    return jsonb_build_object('game',to_jsonb(g),'acceptedRevision',receipt.revision,'replayed',true,'recap',receipt.recap);
  end if;
  if g.revision<>p_expected then raise exception 'stale'; end if;
  if g.status<>'active' then raise exception 'ended'; end if;
  update games set state=p_next->'state',revision=g.revision+1,
    status=p_next->>'status',result=p_next->>'result',draw_by=(p_next->>'draw_by')::uuid,
    last_play_at=coalesce((p_next->>'last_play_at')::timestamptz,g.last_play_at),updated_at=now()
    where id=p_game returning * into g;
  insert into operations values(p_game,p_operation,p_actor,p_fingerprint,g.revision,p_recap);
  foreach recipient in array g.players loop
    if recipient is not null and recipient<>p_actor then
      insert into notifications(user_id,game_id,revision,kind)
        values(recipient,g.id,g.revision,case when g.status='active' then p_recap->>'action' else 'game complete' end);
    end if;
  end loop;
  return jsonb_build_object('game',to_jsonb(g),'acceptedRevision',g.revision,'replayed',false,'recap',p_recap);
end $$;

-- First hide/revoke all app data, then the function caller deletes the Auth identity.
-- Retrying after an Auth outage is safe; deleting=true blocks every mutation meanwhile.
create function public.wc_delete_account(p_actor uuid) returns void
language plpgsql security definer set search_path=public as $$
declare g games;
begin
  perform pg_advisory_xact_lock(hashtext(p_actor::text));
  insert into profiles(id,deleting) values(p_actor,true) on conflict(id) do update set deleting=true,display_name='Deleted player',email_notifications=false;
  for g in select * from games where p_actor=any(players) order by id for update loop
    update games set players=array_replace(players,p_actor,null::uuid),
      status=case when status in ('active','invited') then 'abandoned' else status end,
      state=case when status in ('active','invited') then jsonb_set(state,'{over}','true') else state end,
      draw_by=case when draw_by=p_actor then null else draw_by end,
      revision=revision+1,updated_at=now() where id=g.id;
    delete from invitations where game_id=g.id;
  end loop;
  delete from notifications where user_id=p_actor;
  -- UUIDs in receipts are internal; replace the departing actor without changing replay history.
  update operations set actor='00000000-0000-4000-8000-000000000000' where actor=p_actor;
end $$;

-- Default PUBLIC execute would allow callers to bypass the authoritative function.
revoke all on function public.wc_rate_limit(uuid) from public,anon,authenticated;
revoke all on function public.wc_create(uuid,uuid,uuid,jsonb,text,text) from public,anon,authenticated;
revoke all on function public.wc_invitation(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.wc_commit(uuid,uuid,uuid,text,integer,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.wc_delete_account(uuid) from public,anon,authenticated;
grant execute on function public.wc_rate_limit(uuid),public.wc_create(uuid,uuid,uuid,jsonb,text,text),
  public.wc_invitation(uuid,uuid,text),public.wc_commit(uuid,uuid,uuid,text,integer,jsonb,jsonb),public.wc_delete_account(uuid) to service_role;
