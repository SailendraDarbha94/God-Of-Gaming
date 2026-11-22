/**
 * A small layout language that mirrors React Native's flexbox and maps one to one onto Figma
 * auto-layout. Builders return plain objects (no Figma calls here); renderer.js turns them into
 * Figma nodes in the browser.
 *
 * Semantics follow React Native, so a component's StyleSheet translates line by line:
 *   - box() is a View: a column unless `dir: 'row'` (row() is the shorthand).
 *   - `align` is alignItems and defaults to 'stretch', as in React Native: children fill the
 *     cross axis unless they have a fixed size there or their own `self`.
 *   - `justify` is justifyContent, `gap` is gap, `pad` is padding, `wrap` is flexWrap: 'wrap'.
 *   - `grow` is `flex: 1`: fill what is left of the parent's main axis.
 *   - `self` is alignSelf.
 *   - `w` / `h` are width and height: a number, 'fill' (100%) or 'hug' (content size).
 *     Leave them out for the React Native default (stretch across, hug along).
 *   - `mt` / `mb` / `ml` / `mr` are margins.
 *   - `stroke` + `strokeW` are borderColor + borderWidth, drawn inside the box and counted in
 *     layout, as React Native does.
 *   - `abs` is position: 'absolute' with offsets from the parent's edges.
 */
import { colors, radii, spacing, touchTarget, typeScale, type TypeVariant } from '@app/lib/theme';

export { colors, radii, spacing, touchTarget, typeScale };
export type { TypeVariant };

export type Size = number | 'fill' | 'hug';
export type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type Justify = 'start' | 'center' | 'end' | 'between';
export type Weight = 400 | 500 | 600 | 700;
/** One number, [vertical, horizontal], or [top, right, bottom, left]. */
export type Pad = number | [number, number] | [number, number, number, number];

export interface Common {
  /** The layer's name in Figma: the React component, or the role of the view. */
  name?: string;
  w?: Size;
  h?: Size;
  /** flex: 1 */
  grow?: boolean;
  /** alignSelf */
  self?: 'start' | 'center' | 'end' | 'stretch';
  opacity?: number;
  mt?: number;
  mb?: number;
  ml?: number;
  mr?: number;
  /** position: 'absolute'. Offsets from the parent's edges; centerX / centerY centre on that axis. */
  abs?: {
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
    centerX?: boolean;
    centerY?: boolean;
  };
  /** Prototype link: tapping this layer navigates to the screen whose key this is. */
  go?: string;
  /** How the destination arrives. 'push' (default) slides in from the right, 'modal' slides up, 'tab' and 'replace' swap instantly. */
  goHow?: 'push' | 'modal' | 'tab' | 'replace';
  /** Prototype link: tapping this layer goes back. */
  back?: boolean;
}

export interface Frame extends Common {
  t: 'frame';
  /** flexDirection; 'col' when omitted. */
  dir?: 'col' | 'row';
  gap?: number;
  /** flexWrap: 'wrap' (rows only). */
  wrap?: boolean;
  pad?: Pad;
  /** alignItems; 'stretch' when omitted. */
  align?: Align;
  /** justifyContent; 'start' when omitted. */
  justify?: Justify;
  /** backgroundColor: '#RRGGBB', '#RRGGBBAA' or 'transparent'. */
  fill?: string;
  /** borderColor. 'transparent' keeps the border's space without drawing it. */
  stroke?: string;
  /** borderWidth, or one width per side. */
  strokeW?: number | { top?: number; right?: number; bottom?: number; left?: number };
  /** borderRadius, or [topLeft, topRight, bottomRight, bottomLeft]. */
  radius?: number | [number, number, number, number];
  /** overflow: 'hidden' */
  clip?: boolean;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  /** A remote image that covers the frame (expo-image with contentFit="cover"). */
  image?: string;
  /** A scroll viewport: content past its edge is cut off and scrolls in the prototype. */
  scroll?: 'y' | 'x';
  children?: Node[];
}

export interface TextNode extends Common {
  t: 'text';
  text: string;
  /** A step of the app's type scale; 'body' when omitted. */
  variant?: TypeVariant;
  /** '#RRGGBB'; colors.text when omitted. */
  color?: string;
  /** Overrides of the variant, as a style prop would apply them. */
  size?: number;
  weight?: Weight;
  lh?: number;
  ls?: number;
  align?: 'left' | 'center' | 'right';
  /** numberOfLines */
  lines?: number;
}

export interface Ellipse extends Common {
  t: 'ellipse';
  w: number;
  h: number;
  fill?: string;
  stroke?: string;
  strokeW?: number;
}

export interface Svg extends Common {
  t: 'svg';
  /** A complete <svg> element with width, height and viewBox. */
  svg: string;
}

export type Node = Frame | TextNode | Ellipse | Svg;

/** What a builder may pass as a child, as JSX allows: nodes, nothing, or nested lists. */
export type Child = Node | null | undefined | false | Child[];

function flatten(children: Child[]): Node[] {
  const out: Node[] = [];
  for (const child of children) {
    if (Array.isArray(child)) {
      out.push(...flatten(child));
    } else if (child !== null && child !== undefined && child !== false) {
      out.push(child);
    }
  }
  return out;
}

export type FrameProps = Omit<Frame, 't' | 'children'>;

/** A View. Column by default, as in React Native. */
export function box(props: FrameProps, ...children: Child[]): Frame {
  return { t: 'frame', ...props, children: flatten(children) };
}

/** A View with flexDirection: 'row'. */
export function row(props: Omit<FrameProps, 'dir'>, ...children: Child[]): Frame {
  return { t: 'frame', dir: 'row', ...props, children: flatten(children) };
}

/** Raw text. Screens use ui.ts's Text(), which applies the app's tones. */
export function txt(text: string, props: Omit<TextNode, 't' | 'text'> = {}): TextNode {
  return { t: 'text', text, ...props };
}

export function ellipse(props: Omit<Ellipse, 't'>): Ellipse {
  return { t: 'ellipse', ...props };
}

export function svg(source: string, props: Omit<Svg, 't' | 'svg'> = {}): Svg {
  return { t: 'svg', svg: source, ...props };
}

/** One screen (or one state of a screen) on the board. */
export interface Screen {
  /** Unique id, used by `go` links and by the flow arrows: 'explore', 'cafe', 'booking-held'. */
  key: string;
  /** The frame's name on the canvas: 'Explore', 'Booking · on hold'. */
  name: string;
  /** The route file this draws, for the caption under the frame: 'app/(tabs)/index.tsx'. */
  route: string;
  /** One line on what state this is and how the player gets here. */
  note?: string;
  /**
   * 'device' keeps the frame at the phone's height and cuts scrolling content off at the bottom.
   * 'full' grows the frame to show everything a scroll view holds.
   */
  mode: 'device' | 'full';
  tree: Frame;
}
