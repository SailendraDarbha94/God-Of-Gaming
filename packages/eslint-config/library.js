import { jsNoTypeInfo, presets, prettier, rules } from './base.js';

/**
 * For pure libraries such as @gog/domain: the shared presets and rules, plus a ban on UI, framework
 * and I/O imports so the package cannot quietly stop being pure (ADR 0007, spec 02).
 */
const boundaries = {
  name: 'gog/library-boundaries',
  files: ['src/**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: [
              'react',
              'react/*',
              'react-dom',
              'react-dom/*',
              'react-native',
              'react-native/*',
              'next',
              'next/*',
              'expo',
              'expo/*',
              'expo-*',
              '@supabase/*',
              'node:*',
            ],
            message:
              'This package stays pure: no UI, framework, platform or I/O imports (ADR 0007, spec 02).',
          },
        ],
      },
    ],
  },
};

export default [...presets, prettier, rules, boundaries, jsNoTypeInfo];
