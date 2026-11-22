/**
 * Runs one of the board generator's TypeScript files with the app's own modules on the import path:
 *
 *   node scripts/figma-board/run.mjs build.ts
 *   node scripts/figma-board/run.mjs tools/preview.ts screens/explore.ts
 *
 * The script path is relative to this folder; any further arguments are passed on. jiti loads
 * TypeScript directly, so the builders can import the player app's theme, copy and formatters and
 * the fixture repositories of @gog/data without a build step.
 */
import path from 'node:path';

import { createJiti } from 'jiti';

const here = import.meta.dirname;
const root = path.resolve(here, '../..');

const [script] = process.argv.splice(2, 1);
if (script === undefined) {
  console.error('usage: node scripts/figma-board/run.mjs <file.ts> [arguments]');
  process.exit(2);
}

const jiti = createJiti(import.meta.url, {
  alias: {
    '@app': path.join(root, 'apps/player/src'),
    '@gog/domain': path.join(root, 'packages/domain/src'),
    '@gog/data': path.join(root, 'packages/data/src'),
    '@board': here,
  },
});

await jiti.import(path.resolve(here, script));
