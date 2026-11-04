import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '../lib/theme';
import { Text } from './Text';

export type NoticeTone = 'error' | 'info' | 'success';

export interface NoticeProps {
  message: string;
  tone?: NoticeTone;
}

const BORDER: Readonly<Record<NoticeTone, string>> = {
  error: colors.danger,
  info: colors.border,
  success: colors.success,
};

/** An inline message for the outcome of an action: a failed hold, an expired code, a saved change. */
export function Notice({ message, tone = 'info' }: NoticeProps) {
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.root, { borderColor: BORDER[tone] }]}
    >
      <Text tone={tone === 'error' ? 'danger' : tone === 'success' ? 'success' : 'default'}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
});
