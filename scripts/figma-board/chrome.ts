/**
 * Everything around a screen's own content: the phone frame, the status bar, the navigation header,
 * the tab bar, the home indicator, a modal sheet and a system alert. Plus the two containers every
 * screen is built from, Screen() (components/Screen.tsx) and ScrollView().
 *
 * The app styles the navigation chrome only through colours (app/_layout.tsx, app/(tabs)/_layout.tsx);
 * its shapes come from iOS and React Navigation, and are drawn here to match their defaults.
 */
import {
  box,
  colors,
  row,
  spacing,
  svg,
  type Child,
  type Frame,
  type FrameProps,
  type Node,
  type Screen as BoardScreen,
} from './dsl';
import { TabIcon, Text, type Link, type TabIconName } from './ui';

/** iPhone 16 / 17 logical size, and the safe-area insets useSafeAreaInsets() reports on it. */
export const DEVICE = { w: 393, h: 852 } as const;
export const INSETS = { top: 59, bottom: 34 } as const;

// ----- components/Screen.tsx -----

export interface ScreenProps {
  /** Scrolls the content; off for screens that render their own list. */
  scroll?: boolean;
  /** Horizontal padding and a top padding; off when a list wants edge-to-edge rows. */
  padded?: boolean;
  /** The screen hides the navigation header and pads the status bar itself. Phone() draws that bar, so this only changes the top padding. */
  safeTop?: boolean;
}

/** The root of every screen: background colour, safe insets, optional scrolling. */
export function Screen(props: ScreenProps, ...children: Child[]): Frame {
  const { scroll = false, padded = true, safeTop = false } = props;
  const bottomInset = Math.max(INSETS.bottom, spacing.lg);
  const side = padded ? spacing.lg : 0;

  if (scroll) {
    // ScrollView: the top inset sits on the viewport, the padding on the content container.
    return box(
      { name: 'Screen (ScrollView)', grow: true, fill: colors.background, scroll: 'y', clip: true },
      box(
        { name: 'content', pad: [padded ? spacing.lg : 0, side, bottomInset, side] },
        ...children,
      ),
    );
  }
  // View: with safeTop the inset replaces the padded top, so nothing is added under the status bar.
  return box(
    {
      name: 'Screen',
      grow: true,
      fill: colors.background,
      pad: [padded && !safeTop ? spacing.lg : 0, side, 0, side],
    },
    ...children,
  );
}

// ----- ScrollView and FlatList -----

export interface ScrollViewProps {
  horizontal?: boolean;
  /** contentContainerStyle */
  content?: FrameProps;
  /** The viewport's own style. A vertical list fills its parent (`grow`) unless told otherwise. */
  style?: FrameProps;
}

/**
 * <ScrollView> or <FlatList>. Vertical: the viewport fills what is left of the screen and cuts the
 * content off. Horizontal: the viewport is as wide as its parent and the row of children runs past
 * its right edge. Pass a FlatList's header, items, separators and empty component as children of a
 * content container with `gap`.
 */
export function ScrollView(props: ScrollViewProps, ...children: Child[]): Frame {
  const { horizontal = false, content = {}, style = {} } = props;
  if (horizontal) {
    return box(
      { name: 'ScrollView (horizontal)', dir: 'row', scroll: 'x', clip: true, ...style },
      row({ name: 'content', w: 'hug', ...content }, ...children),
    );
  }
  return box(
    { name: 'ScrollView', grow: true, scroll: 'y', clip: true, ...style },
    box({ name: 'content', ...content }, ...children),
  );
}

// ----- System chrome -----

