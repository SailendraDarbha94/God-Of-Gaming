-- Reference data (docs/spec/03-database.md, Reference data; docs/spec/iteration-2/03-database.md, M0).
--
-- The three cities, the 18 Bengaluru areas and the 16 games, moved here from supabase/seed.sql with
-- the same UUIDs, which the fixtures in @gog/data share (packages/data/src/fixtures/bengaluru.ts).
-- Every project needs them, production included, and production never runs the seed: without these
-- rows catalog.listAreas('bengaluru') returns nothing (areas are readable only when their city is
-- live), no cafe could be given an area and the partner app's games picker would be empty. They are
-- real public geography and real game titles, not fictional rows. Only Bengaluru is live (ADR 0006).
--
-- `on conflict do nothing` (on the id or a slug) leaves a row a database already has untouched, so
-- applying this to a database seeded before the move changes nothing. A cafe's missing game is added
-- in the Supabase dashboard before its visit (docs/spec/iteration-2/07-launch.md), not here.

-- Cities ------------------------------------------------------------------------------------------

insert into public.cities (id, slug, name, state, lat, lng, is_live) values
  ('00000000-0000-4000-8000-000000000001', 'bengaluru', 'Bengaluru', 'Karnataka', 12.9716, 77.5946, true),
  ('00000000-0000-4000-8000-000000000002', 'pune', 'Pune', 'Maharashtra', 18.5204, 73.8567, false),
  ('00000000-0000-4000-8000-000000000003', 'hyderabad', 'Hyderabad', 'Telangana', 17.3850, 78.4867, false)
on conflict do nothing;

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
  ('00000000-0000-4000-8000-000000000118', '00000000-0000-4000-8000-000000000001', 'basavanagudi', 'Basavanagudi', 12.9416, 77.5750)
on conflict do nothing;

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
  ('00000000-0000-4000-8000-000000000216', 'mario-kart-world', 'Mario Kart World', '{switch}')
on conflict do nothing;
