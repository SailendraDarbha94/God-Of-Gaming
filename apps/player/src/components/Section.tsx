import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../lib/theme';
import { Text } from './Text';

export interface SectionProps {
  title: string;
  children: ReactNode;
}

/** A titled block of a detail screen. */
export function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text variant="label" tone="muted" accessibilityRole="header">
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
});
