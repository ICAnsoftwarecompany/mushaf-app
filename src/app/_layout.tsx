/**
 * الجذر: تحميل خط القرآن + الثيمات + حالة القراءة + الشاشة الافتتاحية، وبعدها:
 *   (tabs)          التابات (الفهرس، البحث، العلامات، الإعدادات)
 *   mushaf/[page]   شاشة القراءة (ملء الشاشة فوق التابات)
 */
// بنستورد الوزن العادي بس (مش الحزمة كلها) علشان باقي الأوزان ما تدخلش في حجم التطبيق
import { ScheherazadeNew_400Regular } from '@expo-google-fonts/scheherazade-new/400Regular';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { IntroScreen } from '@/components/brand/intro-screen';

import { ReadingProvider, useReading } from '@/store/reading-store';
import { ThemeProvider, useMushafTheme } from '@/theme/ThemeContext';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { theme, ready: themeReady } = useMushafTheme();
  const { ready: readingReady } = useReading();
  const [fontsLoaded, fontError] = useFonts({ ScheherazadeNew_400Regular });
  const ready = themeReady && readingReady && (fontsLoaded || !!fontError);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="mushaf/[page]" options={{ animation: 'fade' }} />
      </Stack>
      {/* الشاشة الافتتاحية: اللوجو + الآية اللي منها الاسم */}
      {showIntro && <IntroScreen onDone={() => setShowIntro(false)} />}
    </View>
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
