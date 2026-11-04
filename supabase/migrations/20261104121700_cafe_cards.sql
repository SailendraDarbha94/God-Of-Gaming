-- cafe_cards (docs/spec/03-database.md, Views). One row per cafe for list pages; listCafes in
-- @gog/data reads it instead of aggregating client-side (PostgREST aggregates are off).
--
-- security_invoker: the caller's RLS applies to cafes and the joined tables, so non-live cafes
-- are hidden automatically. The inner joins on areas and cities mean a live cafe in a non-live
-- city has no card (getCafe(slug) still returns it).
create view public.cafe_cards
with (security_invoker = true)
as
select
  c.id,
  c.slug,
  c.name,
  c.status,
  ci.slug as city_slug,
  ci.name as city_name,
  a.slug as area_slug,
  a.name as area_name,
  (
    select i.url
    from public.cafe_images i
    where i.cafe_id = c.id
    order by i.sort_order
    limit 1
  ) as cover_image_url,
  coalesce(
    (
      select array_agg(distinct t.kind order by t.kind)
      from public.station_tiers t
      where t.cafe_id = c.id
    ),
    '{}'::public.station_kind[]
  ) as kinds,
  (
    select min(t.hourly_rate_paise)
    from public.station_tiers t
    where t.cafe_id = c.id
      and exists (select 1 from public.stations s where s.tier_id = t.id and s.is_active)
  ) as from_hourly_rate_paise,
  (
    select count(*)::integer
    from public.stations s
    join public.station_tiers t on t.id = s.tier_id
    where t.cafe_id = c.id and s.is_active
  ) as station_count
from public.cafes c
join public.areas a on a.id = c.area_id
join public.cities ci on ci.id = a.city_id;

comment on view public.cafe_cards is
  'Cafe list card: cover image, distinct tier kinds, lowest hourly rate among tiers with an active station, active station count.';
