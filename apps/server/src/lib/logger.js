// @ts-check
import pino from 'pino';
import { getEnv } from '../config/env.js';

/**
 * Structured logger with redaction. docs/architecture.md §7.4 "Logging":
 * pino JSON with requestId/route/status/latency, `userId` hashed, and
 * secrets/PII never logged.
 *
 * Redaction paths cover: the Authorization header, cookies, and any field
 * anywhere in the log object literally named email/code/otp/token/
 * refreshToken/password, plus the raw request/response body (which could
 * contain a post/message body, an email, or an OTP code).
 */
const REDACTED = '[REDACTED]';

// pino/fast-redact wildcards match an EXACT depth: '*.email' matches
// `data.email` but NOT a top-level `email` key, and NOT `data.nested.email`.
// There's no recursive "any depth" wildcard, so each sensitive field name
// is listed at the top level, one level deep, and two levels deep — the
// shapes real log calls actually use (`logger.info({email})`,
// `logger.info({data: {email}})`, `logger.info({data: {user: {email}}})`).
//
// Deliberately NOT included: a bare `code` field. Node's standard Error
// objects use `.code` for syscall/network error codes (ECONNREFUSED,
// ETIMEDOUT, ENOENT, …) — verified directly (an ioredis connection error
// logged during Phase 1 testing had its `code` silently redacted to
// "[REDACTED]", hiding exactly the detail needed to diagnose it). An OTP
// verification code (Phase 3) must be logged under a distinct field name
// (e.g. `otp`, already listed below) specifically to avoid this
// collision — never as a bare `code`.
const SENSITIVE_FIELD_NAMES = [
  'email',
  'Email',
  'otp',
  'token',
  'accessToken',
  'refreshToken',
  'password',
  'passwordHash',
];

const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'req.body',
  'res.body',
  ...SENSITIVE_FIELD_NAMES.flatMap((field) => [field, `*.${field}`, `*.*.${field}`]),
];

/**
 * @param {{ level?: string; isProduction?: boolean; destination?: NodeJS.WritableStream }} [overrides]
 */
export function createLogger(overrides = {}) {
  const env = safeGetEnv();
  const level = overrides.level ?? env?.LOG_LEVEL ?? 'info';
  const isProduction = overrides.isProduction ?? env?.isProduction ?? false;

  const options = {
    level,
    redact: { paths: REDACT_PATHS, censor: REDACTED },
  };

  // pino's `transport` (a worker thread) and a plain destination stream
  // are mutually exclusive in its API — a destination override (used by
  // tests/unit/logger-redaction.test.js to capture raw JSON output) skips
  // pino-pretty entirely rather than trying to combine them.
  if (overrides.destination) {
    return pino(options, overrides.destination);
  }

  return pino({
    ...options,
    // Human-readable logs locally/dev; plain JSON in production for log
    // drains (Better Stack/Axiom per §23.2 "Monitoring").
    transport: isProduction
      ? undefined
      : {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
        },
  });
}

/**
 * env may not be loadable in some contexts (e.g. this module imported
 * before env validation runs in a test) — fall back to safe defaults
 * rather than crashing logger creation itself.
 */
function safeGetEnv() {
  try {
    return getEnv();
  } catch {
    return undefined;
  }
}

export const logger = createLogger();
