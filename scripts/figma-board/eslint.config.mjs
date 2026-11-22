import base from '../../packages/eslint-config/base.js';

/**
 * The repository's shared rules (packages/eslint-config/base.js). This folder is not a workspace
 * package, so it imports the config by path and is linted by `pnpm board:check`, not by `pnpm lint`.
 */
export default [
  { ignores: ['out/**'] },
  ...base,
  {
    // run.mjs, build.ts and tools/preview.ts are command-line scripts: printing is their output.
    files: ['build.ts', 'tools/preview.ts', 'run.mjs'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['run.mjs'],
    languageOptions: { globals: { process: 'readonly', console: 'readonly' } },
  },
  {
    // renderer.js and loader.js run in the Figma tab, against Figma's plugin API and the DOM.
    files: ['renderer.js', 'loader.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        figma: 'readonly',
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
      },
    },
    rules: { 'no-console': 'off' },
  },
];
