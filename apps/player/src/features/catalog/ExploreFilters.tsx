import { STATION_KIND_LABELS, StationKind, type Area, type Slug } from '@gog/domain';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Chip } from '../../components/Chip';
import { Text } from '../../components/Text';
import { spacing } from '../../lib/theme';
import type { ExploreFilter } from './queries';

export interface ExploreFiltersProps {
  areas: Area[];
  filter: ExploreFilter;
  onChange: (filter: ExploreFilter) => void;
}

/** The Explore header: city, area chips and station-kind chips (spec 06, `(tabs)/index.tsx`). */
export function ExploreFilters({ areas, filter, onChange }: ExploreFiltersProps) {
  const selectArea = (areaSlug: Slug | null) => {
    onChange({ ...filter, areaSlug });
  };
  const selectKind = (kind: StationKind | null) => {
    onChange({ ...filter, kind });
  };

  return (
    <View style={styles.root}>
      <View style={styles.titles}>
        <Text variant="title">Bengaluru</Text>
        <Text tone="muted">Find a cafe, hold seats for your squad, confirm.</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        <Chip
          label="All areas"
          selected={filter.areaSlug === null}
          onPress={() => {
            selectArea(null);
          }}
        />
        {areas.map((area) => (
          <Chip
            key={area.id}
            label={area.name}
            selected={filter.areaSlug === area.slug}
            onPress={() => {
              selectArea(filter.areaSlug === area.slug ? null : area.slug);
            }}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        <Chip
          label="Everything"
          selected={filter.kind === null}
          onPress={() => {
            selectKind(null);
          }}
        />
        {StationKind.options.map((kind) => (
          <Chip
            key={kind}
            label={STATION_KIND_LABELS[kind]}
            selected={filter.kind === kind}
            onPress={() => {
              selectKind(filter.kind === kind ? null : kind);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  titles: {
    gap: spacing.xs,
  },
  row: {
    gap: spacing.sm,
  },
});
