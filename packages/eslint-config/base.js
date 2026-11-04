import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

/**
 * Building blocks shared by every package. Each finished config is composed in the same order:
 *
 *   [...presets, ...frameworkConfigs, prettier, rules, boundaries, jsNoTypeInfo]
 *
 * `rules` comes after the framework configs and after eslint-config-prettier on purpose:
 * eslint-config-next/typescript downgrades `@typescript-eslint/no-unused-vars` to a warning,
 * eslint-config-expo sets `eqeqeq` to `['warn', 'smart']` and replaces our `no-unused-vars`
 * options, and eslint-config-prettier turns `curly` off. Applying ours last keeps them errors;
 * `curly: ['error', 'all']` after Prettier is explicitly allowed by eslint-config-prettier.
 *
 * Type-aware linting uses the nearest tsconfig.json of each linted file (projectService), so run
 * ESLint from the package directory, as Turborepo does.
 */
export const ignores = {
  ignores: [
    '**/node_modules/**',
    '**/.next/**',
    '**/.expo/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.turbo/**',
    '**/database.types.ts',
  ],
};

export const presets = [
  ignores,
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.config.ts'],
        },
      },
    },
  },
];

export const rules = {
  name: 'gog/rules',
  rules: {
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
    ],
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-non-null-assertion': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    eqeqeq: ['error', 'always'],
    curly: ['error', 'all'],
  },
};

export const jsNoTypeInfo = {
  // Plain JavaScript config files have no type information.
  files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
  ...tseslint.configs.disableTypeChecked,
};

export { prettier };

export default [...presets, prettier, rules, jsNoTypeInfo];