const STATUS_GLYPHS =
  '<svg width="78" height="13" viewBox="0 0 78 13" fill="none" xmlns="http://www.w3.org/2000/svg">' +
  `<rect x="0" y="8.5" width="3" height="4" rx="0.7" fill="${colors.text}"/>` +
  `<rect x="5" y="6" width="3" height="6.5" rx="0.7" fill="${colors.text}"/>` +
  `<rect x="10" y="3.2" width="3" height="9.3" rx="0.7" fill="${colors.text}"/>` +
  `<rect x="15" y="0.5" width="3" height="12" rx="0.7" fill="${colors.text}"/>` +
  `<circle cx="33.5" cy="11.2" r="1.5" fill="${colors.text}"/>` +
  `<path d="M29.4 8.2a5.9 5.9 0 0 1 8.2 0" stroke="${colors.text}" stroke-width="1.9" stroke-linecap="round"/>` +
  `<path d="M26.4 5.2a10.1 10.1 0 0 1 14.2 0" stroke="${colors.text}" stroke-width="1.9" stroke-linecap="round"/>` +
  `<rect x="49.5" y="0.5" width="24" height="12" rx="3.8" stroke="${colors.text}" stroke-opacity="0.4"/>` +
  `<rect x="51.5" y="2.5" width="20" height="8" rx="2.2" fill="${colors.text}"/>` +
  `<path d="M75 4.3v4.4c.9-.3 1.5-1.2 1.5-2.2s-.6-1.9-1.5-2.2z" fill="${colors.text}" fill-opacity="0.4"/>` +
  '</svg>';

/** The iOS status bar over the top safe-area inset (StatusBar style="light"). */
export function StatusBar(): Frame {
  return box(
    { name: 'Status bar', h: INSETS.top },
    box({
      name: 'Dynamic Island',
      w: 126,
      h: 37,
      radius: 19,
      fill: '#000000',
      abs: { top: 11, centerX: true },
    }),
    Text('9:41', { size: 17, lh: 22, weight: 600, abs: { left: 51, top: 18 } }),
    svg(STATUS_GLYPHS, { name: 'Signal, Wi-Fi, battery', abs: { right: 30, top: 23 } }),
  );
}

/** The bar under the bottom safe-area inset. */
export function HomeIndicator(): Frame {
  return box({
    name: 'Home indicator',
    w: 134,
    h: 5,
    radius: 100,
    fill: colors.text,
    abs: { bottom: 8, centerX: true },
  });
}

const CHEVRON_LEFT =
  '<svg width="12" height="20" viewBox="0 0 12 20" fill="none" xmlns="http://www.w3.org/2000/svg">' +
  `<path d="M10 2 2.5 10 10 18" stroke="${colors.text}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>` +
  '</svg>';

export interface HeaderProps {
  /** The Stack.Screen / Tabs.Screen title. */
  title: string;
  /** Shows the system back button. Pass a screen key to make it a prototype link there; `true` links "back". */
  back?: boolean | string;
  /** headerLeft / headerRight, when a screen sets them. */
  left?: Node;
  right?: Node;
}

/**
 * The navigation header: the native stack's bar on pushed screens, React Navigation's on tabs.
 * Colours are the app's (headerStyle, headerTintColor); the 44 pt bar, the centred 17 pt semibold
 * title and the round back button are iOS 26's.
 */
export function NavHeader({ title, back = false, left, right }: HeaderProps, height = 44): Frame {
  const backLink: Link = typeof back === 'string' ? { go: back, goHow: 'replace' } : { back: true };
  return row(
    { name: 'Header', h: height, fill: colors.background, align: 'center', pad: [0, spacing.lg] },
    left ??
      (back === false
        ? null
        : box(
            {
              name: 'Back',
              w: 44,
              h: 44,
              radius: 22,
              fill: colors.surfaceRaised,
              stroke: colors.border,
              strokeW: 1,
              align: 'center',
              justify: 'center',
              ...backLink,
            },
            svg(CHEVRON_LEFT, { name: 'chevron', mr: 2 }),
          )),
    box({ name: 'spacer', grow: true }),
    right ?? null,
    title === ''
      ? null
      : Text(title, {
          variant: 'subheading',
          abs: { centerX: true, centerY: true },
        }),
  );
}

export type TabName = TabIconName;

const TAB_TITLES: Readonly<Record<TabName, string>> = {
  explore: 'Explore',
  bookings: 'Bookings',
  profile: 'Profile',
};

/** Which screen key each tab links to in the prototype; override per screen state where it matters. */
export const DEFAULT_TAB_TARGETS: Readonly<Record<TabName, string>> = {
  explore: 'explore',
  bookings: 'bookings',
  profile: 'profile',
};

export interface TabBarProps {
  active: TabName;
  targets?: Partial<Record<TabName, string>>;
}

/**
 * React Navigation's bottom tab bar with the app's colours: background and top border from
 * tabBarStyle, accent for the focused tab, muted text for the others. 49 pt of bar over the
 * bottom inset; 25 pt icons over 10 pt medium labels.
 */
