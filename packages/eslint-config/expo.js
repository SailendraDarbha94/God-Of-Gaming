// eslint-config-expo has no `exports` map, so the file extension is required under ESM resolution.
import expoConfig from 'eslint-config-expo/flat.js';

import { jsNoTypeInfo, presets, prettier, rules } from './base.js';

/**
 * For apps/player: the shared presets, Expo's flat config (React, React Native, Expo and import
 * rules), Prettier, then our rules (after Expo's, which would otherwise soften `eqeqeq` and
 * `no-unused-vars`) and one boundary: the app never imports the Supabase SDK itself. The client is
 * created by `createNativeClient` from @gog/data in src/lib/supabase.ts, so no file is exempt
 * (ADR 0011).
 */
const boundaries = {
  name: 'gog/player-boundaries',
  files: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@supabase/supabase-js',
            message:
              'Go through @gog/data (createNativeClient in src/lib/supabase.ts builds the client); the app never imports the SDK (ADR 0011).',
          },
        ],
      },
    ],
  },
};

/**
 * eslint-config-expo sets `settings.react.version: 'detect'`, and eslint-plugin-react 7.37's
 * detection calls `context.getFilename()`, which ESLint 10 removed, so the first React rule crashes
 * ("contextOrFilename.getFilename is not a function"). Stating the version skips detection; it is
 * the React major.minor the catalog pins in pnpm-workspace.yaml.
 */
const reactVersion = {
  name: 'gog/react-version',
  settings: { react: { version: '19.3' } },
};

/**
 * Metro loads metro.config.js (and Babel babel.config.js) with Node's CommonJS `require`, as the
 * Expo docs write them; typescript-eslint's recommended set would otherwise flag that `require`.
 */
const commonJsConfigFiles = {
  name: 'gog/expo-commonjs-config-files',
  files: ['metro.config.js', 'babel.config.js'],
  rules: {
    '@typescript-eslint/no-require-imports': 'off',
  },
};

export default [
  ...presets,
  ...(Array.isArray(expoConfig) ? expoConfig : [expoConfig]),
  reactVersion,
  prettier,
  rules,
  boundaries,
  jsNoTypeInfo,
  commonJsConfigFiles,
];
