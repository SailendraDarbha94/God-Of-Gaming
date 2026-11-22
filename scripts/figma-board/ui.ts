/**
 * The app's core components (apps/player/src/components: Text, Button, Card, Chip, TabIcon) as
 * layout builders. Each mirrors its React Native source style for style; the comments name the
 * source lines' intent, not new design decisions.
 */
import {
  box,
  colors,
  radii,
  spacing,
  svg,
  touchTarget,
  txt,
  type Child,
  type Common,
  type Frame,
  type FrameProps,
  type Svg,
  type TextNode,
  type TypeVariant,
} from './dsl';

/** Prototype-link props any pressable builder accepts. */
export type Link = Pick<Common, 'go' | 'goHow' | 'back'>;

// ----- components/Text.tsx -----

export type TextTone = 'default' | 'muted' | 'subtle' | 'accent' | 'danger' | 'success';

const TONE_COLORS: Readonly<Record<TextTone, string>> = {
  default: colors.text,
  muted: colors.textMuted,
  subtle: colors.textSubtle,
  accent: colors.accent,
  danger: colors.danger,
  success: colors.success,
};

export interface TextProps extends Omit<TextNode, 't' | 'text' | 'variant'> {
  variant?: TypeVariant;
  tone?: TextTone;
}

/** <Text variant tone style>: every string on screen goes through the type scale. */
export function Text(text: string, props: TextProps = {}): TextNode {
  const { variant = 'body', tone = 'default', color, ...rest } = props;
  return txt(text, { variant, color: color ?? TONE_COLORS[tone], ...rest });
}

// ----- components/Button.tsx -----

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const BUTTON_PALETTES: Readonly<
  Record<ButtonVariant, { background: string; border: string; text: string }>
> = {
  primary: { background: colors.accent, border: colors.accent, text: colors.onAccent },
  secondary: { background: colors.surfaceRaised, border: colors.border, text: colors.text },
  ghost: { background: 'transparent', border: 'transparent', text: colors.accent },
};

export interface ButtonProps extends Link {
  label: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  /** Stretches to the container width; the default hugs the label. */
  block?: boolean;
  /** The `style` prop: layout overrides the screen passes in (margins, alignSelf, flex). */
  style?: Pick<FrameProps, 'mt' | 'mb' | 'ml' | 'mr' | 'self' | 'grow' | 'w'>;
}

export function Button({
  label,
  variant = 'primary',
  disabled = false,
  loading = false,
  block = false,
  style,
  ...link
}: ButtonProps): Frame {
  const palette = BUTTON_PALETTES[variant];
  const inactive = disabled || loading;
  return box(
    {
      name: `Button/${variant}${loading ? ' (loading)' : disabled ? ' (disabled)' : ''}`,
      minH: touchTarget + 4,
      pad: [spacing.md, spacing.lg],
      radius: radii.md,
      stroke: palette.border,
      strokeW: 1,
      fill: palette.background,
      align: 'center',
      justify: 'center',
      // styles.base is alignSelf: 'flex-start'; `block` makes it 'stretch'.
      self: block ? 'stretch' : 'start',
      ...(inactive ? { opacity: 0.5 } : {}),
      ...link,
      ...style,
    },
    loading ? Spinner(palette.text) : Text(label, { variant: 'subheading', color: palette.text }),
  );
}

/** <ActivityIndicator>: the small iOS spinner, drawn as a three-quarter ring. */
export function Spinner(color: string = colors.accent, size = 20): Svg {
  const r = size / 2 - 1.5;
  const c = size / 2;
  return svg(
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">` +
      `<circle cx="${c}" cy="${c}" r="${r}" stroke="${color}" stroke-opacity="0.25" stroke-width="2.5"/>` +
      `<path d="M ${c} ${c - r} A ${r} ${r} 0 0 1 ${c + r} ${c}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>` +
      `</svg>`,
    { name: 'ActivityIndicator' },
  );
}

// ----- components/Card.tsx -----

export interface CardProps extends FrameProps {
  /** Removes the inner padding, for cards whose first child is an image. */
  flush?: boolean;
}

export function Card({ flush = false, ...style }: CardProps, ...children: Child[]): Frame {
  return box(
    {
      name: 'Card',
      fill: colors.surface,
      radius: radii.lg,
      stroke: colors.border,
      strokeW: 1,
      clip: true,
      ...(flush ? {} : { pad: spacing.lg }),
      ...style,
    },
    ...children,
  );
}

