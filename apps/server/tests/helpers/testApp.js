// @ts-check
import { createApp } from '../../src/app.js';
import { getEnv } from '../../src/config/env.js';
import { createLogger } from '../../src/lib/logger.js';

// Silent by default so `pnpm test` output isn't drowned in per-request
// log lines; import createLogger directly in a test that needs to assert
// on log output (see tests/unit/logger-redaction.test.js).
const testLogger = createLogger({ level: 'silent' });

/**
 * @param {{ env?: Partial<import('../../src/config/env.js').Env> }} [options]
 */
export function buildTestApp(options = {}) {
  const env = { ...getEnv(), ...options.env };
  return createApp({ env, logger: testLogger });
}
