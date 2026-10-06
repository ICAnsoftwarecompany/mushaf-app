/**
 * الجذر: الإعدادات + الثيم + حالة القراءة + التلاوة + الخطوط + الشاشة الافتتاحية + جدولة الإشعارات.
 *   (tabs)            المصحف، المواقيت، الأذكار، البحث، الإعدادات
 *   mushaf/[page]     القارئ (ملء الشاشة)
 *   باقي الشاشات      فرعية فوق التابات (العلامات، القبلة، السبحة، الأذكار، المدينة، …)
 */
// بنستورد الأوزان اللي بنستخدمها بس علشان حجم التطبيق
import { ScheherazadeNew_400Regular } from '@expo-google-fonts/scheherazade-new/400Regular';
import { ScheherazadeNew_700Bold } from '@expo-google-fonts/scheherazade-new/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';

import { IntroScreen } from '@/components/brand/intro-screen';
import { AudioProvider } from '@/features/audio/audio-store';
import { rescheduleAll } from '@/features/notifications/schedule';
import { ReadingProvider, useReading } from '@/store/reading-store';
import { SettingsProvider, useSettings } from '@/store/settings-store';
import { ThemeProvider, useMushafTheme } from '@/theme/ThemeContext';

SplashScreen.preventAutoHideAsync();

/** إعادة جدولة الإشعارات لما الإعدادات تتغير أو التطبيق يرجع للواجهة */
function NotificationsSync() {
  const { settings, ready } = useSettings();
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => rescheduleAll(settings).catch(() => {}), 800);
    return () => clearTimeout(t);
  }, [settings, ready]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active' && ready) rescheduleAll(settings).catch(() => {});
    });
    return () => sub.remove();
  }, [settings, ready]);
  return null;
}

function RootStack() {
  const { theme, ready: themeReady } = useMushafTheme();
  const { ready: readingReady } = useReading();
  const { settings, ready: settingsReady } = useSettings();
  const [fontsLoaded, fontError] = useFonts({ ScheherazadeNew_400Regular, ScheherazadeNew_700Bold });
  const ready = settingsReady && themeReady && readingReady && (fontsLoaded || !!fontError);
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <NotificationsSync />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="mushaf/[page]" options={{ animation: 'fade' }} />
      </Stack>
      {/* الشاشة الافتتاحية: اللوجو + الآية اللي منها الاسم */}
      {settings.showIntro && !introDone && <IntroScreen onDone={() => setIntroDone(true)} />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <ReadingProvider>
          <AudioProvider>
            <RootStack />
          </AudioProvider>
        </ReadingProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
}
