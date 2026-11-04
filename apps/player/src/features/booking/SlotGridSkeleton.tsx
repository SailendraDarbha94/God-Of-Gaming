import { StyleSheet, View } from 'react-native';

import { Skeleton } from '../../components/Skeleton';
import { radii, spacing } from '../../lib/theme';

export interface SlotGridSkeletonProps {
  /** How many cells to draw, normally the number of starts the domain predicts for the day. */
  count: number;
}

export function SlotGridSkeleton({ count }: SlotGridSkeletonProps) {
  const cells = Array.from({ length: Math.max(count, 3) }, (_, index) => index);
  return (
    <View style={styles.grid}>
      {cells.map((index) => (
        <View key={index} style={styles.cell}>
          <Skeleton height={64} radius={radii.md} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    width: '31%',
    flexGrow: 1,
  },
});
