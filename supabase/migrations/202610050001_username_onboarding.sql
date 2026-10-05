-- A missing username is the persistent onboarding flag. Existing names stay set.
alter table public.profiles alter column username drop not null;
alter table public.profiles drop constraint profiles_username_valid;
alter table public.profiles add constraint profiles_username_valid
  check(deleting or username is null or wc_username_valid(username));
alter table public.profiles drop constraint profiles_username_alias;
alter table public.profiles add constraint profiles_username_alias check(deleting or
  (username is null and display_name='Player') or (username is not null and display_name=username));

create or replace function public.wc_profile_username() returns trigger
language plpgsql security definer set search_path=public as $$
declare existing profiles;
begin
  if tg_op='INSERT' then
    select * into existing from profiles where id=new.id;
    new.username:=coalesce(new.username,new.display_name,existing.username);
  elsif new.username is not distinct from old.username and new.display_name is distinct from old.display_name then
    new.username:=new.display_name;
  end if;
  if new.deleting then
    if tg_op='UPDATE' then new.username:=old.username;end if;
    new.display_name:='Deleted player';return new;
  end if;
  if new.username is null then
    -- Once chosen, a username cannot be cleared to bypass normal profile rules.
    if tg_op='UPDATE' and old.username is not null then raise exception 'username_required';end if;
    new.display_name:='Player';return new;
  end if;
  new.username:=wc_username(new.username);
  if not wc_username_valid(new.username) then raise exception 'invalid_username';end if;
  new.display_name:=new.username;return new;
end $$;

-- Account creation needs only Auth credentials. Even old clients' metadata is
-- ignored: every genuinely new account chooses its name after authentication.
create or replace function public.wc_signup_profile() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id) values(new.id);
  return new;
end $$;

create function public.wc_complete_username(p_actor uuid,p_username text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare p profiles; name text:=wc_username(p_username);
begin
  if not wc_username_valid(name) then raise exception 'invalid_username';end if;
  select * into p from profiles where id=p_actor for update;
  if not found or p.deleting then raise exception 'account_deleting';end if;
  -- Lost replies and two devices completing setup must not rename the account.
  if p.username is not null then return to_jsonb(p);end if;
  update profiles set username=name where id=p_actor returning * into p;
  return to_jsonb(p);
end $$;
revoke all on function public.wc_complete_username(uuid,text) from public,anon,authenticated;
grant execute on function public.wc_complete_username(uuid,text) to service_role;

create or replace function public.wc_friend_search(p_actor uuid,p_query text) returns jsonb language sql stable security definer set search_path=public as $$
 select coalesce(jsonb_agg(row_to_json(t)),'[]'::jsonb) from (
  select p.id,p.display_name,p.friend_code,f.status,f.request_id,f.requested_by
  from profiles p left join friendships f on f.low_id=least(p_actor,p.id) and f.high_id=greatest(p_actor,p.id)
  where p.id<>p_actor and not p.deleting and p.username is not null and char_length(wc_username(p_query)) between 1 and 64
   and (p.friend_code=upper(replace(trim(p_query),'-','')) or lower(p.username)=lower(wc_username(p_query)) or
     (char_length(wc_username(p_query))>=3 and strpos(lower(p.username),lower(wc_username(p_query)))>0))
   and not exists(select 1 from friend_blocks b where (b.actor=p_actor and b.target=p.id) or (b.actor=p.id and b.target=p_actor))
  order by lower(p.username),p.id limit 20
 ) t
$$;

-- The private implementation keeps its existing receipts, rate limits and locks.
alter function public.wc_friend_action(uuid,uuid,text,uuid,uuid) rename to wc_named_friend_action;
revoke all on function public.wc_named_friend_action(uuid,uuid,text,uuid,uuid) from public,anon,authenticated,service_role;
create function public.wc_friend_action(p_actor uuid,p_target uuid,p_action text,p_operation uuid,p_request uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from profiles where id=p_actor and username is not null and not deleting) then raise exception 'username_required';end if;
  if p_action in ('request','accept') and not exists(select 1 from profiles where id=p_target and username is not null and not deleting) then raise exception 'friend_unavailable';end if;
  perform wc_named_friend_action(p_actor,p_target,p_action,p_operation,p_request);
end $$;
revoke all on function public.wc_friend_action(uuid,uuid,text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.wc_friend_action(uuid,uuid,text,uuid,uuid) to service_role;
