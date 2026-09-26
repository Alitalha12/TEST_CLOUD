// @ts-check
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../src/components/common/ErrorBoundary.js';
import { OfflineBanner } from '../src/components/common/OfflineBanner.js';
import { queryClient, setupFocusManager, setupOnlineManager } from '../src/lib/query/client.js';
import { ThemeProvider } from '../src/theme/ThemeProvider.js';

/**
 * Root layout: the provider stack from docs/architecture.md §6.2
 * (`SafeArea`, `Theme`, `QueryClient`, `ErrorBoundary`) plus the top-level
 * `Stack` that hosts the three route groups. `AuthBootstrap` and
 * `SocketProvider` are not here yet — both need real auth (P3).
 */
export default function RootLayout() {
  useEffect(() => {
    const unsubscribeOnline = setupOnlineManager();
    const unsubscribeFocus = setupFocusManager();
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
