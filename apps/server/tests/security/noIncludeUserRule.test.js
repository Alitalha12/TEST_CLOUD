// @ts-check
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';

/**
 * Proves the §11.5 "four locks" lint rule actually fires, rather than
 * trusting the config is wired correctly by inspection alone — required
 * fix from the Phase 0 review (docs/architecture.md §11.5,
 * packages/config/eslint.config.js `noIncludeUserOutsideAuthAdmin`).
 *
 * Uses ESLint's `lintText` with a virtual `filePath` so no real fixture
 * files need to exist under apps/server/src/modules — the flat config's
 * file-glob matching resolves purely from the given path.
 */

const REPO_ROOT = path.resolve(import.meta.dirname, '../../../..');

const SNIPPET_WITH_INCLUDE_USER = `
export function findPostsWithAuthor(prisma) {
  return prisma.post.findMany({ include: { user: true } });
}
`;

const SNIPPET_WITHOUT_VIOLATION = `
export function findPosts(prisma) {
  return prisma.post.findMany({ select: { id: true } });
}
`;

/**
 * @param {string} code
 * @param {string} virtualFilePath
 */
async function lint(code, virtualFilePath) {
  const eslint = new ESLint({ cwd: REPO_ROOT });
  const [result] = await eslint.lintText(code, { filePath: virtualFilePath });
  return result;
}

describe('noIncludeUserOutsideAuthAdmin lint rule', () => {
  it('fires on include:{user:true} inside a non-auth/admin module', async () => {
    const result = await lint(
      SNIPPET_WITH_INCLUDE_USER,
      path.join(REPO_ROOT, 'apps/server/src/modules/posts/repository.js'),
    );
    const messages = result.messages.filter((m) => m.ruleId === 'no-restricted-syntax');
    expect(messages.some((m) => m.message.includes('auth or admin'))).toBe(true);
  });

  it('does NOT fire inside the auth module', async () => {
    const result = await lint(
      SNIPPET_WITH_INCLUDE_USER,
      path.join(REPO_ROOT, 'apps/server/src/modules/auth/repository.js'),
    );
    const messages = result.messages.filter(
      (m) => m.ruleId === 'no-restricted-syntax' && m.message.includes('auth or admin'),
    );
    expect(messages).toHaveLength(0);
  });

  it('does NOT fire inside the admin module', async () => {
    const result = await lint(
      SNIPPET_WITH_INCLUDE_USER,
      path.join(REPO_ROOT, 'apps/server/src/modules/admin/repository.js'),
    );
    const messages = result.messages.filter(
      (m) => m.ruleId === 'no-restricted-syntax' && m.message.includes('auth or admin'),
    );
    expect(messages).toHaveLength(0);
  });

  it('does not false-positive on a clean select-only query', async () => {
    const result = await lint(
      SNIPPET_WITHOUT_VIOLATION,
      path.join(REPO_ROOT, 'apps/server/src/modules/posts/repository.js'),
    );
    expect(result.messages).toHaveLength(0);
  });

  it('the $queryRawUnsafe ban still applies inside modules/ (rules are additive, not replaced)', async () => {
    const result = await lint(
      `export function bad(prisma) { return prisma.$queryRawUnsafe('select 1'); }`,
      path.join(REPO_ROOT, 'apps/server/src/modules/posts/repository.js'),
    );
    const messages = result.messages.filter((m) => m.ruleId === 'no-restricted-syntax');
    expect(messages.some((m) => m.message.includes('queryRawUnsafe'))).toBe(true);
  });
});
