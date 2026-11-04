-- Sample data (docs/spec/08-sample-data.md). Fictional development data: cafe names, addresses
-- and prices are invented; area names and coordinates are real public geography. UUIDs are fixed
-- so the fixtures in @gog/data and this seed agree and tests can reference rows:
--   cities      00000000-0000-4000-8000-00000000000N
--   areas       00000000-0000-4000-8000-0000000001NN
--   games       00000000-0000-4000-8000-0000000002NN
--   cafes       00000000-0000-4000-8000-00000000030C      C = 1..6 in table order
--   tiers       00000000-0000-4000-8000-0000000003CT      T = 1..3 per cafe
--   stations    00000000-0000-4000-8000-00000003CTSS      SS = 01..24
--   promotions  00000000-0000-4000-8000-00000000040N
--   images      00000000-0000-4000-8000-0000000005CN      N = 1..3
-- No bookings and no users: tests create their own.

-- Cities ------------------------------------------------------------------------------------------

insert into public.cities (id, slug, name, state, lat, lng, is_live) values
  ('00000000-0000-4000-8000-000000000001', 'bengaluru', 'Bengaluru', 'Karnataka', 12.9716, 77.5946, true),
  ('00000000-0000-4000-8000-000000000002', 'pune', 'Pune', 'Maharashtra', 18.5204, 73.8567, false),
  ('00000000-0000-4000-8000-000000000003', 'hyderabad', 'Hyderabad', 'Telangana', 17.3850, 78.4867, false);

-- Areas (Bengaluru) -------------------------------------------------------------------------------

insert into public.areas (id, city_id, slug, name, lat, lng) values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'koramangala', 'Koramangala', 12.9352, 77.6245),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'indiranagar', 'Indiranagar', 12.9784, 77.6408),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', 'hsr-layout', 'HSR Layout', 12.9116, 77.6389),
  ('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000001', 'whitefield', 'Whitefield', 12.9698, 77.7500),
  ('00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000001', 'marathahalli', 'Marathahalli', 12.9591, 77.6974),
  ('00000000-0000-4000-8000-000000000106', '00000000-0000-4000-8000-000000000001', 'jayanagar', 'Jayanagar', 12.9308, 77.5838),
  ('00000000-0000-4000-8000-000000000107', '00000000-0000-4000-8000-000000000001', 'jp-nagar', 'JP Nagar', 12.9063, 77.5857),
  ('00000000-0000-4000-8000-000000000108', '00000000-0000-4000-8000-000000000001', 'electronic-city', 'Electronic City', 12.8399, 77.6770),
  ('00000000-0000-4000-8000-000000000109', '00000000-0000-4000-8000-000000000001', 'bellandur', 'Bellandur', 12.9260, 77.6762),
  ('00000000-0000-4000-8000-000000000110', '00000000-0000-4000-8000-000000000001', 'btm-layout', 'BTM Layout', 12.9166, 77.6101),
  ('00000000-0000-4000-8000-000000000111', '00000000-0000-4000-8000-000000000001', 'malleshwaram', 'Malleshwaram', 13.0035, 77.5647),
  ('00000000-0000-4000-8000-000000000112', '00000000-0000-4000-8000-000000000001', 'rajajinagar', 'Rajajinagar', 12.9915, 77.5527),
  ('00000000-0000-4000-8000-000000000113', '00000000-0000-4000-8000-000000000001', 'hebbal', 'Hebbal', 13.0358, 77.5970),
  ('00000000-0000-4000-8000-000000000114', '00000000-0000-4000-8000-000000000001', 'yelahanka', 'Yelahanka', 13.1007, 77.5963),
  ('00000000-0000-4000-8000-000000000115', '00000000-0000-4000-8000-000000000001', 'banashankari', 'Banashankari', 12.9255, 77.5468),
  ('00000000-0000-4000-8000-000000000116', '00000000-0000-4000-8000-000000000001', 'sarjapur-road', 'Sarjapur Road', 12.9100, 77.6870),
  ('00000000-0000-4000-8000-000000000117', '00000000-0000-4000-8000-000000000001', 'kalyan-nagar', 'Kalyan Nagar', 13.0247, 77.6400),
  ('00000000-0000-4000-8000-000000000118', '00000000-0000-4000-8000-000000000001', 'basavanagudi', 'Basavanagudi', 12.9416, 77.5750);

