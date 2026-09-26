// @ts-check
import nodemailer from 'nodemailer';

/**
 * A thin nodemailer wrapper. Mailpit locally, a real transactional-email
 * provider on staging/prod (docs/architecture.md §28 P3). Never logs
 * `to` or the OTP code — the caller (the worker) doesn't either; see
 * docs/architecture.md §11.2 "the code exists in plaintext only in the
 * job payload ... never logged".
 *
 * @param {{ SMTP_HOST: string, SMTP_PORT: number }} env
 */
export function createMailTransport(env) {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    // Mailpit and most local SMTP relays don't speak TLS; a real provider
    // on staging/prod is reached over 587/STARTTLS or 465/TLS, which this
    // still supports since `secure` here only forces implicit TLS on 465.
    secure: env.SMTP_PORT === 465,
  });
}

/**
 * @param {import('nodemailer').Transporter} transport
 * @param {{ to: string, from: string, code: string }} params
 */
export async function sendOtpEmail(transport, { to, from, code }) {
  await transport.sendMail({
    from,
    to,
    subject: 'Your Anonymous Campus verification code',
    text: `Your verification code is ${code}. It expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`,
  });
}
