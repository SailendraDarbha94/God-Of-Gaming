import type { LocalDate } from '@gog/domain';
import { ScrollView, StyleSheet } from 'react-native';

import { Chip } from '../../components/Chip';
import { spacing } from '../../lib/theme';
import type { DayOption } from './slots';

export interface DayPickerProps {
  options: DayOption[];
  value: LocalDate | null;
  onChange: (day: LocalDate) => void;
}

export function DayPicker({ options, value, onChange }: DayPickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => (
        <Chip
          key={option.day}
          label={option.label}
          selected={option.day === value}
          onPress={() => {
            onChange(option.day);
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
