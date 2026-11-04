import { StyleSheet, View } from 'react-native';

import { Skeleton } from '../../components/Skeleton';
import { radii, spacing } from '../../lib/theme';

export function CafeDetailSkeleton() {
  return (
    <View style={styles.root}>
      <Skeleton height={220} radius={radii.lg} />
      <Skeleton width="70%" height={28} />
      <Skeleton width="50%" height={16} />
      <Skeleton height={16} />
      <Skeleton height={16} />
      <Skeleton width="80%" height={16} />
      <Skeleton height={120} radius={radii.lg} />
      <Skeleton height={120} radius={radii.lg} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
});
