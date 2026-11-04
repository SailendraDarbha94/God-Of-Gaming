import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../lib/theme';

export interface ScreenProps {
  children: ReactNode;
  /** Scrolls the content; off for screens that render their own list. */
  scroll?: boolean;
  /** Horizontal padding and a bottom inset; off when a list wants edge-to-edge rows. */
  padded?: boolean;
  /** Adds the top safe-area inset, for screens that hide the navigation header. */
  safeTop?: boolean;
}

/** The root of every screen: background colour, safe insets, optional scrolling. */
export function Screen({ children, scroll = false, padded = true, safeTop = false }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, spacing.lg);
  const topInset = safeTop ? { paddingTop: insets.top } : null;

  if (scroll) {
    return (
      <ScrollView
        style={[styles.root, topInset]}
        contentContainerStyle={[padded && styles.padded, { paddingBottom: bottomInset }]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.root, padded && styles.padded, topInset]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  padded: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
});
