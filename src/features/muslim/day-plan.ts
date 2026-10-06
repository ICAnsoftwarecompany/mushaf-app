/**
 * «أنا مسلم»: خطة اليوم — الصلوات الخمس + الأذكار + الورد + سماع القرآن + التسبيح + الدعاء لغزة
 * (+ الكهف يوم الجمعة)، مرتّبة بالوقت زي خريطة طريق لليوم.
 * كل نشاط بيتعلّم لوحده لما يتعمل (أو يدوي من الخطة). كله على الجهاز من غير نت.
 */
import { featuredCategories } from '@/data/azkar';
import { GAZA_CATEGORY_ID } from '@/data/gaza-duas';
import { getSurah } from '@/data/quran';
import { computeTimes } from '@/features/prayer/prayer';
import type { IconName } from '@/components/ui';
import type { translate } from '@/i18n';
import { type ActivityLog, type Khatma, type LastRead, type PrayerLog, type Salah, todayKey } from '@/store/reading-store';
import type { Settings } from '@/store/settings-store';

export type ActivityKind = 'prayer' | 'azkar' | 'wird' | 'listen' | 'tasbih' | 'gaza' | 'kahf';

export interface DayItem {
  id: string; // ثابت: prayer:fajr، azkar:<id>، wird، listen، tasbih، kahf
  kind: ActivityKind;
  /** مفتاح العنوان في strings */
  titleKey: string;
  prayer?: Salah;
  at: number;
  route: string;
  icon: IconName;
  done: boolean;
}

const SALAH: Salah[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const azkarId = (name: string) => featuredCategories.find((c) => c.name === name)?.id;

function at(date: Date, hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h || 0, m || 0).getTime();
}

export function buildDayPlan(
  s: Settings,
  ctx: { log: PrayerLog; activities: ActivityLog; khatma: Khatma; lastRead: LastRead | null },
  now = new Date()
): { items: DayItem[]; hasPrayers: boolean } {
  const day = todayKey(now);
  const acts = ctx.activities[day] ?? {};
  const items: DayItem[] = [];
  const times = computeTimes(s, new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12));
  const MIN = 60000;

  if (times) {
    for (const p of SALAH) {
      items.push({
        id: `prayer:${p}`,
        kind: 'prayer',
        titleKey: 'act_prayer',
        prayer: p,
        at: times[p].getTime(),
        route: '/prayer',
        icon: 'clock',
        done: !!ctx.log[day]?.[p],
      });
    }
  }

  const morning = azkarId('أذكار الصباح');
  const evening = azkarId('أذكار المساء');
  const sleep = azkarId('أذكار النوم');
  if (morning)
    items.push({ id: `azkar:${morning}`, kind: 'azkar', titleKey: 'act_morning', at: at(now, s.morningAzkarTime), route: `/azkar/${morning}`, icon: 'sun', done: !!acts[`azkar:${morning}`] });
  if (evening)
    items.push({ id: `azkar:${evening}`, kind: 'azkar', titleKey: 'act_evening', at: at(now, s.eveningAzkarTime), route: `/azkar/${evening}`, icon: 'moon', done: !!acts[`azkar:${evening}`] });

  // الورد: بيتعلّم لما تدوس «خلّصت» في كارت الورد (أو يدوي)
  const wirdPage = ctx.khatma.nextPage <= 604 ? ctx.khatma.nextPage : 1;
  items.push({
    id: 'wird',
    kind: 'wird',
    titleKey: 'act_wird',
    at: at(now, s.wirdTime),
    route: `/mushaf/${ctx.khatma.lastDoneDay === day && ctx.lastRead ? ctx.lastRead.page : wirdPage}`,
    icon: 'book',
    done: ctx.khatma.lastDoneDay === day || !!acts.wird,
  });

  // سماع القرآن: بعد الظهر بنص ساعة (أو ١:٣٠ لو مفيش مواقيت)
  items.push({
    id: 'listen',
    kind: 'listen',
    titleKey: 'act_listen',
    at: times ? times.dhuhr.getTime() + 30 * MIN : at(now, '13:30'),
    route: '/listen',
    icon: 'headphones',
    done: !!acts.listen,
  });

  items.push({ id: `azkar:${GAZA_CATEGORY_ID}`, kind: 'gaza', titleKey: 'act_gaza', at: at(now, s.gazaTime), route: `/azkar/${GAZA_CATEGORY_ID}`, icon: 'heart', done: !!acts[`azkar:${GAZA_CATEGORY_ID}`] });
  items.push({ id: 'tasbih', kind: 'tasbih', titleKey: 'act_tasbih', at: at(now, s.tasbihTime), route: '/tasbih', icon: 'tasbih', done: !!acts.tasbih });

  // أذكار النوم: بعد العشا بساعة ونص (ومش قبل ١٠ بالليل)
  if (sleep) {
    const after = times ? times.isha.getTime() + 90 * MIN : 0;
    items.push({ id: `azkar:${sleep}`, kind: 'azkar', titleKey: 'act_sleep', at: Math.max(after, at(now, '22:00')), route: `/azkar/${sleep}`, icon: 'moon', done: !!acts[`azkar:${sleep}`] });
  }

  // الكهف يوم الجمعة
  if (now.getDay() === 5) {
    items.push({ id: 'kahf', kind: 'kahf', titleKey: 'act_kahf', at: at(now, '09:00'), route: `/mushaf/${getSurah(18).page}`, icon: 'calendar', done: !!acts.kahf });
  }

  return { items: items.sort((a, b) => a.at - b.at), hasPrayers: !!times };
}

type T = (k: Parameters<typeof translate>[1], v?: Record<string, string | number>) => string;
/** اسم النشاط للعرض */
export function activityTitle(item: DayItem, t: T) {
  return item.prayer ? t('act_prayer', { p: t(item.prayer) }) : t(item.titleKey as Parameters<typeof translate>[1]);
}
