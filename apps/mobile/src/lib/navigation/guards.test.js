// @ts-check
import { describe, expect, it } from '@jest/globals';
import { getGroupGuardResult, getInitialRouteResult, HOME_ROUTE_FOR_STATUS } from './guards.js';

/** @type {import('./guards.js').RouteGroup[]} */
const GROUPS = ['auth', 'onboarding', 'app'];

describe('getGroupGuardResult', () => {
  it('shows a loading view for every group while booting', () => {
    for (const group of GROUPS) {
      expect(getGroupGuardResult('booting', group)).toEqual({ type: 'loading' });
    }
  });

  it('allows unauthenticated -> auth, and redirects it away from the other groups', () => {
    expect(getGroupGuardResult('unauthenticated', 'auth')).toEqual({ type: 'allow' });
    expect(getGroupGuardResult('unauthenticated', 'onboarding')).toEqual({
      type: 'redirect',
      href: HOME_ROUTE_FOR_STATUS.unauthenticated,
    });
    expect(getGroupGuardResult('unauthenticated', 'app')).toEqual({
      type: 'redirect',
      href: HOME_ROUTE_FOR_STATUS.unauthenticated,
    });
  });

  it('allows needs_onboarding -> onboarding, and redirects it away from the other groups', () => {
    expect(getGroupGuardResult('needs_onboarding', 'onboarding')).toEqual({ type: 'allow' });
    expect(getGroupGuardResult('needs_onboarding', 'auth')).toEqual({
      type: 'redirect',
      href: HOME_ROUTE_FOR_STATUS.needs_onboarding,
    });
    expect(getGroupGuardResult('needs_onboarding', 'app')).toEqual({
      type: 'redirect',
      href: HOME_ROUTE_FOR_STATUS.needs_onboarding,
    });
  });

  it('allows ready -> app, and redirects it away from the other groups', () => {
    expect(getGroupGuardResult('ready', 'app')).toEqual({ type: 'allow' });
    expect(getGroupGuardResult('ready', 'auth')).toEqual({
      type: 'redirect',
      href: HOME_ROUTE_FOR_STATUS.ready,
    });
    expect(getGroupGuardResult('ready', 'onboarding')).toEqual({
      type: 'redirect',
      href: HOME_ROUTE_FOR_STATUS.ready,
    });
  });
});

describe('getInitialRouteResult', () => {
  it('shows a loading view while booting', () => {
    expect(getInitialRouteResult('booting')).toEqual({ type: 'loading' });
  });

  it.each(/** @type {const} */ (['unauthenticated', 'needs_onboarding', 'ready']))(
    'redirects %s to its home route',
    (status) => {
      expect(getInitialRouteResult(status)).toEqual({
        type: 'redirect',
        href: HOME_ROUTE_FOR_STATUS[status],
      });
    },
  );
});
