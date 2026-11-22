/** features/catalog/CafeCard.tsx */
import { formatRatePerHour, formatStations } from '@app/lib/format';
import { box, colors, row, spacing, type Frame } from '@board/dsl';
import { Card, Text, type Link } from '@board/ui';
import { STATION_KIND_LABELS, type CafeCard as CafeCardModel } from '@gog/domain';

export const CAFE_CARD_COVER_HEIGHT = 160;

export interface CafeCardProps extends Link {
  cafe: CafeCardModel;
}

export function CafeCard({ cafe, ...link }: CafeCardProps): Frame {
  const kinds = cafe.kinds.map((kind) => STATION_KIND_LABELS[kind]).join(' · ');
  const price =
    cafe.fromHourlyRatePaise === null
      ? 'Prices at the counter'
      : `from ${formatRatePerHour(cafe.fromHourlyRatePaise)}`;

  // The Pressable has no style of its own, so the card carries the link.
  return Card(
    { flush: true, name: 'CafeCard', ...link },
    cafe.coverImageUrl === null
      ? box({ name: 'cover (fallback)', h: CAFE_CARD_COVER_HEIGHT, fill: colors.surfaceRaised })
      : box({
          name: 'cover',
          h: CAFE_CARD_COVER_HEIGHT,
          fill: colors.surfaceRaised,
          image: cafe.coverImageUrl,
        }),
    box(
      { name: 'body', pad: spacing.lg, gap: spacing.xs },
      Text(cafe.name, { variant: 'subheading' }),
      Text(cafe.area.name, { variant: 'caption', tone: 'muted' }),
      kinds === '' ? null : Text(kinds, { variant: 'caption' }),
      row(
        { name: 'footer', justify: 'between', align: 'baseline', mt: spacing.sm },
        Text(price),
        Text(formatStations(cafe.stationCount), { variant: 'caption', tone: 'muted' }),
      ),
    ),
  );
}
