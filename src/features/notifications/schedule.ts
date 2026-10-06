/**
 * إشعارات الموبايل المحلية (من غير سيرفر) — بتتعمل من خطة التنبيهات (plan.ts).
 * بيتعاد جدولتها كل ما الإعدادات أو الفروض أو القراءة تتغير، أو التطبيق يتفتح.
 * iOS بيسمح بـ 64 إشعار مجدول بس، فبنجدول أقرب 60.
 *
 * صوت الأذان الكامل: لو ملف assets/sounds/adhan.wav موجود وقت البناء، app.config.js
 * بيضيفه للتطبيق وبيعلّم extra.adhanSound، وقناة «الأذان» بتستخدمه حتى والتطبيق مقفول.
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as NotificationsModule from 'expo-notifications';
import { Platform } from 'react-native';

import type { Settings } from '@/store/settings-store';

import type { PlannedNotif } from './plan';

/**
 * Expo Go على أندرويد (من SDK 53) بيرمي خطأ بمجرد استيراد expo-notifications،
 * فالمكتبة بتتحمّل وقت الحاجة بس، وفي Expo Go أندرويد الإشعارات بتتقفل (محتاج development build).
 */
export const isExpoGoAndroid =
  Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
export const notificationsSupported = !isExpoGoAndroid;
/** ملف الأذان الكامل اتضاف للتطبيق وقت البناء */
export const adhanSoundAvailable = Constants.expoConfig?.extra?.adhanSound === true;

const ADHAN_FILE = 'adhan.wav';
// قنوات أندرويد (صوت القناة مينفعش يتغير بعد إنشائها، فلكل صوت قناة)
const CH_ADHAN = adhanSoundAvailable ? 'adhan-full' : 'adhan';
const CH_ADHAN_SILENT = 'adhan-silent';
const CH_PRAYER = 'prayer-alerts';
const CH_REMINDERS = 'reminders';
const MAX_SCHEDULED = 60;

let mod: typeof NotificationsModule | null = null;
function load(): typeof NotificationsModule | null {
  if (!notificationsSupported) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  if (!mod) mod = require('expo-notifications') as typeof NotificationsModule;
  return mod;
}

let configured = false;

async function configure(N: typeof NotificationsModule) {
  if (configured) return;
  configured = true;
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync(CH_ADHAN, {
      name: 'الأذان — Adhan',
      importance: N.AndroidImportance.MAX,
      sound: adhanSoundAvailable ? ADHAN_FILE : 'default',
      vibrationPattern: [0, 300, 200, 300],
      lockscreenVisibility: N.AndroidNotificationVisibility.PUBLIC,
    });
    await N.setNotificationChannelAsync(CH_ADHAN_SILENT, {
      name: 'الأذان بدون صوت — Adhan (silent)',
      importance: N.AndroidImportance.DEFAULT,
      sound: null,
    });
    await N.setNotificationChannelAsync(CH_PRAYER, {
      name: 'تنبيهات الصلاة — Prayer reminders',
      importance: N.AndroidImportance.HIGH,
      sound: 'default',
    });
    await N.setNotificationChannelAsync(CH_REMINDERS, {
      name: 'التذكيرات — Reminders',
      importance: N.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }
}

export async function ensurePermission(): Promise<boolean> {
  const N = load();
  if (!N) return false;
  await configure(N);
  const cur = await N.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  const res = await N.requestPermissionsAsync();
  return res.granted;
}

export async function scheduleOnDevice(plan: PlannedNotif[], s: Settings): Promise<void> {
  const N = load();
  if (!N) return;
  await configure(N);
  await N.cancelAllScheduledNotificationsAsync();
  const perm = await N.getPermissionsAsync();
  if (!perm.granted) return;

  const now = Date.now() + 5000;
  const upcoming = plan.filter((p) => p.at > now).slice(0, MAX_SCHEDULED);
  await Promise.allSettled(
    upcoming.map((p) => {
      const adhan = p.kind === 'adhan';
      const channel = adhan ? (s.adhanSound ? CH_ADHAN : CH_ADHAN_SILENT) : p.kind === 'pre' || p.kind === 'missed' ? CH_PRAYER : CH_REMINDERS;
      const sound = adhan ? (s.adhanSound ? (adhanSoundAvailable ? ADHAN_FILE : 'default') : undefined) : 'default';
      return N.scheduleNotificationAsync({
        identifier: p.id,
        content: { title: p.title, body: p.body, sound, data: { route: p.route, id: p.id } },
        trigger: {
          type: N.SchedulableTriggerInputTypes.DATE,
          date: new Date(p.at),
          ...(Platform.OS === 'android' ? { channelId: channel } : {}),
        } as NotificationsModule.NotificationTriggerInput,
      });
    })
  );
}

/** لما المستخدم يدوس على إشعار (والتطبيق مفتوح أو بيتفتح منه) */
export function onNotificationTap(cb: (route: string, id: string) => void): () => void {
  const N = load();
  if (!N) return () => {};
  const handle = (r: NotificationsModule.NotificationResponse | null) => {
    const d = r?.notification.request.content.data as { route?: string; id?: string } | undefined;
    if (d?.route) cb(d.route, d.id ?? '');
  };
  N.getLastNotificationResponseAsync().then(handle).catch(() => {});
  const sub = N.addNotificationResponseReceivedListener(handle);
  return () => sub.remove();
}