-- Games -------------------------------------------------------------------------------------------

insert into public.games (id, slug, name, kinds) values
  ('00000000-0000-4000-8000-000000000201', 'valorant', 'Valorant', '{pc}'),
  ('00000000-0000-4000-8000-000000000202', 'counter-strike-2', 'Counter-Strike 2', '{pc}'),
  ('00000000-0000-4000-8000-000000000203', 'gta-vi', 'Grand Theft Auto VI', '{ps5,xbox}'),
  ('00000000-0000-4000-8000-000000000204', 'gta-v', 'Grand Theft Auto V', '{pc,ps5,xbox}'),
  ('00000000-0000-4000-8000-000000000205', 'ea-sports-fc-26', 'EA Sports FC 26', '{pc,ps5,xbox,switch}'),
  ('00000000-0000-4000-8000-000000000206', 'fortnite', 'Fortnite', '{pc,ps5,xbox,switch}'),
  ('00000000-0000-4000-8000-000000000207', 'call-of-duty-warzone', 'Call of Duty: Warzone', '{pc,ps5,xbox}'),
  ('00000000-0000-4000-8000-000000000208', 'tekken-8', 'Tekken 8', '{pc,ps5,xbox}'),
  ('00000000-0000-4000-8000-000000000209', 'mortal-kombat-1', 'Mortal Kombat 1', '{pc,ps5,xbox,switch}'),
  ('00000000-0000-4000-8000-000000000210', 'apex-legends', 'Apex Legends', '{pc,ps5,xbox}'),
  ('00000000-0000-4000-8000-000000000211', 'dota-2', 'Dota 2', '{pc}'),
  ('00000000-0000-4000-8000-000000000212', 'marvel-rivals', 'Marvel Rivals', '{pc,ps5,xbox}'),
  ('00000000-0000-4000-8000-000000000213', 'gran-turismo-7', 'Gran Turismo 7', '{ps5}'),
  ('00000000-0000-4000-8000-000000000214', 'assetto-corsa-competizione', 'Assetto Corsa Competizione', '{pc,sim_racing}'),
  ('00000000-0000-4000-8000-000000000215', 'beat-saber', 'Beat Saber', '{vr}'),
  ('00000000-0000-4000-8000-000000000216', 'mario-kart-world', 'Mario Kart World', '{switch}');

-- Cafes -------------------------------------------------------------------------------------------
-- Coordinates are the area centres (08 gives none per cafe); maps_url is derived from them.
-- whatsapp is null for every sample cafe: India has no reserved fictional mobile range, so any
-- number here could belong to a real subscriber and the website publishes it as `telephone`.

