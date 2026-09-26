// @ts-check
import { create } from 'zustand';

/**
 * Session status state machine. Source: docs/architecture.md §6.4 "Auth
 * state": `booting -> unauthenticated | needs_onboarding | ready`, and P3
 * ("session bootstrap on launch, guards now live").
 *
 * Phase 2 (P2) hard-codes the initial status to `unauthenticated` and
 * never transitions it — per docs/architecture.md §28 P2 "guards driven by
 * the session store (hard-coded to unauthenticated for now; no fake auth
 * logic)". The real bootstrap (`booting` -> read refresh token ->
 * `POST /auth/refresh` -> `GET /me` -> final status) is built in P3; the
 * `booting` status already exists in the type so route guards can be
 * written correctly now instead of being rewritten in P3.
 *
 * @typedef {'booting' | 'unauthenticated' | 'needs_onboarding' | 'ready'} SessionStatus
 * @typedef {Object} SessionState
 * @property {SessionStatus} status
 * @property {(status: SessionStatus) => void} setStatus
 */

/** @type {import('zustand').UseBoundStore<import('zustand').StoreApi<SessionState>>} */
export const useSessionStore = create((set) => ({
  status: 'unauthenticated',
  setStatus: (status) => set({ status }),
}));