export function TabBar({ active, targets = {} }: TabBarProps): Frame {
  const names: TabName[] = ['explore', 'bookings', 'profile'];
  return box(
    {
      name: 'Tab bar',
      fill: colors.background,
      stroke: colors.border,
      strokeW: { top: 0.5 },
      pad: [0, 0, INSETS.bottom, 0],
    },
    row(
      { name: 'tabs', h: 49 },
      names.map((name) => {
        const focused = name === active;
        const tint = focused ? colors.accent : colors.textMuted;
        return box(
          {
            name: `Tab/${TAB_TITLES[name]}${focused ? ' (focused)' : ''}`,
            grow: true,
            align: 'center',
            justify: 'center',
            gap: 3,
            ...(focused ? {} : { go: targets[name] ?? DEFAULT_TAB_TARGETS[name], goHow: 'tab' }),
          },
          TabIcon(name, tint, 25, focused),
          Text(TAB_TITLES[name], { size: 10, lh: 12, weight: 500, color: tint }),
        );
      }),
    ),
  );
}

export interface AlertButton extends Link {
  label: string;
  style?: 'default' | 'cancel' | 'destructive';
}

/** Alert.alert(): the iOS system alert over a dimmed screen. Pass it in Phone's `overlay`. */
export function SystemAlert(title: string, message: string | null, buttons: AlertButton[]): Frame {
  const tint = '#0A84FF';
  const hairline = '#54545899';
  return box(
    {
      name: 'Alert.alert (system)',
      w: DEVICE.w,
      h: DEVICE.h,
      fill: '#00000066',
      align: 'center',
      justify: 'center',
      abs: { left: 0, top: 0 },
    },
    box(
      { name: 'Alert', w: 270, self: 'center', radius: 14, fill: '#252528F2', clip: true },
      box(
        { name: 'text', pad: [19, 16, 15, 16], gap: 2 },
        Text(title, { size: 17, lh: 22, weight: 600, align: 'center', color: '#FFFFFF' }),
        message === null
          ? null
          : Text(message, { size: 13, lh: 18, align: 'center', color: '#FFFFFF' }),
      ),
      row(
        { name: 'buttons', stroke: hairline, strokeW: { top: 0.5 } },
        buttons.map((button, index) =>
          box(
            {
              name: `Alert button/${button.label}`,
              grow: true,
              h: 44,
              align: 'center',
              justify: 'center',
              ...(index === 0 ? {} : { stroke: hairline, strokeW: { left: 0.5 } }),
              ...(button.go === undefined
                ? {}
                : { go: button.go, goHow: button.goHow ?? 'replace' }),
              ...(button.back === true ? { back: true } : {}),
            },
            Text(button.label, {
              size: 17,
              lh: 22,
              weight: button.style === 'cancel' ? 600 : 400,
              color: button.style === 'destructive' ? '#FF453A' : tint,
            }),
          ),
        ),
      ),
    ),
  );
}

const NUMBER_PAD_KEYS: readonly (readonly (readonly [digit: string, letters: string])[])[] = [
  [
    ['1', ''],
    ['2', 'ABC'],
    ['3', 'DEF'],
  ],
  [
    ['4', 'GHI'],
    ['5', 'JKL'],
    ['6', 'MNO'],
  ],
  [
    ['7', 'PQRS'],
    ['8', 'TUV'],
    ['9', 'WXYZ'],
  ],
  [
    ['', ''],
    ['0', ''],
    ['⌫', ''],
  ],
];

export type KeyboardKind = 'number-pad' | 'phone-pad';

/**
 * The iOS pad a focused input raises: keyboardType="number-pad" (digits only) or "phone-pad"
 * (the same keys plus "+ * #" at the bottom left).
 */