// ----- components/Chip.tsx -----

export interface ChipProps extends Link {
  label: string;
  selected?: boolean;
}

export function Chip({ label, selected = false, ...link }: ChipProps): Frame {
  return box(
    {
      name: selected ? 'Chip/selected' : 'Chip',
      pad: [spacing.sm, spacing.md],
      radius: radii.pill,
      stroke: selected ? colors.accent : colors.border,
      strokeW: 1,
      fill: selected ? colors.accent : colors.surfaceRaised,
      ...link,
    },
    Text(label, {
      variant: 'caption',
      color: selected ? colors.onAccent : colors.text,
      ...(selected ? { weight: 600 } : {}),
    }),
  );
}

// ----- components/TabIcon.tsx -----

export type TabIconName = 'explore' | 'bookings' | 'profile';

const n = (value: number): string => String(Math.round(value * 1000) / 1000);

/**
 * The tab glyphs, which the app draws from plain views with 2 px borders. The same boxes are
 * reproduced as one SVG: a border inside a box becomes a stroke inset by half its width.
 */
export function TabIcon(name: TabIconName, color: string, size: number, focused: boolean): Svg {
  const stroke = 2;
  const fill = focused ? color : 'none';
  const shapes: string[] = [];
  const half = stroke / 2;

  if (name === 'explore') {
    const outer = size * 0.8;
    shapes.push(
      `<circle cx="${n(size / 2)}" cy="${n(size / 2)}" r="${n(outer / 2 - half)}" stroke="${color}" stroke-width="${stroke}" fill="${fill}"/>`,
    );
    // The inner dot is solid when unfocused; focused, it is a ring in the fill's own colour.
    if (!focused) {
      shapes.push(
        `<circle cx="${n(size / 2)}" cy="${n(size / 2)}" r="${n((size * 0.22) / 2)}" fill="${color}"/>`,
      );
    }
  } else if (name === 'bookings') {
    const w = size * 0.85;
    const h = size * 0.7;
    const x = (size - w) / 2;
    const y = (size - h) / 2;
    shapes.push(
      `<rect x="${n(x + half)}" y="${n(y + half)}" width="${n(w - stroke)}" height="${n(h - stroke)}" rx="${n(size * 0.16 - half)}" stroke="${color}" stroke-width="${stroke}" fill="${fill}"/>`,
    );
    if (!focused) {
      const line = size * 0.45;
      shapes.push(
        `<rect x="${n((size - line) / 2)}" y="${n((size - stroke) / 2)}" width="${n(line)}" height="${stroke}" fill="${color}"/>`,
      );
    }
  } else {
    const head = size * 0.4;
    const bodyW = size * 0.8;
    const bodyH = size * 0.36;
    const gap = size * 0.05;
    const top = (size - (head + gap + bodyH)) / 2;
    shapes.push(
      `<circle cx="${n(size / 2)}" cy="${n(top + head / 2)}" r="${n(head / 2 - half)}" stroke="${color}" stroke-width="${stroke}" fill="${fill}"/>`,
    );
    // The shoulders: top corners fully rounded, no bottom border.
    const left = (size - bodyW) / 2 + half;
    const right = (size + bodyW) / 2 - half;
    const bodyTop = top + head + gap + half;
    const bodyBottom = top + head + gap + bodyH;
    const radius = Math.min(bodyW / 2 - half, bodyH - half);
    shapes.push(
      `<path d="M ${n(left)} ${n(bodyBottom)} L ${n(left)} ${n(bodyTop + radius)} A ${n(radius)} ${n(radius)} 0 0 1 ${n(left + radius)} ${n(bodyTop)} L ${n(right - radius)} ${n(bodyTop)} A ${n(radius)} ${n(radius)} 0 0 1 ${n(right)} ${n(bodyTop + radius)} L ${n(right)} ${n(bodyBottom)}" stroke="${color}" stroke-width="${stroke}" fill="${fill}"/>`,
    );
  }

  return svg(
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">${shapes.join('')}</svg>`,
    { name: `TabIcon/${name}${focused ? ' (focused)' : ''}` },
  );
}
