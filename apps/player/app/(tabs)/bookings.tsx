import type { Booking } from '@gog/domain';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';

import { EmptyState } from '../../src/components/EmptyState';
import { ErrorState } from '../../src/components/ErrorState';
import { Notice } from '../../src/components/Notice';
import { Screen } from '../../src/components/Screen';
import { Skeleton } from '../../src/components/Skeleton';
import { Text } from '../../src/components/Text';
import { BookingCard } from '../../src/features/booking/BookingCard';
import { confirmCancel } from '../../src/features/booking/confirmCancel';
import { bookingErrorMessage } from '../../src/features/booking/copy';
import { splitBookings } from '../../src/features/booking/history';
import { useCancel, useMyBookings } from '../../src/features/booking/queries';
import { radii, spacing } from '../../src/lib/theme';
import { useNow } from '../../src/lib/useNow';
import { useSession } from '../../src/providers/SessionProvider';

export default function BookingsScreen() {
  const router = useRouter();
  const { session, isRestoring } = useSession();
  const bookings = useMyBookings(session !== null);
  const cancel = useCancel();
  const [notice, setNotice] = useState<string | null>(null);
  const now = useNow();

  if (!isRestoring && session === null) {
    return (
      <Screen>
        <EmptyState
          title="Sign in to see your bookings"
          message="Your holds and confirmed sessions show up here."
          actionLabel="Sign in"
          onAction={() => {
            router.push('/auth/sign-in');
          }}
        />
      </Screen>
    );
  }

  if (isRestoring || bookings.isPending) {
    return (
      <Screen>
        <View style={styles.skeletons}>
          <Skeleton height={120} radius={radii.lg} />
          <Skeleton height={120} radius={radii.lg} />
        </View>
      </Screen>
    );
  }

  if (bookings.isError) {
    return (
      <Screen>
        <ErrorState
          title="Could not load your bookings"
          onRetry={() => {
            void bookings.refetch();
          }}
        />
      </Screen>
    );
  }

  const { upcoming, past } = splitBookings(bookings.data, now);
  const sections = [
    { title: 'Upcoming', data: upcoming },
    { title: 'Past', data: past },
  ].filter((section) => section.data.length > 0);

  const cancelBooking = (booking: Booking) => {
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
    <Screen padded={false}>
      <SectionList
        sections={sections}
        keyExtractor={(booking) => booking.id}
        renderSectionHeader={({ section }) => (
          <Text variant="label" tone="muted" style={styles.sectionTitle}>
            {section.title.toUpperCase()}
          </Text>
        )}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            now={now}
            onPress={() => {
              router.push({ pathname: '/booking/[id]', params: { id: item.id } });
            }}
            onCancel={() => {
              cancelBooking(item);
            }}
            cancelling={cancel.isPending && cancel.variables === item.id}
          />
        )}
        ListHeaderComponent={notice === null ? undefined : <Notice tone="error" message={notice} />}
        ListEmptyComponent={
          <EmptyState
            title="No bookings yet"
            message="Find a cafe in Explore and hold seats for your squad."
            actionLabel="Explore cafes"
            onAction={() => {
              router.replace('/');
            }}
          />
        }
        ItemSeparatorComponent={Gap}
        SectionSeparatorComponent={Gap}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
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
    gap: spacing.sm,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
  },
  gap: {
    height: spacing.sm,
  },
  skeletons: {
    gap: spacing.md,
  },
});
