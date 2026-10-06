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
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { MiniPlayer } from '@/components/audio/mini-player';
import { AlertCard } from '@/components/notifications/alert-card';
import { PrayerPill } from '@/components/notifications/prayer-pill';
import { IntroScreen } from '@/components/brand/intro-screen';
import { AudioProvider } from '@/features/audio/audio-store';
import { loadInbox, markRead, refreshInboxClock, syncInbox } from '@/features/notifications/inbox';
import { planNotifications } from '@/features/notifications/plan';
import { onNotificationTap, scheduleOnDevice } from '@/features/notifications/schedule';
import { ReadingProvider, useReading } from '@/store/reading-store';
import { SettingsProvider, useSettings } from '@/store/settings-store';
import { ThemeProvider, useMushafTheme } from '@/theme/ThemeContext';

SplashScreen.preventAutoHideAsync();

/**
 * التنبيهات: خطة واحدة (plan.ts) بتتحسب لما الإعدادات أو الفروض أو القراءة تتغير أو التطبيق يرجع،
 * ومنها: مركز التنبيهات جوه التطبيق + إشعارات الموبايل. والضغط على إشعار بيفتح الشاشة بتاعته.
 */
function NotificationsSync() {
  const { settings, ready } = useSettings();
  const { prayerLog, khatma, lastRead } = useReading();
  const lastReadDay = lastRead ? new Date(lastRead.at).toDateString() : '';
  const [active, setActive] = useState(0);

  useEffect(() => {
    loadInbox();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') setActive((n) => n + 1);
    });
    const clock = setInterval(refreshInboxClock, 60000);
    const unTap = onNotificationTap((route, id) => {
      if (id) markRead(id);
      if (route) router.push(route as never);
    });
    return () => {
      sub.remove();
      clearInterval(clock);
      unTap();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      const plan = planNotifications(settings, { log: prayerLog, khatma, lastRead });
      loadInbox().then(() => syncInbox(plan));
      scheduleOnDevice(plan, settings).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
    // آخر قراءة: بيكفي نعرف اليوم والصفحة (مش كل تقليبة)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, prayerLog, khatma, lastRead?.page, lastReadDay, ready, active]);
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
      {/* العد التنازلي للصلاة على جنب الشاشة، وكارت الأذان/الصلاة اللي ما اتعلّمتش فوق */}
      <PrayerPill />
      <AlertCard />
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
