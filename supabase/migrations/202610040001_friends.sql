-- Signed-in players can find display names. Auth emails are never searched/exposed.
alter table public.profiles add column friend_code text not null default upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)) unique;
alter table public.invitations add column recipient uuid references public.profiles(id) on delete cascade;

create table public.friendships (
  low_id uuid not null references public.profiles(id) on delete cascade,
  high_id uuid not null references public.profiles(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  request_id uuid not null,
  status text not null check(status in ('pending','accepted','declined','removed')),
  updated_at timestamptz not null default now(),
  requested_at timestamptz not null default now(),
  primary key(low_id,high_id),
  check(low_id<high_id and requested_by in (low_id,high_id))
);
create table public.friend_blocks (
  actor uuid not null references public.profiles(id) on delete cascade,
  target uuid not null references public.profiles(id) on delete cascade,
  primary key(actor,target), check(actor<>target)
);
create table public.friend_operations (
  actor uuid not null references public.profiles(id) on delete cascade,
  operation_id uuid not null,
  fingerprint text not null,
  created_at timestamptz not null default now(),
  primary key(actor,operation_id)
);
alter table public.friendships enable row level security;
alter table public.friend_blocks enable row level security;
alter table public.friend_operations enable row level security;
create policy own_friendships on public.friendships for select to authenticated using(auth.uid() in (low_id,high_id));
create policy addressed_invitation on public.invitations for select to authenticated using(recipient=auth.uid());
grant select on public.friendships,public.invitations to authenticated;
revoke all on public.friend_blocks,public.friend_operations from anon,authenticated;
revoke insert,update,delete on public.friendships,public.invitations from anon,authenticated;
grant all on public.friendships,public.friend_blocks,public.friend_operations to service_role;

create function public.wc_friends(p_actor uuid) returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object(
  'people',coalesce((select jsonb_agg(row_to_json(t) order by lower(t.display_name),t.id) from (
   select p.id,p.display_name,p.friend_code,f.status,f.request_id,f.requested_by
   from friendships f join profiles p on p.id=case when f.low_id=p_actor then f.high_id else f.low_id end
   where p_actor in (f.low_id,f.high_id) and f.status in ('accepted','pending') and not p.deleting
     and not exists(select 1 from friend_blocks b where (b.actor=p_actor and b.target=p.id) or (b.actor=p.id and b.target=p_actor))
  ) t),'[]'::jsonb),
  'invitations',coalesce((select jsonb_agg(row_to_json(t) order by t.created_at desc) from (
   select g.id,i.token,i.expires_at,p.display_name as host,g.rules_version,g.created_at
   from invitations i join games g on g.id=i.game_id join profiles p on p.id=g.players[1]
   where i.recipient=p_actor and g.status='invited' and i.expires_at>now() and not p.deleting
  ) t),'[]'::jsonb),
  'outgoing',coalesce((select jsonb_agg(jsonb_build_object('id',g.id,'recipient',i.recipient)) from invitations i join games g on g.id=i.game_id
    where g.players[1]=p_actor and i.recipient is not null and g.status='invited' and i.expires_at>now()),'[]'::jsonb),
  'blocked',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'display_name',p.display_name))
    from friend_blocks b join profiles p on p.id=b.target where b.actor=p_actor and not p.deleting),'[]'::jsonb)
 )
$$;

create function public.wc_friend_search(p_actor uuid,p_query text) returns jsonb language sql stable security definer set search_path=public as $$
 select coalesce(jsonb_agg(row_to_json(t)),'[]'::jsonb) from (
  select p.id,p.display_name,p.friend_code,f.status,f.request_id,f.requested_by
  from profiles p left join friendships f on f.low_id=least(p_actor,p.id) and f.high_id=greatest(p_actor,p.id)
  where p.id<>p_actor and not p.deleting and char_length(trim(p_query)) between 3 and 64
   and (p.friend_code=upper(replace(trim(p_query),'-','')) or
     strpos(lower(p.display_name),lower(trim(p_query)))>0)
   and not exists(select 1 from friend_blocks b where (b.actor=p_actor and b.target=p.id) or (b.actor=p.id and b.target=p_actor))
  order by lower(p.display_name),p.id limit 20
 ) t
$$;

