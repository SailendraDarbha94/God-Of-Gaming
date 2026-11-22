/** Structural checks on a screen's tree, so a typo fails here and not halfway through a Figma render. */
import type { Node, Screen } from '@board/dsl';
import { typeScale } from '@board/dsl';

const COLOR = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const COMMON = [
  't',
  'name',
  'w',
  'h',
  'grow',
  'self',
  'opacity',
  'mt',
  'mb',
  'ml',
  'mr',
  'abs',
  'go',
  'goHow',
  'back',
];
const ALLOWED: Record<Node['t'], string[]> = {
  frame: [
    ...COMMON,
    'dir',
    'gap',
    'wrap',
    'pad',
    'align',
    'justify',
    'fill',
    'stroke',
    'strokeW',
    'radius',
    'clip',
    'minW',
    'minH',
    'maxW',
    'maxH',
    'image',
    'scroll',
    'children',
  ],
  text: [...COMMON, 'text', 'variant', 'color', 'size', 'weight', 'lh', 'ls', 'align', 'lines'],
  ellipse: [...COMMON, 'fill', 'stroke', 'strokeW'],
  svg: [...COMMON, 'svg'],
};

const isNum = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const isSize = (value: unknown): boolean =>
  value === undefined || value === 'fill' || value === 'hug' || (isNum(value) && value >= 0);
const isColor = (value: unknown, allowTransparent: boolean): boolean =>
  value === undefined ||
  (allowTransparent && value === 'transparent') ||
  (typeof value === 'string' && COLOR.test(value));

export interface Issue {
  path: string;
  message: string;
}

export function validateNode(node: Node, path: string, issues: Issue[], links: Set<string>): void {
  const add = (message: string): void => {
    issues.push({ path, message });
  };
  const record = node as unknown as Record<string, unknown>;
  const allowed = ALLOWED[node.t];
  if (allowed === undefined) {
    add(`unknown node type ${String(record.t)}`);
    return;
  }
  for (const key of Object.keys(record)) {
    if (record[key] !== undefined && !allowed.includes(key)) {
      add(`unknown property "${key}" on a ${node.t}`);
    }
  }
  if (!isSize(node.w)) {
    add(`w must be a number, 'fill' or 'hug', got ${JSON.stringify(node.w)}`);
  }
  if (!isSize(node.h)) {
    add(`h must be a number, 'fill' or 'hug', got ${JSON.stringify(node.h)}`);
  }
  for (const side of ['mt', 'mb', 'ml', 'mr'] as const) {
    const margin = node[side];
    if (margin !== undefined && (!isNum(margin) || margin < 0)) {
      add(
        `${side} must be a number >= 0 (negative margins are not supported), got ${JSON.stringify(margin)}`,
      );
    }
  }
  if (
    node.opacity !== undefined &&
    (!isNum(node.opacity) || node.opacity < 0 || node.opacity > 1)
  ) {
    add('opacity must be between 0 and 1');
  }
  if (node.go !== undefined) {
    links.add(node.go);
  }
  if (node.goHow !== undefined && node.go === undefined) {
    add('goHow without go');
  }

  if (node.t === 'text') {
    if (typeof node.text !== 'string') {
      add('text must be a string');
    } else if (node.text === '') {
      add('empty text');
    }
    if (node.variant !== undefined && !(node.variant in typeScale)) {
      add(`unknown variant ${String(node.variant)}`);
    }
    if (!isColor(node.color, false)) {
      add(`color must be #RRGGBB or #RRGGBBAA, got ${JSON.stringify(node.color)}`);
    }
    if (node.weight !== undefined && ![400, 500, 600, 700].includes(node.weight)) {
      add(`weight must be 400, 500, 600 or 700`);
    }
    return;
  }
  if (node.t === 'svg') {
    if (
      typeof node.svg !== 'string' ||
      !node.svg.startsWith('<svg') ||
      !/width="[\d.]+"/.test(node.svg) ||
      !/height="[\d.]+"/.test(node.svg)
    ) {
      add('svg must be a complete <svg> element with numeric width and height');
    }
    return;
  }
  if (node.t === 'ellipse') {
    if (!isNum(node.w) || !isNum(node.h)) {
      add('an ellipse needs numeric w and h');
    }
    if (!isColor(node.fill, true)) {
      add(`fill must be a hex colour or 'transparent'`);
    }
    if (!isColor(node.stroke, true)) {
      add(`stroke must be a hex colour or 'transparent'`);
    }
    return;
  }

  if (node.dir !== undefined && node.dir !== 'col' && node.dir !== 'row') {
    add(`dir must be 'col' or 'row'`);
  }
  if (node.wrap === true && node.dir !== 'row') {
    add('wrap needs dir: row');
  }
  if (node.align === 'baseline' && node.dir !== 'row') {
    add(`align: 'baseline' needs dir: row`);
  }
  if (!isColor(node.fill, true)) {
    add(`fill must be a hex colour or 'transparent', got ${JSON.stringify(node.fill)}`);
  }
  if (!isColor(node.stroke, true)) {
    add(`stroke must be a hex colour or 'transparent', got ${JSON.stringify(node.stroke)}`);
  }
  if (node.stroke !== undefined && node.strokeW === undefined) {
    add('stroke without strokeW');
  }
  if (node.gap !== undefined && (!isNum(node.gap) || node.gap < 0)) {
    add('gap must be a number >= 0');
  }
  if (node.pad !== undefined) {
    const pad = Array.isArray(node.pad) ? node.pad : [node.pad];
    if (![1, 2, 4].includes(pad.length) || pad.some((value) => !isNum(value) || value < 0)) {
      add(
        `pad must be a number, [v, h] or [t, r, b, l] of numbers >= 0, got ${JSON.stringify(node.pad)}`,
      );
    }
  }
  if (node.image !== undefined && !node.image.startsWith('https://')) {
    add('image must be an https URL');
  }
  if (node.scroll !== undefined && (node.children ?? []).length !== 1) {
    add('a scroll viewport must have exactly one child, its content container');
  }
  (node.children ?? []).forEach((child, index) => {
    if (child === null || typeof child !== 'object') {
      issues.push({
        path: `${path} > [${index}]`,
        message: `child is ${JSON.stringify(child)}; pass children through box()/row(), which drop empty ones`,
      });
      return;
    }
    validateNode(
      child,
      `${path} > ${child.name ?? (child.t === 'text' ? JSON.stringify(child.text.slice(0, 24)) : child.t)}`,
      issues,
      links,
    );
  });
}

export function validateScreen(screen: Screen): { issues: Issue[]; links: Set<string> } {
  const issues: Issue[] = [];
  const links = new Set<string>();
  if (!/^[a-z0-9-]+$/.test(screen.key)) {
    issues.push({
      path: screen.key,
      message: 'key must be lower-case letters, digits and hyphens',
    });
  }
  if (screen.mode !== 'device' && screen.mode !== 'full') {
    issues.push({ path: screen.key, message: `mode must be 'device' or 'full'` });
  }
  if (
    typeof screen.tree.w !== 'number' ||
    (screen.tree.h !== undefined && typeof screen.tree.h !== 'number')
  ) {
    issues.push({
      path: screen.key,
      message:
        'the root needs a numeric w, and a numeric h or none (a sheet that hugs); build screens with Phone()',
    });
  }
  validateNode(screen.tree, screen.name, issues, links);
  return { issues, links };
}
