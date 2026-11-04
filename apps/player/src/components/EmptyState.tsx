import { StyleSheet, View } from 'react-native';

import { spacing } from '../lib/theme';
import { Button } from './Button';
import { Text } from './Text';

export interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.root}>
      <Text variant="subheading" style={styles.centered}>
        {title}
      </Text>
      {message === undefined ? null : (
        <Text tone="muted" style={styles.centered}>
          {message}
        </Text>
      )}
      {actionLabel !== undefined && onAction !== undefined ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  centered: {
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.md,
  },
});
