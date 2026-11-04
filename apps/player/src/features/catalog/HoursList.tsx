import { groupHoursForDisplay, type OpeningHours } from '@gog/domain';
import { StyleSheet, View } from 'react-native';

import { Text } from '../../components/Text';
import { spacing } from '../../lib/theme';

export interface HoursListProps {
  hours: OpeningHours[];
}

/** Opening hours grouped by the domain: "Mon – Thu · 11:00 am – 11:00 pm". */
export function HoursList({ hours }: HoursListProps) {
  const groups = groupHoursForDisplay(hours);
  return (
    <View style={styles.list}>
      {groups.map((group, index) => (
        <View key={`${group.days}-${index}`} style={styles.row}>
          <Text tone="muted" style={styles.days}>
            {group.days}
          </Text>
          <Text style={styles.hours}>{group.hours}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  days: {
    width: 96,
  },
  hours: {
    flex: 1,
  },
});
