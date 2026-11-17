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
  // JavaScript files have no type information: no tsconfig includes them, so the project service
  // would refuse to parse one (a .jsx file would fail lint before any boundary rule ran).
  files: ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
  ...tseslint.configs.disableTypeChecked,
};

/**
 * Refuses an `import()` whose specifier is not a plain string literal (a template literal, a
 * concatenation, a variable), which no boundary can read: bundlers still resolve a template literal
 * without expressions, so `` import(`@gog/data/booking`) `` would otherwise bypass every ban below.
 */
export const nonLiteralImportBan = {
  selector: "ImportExpression[source.type!='Literal']",
  message: 'Write the import() specifier as a plain string, so the import boundary can check it.',
};

/**
 * `no-restricted-imports` checks `import` and `export … from` declarations only, so a dynamic
 * `import('x')` slips past it. This turns a boundary's `paths` into the matching
 * `no-restricted-syntax` entries, plus `nonLiteralImportBan`, so each boundary refuses both forms.
 * A path restricted to some of its exports (`importNames`) is refused whole when imported
 * dynamically, because lint cannot see which export a dynamic import goes on to use.
 *
 * @param {{ name: string; message: string; importNames?: string[] }[]} paths
 * @returns {{ selector: string; message: string }[]}
 */
export function dynamicImportBans(paths) {
  return [
    ...paths.map(({ name, message, importNames }) => ({
      selector: `ImportExpression[source.value=${JSON.stringify(name)}]`,
      message:
        importNames === undefined
          ? message
          : `Import ${name} statically, so lint can check which of its exports you use. ${message}`,
    })),
    nonLiteralImportBan,
  ];
}

/**
 * The files a boundary applies to under each of its roots: TypeScript and any JavaScript Next or
 * Metro would compile, so a `.js` or `.mjs` module cannot carry what a `.ts` one may not.
 *
 * @param {string[]} roots e.g. ['src']
 * @returns {string[]}
 */
export function boundaryFiles(roots) {
  return roots.map((root) => `${root}/**/*.{ts,tsx,js,jsx,mjs,cjs}`);
}

export { prettier };

export default [...presets, prettier, rules, jsNoTypeInfo];
