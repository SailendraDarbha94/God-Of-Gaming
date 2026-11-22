/**
 * Lowers a builder's tree (React Native semantics) into what Figma auto-layout needs spelled out:
 * every node gets an explicit horizontal and vertical sizing mode, margins and alignSelf become
 * wrapper frames, transparent borders become padding, and text gets its resolved type style.
 * renderer.js draws the lowered tree without making any layout decisions of its own.
 */
import { colors, typeScale, type Align, type Frame, type Node, type TextNode } from './dsl';

export type Sizing = 'FIXED' | 'FILL' | 'HUG';
type Quad = [number, number, number, number];

interface LCommon {
  n: string;
  sx: Sizing;
  sy: Sizing;
  w?: number;
  h?: number;
  op?: number;
  abs?: NonNullable<Node['abs']>;
  go?: string;
  how?: 'push' | 'modal' | 'tab' | 'replace';
  back?: true;
}

export interface LFrame extends LCommon {
  t: 'f';
  d: 'V' | 'H';
  g: number;
  wrap?: true;
  /** A wrapping row with alignItems: 'stretch': the cells of one line share the tallest height. */
  stretchLines?: true;
  /** A frame that stands in for alignSelf; the renderer lets it set a hugging parent's size. */
  aligner?: true;
  /** top, right, bottom, left */
  p: Quad;
  ai: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
  ji: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  fill?: string;
  /** Stroke colour and its weight per side: top, right, bottom, left. */
  st?: { c: string; w: Quad };
  /** topLeft, topRight, bottomRight, bottomLeft */
  r?: Quad;
  clip?: true;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  img?: string;
  scroll?: 'y' | 'x';
  c: LNode[];
}

export interface LText extends LCommon {
  t: 't';
  x: string;
  fs: number;
  lh: number;
  fw: 400 | 500 | 600 | 700;
  ls: number;
  c: string;
  ta: 'LEFT' | 'CENTER' | 'RIGHT';
  lines?: number;
  /** The type-scale step to bind as a Figma text style, when nothing overrides it. */
  style?: string;
}

export interface LEllipse extends LCommon {
  t: 'e';
  fill?: string;
  st?: { c: string; w: number };
}

export interface LSvg extends LCommon {
  t: 's';
  svg: string;
}

export type LNode = LFrame | LText | LEllipse | LSvg;

/** What a child needs to know about the frame it sits in. */
interface ParentCtx {
  dir: 'V' | 'H';
  align: Align;
  sx: Sizing;
  sy: Sizing;
}

const ALIGN: Record<Align, LFrame['ai']> = {
  start: 'MIN',
  center: 'CENTER',
  end: 'MAX',
  stretch: 'MIN',
  baseline: 'BASELINE',
};
const JUSTIFY: Record<NonNullable<Frame['justify']>, LFrame['ji']> = {
  start: 'MIN',
  center: 'CENTER',
  end: 'MAX',
  between: 'SPACE_BETWEEN',
};

function quad(pad: Frame['pad']): Quad {
  if (pad === undefined) {
    return [0, 0, 0, 0];
  }
  if (typeof pad === 'number') {
    return [pad, pad, pad, pad];
  }
  if (pad.length === 2) {
    return [pad[0], pad[1], pad[0], pad[1]];
  }
  return [pad[0], pad[1], pad[2], pad[3]];
}

function label(node: Node): string {
  if (node.name !== undefined) {
    return node.name;
  }
  if (node.t === 'text') {
    return node.text.length > 40 ? `${node.text.slice(0, 39)}…` : node.text;
  }
  return node.t === 'frame' ? 'View' : node.t;
}

/** Smaller copies of the sample photos: the cards are at most 393 pt wide. */
function imageUrl(url: string): string {
  return url.replace(/\/1200\/800$/, '/900/600');
}

