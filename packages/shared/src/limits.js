// @ts-check
/**
 * Central limits: rate limits and content size limits.
 * Source: docs/architecture.md §9 (Redis rate-limit keys), §8.3 (column sizes),
 * §10.2 (media rules), §12/§13 (feed/chat rules).
 *
 * Defining these once here means the server enforces them and the mobile
 * app can show accurate, friendly copy ("3 posts left today") without
 * hard-coding numbers that could drift from the server's real limits.
 */

/**
 * @typedef {Object} RateLimitRule
 * @property {number} points   Number of allowed actions...
 * @property {number} durationSeconds ...within this many seconds.
 * @property {string} description
 */

/** @type {Record<string, RateLimitRule>} */
export const RATE_LIMITS = Object.freeze({
  OTP_SEND_PER_EMAIL: {
    points: 5,
    durationSeconds: 3600,
    description: 'OTP requests per email per hour',
  },
  OTP_SEND_COOLDOWN: {
    points: 1,
    durationSeconds: 60,
    description: 'Minimum seconds between OTP resends',
  },
  OTP_SEND_PER_IP: {
    points: 20,
    durationSeconds: 3600,
    description: 'OTP requests per IP per hour',
  },
  OTP_VERIFY_ATTEMPTS: {
    points: 5,
    durationSeconds: 600,
    description: 'OTP verify attempts per challenge (10 min expiry)',
  },
  POST_CREATE_NEW_ACCOUNT: {
    points: 3,
    durationSeconds: 86400,
    description: 'Posts per day for accounts < 72h old',
  },
  POST_CREATE: {
    points: 10,
    durationSeconds: 3600,
    description: 'Posts per hour for established accounts',
  },
  COMMENT_CREATE: { points: 30, durationSeconds: 3600, description: 'Comments per hour' },
  MESSAGE_SEND: {
    points: 30,
    durationSeconds: 60,
    description: 'Messages per minute for established accounts',
  },
  MESSAGE_SEND_NEW_ACCOUNT: {
    points: 10,
    durationSeconds: 60,
    description: 'Messages per minute for new accounts',
  },
  CONVERSATION_CREATE_NEW_ACCOUNT: {
    points: 5,
    durationSeconds: 86400,
    description: 'New conversation requests per day for new accounts',
  },
  CONVERSATION_CREATE: {
    points: 20,
    durationSeconds: 86400,
    description: 'New conversation requests per day',
  },
  REPORT_CREATE: {
    points: 10,
    durationSeconds: 86400,
    description: 'Reports per day (abuse prevention)',
  },
  MEDIA_UPLOAD: {
    points: 20,
    durationSeconds: 3600,
    description: 'Media upload requests per hour',
  },
  SEARCH: { points: 60, durationSeconds: 3600, description: 'Search requests per hour (V1)' },
});

export const CONTENT_LIMITS = Object.freeze({
  POST_BODY_MAX_CHARS: 2000,
  COMMENT_BODY_MAX_CHARS: 1000,
  MESSAGE_BODY_MAX_CHARS: 4000,
  REPORT_DETAILS_MAX_CHARS: 500,
  POST_MAX_IMAGES: 4,
  MESSAGE_MAX_IMAGES_PER_MESSAGE: 1,
  DISPLAY_NAME_RENAME_COOLDOWN_DAYS: 30,
});

/**
 * §11.6 "Onboarding offers 3 generated options" and §8.3 `anonymous_profiles`
 * (semester, profile_interests). Not rate limits (no per-user cost to
 * abuse) — just fixed shape/size rules for the profiles module (P4).
 */
export const PROFILE_LIMITS = Object.freeze({
  IDENTITY_OPTIONS_COUNT: 3,
  // How long a generated batch of options stays choosable before the
  // client must request a fresh one (regenerate) — long enough to read
  // three names and a color, short enough that a stale set can't be
  // replayed much later.
  IDENTITY_OPTIONS_TTL_SECONDS: 15 * 60,
  // Retries when a candidate "Anonymous {Animal} #{Number}" collides
  // with an existing display_name in the same university (§11.6 "retry
  // on unique violation") before giving up and surfacing a 500 — this
  // should never realistically happen with ~60 animals × 9000 numbers.
  IDENTITY_GENERATION_MAX_ATTEMPTS: 20,
  MAX_INTERESTS_PER_PROFILE: 8,
  SEMESTER_MIN: 1,
  SEMESTER_MAX: 12,
});

export const MEDIA_LIMITS = Object.freeze({
  IMAGE_MAX_UPLOAD_BYTES: 10 * 1024 * 1024, // 10 MB
  IMAGE_MAX_INPUT_MEGAPIXELS: 40,
  IMAGE_ALLOWED_MIME_TYPES: Object.freeze(['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  PENDING_UPLOAD_EXPIRY_SECONDS: 3600, // 1 hour
  SIGNED_GET_TTL_SECONDS: 3600, // 1 hour
});

export const PAGINATION_LIMITS = Object.freeze({
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,
});
