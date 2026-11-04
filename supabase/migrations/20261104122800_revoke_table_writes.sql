-- Table write privileges (docs/spec/03-database.md, Row Level Security; ADR 0011).
--
-- Supabase's default privileges grant ALL on every new table in public to anon and authenticated
-- (supabase/local/shim.sql mirrors them), so until now only the absence of insert, update and delete
-- policies stood between a client and the booking tables. RLS never applies to TRUNCATE, and a
-- future `create policy ... for all` for a partner surface would silently open direct writes that
-- must only happen through the security-definer functions. With the table-level write privileges
-- revoked, such a write is a permission error whatever the policies say. Reads stay as RLS allows.
-- A table created later (in the dashboard or a migration) receives the default grants again and
-- needs the same revoke.
revoke insert, update, delete, truncate, references, trigger
  on all tables in schema public
  from anon, authenticated;

-- The one client write that is not a function call: a player edits their own display name and home
-- city (RLS: id = auth.uid()). Column privileges survive a table-level revoke; the grant is restated
-- here so the whole write surface of the schema reads in one file.
grant update (display_name, home_city_id) on public.profiles to authenticated;
