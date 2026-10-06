/**
 * خطة التنبيهات: قايمة واحدة بكل التنبيهات (اللي فاتت النهارده + الأيام الجاية) بمواعيدها.
 * منها بنعمل:
 *  - إشعارات الموبايل (schedule.ts) — الجاية بس، وفي حدود 60 إشعار (حد iOS 64).
 *  - مركز التنبيهات جوه التطبيق (inbox.ts) — اللي وقتها جه.
 *  - الكارت اللي فوق (الأذان، والصلاة اللي ما اتعلّمتش).
 * كله محسوب على الجهاز من غير نت.
 */
import { getSurah, surahsOfPage } from '@/data/quran';
import { featuredCategories } from '@/data/azkar';
import { computeTimes, locationLabel } from '@/features/prayer/prayer';
import { translate } from '@/i18n';
import { type Khatma, type LastRead, type PrayerLog, type Salah, todayKey } from '@/store/reading-store';
import type { Settings } from '@/store/settings-store';

export type NotifKind = 'adhan' | 'pre' | 'missed' | 'azkarMorning' | 'azkarEvening' | 'wird' | 'kahf' | 'tasbih' | 'lastRead';

export interface PlannedNotif {
  id: string; // ثابت لنفس التنبيه (مثلًا adhan:2026-10-06:fajr)
  kind: NotifKind;
  at: number; // ms
  title: string;
  body: string;
  /** الشاشة اللي بتتفتح لما تدوس على التنبيه */
  route: string;
  prayer?: Salah;
  day?: string;
}

const SALAH: Salah[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const DAY = 86400000;
/** كام يوم قدام بنخطط */
const HORIZON_DAYS = 7;

const azkarId = (name: string) => featuredCategories.find((c) => c.name === name)?.id;

function at(date: Date, hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h || 0, m || 0).getTime();
}

export function planNotifications(
  s: Settings,
  ctx: { log: PrayerLog; khatma: Khatma; lastRead: LastRead | null },
  now = Date.now()
): PlannedNotif[] {
  const out: PlannedNotif[] = [];
  const t = (k: Parameters<typeof translate>[1], v?: Record<string, string | number>) => translate(s.language, k, v);
  const city = s.location ? locationLabel(s.location, s.language) : '';
  const base = new Date(now);
  const morningId = azkarId('أذكار الصباح');
  const eveningId = azkarId('أذكار المساء');

  // من امبارح (علشان تنبيهات الليل اللي فاتت) لحد HORIZON_DAYS قدام
  for (let d = -1; d < HORIZON_DAYS; d++) {
    const date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + d);
    const day = todayKey(date);

    // ───── الصلاة ─────
    const times = computeTimes(s, new Date(date.getTime() + 12 * 3600000));
    const next = computeTimes(s, new Date(date.getTime() + DAY + 12 * 3600000));
    if (times && next) {
      const ends: Record<Salah, Date> = { fajr: times.sunrise, dhuhr: times.asr, asr: times.maghrib, maghrib: times.isha, isha: next.fajr };
      for (const p of SALAH) {
        const pt = times[p].getTime();
        if (s.notifyAdhan && s.notifyPrayers[p]) {
          out.push({ id: `adhan:${day}:${p}`, kind: 'adhan', at: pt, title: t('notifAdhanTitle', { p: t(p) }), body: city, route: '/prayer', prayer: p, day });
          if (s.preReminder > 0)
            out.push({
              id: `pre:${day}:${p}`,
              kind: 'pre',
              at: pt - s.preReminder * 60000,
              title: t('notifPreTitle', { p: t(p), n: s.preReminder }),
              body: city,
              route: '/prayer',
              prayer: p,
              day,
            });
        }
        if (s.notifyMissedPrayer && !ctx.log[day]?.[p]) {
          const mt = ends[p].getTime() - s.missedReminderMin * 60000;
          if (mt > pt + 5 * 60000)
            out.push({
              id: `missed:${day}:${p}`,
              kind: 'missed',
              at: mt,
              title: t('notifMissedTitle', { p: t(p) }),
              body: t('notifMissedBody', { p: t(p), city }),
              route: '/prayer',
              prayer: p,
              day,
            });
        }
      }
    }

    // ───── الأذكار والورد والتسبيح ─────
    if (s.notifyAzkar) {
      out.push({ id: `azkarM:${day}`, kind: 'azkarMorning', at: at(date, s.morningAzkarTime), title: t('notifMorningTitle'), body: t('notifAzkarBody'), route: morningId ? `/azkar/${morningId}` : '/azkar', day });
      out.push({ id: `azkarE:${day}`, kind: 'azkarEvening', at: at(date, s.eveningAzkarTime), title: t('notifEveningTitle'), body: t('notifAzkarBody'), route: eveningId ? `/azkar/${eveningId}` : '/azkar', day });
    }
    if (s.notifyWird && ctx.khatma.nextPage <= 604 && ctx.khatma.lastDoneDay !== day) {
      out.push({ id: `wird:${day}`, kind: 'wird', at: at(date, s.wirdTime), title: t('notifWirdTitle'), body: t('notifWirdBody'), route: `/mushaf/${ctx.khatma.nextPage}`, day });
    }
    if (s.notifyTasbih) {
      out.push({ id: `tasbih:${day}`, kind: 'tasbih', at: at(date, s.tasbihTime), title: t('notifTasbihTitle'), body: t('notifTasbihBody'), route: '/tasbih', day });
    }
    // آخر قراءة: بس في الأيام اللي ما اتقراش فيها
    if (s.notifyLastRead && ctx.lastRead && todayKey(new Date(ctx.lastRead.at)) !== day && ctx.lastRead.at < at(date, s.lastReadTime)) {
      const surah = surahsOfPage(ctx.lastRead.page)[0];
      out.push({
        id: `lastRead:${day}`,
        kind: 'lastRead',
        at: at(date, s.lastReadTime),
        title: t('notifLastReadTitle'),
        body: t('notifLastReadBody', { surah: s.language === 'ar' ? `سورة ${surah.name}` : surah.nameEn, page: ctx.lastRead.page }),
        route: `/mushaf/${ctx.lastRead.page}`,
        day,
      });
    }
    // الكهف: الجمعة ٩ الصبح
    if (s.notifyKahf && date.getDay() === 5) {
      out.push({ id: `kahf:${day}`, kind: 'kahf', at: at(date, '09:00'), title: t('notifKahfTitle'), body: t('notifKahfBody'), route: `/mushaf/${getSurah(18).page}`, day });
    }
  }
  return out.sort((a, b) => a.at - b.at);
}