create function public.wc_friend_action(p_actor uuid,p_target uuid,p_action text,p_operation uuid,p_request uuid)
returns void language plpgsql security definer set search_path=public as $$
declare f friendships; fingerprint text; receipt text; v_game games;
begin
 perform pg_advisory_xact_lock(hashtext(p_actor::text));
 perform pg_advisory_xact_lock(hashtext(least(p_actor,p_target)::text||greatest(p_actor,p_target)::text));
 if not exists(select 1 from profiles where id=p_actor and not deleting) then raise exception 'account_deleting'; end if;
 fingerprint:=p_target::text||':'||p_action||':'||coalesce(p_request::text,'');
 select o.fingerprint into receipt from friend_operations o where actor=p_actor and operation_id=p_operation;
 if found then
  if receipt<>fingerprint then raise exception 'idempotency_conflict'; end if;
  return;
 end if;
 if p_actor=p_target or not exists(select 1 from profiles where id=p_target and not deleting) then raise exception 'friend_unavailable'; end if;
 select * into f from friendships where low_id=least(p_actor,p_target) and high_id=greatest(p_actor,p_target) for update;
 if p_action='block' then
  insert into friend_blocks values(p_actor,p_target) on conflict do nothing;
  update friendships set status='removed',updated_at=now() where low_id=least(p_actor,p_target) and high_id=greatest(p_actor,p_target);
  -- Cancel outstanding addressed invitations in both directions, retaining history.
  for v_game in select g.* from games g join invitations i on i.game_id=g.id where g.status='invited'
    and ((i.recipient=p_actor and g.players[1]=p_target) or (i.recipient=p_target and g.players[1]=p_actor)) order by g.id for update of g loop
   update games set status='cancelled',revision=revision+1,updated_at=now() where id=v_game.id;
   update notifications set read_at=now() where game_id=v_game.id;
  end loop;
 elsif p_action='unblock' then
  delete from friend_blocks where actor=p_actor and target=p_target;
 else
  if exists(select 1 from friend_blocks where (actor=p_actor and target=p_target) or (actor=p_target and target=p_actor)) then raise exception 'friend_unavailable'; end if;
  if p_action='request' then
   if f.status in ('accepted','pending') then
    insert into friend_operations values(p_actor,p_operation,fingerprint,now()); return;
   end if;
   if f.requested_at>now()-interval '1 day' then raise exception 'friend_cooldown'; end if;
   if (select count(*) from friend_operations o where o.actor=p_actor and o.created_at>now()-interval '1 day' and o.fingerprint like '%:request:%')>=20 then raise exception 'friend_limit'; end if;
   if (select count(*) from friendships where p_actor in (low_id,high_id) and status in ('pending','accepted'))>=100
     or (select count(*) from friendships where p_target in (low_id,high_id) and status in ('pending','accepted'))>=100 then raise exception 'friend_limit'; end if;
   insert into friendships(low_id,high_id,requested_by,request_id,status) values(least(p_actor,p_target),greatest(p_actor,p_target),p_actor,p_operation,'pending')
    on conflict(low_id,high_id) do update set requested_by=p_actor,request_id=p_operation,status='pending',updated_at=now(),requested_at=now();
  elsif p_action in ('accept','decline','cancel','remove') then
   if f.request_id is distinct from p_request then raise exception 'friend_stale'; end if;
   if p_action='accept' and f.status='accepted' then
    insert into friend_operations values(p_actor,p_operation,fingerprint,now()); return;
   end if;
   if (p_action in ('accept','decline') and (f.status<>'pending' or f.requested_by=p_actor))
     or (p_action='cancel' and (f.status<>'pending' or f.requested_by<>p_actor))
     or (p_action='remove' and f.status<>'accepted') then raise exception 'friend_stale'; end if;
   update friendships set status=case p_action when 'accept' then 'accepted' when 'decline' then 'declined' else 'removed' end,updated_at=now()
    where low_id=f.low_id and high_id=f.high_id;
  else raise exception 'invalid_action'; end if;
 end if;
 insert into friend_operations values(p_actor,p_operation,fingerprint,now());
end $$;

