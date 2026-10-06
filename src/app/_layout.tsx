/**
 * الجذر: الإعدادات + الثيم + حالة القراءة + التلاوة + الخطوط + الشاشة الافتتاحية + جدولة الإشعارات.
 *   (tabs)            المصحف، المواقيت، الأذكار، الاستماع، الإعدادات
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
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { MiniPlayer } from '@/components/audio/mini-player';
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
  const { prayerLog } = useReading();
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => rescheduleAll(settings, prayerLog).catch(() => {}), 800);
    return () => clearTimeout(t);
  }, [settings, prayerLog, ready]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active' && ready) rescheduleAll(settings, prayerLog).catch(() => {});
    });
    return () => sub.remove();
  }, [settings, prayerLog, ready]);
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
      {/* المشغّل الصغير فوق كل الشاشات لما في تلاوة شغالة */}
      <MiniPlayer />
      {/* الشاشة الافتتاحية: اللوجو + الآية اللي منها الاسم */}
      {settings.showIntro && !introDone && <IntroScreen onDone={() => setIntroDone(true)} />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SettingsProvider>
      <ThemeProvider>
        <ReadingProvider>
          <AudioProvider>
            <RootStack />
          </AudioProvider>
        </ReadingProvider>
      </ThemeProvider>
    </SettingsProvider>
    </GestureHandlerRootView>
  );
}
