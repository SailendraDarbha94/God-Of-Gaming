import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../../src/components/Button';
import { EmptyState } from '../../../src/components/EmptyState';
import { ErrorState } from '../../../src/components/ErrorState';
import { Screen } from '../../../src/components/Screen';
import { Section } from '../../../src/components/Section';
import { Skeleton } from '../../../src/components/Skeleton';
import { Text } from '../../../src/components/Text';
import { DayPicker } from '../../../src/features/booking/DayPicker';
import { DurationPicker } from '../../../src/features/booking/DurationPicker';
import { BookStepParams } from '../../../src/features/booking/params';
import { SeatStepper } from '../../../src/features/booking/SeatStepper';
import { SlotGrid } from '../../../src/features/booking/SlotGrid';
import { SlotGridSkeleton } from '../../../src/features/booking/SlotGridSkeleton';
import { useBookingDraft } from '../../../src/features/booking/useBookingDraft';
import { useCafe } from '../../../src/features/catalog/queries';
import { formatRatePerHour, formatSeats } from '../../../src/lib/format';
import { useRouteParams } from '../../../src/lib/params';
import { spacing } from '../../../src/lib/theme';

export default function BookStepScreen() {
  const router = useRouter();
  const params = useRouteParams(BookStepParams);
  const cafe = useCafe(params.ok ? params.value.cafe : null);
  const tier =
    params.ok && cafe.data !== undefined && cafe.data !== null
      ? (cafe.data.tiers.find((candidate) => candidate.id === params.value.tierId) ?? null)
      : null;
  const draft = useBookingDraft(cafe.data ?? null, tier);

  const backToExplore = () => {
    router.replace('/');
  };

  if (!params.ok) {
    return (
      <Screen>
        <EmptyState
          title="Nothing to book here"
          message="The link is incomplete."
          actionLabel="Back to Explore"
          onAction={backToExplore}
        />
      </Screen>
    );
  }
  if (cafe.isPending) {
    return (
      <Screen scroll>
        <View style={styles.skeletons}>
          <Skeleton width="60%" height={28} />
          <Skeleton width="40%" height={16} />
          <Skeleton height={44} />
          <Skeleton height={44} />
        </View>
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
  const { day, selectedSlot, availability } = draft;

  const continueToReview = () => {
    if (selectedSlot === null) {
      return;
    }
    router.push({
      pathname: '/book/[tierId]/review',
      params: {
        tierId: tier.id,
        cafe: data.slug,
        startsAt: selectedSlot.startsAt,
        duration: draft.durationMinutes,
        seats: draft.seatCount,
      },
    });
  };

  return (
    <Screen scroll>
      <Text variant="heading">{tier.name}</Text>
      <Text tone="muted">
        {data.name} · {formatRatePerHour(tier.hourlyRatePaise)} per seat
      </Text>

      <Section title="Day">
        {draft.days.length === 0 ? (
          <Text tone="muted">No opening day fits this duration in the next two weeks.</Text>
        ) : (
          <DayPicker options={draft.days} value={day} onChange={draft.setDay} />
        )}
      </Section>

      <Section title="Duration">
        <DurationPicker value={draft.durationMinutes} onChange={draft.setDurationMinutes} />
      </Section>

      <Section title="Seats">
        <SeatStepper value={draft.seatCount} max={draft.maxSeats} onChange={draft.setSeatCount} />
      </Section>

      <Section title="Start time">
        {day === null ? null : availability.isPending ? (
          <SlotGridSkeleton count={draft.expectedSlotCount} />
        ) : availability.isError ? (
          <ErrorState
            title="Could not load free seats"
            onRetry={() => {
              void availability.refetch();
            }}
          />
        ) : draft.slots.length === 0 ? (
          <Text tone="muted">No slots left on this day. Try another day or a shorter session.</Text>
        ) : (
          <View style={styles.slots}>
            {draft.slots.some((slot) => slot.selectable) ? null : (
              <Text tone="muted">
                No start has {formatSeats(draft.seatCount)} free. Try fewer seats or another day.
              </Text>
            )}
            <SlotGrid
              day={day}
              slots={draft.slots}
              value={selectedSlot?.startsAt ?? null}
              onChange={draft.setStartsAt}
            />
          </View>
        )}
      </Section>

      <Button
        label="Continue"
        onPress={continueToReview}
        disabled={selectedSlot === null}
        block
        style={styles.continue}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  skeletons: {
    gap: spacing.md,
  },
  slots: {
    gap: spacing.sm,
  },
  continue: {
    marginTop: spacing.xl,
  },
});
