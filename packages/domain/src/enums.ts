import { z } from 'zod';

export const StationKind = z.enum(['pc', 'ps5', 'xbox', 'switch', 'vr', 'sim_racing', 'other']);
export type StationKind = z.infer<typeof StationKind>;

export const CafeStatus = z.enum(['draft', 'live', 'paused']);
export type CafeStatus = z.infer<typeof CafeStatus>;

export const BookingStatus = z.enum([
  'held',
  'confirmed',
  'cancelled',
  'expired',
  'completed',
  'no_show',
]);
export type BookingStatus = z.infer<typeof BookingStatus>;

export const BookingSource = z.enum(['app', 'counter']);
export type BookingSource = z.infer<typeof BookingSource>;

/** Display names for station kinds; the apps render these, the database never sees them. */
export const STATION_KIND_LABELS: Readonly<Record<StationKind, string>> = {
  pc: 'PC',
  ps5: 'PlayStation 5',
  xbox: 'Xbox',
  switch: 'Nintendo Switch',
  vr: 'VR',
  sim_racing: 'Sim racing',
  other: 'Other',
};

/**
 * Copy for the amenity slugs of spec 08. Amenities stay free text in the catalog (`text[]`, edited
 * in the dashboard), so this is a lookup, not an enum: both apps label the known slugs the same way
 * and read anything new through `amenityLabel`'s fallback until it is added here.
 */
export const AMENITY_LABELS: Readonly<Record<string, string>> = {
  ac: 'Air conditioning',
  parking: 'Parking',
  food: 'Food',
  cafe: 'Cafe',
  'private-room': 'Private room',
  'streaming-setup': 'Streaming setup',
  'tournament-ready': 'Tournament ready',
  'wheelchair-access': 'Wheelchair access',
  'late-night': 'Open late',
};

/** Known amenity slugs get their label; an unknown slug reads as words (`rooftop-seating` → "Rooftop seating"). */
export function amenityLabel(slug: string): string {
  const known = Object.hasOwn(AMENITY_LABELS, slug) ? AMENITY_LABELS[slug] : undefined;
  if (known !== undefined) {
    return known;
  }
  const words = slug.replace(/-/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
