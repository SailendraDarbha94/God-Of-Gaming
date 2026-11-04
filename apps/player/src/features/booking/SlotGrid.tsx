import {
  formatIstDate,
  formatIstTime,
  instantToIst,
  type IsoInstant,
  type LocalDate,
} from '@gog/domain';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../../components/Text';
import { colors, radii, spacing } from '../../lib/theme';
import type { SlotOption } from './slots';

export interface SlotGridProps {
  /** The opening day being shown; slots after midnight carry the next calendar date. */
  day: LocalDate;
  slots: SlotOption[];
  value: IsoInstant | null;
  onChange: (startsAt: IsoInstant) => void;
}

export function SlotGrid({ day, slots, value, onChange }: SlotGridProps) {
  return (
    <View style={styles.grid}>
      {slots.map((slot) => {
        const selected = slot.startsAt === value;
        const crossesMidnight = instantToIst(slot.startsAt).day !== day;
        // Both the next date (spec 06) and the free count: a late-night squad needs the number too.
        const detail = [
          crossesMidnight ? formatIstDate(slot.startsAt) : null,
          `${slot.freeSeats} free`,
        ]
          .filter((part) => part !== null)
          .join(' · ');
        return (
          <Pressable
            key={slot.startsAt}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled: !slot.selectable }}
            accessibilityLabel={`${formatIstTime(slot.startsAt, { style: 'short' })}, ${detail}`}
            disabled={!slot.selectable}
            onPress={() => {
              onChange(slot.startsAt);
            }}
            style={({ pressed }) => [
              styles.cell,
              selected && styles.selected,
              pressed && styles.pressed,
              !slot.selectable && styles.disabled,
            ]}
          >
            <Text variant="subheading" style={selected ? styles.selectedText : undefined}>
              {formatIstTime(slot.startsAt, { style: 'short' })}
            </Text>
            <Text variant="caption" style={selected ? styles.selectedText : styles.detail}>
              {detail}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    width: '31%',
    flexGrow: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: spacing.xs,
  },
  selected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  selectedText: {
    color: colors.onAccent,
  },
  detail: {
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.35,
  },
});
