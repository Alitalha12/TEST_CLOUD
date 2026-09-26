// @ts-check
import { Router } from 'express';
import { OtpRequestBodySchema, OtpVerifyBodySchema, RefreshBodySchema } from '@campus/shared';
import { validate } from '../../middleware/validate.js';
import { rateLimit } from '../../middleware/rateLimit.js';
import { authenticate } from '../../middleware/authenticate.js';
import { getEnv } from '../../config/env.js';
import { hashEmail, normalizeEmail } from '../../lib/crypto.js';
import { ipHashFor } from './controller.js';
import * as controller from './controller.js';

export const authRouter = Router();

/**
 * @param {import('express').Request} req
 */
function emailHashKey(req) {
  const env = getEnv();
  const email = normalizeEmail(/** @type {{ email: string }} */ (req.body).email);
  return hashEmail(env.EMAIL_HASH_PEPPER, email);
}

authRouter.post(
  '/otp/request',
  validate({ body: OtpRequestBodySchema }),
  rateLimit('OTP_SEND_COOLDOWN', emailHashKey),
  rateLimit('OTP_SEND_PER_EMAIL', emailHashKey),
  rateLimit('OTP_SEND_PER_IP', ipHashFor),
  controller.requestOtp,
);

authRouter.post('/otp/verify', validate({ body: OtpVerifyBodySchema }), controller.verifyOtp);

authRouter.post('/refresh', validate({ body: RefreshBodySchema }), controller.refresh);

authRouter.post('/logout', authenticate, controller.logout);
