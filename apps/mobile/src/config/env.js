// @ts-check
import { z } from 'zod';

/**
 * Validated public environment. Everything here is `EXPO_PUBLIC_*`, so it
 * is inlined into the JS bundle by Metro and visible to anyone who
 * decompiles the app — never put a secret behind an `EXPO_PUBLIC_*` name.
 * Source: docs/architecture.md §6.1 "Environment".
 *
 * Metro only inlines `process.env.EXPO_PUBLIC_*` when the property access
 * is written out literally (not computed), so each one is read as its own
 * `process.env.EXPO_PUBLIC_X` expression below rather than through a loop
 * or a dynamic key.
 */
const PublicEnvSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
  EXPO_PUBLIC_SOCKET_URL: z.string().url(),
});

/** @typedef {z.infer<typeof PublicEnvSchema>} PublicEnv */

/**
 * Local dev fallback: the Express server from docs/architecture.md §7 runs
 * on `PORT=3000` under `/api/v1` (apps/server/.env.example, src/routes.js).
 * A real device on the same LAN must override these with the machine's
 * LAN IP (`EXPO_PUBLIC_API_URL=http://<lan-ip>:3000/api/v1`) since
 * `localhost` on-device means the device itself, not the dev machine.
 */
const DEV_DEFAULTS = {
  EXPO_PUBLIC_API_URL: 'http://localhost:3000/api/v1',
  EXPO_PUBLIC_SOCKET_URL: 'http://localhost:3000',
};

/**
 * @param {NodeJS.ProcessEnv} [rawEnv]
 * @returns {PublicEnv}
 */
export function loadPublicEnv(rawEnv) {
  const apiUrl = rawEnv?.EXPO_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_API_URL;
  const socketUrl = rawEnv?.EXPO_PUBLIC_SOCKET_URL ?? process.env.EXPO_PUBLIC_SOCKET_URL;

  const result = PublicEnvSchema.safeParse({
    EXPO_PUBLIC_API_URL: apiUrl ?? DEV_DEFAULTS.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_SOCKET_URL: socketUrl ?? DEV_DEFAULTS.EXPO_PUBLIC_SOCKET_URL,
  });

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid public environment configuration:\n${issues}`);
  }

  return result.data;
}

/** @type {PublicEnv | undefined} */
let cachedEnv;

/** @returns {PublicEnv} */
export function getPublicEnv() {
  if (!cachedEnv) {
    cachedEnv = loadPublicEnv();
  }
  return cachedEnv;
}
