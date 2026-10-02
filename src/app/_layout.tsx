/**
 * الجذر: تحميل خط القرآن + الثيمات + حالة القراءة، وبعدها:
 *   (tabs)          التابات (الفهرس، البحث، العلامات، الإعدادات)
 *   mushaf/[page]   شاشة القراءة (ملء الشاشة فوق التابات)
 */
import { ScheherazadeNew_400Regular, useFonts } from '@expo-google-fonts/scheherazade-new';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { ReadingProvider, useReading } from '@/store/reading-store';
import { ThemeProvider, useMushafTheme } from '@/theme/ThemeContext';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { theme, ready: themeReady } = useMushafTheme();
  const { ready: readingReady } = useReading();
  const [fontsLoaded, fontError] = useFonts({ ScheherazadeNew_400Regular });
  const ready = themeReady && readingReady && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="mushaf/[page]" options={{ animation: 'fade' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ReadingProvider>
        <RootStack />
      </ReadingProvider>
    </ThemeProvider>
  );
}