insert into public.cafes (id, slug, name, area_id, status, address_line, lat, lng, description, amenities, whatsapp, maps_url) values
  (
    '00000000-0000-4000-8000-000000000301', 'pixel-den-koramangala', 'Pixel Den',
    '00000000-0000-4000-8000-000000000101', 'live', '12, 5th Block, Koramangala', 12.9352, 77.6245,
    'A 24-seat PC and PS5 cafe on 5th Block, a short walk from the Koramangala bus stand. Standard and Premium PC rows face each other, and the PS5 lounge sits in a separate room with couches. Open past midnight on Fridays and Saturdays.',
    '{ac,food,late-night}', null, 'https://maps.google.com/?q=12.9352,77.6245'
  ),
  (
    '00000000-0000-4000-8000-000000000302', 'frame-rate-indiranagar', 'Frame Rate',
    '00000000-0000-4000-8000-000000000102', 'live', '100 Feet Road, Indiranagar', 12.9784, 77.6408,
    'Sixteen high-refresh PCs and two sim racing rigs above a cafe on 100 Feet Road. The rigs have direct-drive wheels, load-cell pedals and triple screens. Food and coffee come from the kitchen downstairs.',
    '{ac,cafe,parking}', null, 'https://maps.google.com/?q=12.9784,77.6408'
  ),
  (
    '00000000-0000-4000-8000-000000000303', 'respawn-room-hsr', 'Respawn Room',
    '00000000-0000-4000-8000-000000000103', 'live', '27th Main, HSR Layout Sector 1', 12.9116, 77.6389,
    'A neighbourhood cafe in HSR Layout Sector 1 with twenty Standard PCs, six PS5 setups and a closed five-seat squad room. The squad room has its own door and air conditioning. Parking is on the street outside.',
    '{ac,private-room,food}', null, 'https://maps.google.com/?q=12.9116,77.6389'
  ),
  (
    '00000000-0000-4000-8000-000000000304', 'overclock-lounge-whitefield', 'Overclock Lounge',
    '00000000-0000-4000-8000-000000000104', 'live', 'ITPL Main Road, Whitefield', 12.9698, 77.7500,
    'Ten Elite PCs with OLED monitors and a two-headset VR bay near ITPL. Seats are spaced for tournaments and the floor has a small streaming corner. Weekends run past midnight.',
    '{ac,streaming-setup,tournament-ready,late-night,parking}', null, 'https://maps.google.com/?q=12.9698,77.75'
  ),
  (
    '00000000-0000-4000-8000-000000000305', 'side-quest-jayanagar', 'Side Quest',
    '00000000-0000-4000-8000-000000000106', 'live', '4th Block, Jayanagar', 12.9308, 77.5838,
    'A console-only cafe in 4th Block with six PS5 setups, two Xbox Series X stations and a Nintendo Switch corner. Groups of friends and families are the usual crowd. Closes at 23:30 every day.',
    '{ac,food,wheelchair-access}', null, 'https://maps.google.com/?q=12.9308,77.5838'
  ),
  (
    '00000000-0000-4000-8000-000000000306', 'clutch-arena-marathahalli', 'Clutch Arena',
    '00000000-0000-4000-8000-000000000105', 'live', 'Outer Ring Road, Marathahalli', 12.9591, 77.6974,
    'A 34-seat esports venue on Outer Ring Road with a ten-PC tournament stage. Standard PC rows take walk-ins; the stage is booked for scrims and community cups. Open until 04:00 on Fridays and Saturdays.',
    '{ac,tournament-ready,streaming-setup,late-night,parking}', null, 'https://maps.google.com/?q=12.9591,77.6974'
  );

-- Images: three picsum placeholders per cafe, seeded with <cafe-slug>-<n>.

insert into public.cafe_images (id, cafe_id, url, alt, sort_order)
select
  format('00000000-0000-4000-8000-0000000005%s%s', right(c.id::text, 1), n)::uuid,
  c.id,
  format('https://picsum.photos/seed/%s-%s/1200/800', c.slug, n),
  format('%s, photo %s', c.name, n),
  n - 1
from public.cafes c
cross join generate_series(1, 3) as n;

-- Hours: Sun-Thu 10:00-23:00 and Fri-Sat 10:00-02:00 overnight, except Side Quest (daily
-- 11:00-23:30, no overnight) and Clutch Arena (Fri-Sat 10:00-04:00 overnight).

insert into public.cafe_hours (cafe_id, weekday, opens_at, closes_at, is_overnight)
select
  c.id,
  d.weekday,
  case when c.slug = 'side-quest-jayanagar' then time '11:00' else time '10:00' end,
  case
    when c.slug = 'side-quest-jayanagar' then time '23:30'
    when d.weekday in (5, 6) and c.slug = 'clutch-arena-marathahalli' then time '04:00'
    when d.weekday in (5, 6) then time '02:00'
    else time '23:00'
  end,
  c.slug <> 'side-quest-jayanagar' and d.weekday in (5, 6)
