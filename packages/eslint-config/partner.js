import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

import {
  boundaryFiles,
  dynamicImportBans,
  jsNoTypeInfo,
  presets,
  prettier,
  rules,
} from './base.js';

/**
 * For apps/partner: composed like `next.js` (the website's), with the partner app's own boundary
 * (docs/spec/iteration-2/04-packages.md). All data access happens in the browser and the server
 * renders static shells only (ADR 0013), so the app never imports the Supabase SDK or the server's
 * request APIs, never declares a Server Action, and never books for players (ADR 0016).
 *
 * `paths` entries match exact specifiers, as in `next.js`: the `@gog/data` root re-exports the
 * booking module, and `@gog/data/factory` exports `createBookingRepository` next to the creators the
 * app does use. Deep paths need no entry because the package's `exports` map does not expose them.
 * The `'use server'` selector matches the directive at the top of a module and inside a function,
 * and the same paths are refused as dynamic `import()` expressions (`dynamicImportBans`, base.js).
 */
const restrictedPaths = [
  {
    name: '@gog/data',
    message: 'Import @gog/data/partner, ./catalog, ./auth, ./client or ./factory (ADR 0013).',
  },
  {
    name: '@gog/data/booking',
    message:
      'The partner app never books for players; counter writes go through @gog/data/partner (ADR 0016).',
  },
  {
    name: '@gog/data/factory',
    importNames: ['createBookingRepository'],
    message: 'The partner app does not book for players (ADR 0016).',
  },
  {
    name: '@supabase/supabase-js',
    message: 'Go through @gog/data (ADR 0011).',
  },
  {
    name: '@supabase/ssr',
    message: 'The partner app keeps its session in the browser (ADR 0013).',
  },
  {
    name: 'next/headers',
    message: 'The partner server renders no user data (ADR 0013).',
  },
];

const boundaries = {
  name: 'gog/partner-boundaries',
  files: boundaryFiles(['src']),
  rules: {
    'no-restricted-imports': ['error', { paths: restrictedPaths }],
    'no-restricted-syntax': [
      'error',
      {
        selector: "ExpressionStatement[directive='use server']",
        message: 'No Server Actions in apps/partner (ADR 0013).',
      },
      ...dynamicImportBans(restrictedPaths),
    ],
  },
};

export default [...presets, ...nextVitals, ...nextTs, prettier, rules, boundaries, jsNoTypeInfo];
