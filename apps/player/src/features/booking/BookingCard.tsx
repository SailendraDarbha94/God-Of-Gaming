import type { Booking, IsoInstant } from '@gog/domain';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Text } from '../../components/Text';
import { formatSeats, formatSession } from '../../lib/format';
import { spacing } from '../../lib/theme';
import { BOOKING_CANCEL_LABELS } from './copy';
import { effectiveStatus, isCancellable } from './history';
import { StatusBadge } from './StatusBadge';

export interface BookingCardProps {
  booking: Booking;
  /** The instant the list was split at, so badge and actions agree with the sections. */
  now: IsoInstant;
  onPress: () => void;
  /** Shown only while the session reads live (not lapsed) and has not ended. */
  onCancel?: () => void;
  cancelling?: boolean;
}

export function BookingCard({
  booking,
  now,
  onPress,
  onCancel,
  cancelling = false,
}: BookingCardProps) {
  const status = effectiveStatus(booking, now);
  const cancellable = onCancel !== undefined && isCancellable(booking, now);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${booking.cafe.name}, ${booking.tier.name}, ${formatSession(booking.startsAt, booking.endsAt)}`}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text variant="subheading" style={styles.title}>
            {booking.cafe.name}
          </Text>
          <StatusBadge status={status} />
        </View>
        <Text tone="muted">{booking.tier.name}</Text>
        <Text>{formatSession(booking.startsAt, booking.endsAt)}</Text>
        <Text variant="caption" tone="muted">
          {formatSeats(booking.seatCount)}
        </Text>
        {cancellable && (status === 'held' || status === 'confirmed') ? (
          <Button
            label={BOOKING_CANCEL_LABELS[status]}
            variant="ghost"
            onPress={onCancel}
            loading={cancelling}
            style={styles.cancel}
          />
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
  },
  card: {
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
  cancel: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
});