from public.cafes c
cross join generate_series(0, 6) as d (weekday);

-- Station tiers ------------------------------------------------------------------------------------

insert into public.station_tiers (id, cafe_id, kind, name, description, hourly_rate_paise, specs, sort_order) values
  -- Pixel Den
  ('00000000-0000-4000-8000-000000000311', '00000000-0000-4000-8000-000000000301', 'pc', 'Standard PC', 'Everyday competitive PCs on 165 Hz monitors.', 8000, '{"gpu": "RTX 4060", "refresh_rate": "165 Hz"}', 0),
  ('00000000-0000-4000-8000-000000000312', '00000000-0000-4000-8000-000000000301', 'pc', 'Premium PC', 'Higher-end PCs on 240 Hz monitors.', 12000, '{"gpu": "RTX 5070", "refresh_rate": "240 Hz"}', 1),
  ('00000000-0000-4000-8000-000000000313', '00000000-0000-4000-8000-000000000301', 'ps5', 'PS5 Lounge', 'PS5 consoles on 55-inch 4K screens in a separate room.', 15000, '{"display": "55\" 4K"}', 2),
  -- Frame Rate
  ('00000000-0000-4000-8000-000000000321', '00000000-0000-4000-8000-000000000302', 'pc', 'Pro PC', 'Tournament-grade PCs on 360 Hz monitors.', 11000, '{"gpu": "RTX 5070 Ti", "refresh_rate": "360 Hz"}', 0),
  ('00000000-0000-4000-8000-000000000322', '00000000-0000-4000-8000-000000000302', 'sim_racing', 'Sim Rig', 'Direct-drive racing rigs with triple screens.', 30000, '{"wheel": "Fanatec", "display": "Triple screen"}', 1),
  -- Respawn Room
  ('00000000-0000-4000-8000-000000000331', '00000000-0000-4000-8000-000000000303', 'pc', 'Standard PC', 'Everyday competitive PCs on 144 Hz monitors.', 7000, '{"gpu": "RTX 4060", "refresh_rate": "144 Hz"}', 0),
  ('00000000-0000-4000-8000-000000000332', '00000000-0000-4000-8000-000000000303', 'ps5', 'PS5', 'PS5 consoles on 4K TVs.', 14000, '{"display": "4K TV"}', 1),
  ('00000000-0000-4000-8000-000000000333', '00000000-0000-4000-8000-000000000303', 'pc', 'Private Squad Room', 'Five high-end PCs in a closed room for one squad.', 15000, '{"gpu": "RTX 5080", "refresh_rate": "240 Hz", "room": "Closed room"}', 2),
  -- Overclock Lounge
  ('00000000-0000-4000-8000-000000000341', '00000000-0000-4000-8000-000000000304', 'pc', 'Elite PC', 'High-end PCs on 240 Hz OLED monitors.', 13000, '{"gpu": "RTX 5080", "refresh_rate": "240 Hz", "panel": "OLED"}', 0),
  ('00000000-0000-4000-8000-000000000342', '00000000-0000-4000-8000-000000000304', 'vr', 'VR Bay', 'Roomscale VR with Quest 3 headsets.', 25000, '{"headset": "Quest 3", "tracking": "Roomscale"}', 1),
  -- Side Quest
  ('00000000-0000-4000-8000-000000000351', '00000000-0000-4000-8000-000000000305', 'ps5', 'PS5', 'PS5 consoles on 4K TVs.', 15000, '{"display": "4K TV"}', 0),
  ('00000000-0000-4000-8000-000000000352', '00000000-0000-4000-8000-000000000305', 'xbox', 'Xbox', 'Xbox Series X consoles.', 14000, '{"console": "Series X"}', 1),
  ('00000000-0000-4000-8000-000000000353', '00000000-0000-4000-8000-000000000305', 'switch', 'Switch Corner', 'Nintendo Switch 2 consoles with local multiplayer.', 10000, '{"console": "Switch 2"}', 2),
  -- Clutch Arena
  ('00000000-0000-4000-8000-000000000361', '00000000-0000-4000-8000-000000000306', 'pc', 'Standard PC', 'Everyday competitive PCs on 165 Hz monitors.', 7500, '{"gpu": "RTX 4060", "refresh_rate": "165 Hz"}', 0),
  ('00000000-0000-4000-8000-000000000362', '00000000-0000-4000-8000-000000000306', 'pc', 'Stage PC', 'Ten PCs on the tournament stage, 360 Hz monitors.', 14000, '{"gpu": "RTX 5080", "refresh_rate": "360 Hz", "setting": "Tournament stage"}', 1);

