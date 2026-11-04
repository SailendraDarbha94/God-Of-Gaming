import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { EmptyState } from '../../src/components/EmptyState';
import { ErrorState } from '../../src/components/ErrorState';
import { Screen } from '../../src/components/Screen';
import { CafeCard } from '../../src/features/catalog/CafeCard';
import { CafeCardSkeleton } from '../../src/features/catalog/CafeCardSkeleton';
import { ExploreFilters } from '../../src/features/catalog/ExploreFilters';
import { useAreas, useCafes, type ExploreFilter } from '../../src/features/catalog/queries';
import { colors, spacing } from '../../src/lib/theme';

const SKELETON_COUNT = 3;

export default function ExploreScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<ExploreFilter>({ areaSlug: null, kind: null });
  const [refreshing, setRefreshing] = useState(false);
  const areas = useAreas();
  const cafes = useCafes(filter);

  const refresh = () => {
    setRefreshing(true);
    void Promise.all([areas.refetch(), cafes.refetch()]).finally(() => {
      setRefreshing(false);
    });
  };

  const retry = () => {
    void cafes.refetch();
  };

  return (
    <Screen padded={false} safeTop>
      <FlatList
        data={cafes.data ?? []}
        keyExtractor={(cafe) => cafe.id}
        renderItem={({ item }) => (
          <CafeCard
            cafe={item}
            onPress={() => {
              router.push({ pathname: '/cafe/[slug]', params: { slug: item.slug } });
            }}
          />
        )}
        ListHeaderComponent={
          <ExploreFilters areas={areas.data ?? []} filter={filter} onChange={setFilter} />
        }
        ListEmptyComponent={
          cafes.isPending ? (
            <View style={styles.skeletons}>
              {Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <CafeCardSkeleton key={index} />
              ))}
            </View>
          ) : cafes.isError ? (
            <ErrorState title="Could not load cafes" onRetry={retry} />
          ) : (
            <EmptyState
              title="No cafes here yet"
              message="Try another area or kind of station. New cafes are being signed up."
            />
          )
        }
        ItemSeparatorComponent={Gap}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />
        }
      />
    </Screen>
  );
}

function Gap() {
  return <View style={styles.gap} />;
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  gap: {
    height: spacing.md,
  },
  skeletons: {
    gap: spacing.md,
  },
});
