import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radii, spacing } from '../lib/theme';

export interface CardProps extends ViewProps {
  /** Removes the inner padding, for cards whose first child is an image. */
  flush?: boolean;
}

export function Card({ flush = false, style, ...rest }: CardProps) {
  return <View style={[styles.card, !flush && styles.padded, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.lg,
  },
});