-- Stations: id 00000000-0000-4000-8000-00000003CTSS and label <prefix>-SS, SS = 01..count.

insert into public.stations (id, tier_id, label)
select
  format('00000000-0000-4000-8000-00000003%s%s%s', t.cafe_no, t.tier_no, lpad(n::text, 2, '0'))::uuid,
  t.tier_id,
  format('%s-%s', t.prefix, lpad(n::text, 2, '0'))
from (
  values
    (1, 1, '00000000-0000-4000-8000-000000000311'::uuid, 'STD', 12),
    (1, 2, '00000000-0000-4000-8000-000000000312'::uuid, 'PRM', 8),
    (1, 3, '00000000-0000-4000-8000-000000000313'::uuid, 'PS5', 4),
    (2, 1, '00000000-0000-4000-8000-000000000321'::uuid, 'PRO', 16),
    (2, 2, '00000000-0000-4000-8000-000000000322'::uuid, 'SIM', 2),
    (3, 1, '00000000-0000-4000-8000-000000000331'::uuid, 'STD', 20),
    (3, 2, '00000000-0000-4000-8000-000000000332'::uuid, 'PS5', 6),
    (3, 3, '00000000-0000-4000-8000-000000000333'::uuid, 'ROOM', 5),
    (4, 1, '00000000-0000-4000-8000-000000000341'::uuid, 'ELT', 10),
    (4, 2, '00000000-0000-4000-8000-000000000342'::uuid, 'VR', 2),
    (5, 1, '00000000-0000-4000-8000-000000000351'::uuid, 'PS5', 6),
    (5, 2, '00000000-0000-4000-8000-000000000352'::uuid, 'XBX', 2),
    (5, 3, '00000000-0000-4000-8000-000000000353'::uuid, 'NSW', 2),
    (6, 1, '00000000-0000-4000-8000-000000000361'::uuid, 'STD', 24),
    (6, 2, '00000000-0000-4000-8000-000000000362'::uuid, 'STG', 10)
) as t (cafe_no, tier_no, tier_id, prefix, station_count)
cross join lateral generate_series(1, t.station_count) as n;

-- Games per cafe -----------------------------------------------------------------------------------

insert into public.cafe_games (cafe_id, game_id)
select c.id, g.id
from (
  values
    ('pixel-den-koramangala', '{valorant,counter-strike-2,ea-sports-fc-26,gta-v,fortnite,marvel-rivals}'::text[]),
    ('frame-rate-indiranagar', '{valorant,counter-strike-2,apex-legends,dota-2,assetto-corsa-competizione}'),
    ('respawn-room-hsr', '{valorant,counter-strike-2,call-of-duty-warzone,ea-sports-fc-26,tekken-8,gta-v}'),
    ('overclock-lounge-whitefield', '{valorant,counter-strike-2,apex-legends,beat-saber,marvel-rivals}'),
    ('side-quest-jayanagar', '{gta-vi,gta-v,ea-sports-fc-26,mortal-kombat-1,gran-turismo-7,mario-kart-world}'),
    ('clutch-arena-marathahalli', '{valorant,counter-strike-2,dota-2,apex-legends,fortnite,call-of-duty-warzone}')
) as cg (cafe_slug, game_slugs)
join public.cafes c on c.slug = cg.cafe_slug
join public.games g on g.slug = any (cg.game_slugs);

