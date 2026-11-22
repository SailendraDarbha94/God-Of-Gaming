/**
 * Builds out/board.json: every screen's lowered tree, laid out in sections, with the design tokens
 * and the flow arrows, plus a copy of renderer.js next to it. Usage: pnpm board:build
 */
import fs from 'node:fs';
import path from 'node:path';

import { colors, typeScale, type Screen } from '@board/dsl';
import { lowerRoot } from '@board/lower';
import { loadScenario } from '@board/scenario';
import { validateScreen } from '@board/tools/validate';
import { arrows, flowStart, page, sections } from '@board/board';

const scenario = await loadScenario();
const byKey = new Map<string, Screen>();
const dir = path.join(import.meta.dirname, 'screens');
for (const file of fs
  .readdirSync(dir)
  .filter((name) => name.endsWith('.ts'))
  .sort()) {
  const module_ = (await import(path.join(dir, file))) as {
    screens: (s: typeof scenario) => Screen[];
  };
  for (const screen of module_.screens(scenario)) {
    if (byKey.has(screen.key)) {
      throw new Error(`duplicate screen key ${screen.key} (in ${file})`);
    }
    byKey.set(screen.key, screen);
  }
}

let failed = false;
const linked = new Set<string>();
for (const screen of byKey.values()) {
  const { issues, links } = validateScreen(screen);
  for (const issue of issues) {
    failed = true;
    console.error(`ERROR ${screen.key} ${issue.path}: ${issue.message}`);
  }
  for (const link of links) {
    linked.add(link);
  }
}
for (const link of linked) {
  if (!byKey.has(link)) {
    console.warn(`WARN a layer links to "${link}", which no screen has as its key`);
  }
}
if (failed) {
  process.exit(1);
}

const placed = new Set<string>();
const outSections = sections.map((section) => ({
  ...section,
  rows: section.rows.map((row) =>
    row.flatMap((entry) => {
      const key = typeof entry === 'string' ? entry : entry.key;
      const screen = byKey.get(key);
      if (screen === undefined) {
        console.warn(`WARN board.ts places "${key}", which no screen file builds yet`);
        return [];
      }
      placed.add(key);
      return [
        {
          key: screen.key,
          name: screen.name,
          route: screen.route,
          note: screen.note,
          mode: screen.mode,
          ...(typeof entry === 'string' || entry.col === undefined ? {} : { col: entry.col }),
          tree: lowerRoot(screen.tree),
        },
      ];
    }),
  ),
}));
for (const key of byKey.keys()) {
  if (!placed.has(key)) {
    console.warn(`WARN screen "${key}" is built but board.ts does not place it`);
  }
}

// onAccent is the background colour again; one style per distinct value.
const { onAccent: _onAccent, ...distinctColors } = colors;
const board = {
  page,
  tokens: {
    colors: distinctColors,
    type: Object.fromEntries(
      Object.entries(typeScale).map(([name, scale]) => [
        name,
        {
          fs: scale.fontSize,
          lh: scale.lineHeight,
          fw: Number(scale.fontWeight),
          ls: 'letterSpacing' in scale ? scale.letterSpacing : 0,
        },
      ]),
    ),
  },
  sections: outSections,
  arrows: arrows.filter((arrow) => placed.has(arrow.from) && placed.has(arrow.to)),
  flowStart,
};

const outDir = path.join(import.meta.dirname, 'out');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'board.json');
const json = JSON.stringify(board);
fs.writeFileSync(out, json);
// The renderer goes next to the board, so the two files to load in Figma sit in one folder.
fs.copyFileSync(path.join(import.meta.dirname, 'renderer.js'), path.join(outDir, 'renderer.js'));
const layers = json.match(/"t":"[ftes]"/g)?.length ?? 0;
console.log(
  `wrote ${path.relative(process.cwd(), out)}: ${placed.size} screens, ${layers} layers, ${(json.length / 1024).toFixed(0)} KB`,
);
