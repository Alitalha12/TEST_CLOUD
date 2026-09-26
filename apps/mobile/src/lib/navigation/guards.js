// @ts-check
/**
 * Pure route-guard logic for the three top-level route groups
 * ((auth), (onboarding), (app)) described in docs/architecture.md §6.2 and
 * driven by the `session` store's state machine (§6.4). Kept as pure
 * functions, separate from any `_layout.js`, so the guard rules can be
 * unit-tested without rendering Expo Router.
 *
 * @typedef {import('../../stores/session.js').SessionStatus} SessionStatus
 * @typedef {'auth' | 'onboarding' | 'app'} RouteGroup
 * @typedef {{ type: 'allow' }} AllowResult
 * @typedef {{ type: 'loading' }} LoadingResult
 * @typedef {{ type: 'redirect', href: string }} RedirectResult
 * @typedef {AllowResult | LoadingResult | RedirectResult} GuardResult
 */

/** The one route group each non-`booting` status is allowed to render. */
const GROUP_FOR_STATUS = Object.freeze({
  unauthenticated: 'auth',
  needs_onboarding: 'onboarding',
  ready: 'app',
});

/** Where to send the user when they're in the wrong group for their status. */
export const HOME_ROUTE_FOR_STATUS = Object.freeze({
  unauthenticated: '/(auth)/welcome',
  needs_onboarding: '/(onboarding)/guidelines',
  ready: '/(app)/(tabs)',
});

/**
 * Decides what a route group's `_layout.js` should render for the given
 * session status: its stub screens (`allow`), a loading view (`loading`,
 * only while the session is still booting), or a `<Redirect>` to the
 * group that status is actually allowed to see (`redirect`).
 * @param {SessionStatus} status
 * @param {RouteGroup} group
 * @returns {GuardResult}
 */
export function getGroupGuardResult(status, group) {
  if (status === 'booting') {
    return { type: 'loading' };
  }
  if (GROUP_FOR_STATUS[status] === group) {
    return { type: 'allow' };
  }
  return { type: 'redirect', href: HOME_ROUTE_FOR_STATUS[status] };
}

/**
 * Decides what `app/index.js` should do: show a loading view while
 * `booting`, or redirect to the route group for the current status.
 * @param {SessionStatus} status
 * @returns {LoadingResult | RedirectResult}
 */
export function getInitialRouteResult(status) {
  if (status === 'booting') {
    return { type: 'loading' };
  }
  return { type: 'redirect', href: HOME_ROUTE_FOR_STATUS[status] };
}
