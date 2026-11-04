import { isBookable, mapsUrlFor } from '@gog/domain';
import * as Linking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { EmptyState } from '../../src/components/EmptyState';
import { ErrorState } from '../../src/components/ErrorState';
import { Notice } from '../../src/components/Notice';
import { Screen } from '../../src/components/Screen';
import { Section } from '../../src/components/Section';
import { Text } from '../../src/components/Text';
import { AmenityChips } from '../../src/features/catalog/AmenityChips';
import { CafeDetailSkeleton } from '../../src/features/catalog/CafeDetailSkeleton';
import { Gallery } from '../../src/features/catalog/Gallery';
import { GameChips } from '../../src/features/catalog/GameChips';
import { HoursList } from '../../src/features/catalog/HoursList';
import { CafeSlugParams } from '../../src/features/catalog/params';
import { useCafe } from '../../src/features/catalog/queries';
import { TierRow } from '../../src/features/catalog/TierRow';
import { useRouteParams } from '../../src/lib/params';
import { spacing } from '../../src/lib/theme';

export default function CafeScreen() {
  const router = useRouter();
  const params = useRouteParams(CafeSlugParams);
  const slug = params.ok ? params.value.slug : null;
  const cafe = useCafe(slug);

  const notFound = (
    <>
      <Stack.Screen options={{ title: 'Cafe' }} />
      <Screen>
        <EmptyState
          title="This cafe is not listed"
          message="It may have paused bookings, or the link is out of date."
          actionLabel="Back to Explore"
          onAction={() => {
            router.replace('/');
          }}
        />
      </Screen>
    </>
  );

  if (slug === null) {
    return notFound;
  }
  if (cafe.isPending) {
    return (
      <Screen scroll>
        <CafeDetailSkeleton />
      </Screen>
    );
  }
  if (cafe.isError) {
    return (
      <Screen>
        <ErrorState
          title="Could not load this cafe"
          onRetry={() => {
            void cafe.refetch();
          }}
        />
      </Screen>
    );
  }
  const data = cafe.data;
  if (data === null) {
    return notFound;
  }

  const bookable = isBookable(data);
  const mapsUrl = mapsUrlFor(data);

  return (
    <>
      <Stack.Screen options={{ title: data.name }} />
      <Screen scroll>
        <Gallery images={data.images} />
        <View style={styles.heading}>
          <Text variant="title">{data.name}</Text>
          <Text tone="muted">
            {data.area.name} · {data.addressLine}
          </Text>
          <Button
            label="Open in Maps"
            variant="secondary"
            onPress={() => {
              void Linking.openURL(mapsUrl);
            }}
          />
        </View>

        <Text style={styles.description}>{data.description}</Text>
        <AmenityChips amenities={data.amenities} />

        {bookable ? null : (
          <View style={styles.notice}>
            <Notice message="This cafe is not taking bookings right now." />
          </View>
        )}

        <Section title="Hours">
          <HoursList hours={data.hours} />
        </Section>

        <Section title="Stations and prices">
          {data.tiers.map((tier) => (
            <TierRow
              key={tier.id}
              tier={tier}
              bookable={bookable}
              onBook={() => {
                router.push({
                  pathname: '/book/[tierId]',
                  params: { tierId: tier.id, cafe: data.slug },
                });
              }}
            />
          ))}
        </Section>

        <Section title="Games">
          <GameChips games={data.games} />
        </Section>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: spacing.sm,
    marginTop: spacing.lg,
    alignItems: 'flex-start',
  },
  description: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  notice: {
    marginTop: spacing.lg,
  },
});
