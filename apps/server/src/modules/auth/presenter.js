// @ts-check

/**
 * The only place a real (decrypted) email is turned into the masked form
 * a client is ever shown, per docs/architecture.md §11.4 "Visible to
 * self: Masked (`a***@uet.edu.pk`) in settings".
 * @param {string} email
 */
export function maskEmail(email) {
  const atIndex = email.indexOf('@');
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  return `${local.charAt(0)}***@${domain}`;
}

/**
 * Shapes `GET /api/v1/me`'s response. Matches
 * `@campus/shared`'s `MeResponseSchema` exactly — no `userId`, no
 * `email_hash`, no raw email.
 * @param {{
 *   email: string,
 *   status: 'ACTIVE' | 'RESTRICTED',
 *   onboarding: 'NEEDS_PROFILE' | 'COMPLETE',
 *   university: { slug: string, name: string },
 * }} data
 */
export function toMeDTO(data) {
  return {
    maskedEmail: maskEmail(data.email),
    status: data.status,
    onboarding: data.onboarding,
    university: { slug: data.university.slug, name: data.university.name },
  };
}