/** React Native's sizing rules for one node inside its parent. */
function resolve(node: Node, parent: ParentCtx | null): { sx: Sizing; sy: Sizing } {
  if (node.t === 'ellipse' || node.t === 'svg') {
    return { sx: 'FIXED', sy: 'FIXED' };
  }

  const explicit = (size: Node['w']): Sizing | null =>
    typeof size === 'number' ? 'FIXED' : size === 'fill' ? 'FILL' : size === 'hug' ? 'HUG' : null;

  if (parent === null || node.abs !== undefined) {
    const sx = explicit(node.w) ?? 'HUG';
    const sy = explicit(node.h) ?? 'HUG';
    const stretchX = node.abs?.left !== undefined && node.abs.right !== undefined;
    const stretchY = node.abs?.top !== undefined && node.abs.bottom !== undefined;
    return { sx: stretchX ? 'FIXED' : sx, sy: stretchY ? 'FIXED' : sy };
  }

  const mainIsX = parent.dir === 'H';
  const mainSize = mainIsX ? node.w : node.h;
  const crossSize = mainIsX ? node.h : node.w;
  const parentMain = mainIsX ? parent.sx : parent.sy;

  let main: Sizing = explicit(mainSize) ?? (node.grow === true ? 'FILL' : 'HUG');
  // flex: 1 in a parent that hugs has no free space to take.
  if (main === 'FILL' && parentMain === 'HUG') {
    main = 'HUG';
  }

  const self = node.self ?? (parent.align === 'baseline' ? 'start' : parent.align);
  let cross: Sizing = explicit(crossSize) ?? (self === 'stretch' ? 'FILL' : 'HUG');

  // A text's height always follows its lines.
  if (node.t === 'text') {
    if (mainIsX) {
      cross = typeof node.h === 'number' ? 'FIXED' : 'HUG';
    } else {
      main = typeof node.h === 'number' ? 'FIXED' : 'HUG';
    }
  }

  return mainIsX ? { sx: main, sy: cross } : { sx: cross, sy: main };
}

function lowerText(node: TextNode, sizing: { sx: Sizing; sy: Sizing }): LText {
  const scale: {
    fontSize: number;
    lineHeight: number;
    fontWeight: string;
    letterSpacing?: number;
  } = typeScale[node.variant ?? 'body'];
  const overridden =
    node.size !== undefined ||
    node.weight !== undefined ||
    node.lh !== undefined ||
    node.ls !== undefined;
  const out: LText = {
    t: 't',
    n: label(node),
    x: node.text,
    fs: node.size ?? scale.fontSize,
    lh: node.lh ?? scale.lineHeight,
    fw: node.weight ?? (Number(scale.fontWeight) as LText['fw']),
    ls: node.ls ?? scale.letterSpacing ?? 0,
    c: node.color ?? colors.text,
    ta: node.align === 'center' ? 'CENTER' : node.align === 'right' ? 'RIGHT' : 'LEFT',
    ...sizing,
  };
  if (!overridden) {
    out.style = node.variant ?? 'body';
  }
  if (node.lines !== undefined) {
    out.lines = node.lines;
  }
  return out;
}

function common(node: Node, out: LNode): void {
  if (typeof node.w === 'number') {
    out.w = node.w;
  }
  if (typeof node.h === 'number') {
    out.h = node.h;
  }
  if (node.opacity !== undefined) {
    out.op = node.opacity;
  }
  if (node.abs !== undefined) {
    out.abs = node.abs;
  }
  if (node.go !== undefined) {
    out.go = node.go;
    out.how = node.goHow ?? 'push';
  }
  if (node.back === true) {
    out.back = true;
  }
}

