-- Enumerations (docs/spec/03-database.md, Enums; mirrored by @gog/domain enums.ts).

create type public.station_kind as enum ('pc', 'ps5', 'xbox', 'switch', 'vr', 'sim_racing', 'other');
comment on type public.station_kind is 'What a station is: PC, console, VR, sim rig, or other.';

create type public.cafe_status as enum ('draft', 'live', 'paused');
comment on type public.cafe_status is 'Only live cafes are visible to clients and bookable.';

create type public.booking_status as enum ('held', 'confirmed', 'cancelled', 'expired', 'completed', 'no_show');
comment on type public.booking_status is 'held -> confirmed | cancelled | expired; confirmed -> cancelled | completed | no_show.';

create type public.booking_source as enum ('app', 'counter');

create type public.cafe_member_role as enum ('owner', 'staff');
