// @ts-check
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../src/components/common/ErrorBoundary.js';
import { OfflineBanner } from '../src/components/common/OfflineBanner.js';
import { queryClient, setupFocusManager, setupOnlineManager } from '../src/lib/query/client.js';
import { useSessionStore } from '../src/stores/session.js';
import { ThemeProvider } from '../src/theme/ThemeProvider.js';

/**
 * Root layout: the provider stack from docs/architecture.md §6.2
 * (`SafeArea`, `Theme`, `QueryClient`, `ErrorBoundary`) plus the top-level
 * `Stack` that hosts the three route groups. `SocketProvider` isn't here
 * yet (needs sockets, P8). Session bootstrap (§6.4 "booting -> read
 * refresh token -> POST /auth/refresh -> GET /me -> status") runs once
 * here, so every route group's guard sees a real status instead of the
 * hard-coded one from P2.
 */
export default function RootLayout() {
  useEffect(() => {
    const unsubscribeOnline = setupOnlineManager();
    const unsubscribeFocus = setupFocusManager();
    useSessionStore.getState().bootstrap();
    return () => {
      unsubscribeOnline();
      unsubscribeFocus();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
            <StatusBar style="auto" />
            <OfflineBanner />
            <Stack screenOptions={{ headerShown: false }} />
          </ErrorBoundary>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
