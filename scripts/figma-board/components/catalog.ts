/**
 * features/catalog: AmenityChips, GameChips, HoursList, Gallery, TierRow, CafeCardSkeleton and
 * CafeDetailSkeleton. CafeCard and ExploreFilters have their own files.
 */
import { formatRatePerHour, formatStations } from '@app/lib/format';
import { DEVICE, ScrollView } from '@board/chrome';
import { CAFE_CARD_COVER_HEIGHT } from '@board/components/CafeCard';
import { Skeleton } from '@board/components/shared';
import { box, colors, radii, row, spacing, type Frame, type TextNode } from '@board/dsl';
import { Button, Card, Chip, Text, type Link } from '@board/ui';
import {
  STATION_KIND_LABELS,
  amenityLabel,
  groupHoursForDisplay,
  type CafeImage,
  type Game,
  type OpeningHours,
  type StationTier,
} from '@gog/domain';

/** A percentage width worked out against the content width of the view it sits in. */
const percent = (share: number, of: number): number => Math.round(of * share) / 100;

// ----- AmenityChips.tsx -----

export interface AmenityChipsProps {
  amenities: string[];
}

/** Amenity slugs with the domain's labels, as static chips. Nothing at all when the cafe lists none. */
export function AmenityChips({ amenities }: AmenityChipsProps): Frame | null {
  if (amenities.length === 0) {
    return null;
  }
  return row(
    { name: 'AmenityChips', wrap: true, gap: spacing.sm },
    amenities.map((amenity) => Chip({ label: amenityLabel(amenity) })),
  );
}

// ----- GameChips.tsx -----

export interface GameChipsProps {
  games: Game[];
}

export function GameChips({ games }: GameChipsProps): Frame | TextNode {
  if (games.length === 0) {
    return Text('No games listed yet.', { tone: 'muted' });
  }
  return row(
    { name: 'GameChips', wrap: true, gap: spacing.sm },
    games.map((game) => Chip({ label: game.name })),
  );
}

// ----- HoursList.tsx -----

export interface HoursListProps {
  hours: OpeningHours[];
}

/** Opening hours grouped by the domain: "Mon – Thu · 11:00 am – 11:00 pm". */
export function HoursList({ hours }: HoursListProps): Frame {
  const groups = groupHoursForDisplay(hours);
  return box(
    { name: 'HoursList', gap: spacing.sm },
    groups.map((group) =>
      row(
        { name: 'row', gap: spacing.md },
        Text(group.days, { tone: 'muted', w: 96 }),
        Text(group.hours, { grow: true }),
      ),
    ),
  );
}

// ----- Gallery.tsx -----

export interface GalleryProps {
  images: CafeImage[];
}

const GALLERY_HEIGHT = 220;

/** A horizontal, paged strip of the cafe's photos; a solid block when it has none yet. */
export function Gallery({ images }: GalleryProps): Frame {
  // useWindowDimensions().width
  const width = DEVICE.w;
  const pageWidth = width - spacing.lg * 2;

  if (images.length === 0) {
    return box({
      name: 'Gallery (fallback)',
      w: pageWidth,
      h: GALLERY_HEIGHT,
      radius: radii.lg,
      fill: colors.surfaceRaised,
    });
  }

  // FlatList horizontal: one page per image, an ItemSeparatorComponent between each two.
  return ScrollView(
    { horizontal: true, style: { name: 'Gallery' } },
    images.map((item, index) => [
      index === 0 ? null : box({ name: 'separator', w: spacing.sm }),
      box({
        name: 'image',
        w: pageWidth,
        h: GALLERY_HEIGHT,
        radius: radii.lg,
        fill: colors.surfaceRaised,
        image: item.url,
      }),
    ]),
  );
}

// ----- TierRow.tsx -----

export interface TierRowProps {
  tier: StationTier;
  /** The cafe takes bookings at all; a tier with no stations stays unbookable regardless. */
  bookable: boolean;
  /** onBook: where "Book" leads in the prototype. Ignored while the button is disabled. */
  book?: Link;
}

export function TierRow({ tier, bookable, book }: TierRowProps): Frame {
  const specs = Object.values(tier.specs).join(' · ');
  const canBook = bookable && tier.stationCount > 0;

  return Card(
    { name: 'TierRow' },
    row(
      { name: 'header', justify: 'between', align: 'start', gap: spacing.md, mb: spacing.sm },
      box(
        { name: 'titles', grow: true, gap: spacing.xs },
        Text(tier.name, { variant: 'subheading' }),
        Text(`${STATION_KIND_LABELS[tier.kind]} · ${formatStations(tier.stationCount)}`, {
          variant: 'caption',
          tone: 'muted',
        }),
      ),
      Text(formatRatePerHour(tier.hourlyRatePaise), { variant: 'subheading', tone: 'accent' }),
    ),
    specs === '' ? null : Text(specs, { variant: 'caption' }),
    tier.description === null
      ? null
      : Text(tier.description, { variant: 'caption', tone: 'muted' }),
    Button({
      label: canBook ? 'Book' : 'Not bookable',
      disabled: !canBook,
      variant: 'secondary',
      style: { mt: spacing.md },
      // A disabled Pressable does not fire onPress.
      ...(canBook ? book : {}),
    }),
  );
}

// ----- CafeCardSkeleton.tsx -----

/**
 * What the skeleton's percentages are of: the Explore list's row (the only place it is used,
 * app/(tabs)/index.tsx: paddingHorizontal lg), inside the card's 1 pt border and the body's padding.
 */
const CAFE_CARD_BODY_WIDTH = DEVICE.w - spacing.lg * 2 - 1 * 2 - spacing.lg * 2;

export function CafeCardSkeleton(): Frame {
  return Card(
    { flush: true, name: 'CafeCardSkeleton' },
    Skeleton({ height: CAFE_CARD_COVER_HEIGHT, radius: 0 }),
    box(
      { name: 'body', pad: spacing.lg, gap: spacing.sm },
      Skeleton({ width: percent(60, CAFE_CARD_BODY_WIDTH), height: 20 }),
      Skeleton({ width: percent(35, CAFE_CARD_BODY_WIDTH), height: 14 }),
      Skeleton({ width: percent(80, CAFE_CARD_BODY_WIDTH), height: 14 }),
    ),
  );
}

// ----- CafeDetailSkeleton.tsx -----

/** What the skeleton's percentages are of: a padded <Screen scroll> (app/cafe/[slug].tsx). */
const CAFE_DETAIL_WIDTH = DEVICE.w - spacing.lg * 2;

export function CafeDetailSkeleton(): Frame {
  return box(
    { name: 'CafeDetailSkeleton', gap: spacing.md },
    Skeleton({ height: 220, radius: radii.lg }),
    Skeleton({ width: percent(70, CAFE_DETAIL_WIDTH), height: 28 }),
    Skeleton({ width: percent(50, CAFE_DETAIL_WIDTH), height: 16 }),
    Skeleton({ height: 16 }),
    Skeleton({ height: 16 }),
    Skeleton({ width: percent(80, CAFE_DETAIL_WIDTH), height: 16 }),
    Skeleton({ height: 120, radius: radii.lg }),
    Skeleton({ height: 120, radius: radii.lg }),
  );
}
