import type { Minutes } from '@gog/domain';
import { ScrollView, StyleSheet } from 'react-native';

import { Chip } from '../../components/Chip';
import { formatDuration } from '../../lib/format';
import { spacing } from '../../lib/theme';
import { durationOptions } from './slots';

export interface DurationPickerProps {
  value: Minutes;
  onChange: (minutes: Minutes) => void;
}

const OPTIONS = durationOptions();

export function DurationPicker({ value, onChange }: DurationPickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {OPTIONS.map((minutes) => (
        <Chip
          key={minutes}
          label={formatDuration(minutes)}
          selected={minutes === value}
          onPress={() => {
            onChange(minutes);
          }}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
  },
});
