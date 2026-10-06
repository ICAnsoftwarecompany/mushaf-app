/**
 * الإشعارات المحلية (من غير سيرفر): الأذان، والتنبيه قبل الصلاة، وأذكار الصباح والمساء،
 * والورد اليومي، وسورة الكهف يوم الجمعة، وتذكير قبل خروج وقت الصلاة لو ما اتعلّمتش في قايمة الفروض.
 * بيتعاد جدولتها كل ما الإعدادات تتغير أو التطبيق يتفتح (iOS بيسمح بـ 64 إشعار مجدول بس).
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as NotificationsModule from 'expo-notifications';
import { Platform } from 'react-native';

import { computeTimes, locationLabel, SALAH } from '@/features/prayer/prayer';
import { translate } from '@/i18n';
import { type PrayerLog, todayKey } from '@/store/reading-store';
import type { Settings } from '@/store/settings-store';

const CH_ADHAN = 'adhan';
const CH_ADHAN_SILENT = 'adhan-silent';
const CH_REMINDERS = 'reminders';

/**
 * Expo Go على أندرويد (من SDK 53) بيرمي خطأ بمجرد استيراد expo-notifications،
 * فالمكتبة بتتحمّل وقت الحاجة بس، وفي Expo Go أندرويد الإشعارات بتتقفل (محتاج development build).
 */
export const isExpoGoAndroid =
  Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
export const notificationsSupported = !isExpoGoAndroid;

let mod: typeof NotificationsModule | null = null;
function load(): typeof NotificationsModule | null {
  if (!notificationsSupported) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  if (!mod) mod = require('expo-notifications') as typeof NotificationsModule;
  return mod;
}

let configured = false;

async function configure(Notifications: typeof NotificationsModule) {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CH_ADHAN, {
      name: 'الأذان — Adhan',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 300, 200, 300],
    });
    await Notifications.setNotificationChannelAsync(CH_ADHAN_SILENT, {
      name: 'الأذان بدون صوت — Adhan (silent)',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
    });
    await Notifications.setNotificationChannelAsync(CH_REMINDERS, {
      name: 'التذكيرات — Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }
}

export async function ensurePermission(): Promise<boolean> {
  const Notifications = load();
  if (!Notifications) return false;
  await configure(Notifications);
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  const res = await Notifications.requestPermissionsAsync();
  return res.granted;
}

const hm = (s: string) => {
  const [h, m] = s.split(':').map(Number);
  return { hour: h || 0, minute: m || 0 };
};

export async function rescheduleAll(s: Settings, log: PrayerLog = {}): Promise<void> {
  const Notifications = load();
  if (!Notifications) return;
  await configure(Notifications);
  await Notifications.cancelAllScheduledNotificationsAsync();
  const anything = s.notifyAdhan || s.notifyAzkar || s.notifyWird || s.notifyKahf || s.notifyMissedPrayer;
  if (!anything) return;
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return;

  const t = (k: Parameters<typeof translate>[1], v?: Record<string, string | number>) => translate(s.language, k, v);
  const jobs: Promise<string>[] = [];
  const schedule = (title: string, body: string, trigger: NotificationsModule.NotificationTriggerInput, channel: string, sound: boolean) =>
    jobs.push(
      Notifications.scheduleNotificationAsync({
        content: { title, body, sound: sound ? 'default' : undefined },
        trigger: Platform.OS === 'android' ? { ...(trigger as object), channelId: channel } as NotificationsModule.NotificationTriggerInput : trigger,
      })
    );

  // الأذان والتنبيه قبله: لكام يوم جاي (في حدود 64 إشعار على iOS)
  if (s.notifyAdhan && s.location) {
    // حد iOS 64 إشعار: تذكير الفروض بياخد 10 (النهارده وبكرة)
    const days = (s.preReminder > 0 ? 5 : 10) - (s.notifyMissedPrayer ? 1 : 0);
    const now = Date.now();
    const city = locationLabel(s.location, s.language);
    for (let d = 0; d < days; d++) {
      const times = computeTimes(s, new Date(now + d * 86400000));
      if (!times) break;
      for (const p of SALAH) {
        if (!s.notifyPrayers[p]) continue;
        const at = times[p].getTime();
        const name = t(p);
        if (at > now)
          schedule(
            t('notifAdhanTitle', { p: name }),
            t('notifAdhanBody', { city }),
            { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at) },
            s.adhanSound ? CH_ADHAN : CH_ADHAN_SILENT,
            s.adhanSound
          );
        const pre = at - s.preReminder * 60000;
        if (s.preReminder > 0 && pre > now)
          schedule(
            t('notifPreTitle', { p: name, n: s.preReminder }),
            city,
            { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(pre) },
            CH_REMINDERS,
            true
          );
      }
    }
  }

  // قايمة الفروض: تذكير قبل خروج الوقت لو الصلاة لسه ما اتعلّمش عليها (النهارده وبكرة)
  if (s.notifyMissedPrayer && s.location) {
    const now = Date.now();
    const city = locationLabel(s.location, s.language);
    for (let d = 0; d < 2; d++) {
      const date = new Date(now + d * 86400000);
      const times = computeTimes(s, date);
      const tomorrow = computeTimes(s, new Date(date.getTime() + 86400000));
      if (!times || !tomorrow) break;
      const day = todayKey(date);
      const ends = { fajr: times.sunrise, dhuhr: times.asr, asr: times.maghrib, maghrib: times.isha, isha: tomorrow.fajr };
      for (const p of SALAH) {
        if (log[day]?.[p]) continue;
        const at = ends[p].getTime() - s.missedReminderMin * 60000;
        if (at <= now || at <= times[p].getTime() + 5 * 60000) continue;
        schedule(
          t('notifMissedTitle', { p: t(p) }),
          t('notifMissedBody', { p: t(p), city }),
          { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at) },
          CH_REMINDERS,
          true
        );
      }
    }
  }

  if (s.notifyAzkar) {
    schedule(t('notifMorningTitle'), t('notifAzkarBody'), { type: Notifications.SchedulableTriggerInputTypes.DAILY, ...hm(s.morningAzkarTime) }, CH_REMINDERS, true);
    schedule(t('notifEveningTitle'), t('notifAzkarBody'), { type: Notifications.SchedulableTriggerInputTypes.DAILY, ...hm(s.eveningAzkarTime) }, CH_REMINDERS, true);
  }
  if (s.notifyWird) {
    schedule(t('notifWirdTitle'), t('notifWirdBody'), { type: Notifications.SchedulableTriggerInputTypes.DAILY, ...hm(s.wirdTime) }, CH_REMINDERS, true);
  }
  if (s.notifyKahf) {
    // الجمعة = 6 في expo-notifications (الأحد = 1)
    schedule(t('notifKahfTitle'), t('notifKahfBody'), { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 6, hour: 9, minute: 0 }, CH_REMINDERS, true);
  }
  await Promise.allSettled(jobs);
}

