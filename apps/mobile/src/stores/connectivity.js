// @ts-check
import { create } from 'zustand';

/**
 * Network connectivity status, fed by NetInfo (src/lib/query/client.js
 * wires this into TanStack Query's `onlineManager`) and read by
 * src/components/common/OfflineBanner.js. Source: docs/architecture.md
 * §6.4 "Offline": "`@react-native-community/netinfo` -> `onlineManager`.
 * OfflineBanner."
 *
 * @typedef {Object} ConnectivityState
 * @property {boolean} isOnline
 * @property {(isOnline: boolean) => void} setIsOnline
 */

/** @type {import('zustand').UseBoundStore<import('zustand').StoreApi<ConnectivityState>>} */
export const useConnectivityStore = create((set) => ({
  isOnline: true,
  setIsOnline: (isOnline) => set({ isOnline }),
}));
