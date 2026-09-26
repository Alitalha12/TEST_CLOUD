// Shared ESLint flat config. Apps import and extend this array, e.g.:
//   const base = require('@campus/config/eslint.config.js');
//   module.exports = [...base, { files: ['app/**/*.js'], ... }];
'use strict';

const js = require('@eslint/js');
const importPlugin = require('eslint-plugin-import-x');
const nodePlugin = require('eslint-plugin-n');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');

/**
 * Restricted-syntax rules that encode architecture decisions from
 * docs/architecture.md so a bad pattern fails CI instead of review.
 *
 * - No `$queryRawUnsafe`: raw SQL must go through tagged-template
 *   `$queryRaw` so Prisma parameterizes it. (§20 Security Architecture)
 * - No `dangerouslySetInnerHTML`: content is never rendered as HTML.
 *   (§20 Security Architecture — XSS)
 */
const restrictedSyntaxRules = [
  {
    selector:
      "CallExpression[callee.property.name='$queryRawUnsafe'], CallExpression[callee.name='$queryRawUnsafe']",
    message:
      '$queryRawUnsafe is banned (SQL injection risk). Use $queryRaw with a tagged template instead. See docs/architecture.md §20.',
  },
  {
    selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
    message:
      'dangerouslySetInnerHTML is banned (XSS risk). Render content as text, never as HTML. See docs/architecture.md §20.',
  },
];

/**
 * Server-only rule (applied by apps/server's own eslint config once
 * Prisma modules exist in Phase 1+): Prisma repositories must not
 * `include: { user: true }` (or user_identities) outside the auth/admin
 * modules, per §11.5 "four locks" against accidental identity leaks.
 * Exported here so apps/server can compose it once its module folders
 * exist; not applied globally because most of the repo has no Prisma
 * calls at all.
 */
const noIncludeUserOutsideAuthAdmin = {
  selector:
    "Property[key.name='include'] ObjectExpression > Property[key.name=/^(user|userIdentity|user_identities)$/]",
  message:
    'Do not `include` user/user_identities from outside the auth or admin modules — this is how private fields leak. See docs/architecture.md §11.5.',
};

module.exports = [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.expo/**',
      '**/.next/**',
      '**/*.d.ts',
      'pnpm-lock.yaml',
    ],
  },
  js.configs.recommended,
  {
    plugins: {
      import: importPlugin,
      n: nodePlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-restricted-syntax': ['error', ...restrictedSyntaxRules],
      'import/no-duplicates': 'error',
    },
  },
  prettierConfig,
  // Exported so consuming configs can opt in per-directory:
  //   { files: ['apps/server/src/modules/**/*.js'],
  //     ignores: ['apps/server/src/modules/{auth,admin}/**'],
  //     rules: { 'no-restricted-syntax': ['error', ...restrictedSyntaxRules, noIncludeUserOutsideAuthAdmin] } }
  // NOTE: flat config REPLACES (doesn't merge) a rule's array value when
  // the same rule key appears in a later matching config — an override
  // that sets 'no-restricted-syntax' to only [noIncludeUserOutsideAuthAdmin]
  // would silently drop the $queryRawUnsafe/dangerouslySetInnerHTML bans
  // for those files. Always spread restrictedSyntaxRules back in too.
  { name: '@campus/config/no-include-user-rule', rules: {} },
];

module.exports.restrictedSyntaxRules = restrictedSyntaxRules;
module.exports.noIncludeUserOutsideAuthAdmin = noIncludeUserOutsideAuthAdmin;
