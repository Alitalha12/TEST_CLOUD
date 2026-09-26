// @ts-check
import { getEnv } from '../../config/env.js';
import { hmacSha256 } from '../../lib/crypto.js';
import { sendSuccess } from '../../http/respond.js';
import { requireAuth } from '../../middleware/authenticate.js';
import * as service from './service.js';
import { toMeDTO } from './presenter.js';

/**
 * HTTP ⇄ service translation only, per docs/conventions.md "Layering".
 * `const` arrow expressions (not `function` declarations) because
 * TS/JSDoc's `@type` cast reliably retypes the whole signature — return
 * type included — only in that form.
 */

/**
 * IP addresses are only ever stored/keyed hashed (§9, §11.4) — this is
 * the one place `req.ip` is read at all. Exported so routes.js's
 * `OTP_SEND_PER_IP` rate-limit middleware can key on the same hash.
 * @param {import('express').Request} req
 */
export function ipHashFor(req) {
  const env = getEnv();
  return hmacSha256(env.EMAIL_HASH_PEPPER, req.ip ?? 'unknown');
}

/** @type {import('express').RequestHandler} */
export const requestOtp = async (req, res) => {
  const { email } = /** @type {{ email: string }} */ (req.body);
  const result = await service.requestOtp({ email, ipHash: ipHashFor(req) });
  sendSuccess(res, result);
};

/**
 * Matches `OtpVerifyBodySchema` in packages/shared/src/schemas/auth.js.
 * @typedef {Object} OtpVerifyBody
 * @property {string} challengeId
 * @property {string} code
 * @property {{ platform: 'ANDROID' | 'IOS', label: string, appVersion: string }} device
 */

/** @type {import('express').RequestHandler} */
export const verifyOtp = async (req, res) => {
  const { challengeId, code, device } = /** @type {OtpVerifyBody} */ (req.body);
  const result = await service.verifyOtp({ challengeId, code, device, ipHash: ipHashFor(req) });
  sendSuccess(res, result);
};

/** @type {import('express').RequestHandler} */
export const refresh = async (req, res) => {
  const { refreshToken } = /** @type {{ refreshToken: string }} */ (req.body);
  const result = await service.refreshSession({ refreshToken });
  sendSuccess(res, result);
};

/** @type {import('express').RequestHandler} */
export const logout = async (req, res) => {
  const auth = requireAuth(res);
  await service.logout({ sessionId: auth.sessionId });
  sendSuccess(res, {});
};

/** @type {import('express').RequestHandler} */
export const me = async (req, res) => {
  const auth = requireAuth(res);
  const data = await service.getMe({ userId: auth.userId });
  sendSuccess(res, toMeDTO(data));
};
