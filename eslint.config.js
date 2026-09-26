'use strict';

const base = require('@campus/config/eslint.config.js');
const { restrictedSyntaxRules, noIncludeUserOutsideAuthAdmin } = base;

module.exports = [
  ...base,
  // §11.5 "four locks" against accidental identity leaks: no backend
  // module outside auth/admin may Prisma-`include` the user/
  // user_identities relations. Scoped here (not globally) because most
  // of the repo has no Prisma calls at all, and auth/admin are the only
  // modules that legitimately need that data.
  //
  // Re-spreads restrictedSyntaxRules alongside noIncludeUserOutsideAuthAdmin
  // because flat config REPLACES (not merges) a rule's array value when
  // the same key is set again for matching files — omitting them here
  // would silently drop the base $queryRawUnsafe/dangerouslySetInnerHTML
  // bans for every file under apps/server/src/modules/.
  {
    files: ['apps/server/src/modules/**/*.js'],
    ignores: ['apps/server/src/modules/{auth,admin}/**/*.js'],
    rules: {
      'no-restricted-syntax': ['error', ...restrictedSyntaxRules, noIncludeUserOutsideAuthAdmin],
    },
  },
];
