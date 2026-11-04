-- Schedule the hold-expiry sweeper (docs/spec/03-database.md, Cron; ADR 0005).
--
-- pg_cron keeps "my bookings" tidy; correctness never depends on it (create_booking expires
-- lapsed holds itself). cron.schedule upserts by job name, so re-running is harmless. The
-- Homebrew shim has no pg_cron, so the block only runs when the extension is installed.
do $do$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('expire-holds', '* * * * *', $$select public.expire_holds()$$);
  end if;
end;
$do$;
