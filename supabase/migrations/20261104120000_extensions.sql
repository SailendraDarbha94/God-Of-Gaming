-- Extensions (docs/spec/03-database.md, Extensions).
--
-- btree_gist supplies the GiST operator class for uuid that the booking_seats exclusion
-- constraint needs (station_id with =, during with &&). pg_cron runs the hold-expiry sweeper; its
-- control file pins schema pg_catalog (relocatable = false) and its objects live in the `cron`
-- schema it creates. The Homebrew shim database (supabase/local/shim.sql) has btree_gist but no
-- pg_cron, so both creates are guarded by pg_available_extensions.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'btree_gist') then
    create extension if not exists btree_gist with schema extensions;
  else
    raise exception 'btree_gist is not available on this server; the booking_seats exclusion constraint needs it';
  end if;

  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
    grant usage on schema cron to postgres;
    grant all privileges on all tables in schema cron to postgres;
  end if;
end;
$$;
