/**
 * إشعارات الموبايل المحلية (من غير سيرفر) — بتتعمل من خطة التنبيهات (plan.ts).
 * بيتعاد جدولتها كل ما الإعدادات أو الفروض أو القراءة تتغير، أو التطبيق يتفتح.
 * iOS بيسمح بـ 64 إشعار مجدول بس، فبنجدول أقرب 60.
 *
 * صوت الأذان: app.config.js بيضيف assets/sounds/adhan.mp3 (أندرويد، كامل) و adhan_short.wav (iOS، أقل من ٣٠ ث)
 * وبيعلّم extra.adhanSound، وقناة «الأذان» بتستخدمه حتى والتطبيق مقفول.
 * إشعار الأذان فيه زرارين: «كتم» (بيوقف الصوت) و«الإعدادات» (بيفتح شرح القفل في الإعدادات).
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
const soundFlags = Constants.expoConfig?.extra?.adhanSound as { android?: boolean; ios?: boolean } | undefined;
export const adhanSoundAvailable = Platform.OS === 'ios' ? !!soundFlags?.ios : !!soundFlags?.android;

const ADHAN_FILE = Platform.OS === 'ios' ? 'adhan_short.wav' : 'adhan.mp3';
const ADHAN_CATEGORY = 'adhan';
// قنوات أندرويد (صوت القناة مينفعش يتغير بعد إنشائها، فلكل صوت قناة)
const CH_ADHAN = adhanSoundAvailable ? 'adhan-full-v2' : 'adhan';
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

/** زرارين إشعار الأذان — بيتسجّلوا كل مرة علشان أسماءهم تتبع لغة التطبيق */
async function registerAdhanActions(N: typeof NotificationsModule, lang: Settings['language']) {
  const ar = lang === 'ar';
  await N.setNotificationCategoryAsync(ADHAN_CATEGORY, [
    { identifier: 'mute', buttonTitle: ar ? 'كتم' : 'Mute', options: { opensAppToForeground: false } },
    { identifier: 'settings', buttonTitle: ar ? 'الإعدادات' : 'Settings', options: { opensAppToForeground: true } },
  ]).catch(() => {});
}

/** إيقاف صوت الأذان: شيل إشعاراته الظاهرة (أندرويد بيوقف الصوت لما الإشعار يتشال) */
export async function muteAdhan(id?: string): Promise<void> {
  const N = load();
  if (!N) return;
  if (id) await N.dismissNotificationAsync(id).catch(() => {});
  else {
    const shown = await N.getPresentedNotificationsAsync().catch(() => []);
    await Promise.all(
      shown.filter((n) => n.request.identifier.startsWith('adhan:')).map((n) => N.dismissNotificationAsync(n.request.identifier).catch(() => {}))
    );
  }
}

export async function scheduleOnDevice(plan: PlannedNotif[], s: Settings): Promise<void> {
  const N = load();
  if (!N) return;
  await configure(N);
  await registerAdhanActions(N, s.language);
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
        content: {
          title: p.title,
          body: p.body,
          sound,
          data: { route: p.route, id: p.id },
          ...(adhan ? { categoryIdentifier: ADHAN_CATEGORY } : {}),
          // الأذان والتنبيه قبله والفروض: أولوية عالية علشان يظهروا فوق الشاشة
          ...(adhan || p.kind === 'pre' || p.kind === 'missed' ? { priority: N.AndroidNotificationPriority.MAX } : {}),
        },
        trigger: {
          type: N.SchedulableTriggerInputTypes.DATE,
          date: new Date(p.at),
          ...(Platform.OS === 'android' ? { channelId: channel } : {}),
        } as NotificationsModule.NotificationTriggerInput,
      });
    })
  );
}

/** إشعار أذان تجريبي بعد ١٠ ثواني (من الإعدادات) — علشان المستخدم يتأكد من الصوت والإشعار والتطبيق مقفول */
export async function testAdhan(s: Settings): Promise<boolean> {
  const N = load();
  if (!N) return false;
  const ok = await ensurePermission();
  if (!ok) return false;
  await registerAdhanActions(N, s.language);
  const ar = s.language === 'ar';
  await N.scheduleNotificationAsync({
    identifier: `adhan:test:${Date.now()}`,
    content: {
      title: ar ? 'تجربة: حان الآن موعد الصلاة' : 'Test: it is time for prayer',
      body: ar ? 'لو سامع الأذان وشايف الإشعار ده، كل حاجة شغالة ✓' : 'If you hear the adhan and see this, everything works ✓',
      sound: s.adhanSound ? (adhanSoundAvailable ? ADHAN_FILE : 'default') : undefined,
      data: { route: '/settings?focus=adhan' },
      categoryIdentifier: ADHAN_CATEGORY,
      priority: N.AndroidNotificationPriority.MAX,
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10,
      ...(Platform.OS === 'android' ? { channelId: s.adhanSound ? CH_ADHAN : CH_ADHAN_SILENT } : {}),
    } as NotificationsModule.NotificationTriggerInput,
  });
  return true;
}

/** لما المستخدم يدوس على إشعار (والتطبيق مفتوح أو بيتفتح منه) */
export function onNotificationTap(cb: (route: string, id: string) => void): () => void {
  const N = load();
  if (!N) return () => {};
  const handle = (r: NotificationsModule.NotificationResponse | null) => {
    if (!r) return;
    const d = r.notification.request.content.data as { route?: string; id?: string } | undefined;
    const nid = r.notification.request.identifier;
    if (r.actionIdentifier === 'mute') {
      muteAdhan(nid);
      if (d?.id) cb('', d.id); // يتعلّم مقروء من غير ما يفتح شاشة
      return;
    }
    if (r.actionIdentifier === 'settings') {
      muteAdhan(nid);
      cb('/settings?focus=adhan', d?.id ?? '');
      return;
    }
    // زراير تانية (زي زراير السبحة) ليها معالج خاص بيها — متفتحش شاشة
    if (r.actionIdentifier !== N.DEFAULT_ACTION_IDENTIFIER) return;
    if (d?.route) cb(d.route, d.id ?? '');
  };
  N.getLastNotificationResponseAsync().then(handle).catch(() => {});
  const sub = N.addNotificationResponseReceivedListener(handle);
  return () => sub.remove();
}
