import { STATION_KIND_LABELS, type StationTier } from '@gog/domain';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Text } from '../../components/Text';
import { formatRatePerHour, formatStations } from '../../lib/format';
import { spacing } from '../../lib/theme';

export interface TierRowProps {
  tier: StationTier;
  /** The cafe takes bookings at all; a tier with no stations stays unbookable regardless. */
  bookable: boolean;
  onBook: () => void;
}

export function TierRow({ tier, bookable, onBook }: TierRowProps) {
  const specs = Object.values(tier.specs).join(' · ');
  const canBook = bookable && tier.stationCount > 0;

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.titles}>
          <Text variant="subheading">{tier.name}</Text>
          <Text variant="caption" tone="muted">
            {STATION_KIND_LABELS[tier.kind]} · {formatStations(tier.stationCount)}
          </Text>
        </View>
        <Text variant="subheading" tone="accent">
          {formatRatePerHour(tier.hourlyRatePaise)}
        </Text>
      </View>
      {specs === '' ? null : <Text variant="caption">{specs}</Text>}
      {tier.description === null ? null : (
        <Text variant="caption" tone="muted">
          {tier.description}
        </Text>
      )}
      <Button
        label={canBook ? 'Book' : 'Not bookable'}
        onPress={onBook}
        disabled={!canBook}
        variant="secondary"
        style={styles.button}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  titles: {
    flex: 1,
    gap: spacing.xs,
  },
  button: {
    marginTop: spacing.md,
  },
});
