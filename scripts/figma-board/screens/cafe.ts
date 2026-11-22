/**
 * app/cafe/[slug].tsx
 *
 * app/cafes/[slug].tsx and app/cafes/index.tsx are redirects for links from the website
 * (to this route, or to Explore) and draw nothing, so they have no frame here.
 */
import { Phone, Screen } from '@board/chrome';
import {
  AmenityChips,
  CafeDetailSkeleton,
  Gallery,
  GameChips,
  HoursList,
  TierRow,
} from '@board/components/catalog';
import { EmptyState, ErrorState, Notice, Section } from '@board/components/shared';
import { box, spacing, type Frame, type Screen as BoardScreen } from '@board/dsl';
import type { Scenario } from '@board/scenario';
import { Button, Text, type Link } from '@board/ui';
import { isBookable, type Cafe, type StationTier } from '@gog/domain';

const ROUTE = 'app/cafe/[slug].tsx';

/** The loaded branch (lines 73-129): `book` stands in for each tier row's onBook. */
function CafeDetail(data: Cafe, book: (tier: StationTier) => Link | undefined): Frame {
  const bookable = isBookable(data);

  return Screen(
    { scroll: true },
    Gallery({ images: data.images }),
    box(
      { name: 'heading', gap: spacing.sm, mt: spacing.lg, align: 'start' },
      Text(data.name, { variant: 'title' }),
      Text(`${data.area.name} · ${data.addressLine}`, { tone: 'muted' }),
      // Linking.openURL(mapsUrlFor(data)) leaves the app: no link.
      Button({ label: 'Open in Maps', variant: 'secondary' }),
    ),

    Text(data.description, { mt: spacing.lg, mb: spacing.md }),
    AmenityChips({ amenities: data.amenities }),

    bookable
      ? null
      : box(
          { name: 'notice', mt: spacing.lg },
          Notice({ message: 'This cafe is not taking bookings right now.' }),
        ),

    Section({ title: 'Hours' }, HoursList({ hours: data.hours })),

    Section(
      { title: 'Stations and prices' },
      data.tiers.map((tier) => {
        const link = book(tier);
        return TierRow({ tier, bookable, ...(link === undefined ? {} : { book: link }) });
      }),
    ),

    Section({ title: 'Games' }, GameChips({ games: data.games })),
  );
}

/** The `notFound` fragment (lines 30-44), returned for a malformed slug and for a cafe the catalog does not return. */
function NotFound(): Frame {
  return Screen(
    {},
    EmptyState({
      title: 'This cafe is not listed',
      message: 'It may have paused bookings, or the link is out of date.',
      actionLabel: 'Back to Explore',
      action: { go: 'explore', goHow: 'replace' },
    }),
  );
}

export function screens(s: Scenario): BoardScreen[] {
  const data = s.cafe;

  // No sample cafe is unbookable. isBookable() is false only for a cafe that is not live (which the
  // catalog never returns) or one with no stations in any tier, so this is the story's cafe with
  // every tier's station count at zero: the one shape of data that reaches the branch.
  const withoutStations: Cafe = {
    ...data,
    tiers: data.tiers.map((tier) => ({ ...tier, stationCount: 0 })),
  };

  return [
    Phone({
      key: 'cafe',
      name: 'Cafe',
      route: ROUTE,
      note: 'Pixel Den, opened from its card on Explore. The query has data and the cafe is bookable; "Book" on Standard PC opens Pick a time.',
      mode: 'full',
      // app/_layout.tsx sets title '' for the route; the loaded branch sets it to the cafe's name.
      header: { title: data.name, back: true },
      content: CafeDetail(data, (tier) =>
        tier.id === s.tier.id ? { go: 'pick', goHow: 'push' } : undefined,
      ),
    }),

    Phone({
      key: 'cafe-loading',
      name: 'Cafe · loading',
      route: ROUTE,
      note: 'The first moments after tapping a cafe, while the catalog request is pending (and again after "Try again"). The header has no title yet.',
      header: { title: '', back: true },
      content: Screen({ scroll: true }, CafeDetailSkeleton()),
    }),

    Phone({
      key: 'cafe-error',
      name: 'Cafe · could not load',
      route: ROUTE,
      note: 'The catalog request failed, after one automatic retry. "Try again" refetches, which brings the skeleton back.',
      header: { title: '', back: true },
      content: Screen(
        {},
        ErrorState({
          title: 'Could not load this cafe',
          // cafe.refetch(): with no data yet the query goes back to pending, so the skeleton shows.
          retry: { go: 'cafe-loading', goHow: 'replace' },
        }),
      ),
    }),

    Phone({
      key: 'cafe-not-found',
      name: 'Cafe · not listed',
      route: ROUTE,
      note: 'The slug in the link is malformed, or the catalog has no live cafe under it (a paused cafe, an old link). "Back to Explore" replaces this screen with the first tab.',
      header: { title: 'Cafe', back: true },
      content: NotFound(),
    }),

    Phone({
      key: 'cafe-not-bookable',
      name: 'Cafe · not taking bookings',
      route: ROUTE,
      note: 'A live cafe with no stations in any tier: a notice appears under the amenities and every tier says "Not bookable". No sample cafe is in this state; this is Pixel Den with its station counts set to zero.',
      mode: 'full',
      header: { title: withoutStations.name, back: true },
      content: CafeDetail(withoutStations, () => undefined),
    }),
  ];
}