create function public.wc_create_friend(p_actor uuid,p_friend uuid,p_id uuid,p_token uuid,p_state jsonb,p_rules text,p_dictionary text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_game games;
begin
 perform pg_advisory_xact_lock(hashtext(p_actor::text));
 perform pg_advisory_xact_lock(hashtext(least(p_actor,p_friend)::text||greatest(p_actor,p_friend)::text));
 if exists(select 1 from profiles where id=p_actor and deleting) then raise exception 'account_deleting'; end if;
 select * into v_game from games where id=p_id;
 if found then
  if v_game.players[1]<>p_actor or not exists(select 1 from invitations where game_id=p_id and recipient=p_friend) then raise exception 'idempotency_conflict'; end if;
  return to_jsonb(v_game);
 end if;
 if not exists(select 1 from friendships where low_id=least(p_actor,p_friend) and high_id=greatest(p_actor,p_friend) and status='accepted')
   or not exists(select 1 from profiles where id=p_friend and not deleting)
   or exists(select 1 from friend_blocks where (actor=p_actor and target=p_friend) or (actor=p_friend and target=p_actor)) then raise exception 'friend_unavailable'; end if;
 -- One outstanding invitation per direction; retries/double taps return that same seat.
 select g.* into v_game from games g join invitations i on i.game_id=g.id
  where g.players[1]=p_actor and i.recipient=p_friend and g.status='invited' and i.expires_at>now() order by g.created_at limit 1;
 if found then raise exception 'invitation_pending'; end if;
 if (select count(*) from invitations i join games g on g.id=i.game_id where i.recipient=p_friend and g.status='invited' and i.expires_at>now())>=30 then raise exception 'game_limit'; end if;
 perform wc_create(p_actor,p_id,p_token,p_state,p_rules,p_dictionary);
 update invitations set recipient=p_friend where game_id=p_id;
 insert into notifications(user_id,game_id,revision,kind) values(p_friend,p_id,0,'invitation received');
 select * into v_game from games where id=p_id;
 return to_jsonb(v_game);
end $$;

-- Keep the original link-invitation behaviour, but restrict addressed seats first.
alter function public.wc_invitation(uuid,uuid,text) rename to wc_link_invitation;
create function public.wc_invitation(p_actor uuid,p_token uuid,p_action text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare i invitations; g games; result jsonb;
begin
 select * into i from invitations where token=p_token;
 if not found then raise exception 'invitation_unavailable'; end if;
 select * into g from games where id=i.game_id;
 if i.recipient is not null and p_actor<>i.recipient and p_actor<>g.players[1] then raise exception 'invitation_unavailable'; end if;
 if p_actor<>g.players[1] and exists(select 1 from friend_blocks where (actor=p_actor and target=g.players[1]) or (actor=g.players[1] and target=p_actor)) then raise exception 'invitation_unavailable'; end if;
 if (p_action='cancel' and g.status='cancelled' and p_actor=g.players[1]) or
    (p_action='decline' and g.status='declined' and p_actor=i.recipient) then return to_jsonb(g); end if;
 result:=wc_link_invitation(p_actor,p_token,p_action);
 if p_action<>'preview' then update notifications set read_at=now() where game_id=g.id and kind='invitation received'; end if;
 return result;
end $$;
-- The implementation helper must not be callable directly by the service API.
revoke all on function public.wc_link_invitation(uuid,uuid,text) from public,anon,authenticated,service_role;

alter function public.wc_delete_account(uuid) rename to wc_delete_game_account;
create function public.wc_delete_account(p_actor uuid) returns void language plpgsql security definer set search_path=public as $$
declare v_game games;
begin
 perform wc_delete_game_account(p_actor);
 for v_game in select g.* from games g join invitations i on i.game_id=g.id where i.recipient=p_actor and g.status='invited' order by g.id for update of g loop
  update games set status='cancelled',revision=revision+1,updated_at=now() where id=v_game.id;
 end loop;
 delete from invitations where recipient=p_actor;
 delete from friendships where p_actor in (low_id,high_id);
 delete from friend_blocks where p_actor in (actor,target);
 delete from friend_operations where actor=p_actor or fingerprint like p_actor::text||':%';
end $$;
revoke all on function public.wc_delete_game_account(uuid) from public,anon,authenticated,service_role;
revoke all on function public.wc_friends(uuid),public.wc_friend_search(uuid,text),public.wc_friend_action(uuid,uuid,text,uuid,uuid),public.wc_create_friend(uuid,uuid,uuid,uuid,jsonb,text,text),public.wc_invitation(uuid,uuid,text),public.wc_delete_account(uuid) from public,anon,authenticated;
grant execute on function public.wc_friends(uuid),public.wc_friend_search(uuid,text),public.wc_friend_action(uuid,uuid,text,uuid,uuid),public.wc_create_friend(uuid,uuid,uuid,uuid,jsonb,text,text),public.wc_invitation(uuid,uuid,text),public.wc_delete_account(uuid) to service_role;

-- Realtime respects the participant/recipient SELECT policies above.
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='friendships') then
   alter publication supabase_realtime add table public.friendships;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notifications') then
   alter publication supabase_realtime add table public.notifications;
  end if;
 end if;
end $$;
