import { z } from 'zod';
import { CafeStatus, StationKind } from './enums';
import { HHMM, IsoInstant, Paise, Slug, Uuid, Weekday } from './scalars';

/**
 * Catalog and people entities (spec 02 §Entities). Field names are camelCase here and snake_case
 * in Postgres; the mappers in `@gog/data` translate and validate with these schemas.
 */

export const City = z.object({
  id: Uuid,
  slug: Slug,
  name: z.string(),
  state: z.string(),
  isLive: z.boolean(),
});
export type City = z.infer<typeof City>;

export const Area = z.object({
  id: Uuid,
  citySlug: Slug,
  slug: Slug,
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
});
export type Area = z.infer<typeof Area>;

/** One weekday's hours; `isOvernight` means `closesAt` falls on the next calendar day. */
export const OpeningHours = z.object({
  weekday: Weekday,
  opensAt: HHMM,
  closesAt: HHMM,
  isOvernight: z.boolean(),
});
export type OpeningHours = z.infer<typeof OpeningHours>;

export const StationTier = z.object({
  id: Uuid,
  cafeId: Uuid,
  kind: StationKind,
  name: z.string(),
  description: z.string().nullable(),
  hourlyRatePaise: Paise,
  stationCount: z.number().int().nonnegative(),
  specs: z.record(z.string(), z.string()),
  sortOrder: z.number().int(),
});
export type StationTier = z.infer<typeof StationTier>;

export const Game = z.object({
  id: Uuid,
  slug: Slug,
  name: z.string(),
  kinds: z.array(StationKind),
});
export type Game = z.infer<typeof Game>;

export const CafeImage = z.object({
  id: Uuid,
  url: z.string(),
  alt: z.string(),
  sortOrder: z.number().int(),
});
export type CafeImage = z.infer<typeof CafeImage>;

export const CafeRef = z.object({
  id: Uuid,
  slug: Slug,
  name: z.string(),
});
export type CafeRef = z.infer<typeof CafeRef>;

export const PlaceRef = z.object({
  slug: Slug,
  name: z.string(),
});
export type PlaceRef = z.infer<typeof PlaceRef>;

export const CafeCard = z.object({
  id: Uuid,
  slug: Slug,
  name: z.string(),
  city: PlaceRef,
  area: PlaceRef,
  coverImageUrl: z.string().nullable(),
  kinds: z.array(StationKind),
  fromHourlyRatePaise: Paise.nullable(),
  stationCount: z.number().int().nonnegative(),
});
export type CafeCard = z.infer<typeof CafeCard>;

export const Cafe = z.object({
  id: Uuid,
  slug: Slug,
  name: z.string(),
  status: CafeStatus,
  city: PlaceRef,
  area: PlaceRef,
  addressLine: z.string(),
  lat: z.number(),
  lng: z.number(),
  description: z.string(),
  amenities: z.array(z.string()),
  whatsapp: z.string().nullable(),
  mapsUrl: z.string().nullable(),
  images: z.array(CafeImage),
  hours: z.array(OpeningHours),
  tiers: z.array(StationTier),
  games: z.array(Game),
});
export type Cafe = z.infer<typeof Cafe>;

export const Promotion = z.object({
  id: Uuid,
  slug: Slug,
  title: z.string(),
  summary: z.string(),
  body: z.string(),
  imageUrl: z.string().nullable(),
  cafe: CafeRef.nullable(),
  citySlug: Slug.nullable(),
  startsAt: IsoInstant,
  endsAt: IsoInstant.nullable(),
  ctaLabel: z.string().nullable(),
  ctaUrl: z.string().nullable(),
  isFeatured: z.boolean(),
});
export type Promotion = z.infer<typeof Promotion>;

/** `phone` is digits without `+` (`919999900001`), exactly as GoTrue stores `auth.users.phone`. */
export const Profile = z.object({
  id: Uuid,
  displayName: z.string().nullable(),
  phone: z.string().nullable(),
  homeCitySlug: Slug.nullable(),
});
export type Profile = z.infer<typeof Profile>;

/** Derived, not stored: a cafe takes bookings when it is live and has at least one station. */
export function isBookable(cafe: Cafe): boolean {
  return cafe.status === 'live' && cafe.tiers.some((tier) => tier.stationCount > 0);
}

/** The cafe's own map link, or a Google Maps search on its coordinates when it has none. */
export function mapsUrlFor(cafe: Pick<Cafe, 'mapsUrl' | 'lat' | 'lng'>): string {
  return cafe.mapsUrl ?? `https://maps.google.com/?q=${cafe.lat},${cafe.lng}`;
}
