import type { BookingStatus } from '@gog/domain';
import { StyleSheet, View } from 'react-native';

import { Text, type TextTone } from '../../components/Text';
import { colors, radii, spacing } from '../../lib/theme';
import { BOOKING_STATUS_LABELS } from './copy';

export interface StatusBadgeProps {
  status: BookingStatus;
}

const TONES: Readonly<Record<BookingStatus, TextTone>> = {
  held: 'accent',
  confirmed: 'success',
  cancelled: 'muted',
  expired: 'danger',
  completed: 'muted',
  no_show: 'danger',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <View style={styles.badge}>
      <Text variant="label" tone={TONES[status]}>
        {BOOKING_STATUS_LABELS[status].toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
  },
});
