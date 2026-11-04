-- Storage bucket for cafe images (docs/spec/03-database.md, Storage).
--
-- Public read through object URLs; no client writes (uploads happen in the dashboard for now, so
-- no storage.objects policies are needed). The Homebrew shim has no storage schema, so the insert
-- only runs when storage.buckets exists.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'storage' and table_name = 'buckets'
  ) then
    insert into storage.buckets (id, name, public)
    values ('cafe-images', 'cafe-images', true)
    on conflict (id) do nothing;
  end if;
end;
$$;
