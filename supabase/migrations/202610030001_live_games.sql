-- Realtime respects the existing participant-only SELECT policy.
-- No invitation tokens, profiles or operation payloads are added to publication.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='games') then
    alter publication supabase_realtime add table public.games;
  end if;
end $$;
