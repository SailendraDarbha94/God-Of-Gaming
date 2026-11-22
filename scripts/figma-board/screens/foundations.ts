/**
 * The design foundations as reference sheets: the colour tokens, the type scale, spacing and radii
 * (src/lib/theme.ts, src/lib/palette.json) and the core components (src/components) in each variant.
 * These are not routes; they sit in their own section of the board.
 */
import { AUTH_COPY } from '@app/features/auth/copy';
import { BOOKING_ERROR_COPY } from '@app/features/booking/copy';
import { EmptyState, ErrorState, ListRow, Notice, Skeleton } from '@board/components/shared';
import { TabBar } from '@board/chrome';
import {
  box,
  colors,
  radii,
  row,
  spacing,
  touchTarget,
  typeScale,
  type Child,
  type Frame,
  type Screen as BoardScreen,
  type TypeVariant,
} from '@board/dsl';
import { Button, Card, Chip, Text } from '@board/ui';

interface SheetProps {
  key: string;
  name: string;
  route: string;
  note: string;
  width: number;
}

/** A reference sheet: a dark panel of fixed width that grows with its content. */
function Sheet({ key, name, route, note, width }: SheetProps, ...children: Child[]): BoardScreen {
  return {
    key,
    name,
    route,
    note,
    mode: 'device',
    tree: box(
      { name, w: width, fill: colors.background, pad: 48, gap: 40, radius: 24, clip: true },
      ...children,
    ),
  };
}

function Group(title: string, ...children: Child[]): Frame {
  return box(
    { name: title, gap: spacing.lg },
    Text(title.toUpperCase(), { variant: 'label', tone: 'muted' }),
    ...children,
  );
}

function Specimen(label: string, width: number, ...children: Child[]): Frame {
  return box(
    { name: label, w: width, gap: spacing.sm },
    ...children,
    Text(label, { variant: 'caption', tone: 'subtle' }),
  );
}

const COLOR_USES: Readonly<Record<keyof typeof colors, string>> = {
  background: 'Every screen and both navigation bars',
  surface: 'Cards and notices',
  surfaceRaised: 'Chips, secondary buttons, image placeholders, skeletons',
  border: 'Outlines of cards, chips and inputs; list dividers',
  text: 'Primary text and icons',
  textMuted: 'Secondary text; the tabs that are not focused',
  textSubtle: 'Hints and placeholders',
  accent: 'The one accent: primary buttons, selected chips, the focused tab',
  onAccent: 'Text on the accent (the background colour again)',
  success: 'Success text and outlines',
  warning: 'Warnings',
  danger: 'Error text and outlines',
};

const WEIGHT_NAMES: Readonly<Record<string, string>> = {
  '400': 'Regular',
  '600': 'Semibold',
  '700': 'Bold',
};