export function NumberPad(kind: KeyboardKind = 'number-pad'): Frame {
  return box(
    {
      name: `Keyboard (${kind === 'phone-pad' ? 'phone pad' : 'number pad'}, system)`,
      fill: '#1C1C1E',
      pad: [6, 6, INSETS.bottom + 12, 6],
      gap: 7,
    },
    NUMBER_PAD_KEYS.map((keys) =>
      row(
        { name: 'keys', gap: 6 },
        keys.map(([key, letters]) => {
          const digit = key === '' && kind === 'phone-pad' ? '+ * #' : key;
          return box(
            {
              name: digit === '' ? 'blank' : `key ${digit}`,
              grow: true,
              h: 46,
              radius: 5,
              align: 'center',
              justify: 'center',
              ...(digit === '' || digit === '⌫' || digit === '+ * #' ? {} : { fill: '#4A4A4F' }),
            },
            digit === ''
              ? null
              : Text(
                  digit,
                  digit === '+ * #'
                    ? { size: 17, lh: 28, weight: 400, color: '#FFFFFF' }
                    : { size: 25, lh: 28, weight: 400, color: '#FFFFFF' },
                ),
            letters === ''
              ? null
              : Text(letters, { size: 10, lh: 12, weight: 700, ls: 2, color: '#FFFFFF' }),
          );
        }),
      ),
    ),
  );
}

/** A copy of a tree with no prototype links: what sits under a modal alert takes no touches. */
function withoutLinks(node: Node): Node {
  const copy: Node = { ...node };
  delete copy.go;
  delete copy.goHow;
  delete copy.back;
  if (copy.t === 'frame' && copy.children !== undefined) {
    copy.children = copy.children.map((child) => withoutLinks(child));
  }
  return copy;
}

// ----- The phone -----

export interface PhoneProps {
  key: string;
  name: string;
  /** The route file, for the caption: 'app/(tabs)/index.tsx'. */
  route: string;
  note?: string;
  /** 'device' (default) cuts scrolling content off at the phone's height; 'full' shows all of it. */
  mode?: 'device' | 'full';
  /** The navigation header. Leave out when the route sets headerShown: false. */
  header?: HeaderProps;
  /** The tab bar, for the three routes under app/(tabs). */
  tabs?: TabBarProps;
  /** presentation: 'modal': the screen rises as a sheet over the previous one. */
  modal?: boolean;
  /** The screen's root: what Screen() returned. */
  content: Frame;
  /** The system keyboard, raised when the state has a focused input of that keyboard type. */
  keyboard?: KeyboardKind;
  /** Layers over everything else, such as SystemAlert(). */
  overlay?: Node[];
}

/** A screen (or one state of it) in a phone frame, ready for the board. */
export function Phone(props: PhoneProps): BoardScreen {
  const { key, name, route, note, mode = 'device', header, tabs, modal = false, content } = props;
  const overlay = props.overlay ?? [];
  // Under an overlay (a system alert) nothing else can be tapped, so nothing else is linked.
  const inert = overlay.length > 0;
  const body = (
    inert ? withoutLinks({ ...content, grow: true }) : { ...content, grow: true }
  ) as Frame;
  const keyboard = props.keyboard === undefined ? null : NumberPad(props.keyboard);
  const navHeader = (height?: number): Frame | null => {
    if (header === undefined) {
      return null;
    }
    const bar = NavHeader(header, height);
    return inert ? (withoutLinks(bar) as Frame) : bar;
  };
  const tabBar =
    tabs === undefined ? null : inert ? (withoutLinks(TabBar(tabs)) as Frame) : TabBar(tabs);

  const tree = modal
    ? box(
        { name, w: DEVICE.w, h: DEVICE.h, fill: '#000000', clip: true },
        // The screen underneath, pushed back: only its top edge shows above the sheet.
        box({
          name: 'Screen behind',
          h: 40,
          radius: [12, 12, 0, 0],
          fill: colors.surface,
          opacity: 0.7,
          abs: { left: 14, right: 14, top: INSETS.top - 5 },
        }),
        StatusBar(),
        box(
          {
            name: 'Sheet',
            grow: true,
            mt: 5,
            radius: [20, 20, 0, 0],
            fill: colors.background,
            clip: true,
          },
          navHeader(56),
          body,
          keyboard,
        ),
        HomeIndicator(),
        ...overlay,
      )
    : box(
        { name, w: DEVICE.w, h: DEVICE.h, fill: colors.background, clip: true },
        StatusBar(),
        navHeader(),
        body,
        keyboard,
        tabBar,
        HomeIndicator(),
        ...overlay,
      );

  return { key, name, route, ...(note === undefined ? {} : { note }), mode, tree };
}
