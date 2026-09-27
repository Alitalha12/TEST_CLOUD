// @ts-check

/**
 * Hex per `AvatarColorToken` (`@campus/shared`). The shared contract only
 * knows the token name (`'CORAL'`, `'TEAL'`, ...) — mobile is the only
 * consumer that renders pixels, so it owns the actual hex value, per that
 * enum's own doc comment (docs/architecture.md §11.6 "avatar illustration
 * + chosen color").
 * @type {Record<string, string>}
 */
export const AVATAR_COLOR_HEX = Object.freeze({
  CORAL: '#FF6B5B',
  AMBER: '#F5A623',
  MOSS: '#5B8C5A',
  TEAL: '#2FA6A0',
  SLATE: '#5B6B7C',
  INDIGO: '#4C5FD5',
  VIOLET: '#8B5CF6',
  ROSE: '#E0568C',
});