export function screens(): BoardScreen[] {
  const colorNames = Object.keys(colors) as (keyof typeof colors)[];
  const variants = Object.keys(typeScale) as TypeVariant[];
  const spaces = Object.entries(spacing);
  const corners = Object.entries(radii);

  return [
    Sheet(
      {
        key: 'foundations-colors',
        name: 'Colours',
        route: 'src/lib/theme.ts · src/lib/palette.json',
        note: 'Dark, high contrast, one accent. Each swatch is also a local colour style in this file (Color/…), and every layer on the board is bound to one.',
        width: 1208,
      },
      row(
        { name: 'swatches', wrap: true, gap: 24 },
        colorNames.map((name) =>
          box(
            { name: `colors.${name}`, w: 260, gap: spacing.sm },
            box({
              name: 'swatch',
              h: 96,
              radius: radii.md,
              fill: colors[name],
              stroke: colors.border,
              strokeW: 1,
            }),
            Text(name, { variant: 'subheading' }),
            Text(colors[name].toUpperCase(), { variant: 'caption', tone: 'muted' }),
            Text(COLOR_USES[name], { variant: 'caption', tone: 'subtle' }),
          ),
        ),
      ),
    ),

    Sheet(
      {
        key: 'foundations-type',
        name: 'Type scale',
        route: 'src/lib/theme.ts · src/components/Text.tsx',
        note: 'The app uses the system font (San Francisco on iOS); the board sets it in Inter, its closest match in Figma. Each step is a local text style (Type/…).',
        width: 1208,
      },
      box(
        { name: 'steps', gap: spacing.xl },
        variants.map((variant) => {
          const scale: {
            fontSize: number;
            lineHeight: number;
            fontWeight: string;
            letterSpacing?: number;
          } = typeScale[variant];
          const spec = `${variant} · ${scale.fontSize} / ${scale.lineHeight} · ${WEIGHT_NAMES[scale.fontWeight] ?? scale.fontWeight}${scale.letterSpacing === undefined ? '' : ` · tracking ${scale.letterSpacing}`}`;
          return row(
            { name: `typeScale.${variant}`, align: 'center', gap: spacing.xl },
            box({ name: 'spec', w: 300 }, Text(spec, { variant: 'caption', tone: 'muted' })),
            Text(
              variant === 'label'
                ? 'UPCOMING · TOTAL · SEATS'
                : 'Find a cafe, hold seats for your squad, confirm.',
              { variant, grow: true },
            ),
          );
        }),
      ),
      Group(
        'Tones',
        row(
          { name: 'tones', gap: spacing.xl, wrap: true },
          Text('default', { tone: 'default' }),
          Text('muted', { tone: 'muted' }),
          Text('subtle', { tone: 'subtle' }),
          Text('accent', { tone: 'accent' }),
          Text('success', { tone: 'success' }),
          Text('danger', { tone: 'danger' }),
        ),
      ),
    ),

    Sheet(
      {
        key: 'foundations-spacing',
        name: 'Spacing, radii and touch target',
        route: 'src/lib/theme.ts',
        note: 'Every gap, padding and corner on the screens is one of these tokens.',
        width: 1208,
      },
      Group(
        'Spacing',
        row(
          { name: 'spacing', gap: spacing.xxl, align: 'end' },
          spaces.map(([name, value]) =>
            box(
              { name: `spacing.${name}`, gap: spacing.sm, align: 'start' },
              box({ name: 'bar', w: value, h: value, fill: colors.accent }),
              Text(`${name} · ${value}`, { variant: 'caption', tone: 'muted' }),
            ),
          ),
        ),
      ),
      Group(
        'Radii',
        row(
          { name: 'radii', gap: spacing.xxl, align: 'end' },
          corners.map(([name, value]) =>
            box(
              { name: `radii.${name}`, gap: spacing.sm, align: 'start' },
              box({
                name: 'corner',
                w: name === 'pill' ? 120 : 72,
                h: name === 'pill' ? 40 : 72,
                radius: value,
                fill: colors.surfaceRaised,
                stroke: colors.border,
                strokeW: 1,
              }),
              Text(`${name} · ${value}`, { variant: 'caption', tone: 'muted' }),
            ),
          ),
        ),
      ),
      Group(
        'Touch target',
        row(
          { name: 'touch', gap: spacing.lg, align: 'center' },
          box({
            name: 'touchTarget',
            w: touchTarget,
            h: touchTarget,
            radius: radii.sm,
            stroke: colors.accent,
            strokeW: 1,
          }),
          Text(
            `touchTarget · ${touchTarget} pt: the minimum size of anything a finger has to hit`,
            {
              variant: 'caption',
              tone: 'muted',
            },
          ),
        ),
      ),
    ),

    Sheet(
      {
        key: 'foundations-components',
        name: 'Core components',
        route: 'src/components',
        note: 'Button, Chip, Card, Notice, ListRow, Skeleton, EmptyState, ErrorState and the tab bar, in each variant the code defines.',
        width: 1208,
      },
      Group(
        'Button',
        row(
          { name: 'buttons', gap: spacing.xl, wrap: true, align: 'end' },
          Specimen('primary', 180, Button({ label: 'Primary' })),
          Specimen('secondary', 180, Button({ label: 'Secondary', variant: 'secondary' })),
          Specimen('ghost', 180, Button({ label: 'Ghost', variant: 'ghost' })),
          Specimen('disabled', 180, Button({ label: 'Disabled', disabled: true })),
          Specimen('loading', 180, Button({ label: 'Loading', loading: true })),
        ),
        Specimen('block', 361, Button({ label: 'Block', block: true })),
      ),
      Group(
        'Chip',
        row(
          { name: 'chips', gap: spacing.sm, align: 'start' },
          Chip({ label: 'Selected', selected: true }),
          Chip({ label: 'Chip' }),
        ),
      ),
      Group(
        'Card',
        box(
          { name: 'cards', w: 361 },
          Card(
            {},
            Text('Card', { variant: 'subheading' }),
            Text('surface, 16 pt radius, 1 pt border, 16 pt padding', { tone: 'muted' }),
          ),
        ),
      ),
      Group(
        'Notice',
        box(
          { name: 'notices', w: 361, gap: spacing.md },
          Notice({ message: BOOKING_ERROR_COPY.not_enough_seats, tone: 'error' }),
          Notice({ message: AUTH_COPY.verifyFailed, tone: 'info' }),
          Notice({ message: 'The success tone', tone: 'success' }),
        ),
      ),
      Group(
        'ListRow',
        box(
          { name: 'rows', w: 361 },
          ListRow({ label: 'Label', value: 'Value' }),
          ListRow({ label: 'Label', hint: 'Hint', press: {} }),
        ),
      ),
      Group(
        'Skeleton',
        box(
          { name: 'skeletons', w: 361, gap: spacing.sm },
          Skeleton({ height: 22, width: 200 }),
          Skeleton({}),
          Skeleton({ width: 140 }),
        ),
      ),
      Group(
        'EmptyState and ErrorState',
        row(
          { name: 'states', gap: spacing.xl, align: 'start' },
          box(
            { name: 'empty', w: 361 },
            EmptyState({
              title: 'Title',
              message: 'A message under the title.',
              actionLabel: 'Action',
              action: {},
            }),
          ),
          box({ name: 'error', w: 361 }, ErrorState({ retry: {} })),
        ),
      ),
      Group('Tab bar', box({ name: 'tab bar', w: 393 }, TabBar({ active: 'bookings' }))),
    ),
  ];
}
