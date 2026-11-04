import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

import { jsNoTypeInfo, presets, prettier, rules } from './base.js';

/**
 * For apps/web: the shared presets, Next.js core web vitals and TypeScript rules, Prettier, then our
 * rules (after Next's, which would otherwise downgrade `no-unused-vars` to a warning) and the
 * boundary the website must keep: it reads the catalog and nothing else (ADR 0004, ADR 0011).
 *
 * `paths` entries match exact specifiers, so the subpaths alone were not the whole boundary: the
 * package root re-exports `./booking` and `./auth`, and `@gog/data/factory` exports the booking and
 * auth creators next to the catalog one. Both are named here; deep paths such as
 * `@gog/data/booking/supabase-booking` need no entry because the package's `exports` map does not
 * expose them.
 */
const boundaries = {
  name: 'gog/web-boundaries',
  files: ['src/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@gog/data',
            message:
              'Import @gog/data/catalog, @gog/data/client or @gog/data/factory; the root re-exports booking and auth (ADR 0004).',
          },
          {
            name: '@gog/data/booking',
            message: 'The website never books; booking lives in the apps (ADR 0004).',
          },
          {
            name: '@gog/data/auth',
            message: 'The website has no accounts (ADR 0004).',
          },
          {
            name: '@gog/data/factory',
            importNames: ['createBookingRepository', 'createAuthGateway'],
            message: 'The website only creates the catalog repository (ADR 0004).',
          },
          {
            name: '@supabase/supabase-js',
            message: 'Go through @gog/data; the website only needs the catalog (ADR 0011).',
          },
        ],
      },
    ],
  },
};

export default [...presets, ...nextVitals, ...nextTs, prettier, rules, boundaries, jsNoTypeInfo];
