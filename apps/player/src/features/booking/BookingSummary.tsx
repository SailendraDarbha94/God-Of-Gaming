import {
  STATION_KIND_LABELS,
  formatPaise,
  type IsoInstant,
  type Paise,
  type StationKind,
} from '@gog/domain';
import { StyleSheet, View } from 'react-native';

import { Card } from '../../components/Card';
import { Text } from '../../components/Text';
import { formatRatePerHour, formatSeats, formatSession } from '../../lib/format';
import { spacing } from '../../lib/theme';

export interface BookingSummaryProps {
  cafeName: string;
  tierName: string;
  kind: StationKind;
  startsAt: IsoInstant;
  endsAt: IsoInstant;
  seatCount: number;
  hourlyRatePaise: Paise;
  totalPaise: Paise;
  /** Station labels once seats are allocated; absent on the review step. */
  seatLabels?: string[];
}

/** The facts of a booking, shared by the review step and the hold screen. */
export function BookingSummary({
  cafeName,
  tierName,
  kind,
  startsAt,
  endsAt,
  seatCount,
  hourlyRatePaise,
  totalPaise,
  seatLabels,
}: BookingSummaryProps) {
  return (
    <Card style={styles.card}>
      <Row label="Cafe" value={cafeName} />
      <Row label="Station" value={`${tierName} · ${STATION_KIND_LABELS[kind]}`} />
      <Row label="When" value={formatSession(startsAt, endsAt)} />
      <Row label="Seats" value={formatSeats(seatCount)} />
      {seatLabels === undefined || seatLabels.length === 0 ? null : (
        <Row label="Assigned" value={seatLabels.join(', ')} />
      )}
      <Row label="Rate" value={`${formatRatePerHour(hourlyRatePaise)} per seat`} />
      <View style={styles.total}>
        <Text variant="subheading">Total</Text>
        <Text variant="heading" tone="accent">
          {formatPaise(totalPaise)}
        </Text>
      </View>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text tone="muted" style={styles.label}>
        {label}
      </Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  label: {
    width: 80,
  },
  value: {
    flex: 1,
  },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.sm,
  },
});
