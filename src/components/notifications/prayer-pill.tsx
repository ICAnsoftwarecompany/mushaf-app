/**
 * العد التنازلي للصلاة الجاية على جنب الشاشة في كل التطبيق (ما عدا المواقيت والقارئ).
 * لو وقت صلاة دخل وما اتعلّمش عليها في «فروض اليوم» بيقول «لم تعلّم على …».
 * الضغط بيفتح تاب المواقيت (قايمة الفروض).
 */
import { router, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';

import { Icon, Row, Txt } from '@/components/ui';
import { computeTimes, formatDuration, nextPrayer } from '@/features/prayer/prayer';
import { useI18n } from '@/i18n';
import { type Salah, todayKey, useReading } from '@/store/reading-store';
import { useSettings } from '@/store/settings-store';
import { useMushafTheme } from '@/theme/ThemeContext';

const SALAH: Salah[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

/** آخر صلاة دخل وقتها (النهارده، أو عشاء امبارح قبل الفجر) */
function lastPrayer(s: Parameters<typeof computeTimes>[0], now: Date): { p: Salah; day: string } | null {
  const today = computeTimes(s, now);
  if (!today) return null;
  for (let i = SALAH.length - 1; i >= 0; i--) if (today[SALAH[i]] <= now) return { p: SALAH[i], day: todayKey(now) };
  const y = new Date(now.getTime() - 86400000);
  return { p: 'isha', day: todayKey(y) };
}

export function PrayerPill() {
  const { settings } = useSettings();
  const { prayerLog } = useReading();
  const { t, lang, dir } = useI18n();
  const { theme } = useMushafTheme();
  const path = usePathname();
  const { height } = useWindowDimensions();
  const c = theme.colors;
  const [now, setNow] = useState(() => new Date());

  const hidden = !settings.showPrayerPill || !settings.location || path === '/prayer' || path.startsWith('/mushaf');
  useEffect(() => {
    if (hidden) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [hidden]);
  if (hidden) return null;

  const next = nextPrayer(settings, now);
  const last = lastPrayer(settings, now);
  if (!next) return null;
  const missed = last && !prayerLog[last.day]?.[last.p] ? last.p : null;

  // على الطرف (الشمال في العربي، اليمين في الإنجليزي) — بعيد عن أزرار الهيدر
  const side = dir.rtl ? { left: 0, borderTopRightRadius: 16, borderBottomRightRadius: 16 } : { right: 0, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 };
  const label = missed
    ? t('missedPrevious', { p: t(missed) })
    : t('nextIn', { p: t(next.key), t: formatDuration(next.time.getTime() - now.getTime(), lang) });
  // سطرين قصيرين: اسم الصلاة + الوقت الباقي (أو «لم تعلّم»)
  const line1 = missed ? t(missed) : t(next.key);
  const line2 = missed ? t('notTicked') : formatDuration(next.time.getTime() - now.getTime(), lang);

  return (
    <Pressable
      onPress={() => router.push('/prayer')}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.pill, side, { top: height * 0.6, backgroundColor: missed ? '#C0392B' : c.accent }]}>
      <Row style={{ gap: 4, justifyContent: 'center' }}>
        <Icon name={missed ? 'bell' : 'clock'} size={11} color={missed ? '#FFFFFF' : c.background} />
        <Txt size={11} weight="bold" color={missed ? '#FFFFFF' : c.background} numberOfLines={1}>
          {line1}
        </Txt>
      </Row>
      <Txt size={11} color={missed ? '#FFFFFF' : c.background} align="center" numberOfLines={1}>
        {line2}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    zIndex: 40,
    width: 66,
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 1,
    opacity: 0.92,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
});
