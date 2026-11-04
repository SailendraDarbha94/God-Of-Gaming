-- set_updated_at() (docs/spec/03-database.md, Conventions and Functions).
--
-- Contract: `before update for each row` trigger function; stamps new.updated_at with now() so
-- every table that carries updated_at keeps it without the writer having to remember.
-- Errors: none.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Supabase's default privileges grant every new public function to anon and authenticated;
-- a trigger function is never called directly, so nobody needs execute on it.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
