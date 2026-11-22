/**
 * Checks one screen file without Figma: runs its `screens(scenario)` export, validates every tree
 * and prints an outline of the layers.
 *
 *   pnpm board:preview screens/explore.ts            validate + outline
 *   pnpm board:preview screens/explore.ts --quiet    validate only
 *
 * The screen file's path is relative to scripts/figma-board.
 */
import path from 'node:path';

import type { Node, Screen } from '@board/dsl';
import { loadScenario } from '@board/scenario';
import { validateScreen } from './validate';

const [file, flag] = process.argv.slice(2);
if (file === undefined) {
  console.error('usage: pnpm board:preview <screens/file.ts> [--quiet]');
  process.exit(2);
}

function describe(node: Node): string {
  if (node.t === 'text') {
    const style = [
      node.variant ?? 'body',
      node.color,
      node.size && `size ${node.size}`,
      node.weight && `w${node.weight}`,
      node.lines && `${node.lines} line(s)`,
      node.align,
    ]
      .filter(Boolean)
      .join(', ');
    return `"${node.text.length > 70 ? `${node.text.slice(0, 67)}…` : node.text}"  (${style})`;
  }
  if (node.t === 'svg') {
    return `svg ${node.name ?? ''}`;
  }
  if (node.t === 'ellipse') {
    return `ellipse ${node.name ?? ''} ${node.w}x${node.h}`;
  }
  const bits = [
    node.dir === 'row' ? 'row' : 'col',
    node.gap !== undefined && `gap ${node.gap}`,
    node.pad !== undefined && `pad ${JSON.stringify(node.pad)}`,
    node.align && `align ${node.align}`,
    node.justify && `justify ${node.justify}`,
    node.wrap && 'wrap',
    node.w !== undefined && `w ${node.w}`,
    node.h !== undefined && `h ${node.h}`,
    node.grow && 'grow',
    node.fill && `fill ${node.fill}`,
    node.stroke && `stroke ${node.stroke}`,
    node.radius !== undefined && `r ${JSON.stringify(node.radius)}`,
    node.image && 'image',
    node.scroll && `scroll ${node.scroll}`,
  ].filter(Boolean);
  return `[${node.name ?? 'View'}]  ${bits.join(', ')}`;
}

function outline(node: Node, depth: number, lines: string[]): void {
  const link =
    node.go !== undefined
      ? `  → ${node.go}${node.goHow ? ` (${node.goHow})` : ''}`
      : node.back
        ? '  → back'
        : '';
  const extras = [
    node.abs && `abs ${JSON.stringify(node.abs)}`,
    node.self && `self ${node.self}`,
    node.opacity !== undefined && `opacity ${node.opacity}`,
    (node.mt ?? node.mb ?? node.ml ?? node.mr) !== undefined &&
      `margin t${node.mt ?? 0} r${node.mr ?? 0} b${node.mb ?? 0} l${node.ml ?? 0}`,
  ]
    .filter(Boolean)
    .join(', ');
  lines.push(`${'  '.repeat(depth)}${describe(node)}${extras ? `  {${extras}}` : ''}${link}`);
  if (node.t === 'frame') {
    for (const child of node.children ?? []) {
      outline(child, depth + 1, lines);
    }
  }
}

function count(node: Node): number {
  return (
    1 +
    (node.t === 'frame' ? (node.children ?? []).reduce((sum, child) => sum + count(child), 0) : 0)
  );
}

const scenario = await loadScenario();
const module_ = (await import(path.resolve(import.meta.dirname, '..', file))) as {
  screens?: (s: typeof scenario) => Screen[];
};
if (typeof module_.screens !== 'function') {
  console.error(`${file} must export function screens(s: Scenario): Screen[]`);
  process.exit(1);
}
const screens = module_.screens(scenario);
let failed = false;
for (const screen of screens) {
  const { issues, links } = validateScreen(screen);
  console.log(
    `\n=== ${screen.key}  "${screen.name}"  ${screen.route}  mode ${screen.mode}  ${count(screen.tree)} layers  links: ${[...links].join(', ') || 'none'}`,
  );
  if (screen.note) {
    console.log(`    note: ${screen.note}`);
  }
  for (const issue of issues) {
    failed = true;
    console.log(`  ERROR ${issue.path}: ${issue.message}`);
  }
  if (flag !== '--quiet') {
    const lines: string[] = [];
    outline(screen.tree, 1, lines);
    console.log(lines.join('\n'));
  }
}
console.log(failed ? '\nFAILED: fix the errors above' : `\nOK: ${screens.length} screen(s) valid`);
process.exit(failed ? 1 : 0);