-- Promotions ---------------------------------------------------------------------------------------
-- Instants are given in IST (+05:30) and stored as timestamptz (ADR 0009).

insert into public.promotions (id, slug, title, summary, body, image_url, cafe_id, city_id, starts_at, ends_at, cta_label, cta_url, is_featured, is_published) values
  (
    '00000000-0000-4000-8000-000000000401', 'gta-vi-launch-night', 'GTA VI launch night',
    'Play Grand Theft Auto VI from the first minute at Side Quest, Jayanagar, with PS5 seats held for squads.',
    E'Grand Theft Auto VI releases on 19 November 2026 and Side Quest has it on every PS5 from 6 pm. Seats go in 30-minute blocks, so hold one for your squad in the app before you come.\n\nThe cafe runs past its usual closing time for the night. Snacks and drinks are on the menu as usual; the Switch corner stays open for anyone waiting.',
    'https://picsum.photos/seed/gta-vi-launch-night/1200/800',
    '00000000-0000-4000-8000-000000000305', '00000000-0000-4000-8000-000000000001',
    timestamptz '2026-11-19 18:00:00+05:30', timestamptz '2026-11-20 02:00:00+05:30',
    'Reserve a PS5 in the app', 'gog://cafe/side-quest-jayanagar', true, true
  ),
  (
    '00000000-0000-4000-8000-000000000402', 'squad-saturdays', 'Squad Saturdays: book 5 seats, play 6 hours',
    'Hold five seats of one tier for a Saturday and play six hours for the price of five at listed Bengaluru cafes.',
    E'Every Saturday until the end of January, a squad booking of five seats of the same tier gets its sixth hour free at every cafe listed in Bengaluru. The discount is applied at the counter when you check in.\n\nBook the six hours in the app as usual; the hold works the same way. One offer per squad per day.',
    'https://picsum.photos/seed/squad-saturdays/1200/800',
    null, '00000000-0000-4000-8000-000000000001',
    timestamptz '2026-11-07 00:00:00+05:30', timestamptz '2027-01-31 23:59:00+05:30',
    'Find a cafe', '/cafes', true, true
  ),
  (
    '00000000-0000-4000-8000-000000000403', 'valorant-community-cup', 'Valorant community cup, December qualifiers',
    'Open five-a-side Valorant qualifiers on the Clutch Arena stage over the first weekend of December.',
    E'Sixteen teams play best-of-one qualifiers on Saturday and the top eight return on Sunday for best-of-three brackets. Matches run on the Stage PCs; the Standard PC rows stay open for walk-ins.\n\nRegistration is at the counter and closes on 3 December. Teams need five players and one substitute; the rules follow the current competitive ruleset.',
    'https://picsum.photos/seed/valorant-community-cup/1200/800',
    '00000000-0000-4000-8000-000000000306', '00000000-0000-4000-8000-000000000001',
    timestamptz '2026-12-05 11:00:00+05:30', timestamptz '2026-12-06 22:00:00+05:30',
    'Read the rules', '/events/valorant-community-cup', false, true
  ),
  (
    '00000000-0000-4000-8000-000000000404', 'late-night-pc-rates', 'Late-night PC rates at Pixel Den',
    'Standard and Premium PCs at Pixel Den cost less after 11 pm on Fridays and Saturdays.',
    E'From 11 pm on Fridays and Saturdays, Standard PCs are Rs 60 an hour and Premium PCs Rs 90 an hour until closing at 2 am. The lower rate is applied at the counter to the hours after 11 pm.\n\nHold your seats in the app at the listed rate; the difference is settled when you pay at the cafe.',
    'https://picsum.photos/seed/late-night-pc-rates/1200/800',
    '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000001',
    timestamptz '2026-11-04 00:00:00+05:30', null,
    null, null, false, true
  );