/** The node itself, with the sizing already decided. */
function lowerInner(node: Node, sizing: { sx: Sizing; sy: Sizing }): LNode {
  if (node.t === 'text') {
    const out = lowerText(node, sizing);
    common(node, out);
    return out;
  }
  if (node.t === 'svg') {
    const out: LSvg = { t: 's', n: label(node), svg: node.svg, ...sizing };
    common(node, out);
    return out;
  }
  if (node.t === 'ellipse') {
    const out: LEllipse = { t: 'e', n: label(node), ...sizing };
    if (node.fill !== undefined && node.fill !== 'transparent') {
      out.fill = node.fill;
    }
    if (node.stroke !== undefined && node.stroke !== 'transparent' && node.strokeW !== undefined) {
      out.st = { c: node.stroke, w: node.strokeW };
    }
    common(node, out);
    return out;
  }

  const dir: 'V' | 'H' = node.dir === 'row' ? 'H' : 'V';
  const align: Align = node.align ?? 'stretch';
  const p = quad(node.pad);

  const out: LFrame = {
    t: 'f',
    n: label(node),
    d: dir,
    g: node.gap ?? 0,
    p,
    ai: ALIGN[align],
    ji: JUSTIFY[node.justify ?? 'start'],
    ...sizing,
    c: [],
  };
  if (node.wrap === true) {
    out.wrap = true;
    if (align === 'stretch') {
      out.stretchLines = true;
    }
  }
  if (node.fill !== undefined && node.fill !== 'transparent') {
    out.fill = node.fill;
  }
  if (node.strokeW !== undefined && node.stroke !== undefined) {
    const weights: Quad =
      typeof node.strokeW === 'number'
        ? [node.strokeW, node.strokeW, node.strokeW, node.strokeW]
        : [
            node.strokeW.top ?? 0,
            node.strokeW.right ?? 0,
            node.strokeW.bottom ?? 0,
            node.strokeW.left ?? 0,
          ];
    if (node.stroke === 'transparent') {
      // The border still takes its space in React Native: keep it as padding.
      out.p = [p[0] + weights[0], p[1] + weights[1], p[2] + weights[2], p[3] + weights[3]];
    } else {
      out.st = { c: node.stroke, w: weights };
    }
  }
  if (node.radius !== undefined) {
    out.r =
      typeof node.radius === 'number'
        ? [node.radius, node.radius, node.radius, node.radius]
        : node.radius;
  }
  if (node.clip === true) {
    out.clip = true;
  }
  if (node.minW !== undefined) {
    out.minW = node.minW;
  }
  if (node.minH !== undefined) {
    out.minH = node.minH;
  }
  if (node.maxW !== undefined) {
    out.maxW = node.maxW;
  }
  if (node.maxH !== undefined) {
    out.maxH = node.maxH;
  }
  if (node.image !== undefined) {
    out.img = imageUrl(node.image);
  }
  if (node.scroll !== undefined) {
    out.scroll = node.scroll;
  }
  common(node, out);

  const ctx: ParentCtx = { dir, align, sx: sizing.sx, sy: sizing.sy };
  const children = node.children ?? [];
  const lowered = children.map((child) => lowerNode(child, ctx));

  // Stretching to the widest sibling needs one that is not itself stretched; when all are, hug.
  const crossKey = dir === 'V' ? 'sx' : 'sy';
  const parentCross = dir === 'V' ? sizing.sx : sizing.sy;
  const inFlow = lowered.filter((child) => child.abs === undefined);
  if (
    parentCross === 'HUG' &&
    inFlow.length > 0 &&
    inFlow.every((child) => child[crossKey] === 'FILL')
  ) {
    for (const child of inFlow) {
      child[crossKey] = 'HUG';
    }
  }
  out.c = lowered;
  return out;
}

function hasMargin(node: Node): boolean {
  return (node.mt ?? 0) > 0 || (node.mb ?? 0) > 0 || (node.ml ?? 0) > 0 || (node.mr ?? 0) > 0;
}

function wrapper(name: string, dir: 'V' | 'H', sx: Sizing, sy: Sizing, child: LNode): LFrame {
  return {
    t: 'f',
    n: name,
    d: dir,
    g: 0,
    p: [0, 0, 0, 0],
    ai: 'MIN',
    ji: 'MIN',
    sx,
    sy,
    c: [child],
  };
}

const loosen = (sizing: Sizing): Sizing => (sizing === 'FIXED' ? 'HUG' : sizing);

/** A node in its parent: adds the frames that stand in for margins and for alignSelf. */
export function lowerNode(node: Node, parent: ParentCtx | null): LNode {
  const sizing = resolve(node, parent);
  let out = lowerInner(node, sizing);
  if (parent === null || node.abs !== undefined) {
    return out;
  }

  if (hasMargin(node)) {
    const margin = wrapper(`${out.n} (margin)`, 'V', loosen(sizing.sx), loosen(sizing.sy), out);
    margin.p = [node.mt ?? 0, node.mr ?? 0, node.mb ?? 0, node.ml ?? 0];
    out = margin;
  }

  // alignSelf that differs from where the parent puts its children.
  const parentAlign =
    parent.align === 'stretch' || parent.align === 'baseline' ? 'start' : parent.align;
  if (node.self !== undefined && node.self !== 'stretch' && node.self !== parentAlign) {
    const crossIsX = parent.dir === 'V';
    const main = crossIsX ? out.sy : out.sx;
    const aligner = crossIsX
      ? wrapper(`${out.n} (alignSelf: ${node.self})`, 'H', 'FILL', loosen(main), out)
      : wrapper(`${out.n} (alignSelf: ${node.self})`, 'V', loosen(main), 'FILL', out);
    aligner.ji = node.self === 'center' ? 'CENTER' : node.self === 'end' ? 'MAX' : 'MIN';
    aligner.aligner = true;
    // Inside the aligner the node keeps filling the parent's main axis if it did before.
    if (main === 'FILL') {
      if (crossIsX) {
        out.sy = 'FILL';
      } else {
        out.sx = 'FILL';
      }
    }
    out = aligner;
  }
  return out;
}

/** A screen's root frame, which sits on the canvas at a fixed size. */
export function lowerRoot(tree: Frame): LFrame {
  const out = lowerNode(tree, null);
  if (out.t !== 'f') {
    throw new Error('a screen root must be a frame');
  }
  return out;
}
