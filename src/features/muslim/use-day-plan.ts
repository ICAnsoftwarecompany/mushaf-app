/** خطة اليوم (بتتحدث كل دقيقة) — للصفحة وكارت الصفحة الرئيسية */
import { useEffect, useState } from 'react';

import { useReading } from '@/store/reading-store';
import { useSettings } from '@/store/settings-store';

import { buildDayPlan } from './day-plan';

export function useDayPlan() {
  const { settings } = useSettings();
  const { prayerLog, activityLog, khatma, lastRead } = useReading();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  const plan = buildDayPlan(settings, { log: prayerLog, activities: activityLog, khatma, lastRead }, now);
  const done = plan.items.filter((i) => i.done).length;
  // النشاط الجاي: أول حاجة ما اتعملتش ووقتها جه أو قرّب (أو أول حاجة جاية)
  const next = plan.items.find((i) => !i.done && i.at <= now.getTime()) ?? plan.items.find((i) => !i.done) ?? null;
  return { ...plan, done, total: plan.items.length, next, now };
}
