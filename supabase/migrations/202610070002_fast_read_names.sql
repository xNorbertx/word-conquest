-- Preserve one-player invitation shapes created by older versions.
create or replace function public.wc_read_home(p_actor uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
declare v_games jsonb; v_notifications jsonb;
begin
 select coalesce(jsonb_agg(x.item order by x.updated_at desc),'[]'::jsonb) into v_games
 from (select g.updated_at,to_jsonb(g)||jsonb_build_object('state',(g.state-'log')||jsonb_build_object('log','[]'::jsonb),'names',case when cardinality(g.players)=1 then jsonb_build_array(coalesce(a.display_name,'Deleted player')) else jsonb_build_array(coalesce(a.display_name,'Deleted player'),coalesce(b.display_name,'Deleted player')) end) as item
 from (select * from games where players @> array[p_actor] order by updated_at desc limit 200) g
 left join profiles a on a.id=g.players[1] left join profiles b on b.id=g.players[2]) x;
 select coalesce(jsonb_agg(to_jsonb(n) order by n.created_at desc),'[]'::jsonb) into v_notifications
 from (select id,game_id,kind,read_at,created_at from notifications where user_id=p_actor order by created_at desc limit 50) n;
 return jsonb_build_object('games',v_games,'notifications',v_notifications,'social',wc_friends(p_actor));
end $$;

create or replace function public.wc_read_game(p_actor uuid,p_game uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
declare g games; v_token uuid; v_preview jsonb; v_history jsonb; v_names jsonb; v_invitation jsonb; v_rules text;
begin
 select token into v_token from invitations where game_id=p_game and recipient=p_actor;
 if found then
  v_preview:=wc_invitation(p_actor,v_token,'preview');
  if v_preview->>'status'='invited' then
   select rules_version into v_rules from games where id=p_game;
   return jsonb_build_object('invitation',v_preview||jsonb_build_object('token',v_token,'rulesVersion',v_rules));
  end if;
 end if;
 select * into g from games where id=p_game and players @> array[p_actor];
 if not found then raise exception 'not_found'; end if;
 select case when cardinality(g.players)=1 then jsonb_build_array(coalesce(a.display_name,'Deleted player')) else jsonb_build_array(coalesce(a.display_name,'Deleted player'),coalesce(b.display_name,'Deleted player')) end into v_names
 from (select 1) x left join profiles a on a.id=g.players[1] left join profiles b on b.id=g.players[2];
 select coalesce(jsonb_agg(to_jsonb(o) order by o.revision desc),'[]'::jsonb) into v_history
 from (select revision,recap from operations where game_id=g.id and revision<=g.revision order by revision desc limit 2) o;
 if g.status='invited' and g.players[1]=p_actor then
  select jsonb_build_object('token',i.token,'expires_at',i.expires_at,'recipient',i.recipient,'recipient_name',coalesce(p.display_name,'Your friend')) into v_invitation
  from invitations i left join profiles p on p.id=i.recipient where i.game_id=g.id;
 end if;
 return jsonb_build_object('game',to_jsonb(g)||jsonb_build_object('state',(g.state-'log')||jsonb_build_object('log','[]'::jsonb),'names',v_names),'history',case when jsonb_array_length(v_history)>0 then jsonb_build_array(v_history->0) else '[]'::jsonb end,'historyHasMore',jsonb_array_length(v_history)>1,'invitation',v_invitation);
end $$;
revoke all on function public.wc_read_home(uuid),public.wc_read_game(uuid,uuid) from public,anon,authenticated;
grant execute on function public.wc_read_home(uuid),public.wc_read_game(uuid,uuid) to service_role;
