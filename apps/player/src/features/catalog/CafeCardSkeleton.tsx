import { StyleSheet, View } from 'react-native';

import { Card } from '../../components/Card';
import { Skeleton } from '../../components/Skeleton';
import { spacing } from '../../lib/theme';
import { CAFE_CARD_COVER_HEIGHT } from './CafeCard';

export function CafeCardSkeleton() {
  return (
    <Card flush>
      <Skeleton height={CAFE_CARD_COVER_HEIGHT} radius={0} />
      <View style={styles.body}>
        <Skeleton width="60%" height={20} />
        <Skeleton width="35%" height={14} />
        <Skeleton width="80%" height={14} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
