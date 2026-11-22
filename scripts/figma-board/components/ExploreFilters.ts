/** features/catalog/ExploreFilters.tsx */
import { ScrollView } from '@board/chrome';
import { box, spacing, type Frame } from '@board/dsl';
import type { ExploreFilter } from '@board/scenario';
import { Chip, Text } from '@board/ui';
import { STATION_KIND_LABELS, StationKind, type Area } from '@gog/domain';

export interface ExploreFiltersProps {
  areas: Area[];
  filter: ExploreFilter;
}

/** The Explore header: city, area chips and station-kind chips. */
export function ExploreFilters({ areas, filter }: ExploreFiltersProps): Frame {
  return box(
    { name: 'ExploreFilters', gap: spacing.md, pad: [0, 0, spacing.sm, 0] },
    box(
      { name: 'titles', gap: spacing.xs },
      Text('Bengaluru', { variant: 'title' }),
      Text('Find a cafe, hold seats for your squad, confirm.', { tone: 'muted' }),
    ),
    ScrollView(
      { horizontal: true, content: { gap: spacing.sm } },
      Chip({ label: 'All areas', selected: filter.areaSlug === null }),
      areas.map((area) => Chip({ label: area.name, selected: filter.areaSlug === area.slug })),
    ),
    ScrollView(
      { horizontal: true, content: { gap: spacing.sm } },
      Chip({ label: 'Everything', selected: filter.kind === null }),
      StationKind.options.map((kind) =>
        Chip({ label: STATION_KIND_LABELS[kind], selected: filter.kind === kind }),
      ),
    ),
  );
}
