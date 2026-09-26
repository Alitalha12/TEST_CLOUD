// @ts-check
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { AppState, Platform } from 'react-native';
import { useConnectivityStore } from '../../stores/connectivity.js';

/**
 * The single QueryClient for the app. Source: docs/architecture.md §6.3
 * "lib/query/client.js: QueryClient defaults (staleTime, retry policy,
 * focus/online managers)". Per-query overrides (feed 30s, profile 5m, meta
 * 24h — §6.4 "Caching") live next to each query, not here; this is only
 * the fallback for queries that don't set their own `staleTime`.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnReconnect: true,
    },
    mutations: {
      // A failed mutation shows a retry CTA instead of retrying silently
      // (§6.4 "Offline": "Mutations fail fast with a retry CTA").
      retry: 0,
    },
  },
});

/**
 * Wires NetInfo into TanStack Query's `onlineManager` (so queries pause
 * while offline and refetch on reconnect) and mirrors the same signal into
 * `connectivity` store for `OfflineBanner`. Source: docs/architecture.md
 * §6.4 "Offline: `@react-native-community/netinfo` -> `onlineManager`."
 * @returns {() => void} unsubscribe
 */
export function setupOnlineManager() {
  /** @type {() => void} */
  let unsubscribeNetInfo = () => {};

  onlineManager.setEventListener((setOnline) => {
    unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
      useConnectivityStore.getState().setIsOnline(isOnline);
      setOnline(isOnline);
    });
    return unsubscribeNetInfo;
  });

  return () => unsubscribeNetInfo();
}

/**
 * Wires app foreground/background state into TanStack Query's
 * `focusManager`, so queries refetch when the app returns to the
 * foreground. Web is excluded because `AppState` on web never reports
 * `background`.
 * @returns {() => void} unsubscribe
 */
export function setupFocusManager() {
  const subscription = AppState.addEventListener('change', (status) => {
    if (Platform.OS !== 'web') {
      focusManager.setFocused(status === 'active');
    }
  });
  return () => subscription.remove();
}
