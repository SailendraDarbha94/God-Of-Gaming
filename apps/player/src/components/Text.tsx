import { Text as NativeText, type TextProps as NativeTextProps } from 'react-native';

import { colors, typeScale, type TypeVariant } from '../lib/theme';

export type TextTone = 'default' | 'muted' | 'subtle' | 'accent' | 'danger' | 'success';

const TONE_COLORS: Readonly<Record<TextTone, string>> = {
  default: colors.text,
  muted: colors.textMuted,
  subtle: colors.textSubtle,
  accent: colors.accent,
  danger: colors.danger,
  success: colors.success,
};

export interface TextProps extends NativeTextProps {
  variant?: TypeVariant;
  tone?: TextTone;
}

/** The only text primitive in the app: every string on screen goes through the type scale. */
export function Text({ variant = 'body', tone = 'default', style, ...rest }: TextProps) {
  return <NativeText style={[typeScale[variant], { color: TONE_COLORS[tone] }, style]} {...rest} />;
}
