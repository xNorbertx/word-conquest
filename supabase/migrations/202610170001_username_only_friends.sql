-- Retire friend-code discovery without rewriting accounts or relationships.
-- User IDs remain internal relationship keys; discovery matches usernames only.
-- Keep the legacy column for rollback compatibility, but do not return/search it.
create or replace function public.wc_friend_search(p_actor uuid,p_query text) returns jsonb language sql stable security definer set search_path=public as $$
 select coalesce(jsonb_agg(row_to_json(t)),'[]'::jsonb) from (
  select p.id,p.display_name,f.status,f.request_id,f.requested_by
  from profiles p left join friendships f on f.low_id=least(p_actor,p.id) and f.high_id=greatest(p_actor,p.id)
  where p.id<>p_actor and not p.deleting and p.username is not null and char_length(wc_username(p_query)) between 1 and 40
   and (lower(p.username)=lower(wc_username(p_query)) or
     (char_length(wc_username(p_query))>=3 and strpos(lower(p.username),lower(wc_username(p_query)))>0))
   and not exists(select 1 from friend_blocks b where (b.actor=p_actor and b.target=p.id) or (b.actor=p.id and b.target=p_actor))
  order by lower(p.username),p.id limit 20
 ) t
$$;

create or replace function public.wc_friends(p_actor uuid) returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object(
  'people',coalesce((select jsonb_agg(row_to_json(t) order by lower(t.display_name),t.id) from (
   select p.id,p.display_name,f.status,f.request_id,f.requested_by
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

revoke all on function public.wc_friend_search(uuid,text), public.wc_friends(uuid) from public,anon,authenticated;
grant execute on function public.wc_friend_search(uuid,text), public.wc_friends(uuid) to service_role;
