import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';

import { colors } from '../src/lib/theme';
import { QueryProvider } from '../src/providers/QueryProvider';
import { SessionProvider, useSession } from '../src/providers/SessionProvider';

// Keep the native splash up until the persisted session is read; the API asks for this call at
// module scope so it runs before the first render.
void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: true, duration: 300 });

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
};

export default function RootLayout() {
  return (
    <QueryProvider>
      <SessionProvider>
        <SplashGate>
          <ThemeProvider value={navigationTheme}>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
                headerShadowVisible: false,
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="cafe/[slug]" options={{ title: '' }} />
              <Stack.Screen name="cafes/[slug]" options={{ headerShown: false }} />
              <Stack.Screen name="book/[tierId]/index" options={{ title: 'Pick a time' }} />
              <Stack.Screen name="book/[tierId]/review" options={{ title: 'Review' }} />
              <Stack.Screen name="booking/[id]" options={{ title: 'Booking' }} />
              <Stack.Screen
                name="auth/sign-in"
                options={{ presentation: 'modal', title: 'Sign in' }}
              />
              <Stack.Screen name="+not-found" options={{ title: 'Not found' }} />
            </Stack>
          </ThemeProvider>
        </SplashGate>
      </SessionProvider>
    </QueryProvider>
  );
}

/** Hides the splash once the session is restored, so the first frame already knows who is here. */
function SplashGate({ children }: { children: ReactNode }) {
  const { isRestoring } = useSession();
  useEffect(() => {
    if (!isRestoring) {
      void SplashScreen.hideAsync();
    }
  }, [isRestoring]);
  return children;
}
