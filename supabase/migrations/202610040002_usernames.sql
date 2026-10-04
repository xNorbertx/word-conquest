-- A username is the displayed identity. Keep display_name as a synchronized
-- compatibility alias for older APKs, friend RPCs and notification workers.
create function public.wc_username(p_name text) returns text
language sql immutable strict set search_path=public as $$
  select btrim(normalize(p_name,NFKC))
$$;
create function public.wc_username_valid(p_name text) returns boolean
language sql immutable set search_path=public as $$
  select coalesce(char_length(p_name) between 1 and 40
    and p_name=wc_username(p_name)
    and p_name ~ '^[[:alnum:]_.() ''-]+$' and p_name ~ '[[:alnum:]]',false)
$$;

-- Refuse ambiguous migrations rather than silently renaming anybody.
do $$ begin
  if exists(select 1 from profiles where not deleting and not wc_username_valid(wc_username(display_name))) then
    raise exception 'username_migration_invalid_name';
  end if;
  if exists(select 1 from profiles where not deleting group by lower(wc_username(display_name)) having count(*)>1) then
    raise exception 'username_migration_duplicate';
  end if;
  if exists(select 1 from auth.users u left join profiles p on p.id=u.id where p.id is null) then
    raise exception 'username_migration_missing_profile';
  end if;
end $$;
alter table public.profiles add column username text;
update public.profiles set username=wc_username(display_name),display_name=wc_username(display_name);
alter table public.profiles alter column username set not null;
alter table public.profiles alter column display_name drop default;
alter table public.profiles add constraint profiles_username_valid check(deleting or wc_username_valid(username));
alter table public.profiles add constraint profiles_username_alias check(deleting or display_name=username);
create unique index profiles_username_key on public.profiles(lower(username)) where not deleting;

create function public.wc_profile_username() returns trigger
language plpgsql security definer set search_path=public as $$
declare existing profiles;
begin
  if tg_op='INSERT' then
    -- Old API versions do INSERT ON CONFLICT(id) DO NOTHING on each request.
    select * into existing from profiles where id=new.id;
    new.username:=coalesce(new.username,new.display_name,existing.username);
  elsif new.username is not distinct from old.username and new.display_name is distinct from old.display_name then
    new.username:=new.display_name;
  end if;
  if new.deleting then
    -- Deletion retries retain no visible name and do not contend for a username.
    if tg_op='UPDATE' then new.username:=old.username;end if;
    new.username:=coalesce(new.username,'Deleted player');new.display_name:='Deleted player';return new;
  end if;
  new.username:=wc_username(new.username);
  if new.username is null or new.username='' then raise exception 'username_required';end if;
  if not wc_username_valid(new.username) then raise exception 'invalid_username';end if;
  new.display_name:=new.username;
  return new;
end $$;
create trigger profiles_username before insert or update on public.profiles
for each row execute function public.wc_profile_username();

-- Auth and username creation share one transaction. The unique index wins even
-- when two signups/renames pass an availability check at the same time.
create function public.wc_signup_profile() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,username) values(new.id,new.raw_user_meta_data->>'username');
  return new;
end $$;
create trigger wc_auth_signup after insert on auth.users
for each row execute function public.wc_signup_profile();

-- Signup may learn only whether a username is available, never an email/id/profile.
create function public.wc_username_available(p_username text) returns boolean
language sql stable security definer set search_path=public as $$
  select wc_username_valid(wc_username(p_username)) and not exists(
    select 1 from profiles where not deleting and lower(username)=lower(wc_username(p_username)))
$$;
revoke all on function public.wc_username(text),public.wc_username_valid(text),public.wc_profile_username(),public.wc_signup_profile(),public.wc_username_available(text) from public,anon,authenticated;
grant execute on function public.wc_username_available(text) to anon,authenticated,service_role;
grant execute on function public.wc_username(text),public.wc_username_valid(text) to service_role;

-- Exact short usernames are findable; broader searches still require 3 letters.
create or replace function public.wc_friend_search(p_actor uuid,p_query text) returns jsonb language sql stable security definer set search_path=public as $$
 select coalesce(jsonb_agg(row_to_json(t)),'[]'::jsonb) from (
  select p.id,p.display_name,p.friend_code,f.status,f.request_id,f.requested_by
  from profiles p left join friendships f on f.low_id=least(p_actor,p.id) and f.high_id=greatest(p_actor,p.id)
  where p.id<>p_actor and not p.deleting and char_length(wc_username(p_query)) between 1 and 64
   and (p.friend_code=upper(replace(trim(p_query),'-','')) or lower(p.username)=lower(wc_username(p_query)) or
     (char_length(wc_username(p_query))>=3 and strpos(lower(p.username),lower(wc_username(p_query)))>0))
   and not exists(select 1 from friend_blocks b where (b.actor=p_actor and b.target=p.id) or (b.actor=p.id and b.target=p_actor))
  order by lower(p.username),p.id limit 20
 ) t
$$;
