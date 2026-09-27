// @ts-check

/**
 * Reusable leak-scanning helper (§11.5 "four locks" lock 4: "Leak tests
 * (Phase 4 onward, run in CI): a helper crawls every GET endpoint as user
 * B and asserts that no response contains user A's email, email_hash,
 * internal UUID, `userId` keys, or anything matching an email regex.").
 *
 * The actual per-endpoint checks live in tests/security/leakTests.test.js
 * as one `describe` block per phase — a real cross-file runtime registry
 * doesn't work here (Vitest isolates each test file into its own worker,
 * so registrations from one file's module scope are invisible to
 * another's), so each new phase appends its own block there instead,
 * reusing this file's scanning logic.
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

/**
 * @typedef {Object} LeakSecrets
 * @property {string} [userId] a raw internal id that must never appear
 * @property {string} [emailHash] an email hash that must never appear
 * @property {string} [email] a raw email that must never appear
 */

/**
 * Recursively scans a JSON-shaped value.
 * @param {unknown} value
 * @param {LeakSecrets} secrets
 * @param {string[]} [path]
 * @returns {string[]} human-readable problems; empty if none found
 */
export function scanForLeaks(value, secrets, path = []) {
  if (value === null || value === undefined) {
    return [];
  }

  if (typeof value === 'string') {
    const where = path.join('.') || '(root)';
    const problems = [];
    if (secrets.userId && value === secrets.userId) {
      problems.push(`${where}: the raw internal userId`);
    }
    if (secrets.emailHash && value === secrets.emailHash) {
      problems.push(`${where}: the email hash`);
    }
    if (secrets.email && value === secrets.email) {
      problems.push(`${where}: the raw email`);
    }
    if (EMAIL_REGEX.test(value)) {
      problems.push(`${where}: looks like an email address ("${value}")`);
    }
    return problems;
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => scanForLeaks(item, secrets, [...path, String(index)]));
  }

  if (typeof value === 'object') {
    const problems = [];
    for (const [key, v] of Object.entries(value)) {
      if (/^user_?id$/i.test(key) && typeof v === 'string' && v.length > 0) {
        problems.push(`${[...path, key].join('.')}: a userId-shaped key`);
      }
      problems.push(...scanForLeaks(v, secrets, [...path, key]));
    }
    return problems;
  }

  return [];
}

/**
 * @param {unknown} body a JSON response body
 * @param {LeakSecrets} secrets
 * @param {string} label context named in the failure message
 */
export function assertNoLeaks(body, secrets, label) {
  const problems = scanForLeaks(body, secrets);
  if (problems.length > 0) {
    throw new Error(`Leak test failed for ${label}:\n${problems.join('\n')}`);
  }
}
