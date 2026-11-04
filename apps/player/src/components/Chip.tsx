import { Pressable, StyleSheet } from 'react-native';

import { colors, radii, spacing } from '../lib/theme';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  /** Without a handler the chip is a static tag. */
  onPress?: () => void;
}

export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole={onPress === undefined ? 'text' : 'button'}
      accessibilityState={{ selected }}
      onPress={onPress}
      disabled={onPress === undefined}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      <Text variant="caption" style={selected ? styles.selectedLabel : styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  selected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    color: colors.text,
  },
  selectedLabel: {
    color: colors.onAccent,
    fontWeight: '600',
  },
});
