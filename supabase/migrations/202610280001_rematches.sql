-- One rematch per player and completed game, including opponents met by link.
-- The source/recipient checks and invitation write share the existing pair lock.
create table public.rematches (
  source_game uuid not null references public.games(id) on delete cascade,
  actor uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  primary key(source_game,actor)
);
alter table public.rematches enable row level security;
revoke all on public.rematches from public,anon,authenticated;
grant all on public.rematches to service_role;

create function public.wc_rematch(p_actor uuid,p_source uuid,p_id uuid,p_token uuid,p_state jsonb,p_rules text,p_dictionary text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare source games; v_target uuid; g games;
begin
  perform pg_advisory_xact_lock(hashtext(p_actor::text));
  if not exists(select 1 from profiles where id=p_actor and username is not null and not deleting) then raise exception 'username_required'; end if;
  select * into source from games where id=p_source and p_actor=any(players);
  if not found then raise exception 'not_found'; end if;
  if source.status<>'completed' or array_length(source.players,1)<>2 then raise exception 'rematch_unavailable'; end if;
  v_target:=case when source.players[1]=p_actor then source.players[2] else source.players[1] end;
  if v_target is null or v_target=p_actor then raise exception 'rematch_unavailable'; end if;
  perform pg_advisory_xact_lock(hashtext(least(p_actor,v_target)::text||greatest(p_actor,v_target)::text));
  if not exists(select 1 from profiles where id=v_target and username is not null and not deleting)
    or exists(select 1 from friend_blocks b where (b.actor=p_actor and b.target=v_target) or (b.actor=v_target and b.target=p_actor)) then raise exception 'friend_unavailable'; end if;
  select games.* into g from games join rematches r on r.game_id=games.id where r.source_game=p_source and r.actor=p_actor;
  if found then return to_jsonb(g); end if;
  -- Reuse either player's matching invitation. A crossed request opens the
  -- opponent's invitation for normal acceptance; it never auto-accepts it.
  select games.* into g from games join invitations i on i.game_id=games.id
    where games.status='invited' and i.expires_at>now() and games.rules_version=p_rules
    and ((games.players[1]=p_actor and i.recipient=v_target) or (games.players[1]=v_target and i.recipient=p_actor))
    order by games.created_at,games.id limit 1;
  if not found then
    if exists(select 1 from games where id=p_id) then raise exception 'idempotency_conflict'; end if;
    if exists(select 1 from games join invitations i on i.game_id=games.id where games.status='invited' and i.expires_at>now()
      and ((games.players[1]=p_actor and i.recipient=v_target) or (games.players[1]=v_target and i.recipient=p_actor))) then raise exception 'invitation_pending'; end if;
    if (select count(*) from invitations i join games on games.id=i.game_id where i.recipient=v_target and games.status='invited' and i.expires_at>now())>=30 then raise exception 'game_limit'; end if;
    perform wc_create(p_actor,p_id,p_token,p_state,p_rules,p_dictionary);
    update invitations set recipient=v_target where game_id=p_id;
    insert into notifications(user_id,game_id,revision,kind) values(v_target,p_id,0,'invitation received');
    select * into g from games where id=p_id;
  end if;
  insert into rematches(source_game,actor,game_id) values(p_source,p_actor,g.id);
  return to_jsonb(g);
end $$;
revoke all on function public.wc_rematch(uuid,uuid,uuid,uuid,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.wc_rematch(uuid,uuid,uuid,uuid,jsonb,text,text) to service_role;
