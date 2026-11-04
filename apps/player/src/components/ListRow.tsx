import { Pressable, StyleSheet, View } from 'react-native';

import { colors, spacing, touchTarget } from '../lib/theme';
import { Text } from './Text';

export interface ListRowProps {
  label: string;
  value?: string;
  hint?: string;
  /** Makes the row a link; a chevron shows it leads somewhere. */
  onPress?: () => void;
}

export function ListRow({ label, value, hint, onPress }: ListRowProps) {
  const content = (
    <View style={styles.row}>
      <View style={styles.texts}>
        <Text>{label}</Text>
        {hint === undefined ? null : (
          <Text variant="caption" tone="subtle">
            {hint}
          </Text>
        )}
      </View>
      {value === undefined ? null : <Text tone="muted">{value}</Text>}
      {onPress === undefined ? null : (
        <Text tone="subtle" accessibilityElementsHidden>
          ›
        </Text>
      )}
    </View>
  );

  if (onPress === undefined) {
    return content;
  }
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touchTarget,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.7,
  },
});
