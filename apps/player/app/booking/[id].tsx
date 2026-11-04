import { canTransition } from '@gog/domain';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Countdown } from '../../src/components/Countdown';
import { EmptyState } from '../../src/components/EmptyState';
import { ErrorState } from '../../src/components/ErrorState';
import { Notice } from '../../src/components/Notice';
import { Screen } from '../../src/components/Screen';
import { Skeleton } from '../../src/components/Skeleton';
import { Text } from '../../src/components/Text';
import { BookingSummary } from '../../src/features/booking/BookingSummary';
import { confirmCancel } from '../../src/features/booking/confirmCancel';
import {
  BOOKING_CANCEL_LABELS,
  bookingErrorMessage,
  rateChangedNotice,
} from '../../src/features/booking/copy';
import { effectiveStatus, hasLapsed } from '../../src/features/booking/history';
import { BookingIdParams } from '../../src/features/booking/params';
import { useBooking, useCancel, useConfirm } from '../../src/features/booking/queries';
import { StatusBadge } from '../../src/features/booking/StatusBadge';
import { clock, nowIso } from '../../src/lib/clock';
import { useRouteParams } from '../../src/lib/params';
import { radii, spacing } from '../../src/lib/theme';
import { useSession } from '../../src/providers/SessionProvider';

export default function BookingScreen() {
  const router = useRouter();
  const params = useRouteParams(BookingIdParams);
  const id = params.ok ? params.value.id : null;
  const quoted = params.ok ? params.value.quoted : undefined;
  const { session, isRestoring } = useSession();
  const { query, booking } = useBooking(id, session !== null);
  const confirm = useConfirm();
  const cancel = useCancel();
  const [notice, setNotice] = useState<string | null>(null);

  const { refetch } = query;
  const onHoldExpired = useCallback(() => {
    void refetch();
  }, [refetch]);

  const goToBookings = () => {
    router.replace('/bookings');
  };

  if (id === null) {
    return (
      <Screen>
        <EmptyState title="No such booking" actionLabel="My bookings" onAction={goToBookings} />
      </Screen>
    );
  }
  if (!isRestoring && session === null) {
    return (
      <Screen>
        <EmptyState
          title="Sign in to see this booking"
          actionLabel="Sign in"
          onAction={() => {
            router.push('/auth/sign-in');
          }}
        />
      </Screen>
    );
  }
  if (isRestoring || query.isPending) {
    return (
      <Screen scroll>
        <View style={styles.skeletons}>
          <Skeleton width="40%" height={20} radius={radii.pill} />
          <Skeleton width="70%" height={28} />
          <Skeleton height={200} radius={radii.lg} />
        </View>
      </Screen>
    );
  }
  if (query.isError) {
    return (
      <Screen>
        <ErrorState title="Could not load this booking" onRetry={onHoldExpired} />
      </Screen>
    );
  }
  if (booking === null) {
    return (
      <Screen>
        <EmptyState
          title="We could not find that booking"
          message="It may belong to another account."
          actionLabel="My bookings"
          onAction={goToBookings}
        />
      </Screen>
    );
  }

  // The clock (corrected by the server's responses) decides what the screen reads as; the server's
  // status decides what can be done. A lapsed hold still offers Confirm: confirm_booking is the
  // verdict, and its `invalid_state` answer marks the hold expired in the cache.
  const now = nowIso();
  const lapsed = hasLapsed(booking, now);
  const status = effectiveStatus(booking, now);
  const busy = confirm.isPending || cancel.isPending;
  const canConfirm = canTransition(booking.status, 'confirmed');
  const canCancel = canTransition(booking.status, 'cancelled');
  const rateNotice =
    quoted !== undefined && quoted !== booking.totalPaise
      ? rateChangedNotice(quoted, booking)
      : null;

  const onConfirm = () => {
    setNotice(null);
    confirm.mutate(booking.id, {
      onError: (error) => {
        setNotice(bookingErrorMessage(error));
      },
    });
  };
  const onCancel = () => {
    confirmCancel(booking, () => {
      setNotice(null);
      cancel.mutate(booking.id, {
        onError: (error) => {
          setNotice(bookingErrorMessage(error));
        },
      });
    });
  };

  return (
    <Screen scroll>
      <StatusBadge status={status} />
      <Text variant="title" style={styles.title}>
        {booking.cafe.name}
      </Text>

      {booking.status === 'held' && !lapsed && booking.holdExpiresAt !== null ? (
        <Card style={styles.countdown}>
          <Text tone="muted">Seats held for</Text>
          <Countdown
            until={booking.holdExpiresAt}
            now={clock.now}
            variant="title"
            tone="accent"
            onExpire={onHoldExpired}
          />
          <Text variant="caption" tone="muted">
            Confirm before the timer runs out or the seats go back on sale.
          </Text>
        </Card>
      ) : null}

      {booking.status === 'held' && lapsed ? (
        <View style={styles.message}>
          <Notice message="The timer has run out. Confirm now in case the seats are still yours, or pick a time again." />
        </View>
      ) : null}

      {rateNotice === null ? null : (
        <View style={styles.message}>
          <Notice message={rateNotice} />
        </View>
      )}

      {booking.status === 'confirmed' ? (
        <View style={styles.message}>
          <Notice
            tone="success"
            message="You are booked. Show this screen at the counter and pay there."
          />
        </View>
      ) : null}

      {booking.status === 'expired' ? (
        <View style={styles.message}>
          <Notice
            tone="error"
            message="This hold expired before it was confirmed. Pick a time again."
          />
        </View>
      ) : null}

      <BookingSummary
        cafeName={booking.cafe.name}
        tierName={booking.tier.name}
        kind={booking.tier.kind}
        startsAt={booking.startsAt}
        endsAt={booking.endsAt}
        seatCount={booking.seatCount}
        hourlyRatePaise={booking.hourlyRatePaise}
        totalPaise={booking.totalPaise}
        seatLabels={booking.seats
          .filter((seat) => seat.releasedAt === null)
          .map((seat) => seat.stationLabel)}
      />

      {notice === null ? null : (
        <View style={styles.message}>
          <Notice tone="error" message={notice} />
        </View>
      )}

      <View style={styles.actions}>
        {canConfirm ? (
          <Button
            label="Confirm"
            onPress={onConfirm}
            loading={confirm.isPending}
            disabled={busy}
            block
          />
        ) : (
          <Button label="My bookings" onPress={goToBookings} variant="secondary" block />
        )}
        {canCancel && (booking.status === 'held' || booking.status === 'confirmed') ? (
          <Button
            label={BOOKING_CANCEL_LABELS[booking.status]}
            variant="ghost"
            onPress={onCancel}
            loading={cancel.isPending}
            disabled={busy}
            block
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  skeletons: {
    gap: spacing.md,
  },
  title: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  countdown: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  message: {
    marginBottom: spacing.lg,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
});
