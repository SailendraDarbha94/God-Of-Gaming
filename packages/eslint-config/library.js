import {
  boundaryFiles,
  jsNoTypeInfo,
  nonLiteralImportBan,
  presets,
  prettier,
  rules,
} from './base.js';

/**
 * For pure libraries such as @gog/domain: the shared presets and rules, plus a ban on UI, framework
 * and I/O imports so the package cannot quietly stop being pure (ADR 0007, spec 02).
 */
const boundaries = {
  name: 'gog/library-boundaries',
  files: boundaryFiles(['src']),
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
    // The same groups for a dynamic `import('…')`, which `no-restricted-imports` does not check.
    // esquery reads a regex up to its first slash, so `\x2F` stands for "/" inside it.
    'no-restricted-syntax': [
      'error',
      {
        selector: String.raw`ImportExpression[source.value=/^(react|react-dom|react-native|next|expo)(\x2F|$)|^expo-|^@supabase\x2F|^node:/]`,
        message:
          'This package stays pure: no UI, framework, platform or I/O imports (ADR 0007, spec 02).',
      },
      nonLiteralImportBan,
    ],
  },
};

export default [...presets, prettier, rules, boundaries, jsNoTypeInfo];
