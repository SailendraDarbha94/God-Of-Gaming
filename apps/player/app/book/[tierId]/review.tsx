import {
  BOOKING_RULES,
  addMinutes,
  quote,
  validateBookingRequest,
  type BookingRequest,
} from '@gog/domain';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../../src/components/Button';
import { EmptyState } from '../../../src/components/EmptyState';
import { ErrorState } from '../../../src/components/ErrorState';
import { Notice } from '../../../src/components/Notice';
import { Screen } from '../../../src/components/Screen';
import { Skeleton } from '../../../src/components/Skeleton';
import { Text } from '../../../src/components/Text';
import { BookingSummary } from '../../../src/features/booking/BookingSummary';
import { BOOKING_ERROR_COPY, bookingErrorMessage } from '../../../src/features/booking/copy';
import { ReviewParams } from '../../../src/features/booking/params';
import { useCreateHold } from '../../../src/features/booking/queries';
import { useCafe } from '../../../src/features/catalog/queries';
import { nowIso } from '../../../src/lib/clock';
import { useRouteParams } from '../../../src/lib/params';
import { radii, spacing } from '../../../src/lib/theme';
import { useSession } from '../../../src/providers/SessionProvider';

export default function ReviewScreen() {
  const router = useRouter();
  const params = useRouteParams(ReviewParams);
  const { requireSession } = useSession();
  const createHold = useCreateHold();
  const [notice, setNotice] = useState<string | null>(null);
  const cafe = useCafe(params.ok ? params.value.cafe : null);
  const tier =
    params.ok && cafe.data !== undefined && cafe.data !== null
      ? (cafe.data.tiers.find((candidate) => candidate.id === params.value.tierId) ?? null)
      : null;

  const backToExplore = () => {
    router.replace('/');
  };

  if (!params.ok) {
    return (
      <Screen>
        <EmptyState
          title="Nothing to review"
          message="Pick a time first."
          actionLabel="Back to Explore"
          onAction={backToExplore}
        />
      </Screen>
    );
  }
  if (cafe.isPending) {
    return (
      <Screen scroll>
        <Skeleton height={220} radius={radii.lg} />
      </Screen>
    );
  }
  if (cafe.isError) {
    return (
      <Screen>
        <ErrorState
          onRetry={() => {
            void cafe.refetch();
          }}
        />
      </Screen>
    );
  }
  if (cafe.data === null || tier === null) {
    return (
      <Screen>
        <EmptyState
          title="This station tier is no longer listed"
          actionLabel="Back to Explore"
          onAction={backToExplore}
        />
      </Screen>
    );
  }

  const { data } = cafe;
  const { startsAt, duration, seats } = params.value;
  const endsAt = addMinutes(startsAt, duration);
  const price = quote({
    hourlyRatePaise: tier.hourlyRatePaise,
    durationMinutes: duration,
    seatCount: seats,
  });
  const request: BookingRequest = {
    cafeId: data.id,
    tierId: tier.id,
    startsAt,
    durationMinutes: duration,
    seatCount: seats,
  };

  const holdSeats = async () => {
    setNotice(null);
    // The rules ran on step 1 too, but time has passed since: the lead time may have lapsed.
    const validation = validateBookingRequest(request, nowIso());
    if (!validation.ok) {
      setNotice(BOOKING_ERROR_COPY.invalid_request);
      return;
    }
    const session = await requireSession();
    if (session === null) {
      return;
    }
    try {
      const held = await createHold.mutateAsync(validation.value);
      // The hold is priced from the live rate; the review used the cached catalog rate. When a
      // counter changed the price in between, the hold screen says so rather than switching numbers.
      router.replace({
        pathname: '/booking/[id]',
        params:
          held.totalPaise === price.totalPaise
            ? { id: held.id }
            : { id: held.id, quoted: price.totalPaise },
      });
    } catch (error) {
      setNotice(bookingErrorMessage(error));
    }
  };

  return (
    <Screen scroll>
      <Text variant="heading">Review your hold</Text>
      <Text tone="muted" style={styles.lead}>
        Seats are held for {BOOKING_RULES.holdMinutes} minutes while you confirm. You pay at the
        cafe.
      </Text>
      <BookingSummary
        cafeName={data.name}
        tierName={tier.name}
        kind={tier.kind}
        startsAt={startsAt}
        endsAt={endsAt}
        seatCount={seats}
        hourlyRatePaise={tier.hourlyRatePaise}
        totalPaise={price.totalPaise}
      />
      {notice === null ? null : (
        <View style={styles.notice}>
          <Notice tone="error" message={notice} />
        </View>
      )}
      <Button
        label="Hold seats"
        onPress={() => {
          void holdSeats();
        }}
        loading={createHold.isPending}
        block
        style={styles.action}
      />
      <Button
        label="Change time"
        variant="ghost"
        onPress={() => {
          router.back();
        }}
        disabled={createHold.isPending}
        block
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  notice: {
    marginTop: spacing.lg,
  },
  action: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
});
