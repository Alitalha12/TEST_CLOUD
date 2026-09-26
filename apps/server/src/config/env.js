// @ts-check
import { z } from 'zod';

/**
 * Validated process environment. The app refuses to start on invalid
 * config — see docs/architecture.md §7.4 "Config" row.
 *
 * Only the keys the server actually reads are validated here (not all of
 * `process.env`), so unrelated OS/CI env vars don't cause a startup
 * failure. Add a new field here — and to `.env.example` — whenever a new
 * module needs a new setting; never read `process.env.X` directly from
 * application code.
 */

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),
  // Comma-separated list of allowed origins for CORS. Empty by default —
  // the mobile app sends no Origin header, so this only matters once a
  // browser-based client (the admin app, Phase 10) needs to call the API.
  // Never treat an empty/missing value as "allow everything" — see
  // buildCorsOrigins below and docs/architecture.md §20 "API hardening".
  CORS_ALLOWED_ORIGINS: z.string().optional().default(''),
});

/**
 * @typedef {z.infer<typeof EnvSchema>} RawEnv
 * @typedef {Omit<RawEnv, 'CORS_ALLOWED_ORIGINS'> & {
 *   corsAllowedOrigins: string[];
 *   isProduction: boolean;
 *   isTest: boolean;
 * }} Env
 */

/**
 * @param {NodeJS.ProcessEnv} rawEnv
 * @returns {Env}
 */
export function loadEnv(rawEnv = process.env) {
  const result = EnvSchema.safeParse({
    NODE_ENV: rawEnv.NODE_ENV,
    PORT: rawEnv.PORT,
    DATABASE_URL: rawEnv.DATABASE_URL,
    REDIS_URL: rawEnv.REDIS_URL,
    LOG_LEVEL: rawEnv.LOG_LEVEL,
    CORS_ALLOWED_ORIGINS: rawEnv.CORS_ALLOWED_ORIGINS,
  });

  if (!result.success) {
    // Never log rawEnv itself — it may contain DATABASE_URL/REDIS_URL
    // credentials. Only the field names and validation issues are safe.
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    console.error(`Invalid environment configuration:\n${issues}`);
    throw new Error('Invalid environment configuration. See stderr for details.');
  }

  const { CORS_ALLOWED_ORIGINS, ...rest } = result.data;

  return {
    ...rest,
    corsAllowedOrigins: parseCorsOrigins(CORS_ALLOWED_ORIGINS),
    isProduction: rest.NODE_ENV === 'production',
    isTest: rest.NODE_ENV === 'test',
  };
}

/**
 * @param {string} value
 * @returns {string[]}
 */
function parseCorsOrigins(value) {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/** @type {Env | undefined} */
let cachedEnv;

/**
 * Returns the validated env, computing (and caching) it on first call.
 * Application code should call this rather than reading `process.env`
 * directly. Tests should use `loadEnv(customEnv)` instead, to avoid the
 * process-wide cache leaking between test cases.
 * @returns {Env}
 */
export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = loadEnv();
  }
  return cachedEnv;
}
