/**
 * تاب المواقيت: الصلاة القادمة والعد التنازلي، وجدول اليوم، والتاريخ الهجري،
 * وقايمة الفروض (✓ لكل صلاة + سجل ٧ أيام + أذكار ما بعد الصلاة)،
 * واختصارات للقبلة والسبحة. الحساب كله على الجهاز من غير إنترنت.
 */
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AfterPrayerPrompt, PrayedCheck, WeekLog } from '@/components/prayer/prayer-tracker';
import { Screen } from '@/components/screen';
import { Btn, Card, Icon, type IconName, Row, Txt } from '@/components/ui';
import { BottomTabInset } from '@/constants/theme';
import { gregorianDate, hijriDate } from '@/features/prayer/hijri';
import { detectLocation } from '@/features/prayer/locate';
import { computeTimes, formatDuration, formatTime, locationLabel, nextPrayer, PRAYERS, resolveMethod } from '@/features/prayer/prayer';
import { useI18n } from '@/i18n';
import { type Salah, todayKey } from '@/store/reading-store';
import { useSettings } from '@/store/settings-store';
import { useMushafTheme } from '@/theme/ThemeContext';

let triedAutoThisSession = false;

export default function PrayerScreen() {
  const { t, lang } = useI18n();
  const { theme } = useMushafTheme();
  const c = theme.colors;
  const { settings, update } = useSettings();
  const [now, setNow] = useState(() => new Date());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [justPrayed, setJustPrayed] = useState<Salah | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, []);

  const locate = async (silent = false) => {
    if (!silent) {
      setBusy(true);
      setMsg(null);
    }
    const r = await detectLocation(settings.useInternetForCity);
    if (!mounted.current) return;
    if (!silent) setBusy(false);
    if (r.ok) update({ location: r.location });
    else if (!silent) setMsg(r.reason === 'denied' ? t('locationDenied') : t('locationFailed'));
  };

  // تحديث الموقع تلقائيًا مرة في كل تشغيل (لو مفعّل)
  useEffect(() => {
    if (triedAutoThisSession || !settings.autoLocation) return;
    if (settings.location && settings.location.source === 'city') return;
    triedAutoThisSession = true;
    const id = setTimeout(() => locate(true), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const times = computeTimes(settings, now);
  const next = nextPrayer(settings, now);

  return (
    <Screen title={t('prayerTimes')} subtitle={`${hijriDate(now, lang)} · ${gregorianDate(now, lang)}`}>
      <ScrollView contentContainerStyle={styles.body}>
        {!settings.location || !times ? (
          <Card style={{ gap: 10 }}>
            <Txt size={18} weight="bold">
              {t('setLocationTitle')}
            </Txt>
            <Txt size={14} color="textSecondary" lineHeight={1.5}>
              {t('setLocationHint')}
            </Txt>
            <Btn title={busy ? t('locating') : t('detectLocation')} icon="location" onPress={() => locate()} disabled={busy} />
            <Btn title={t('chooseCity')} kind="secondary" onPress={() => router.push('/city')} />
            {msg ? (
              <Txt size={13} color="textSecondary">
                {msg}
              </Txt>
            ) : null}
          </Card>
        ) : (
          <>
            {next && (
              <Card style={[styles.hero, { backgroundColor: c.accent, borderColor: c.accent }]}>
                <Txt size={14} color={c.background} align="center">
                  {t('nextPrayer')}
                </Txt>
                <Txt size={34} weight="bold" color={c.background} align="center">
                  {t(next.key)}
                </Txt>
                <Txt size={18} color={c.background} align="center">
                  {formatTime(next.time, lang)}
                </Txt>
                <Txt size={15} weight="medium" color={c.background} align="center" accessibilityLiveRegion="polite">
                  {t('remaining', { t: formatDuration(next.time.getTime() - now.getTime(), lang) })}
                </Txt>
              </Card>
            )}

            <Card style={{ padding: 0 }}>
              <Row style={[styles.trackerHead, { borderColor: c.border }]}>
                <Txt size={15} weight="bold" style={{ flex: 1 }}>
                  {t('prayerTracker')}
                </Txt>
                <Txt size={12} color="textSecondary">
                  {t('prayerTrackerHint')}
                </Txt>
              </Row>
              {PRAYERS.map((p, i) => {
                const active = next?.key === p && next.time.toDateString() === now.toDateString();
                return (
                  <Row
                    key={p}
                    style={[
                      styles.timeRow,
                      { gap: 12 },
                      i < PRAYERS.length - 1 ? { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.border } : {},
                      active ? { backgroundColor: c.highlight } : {},
                    ]}>
                    {p === 'sunrise' ? (
                      <View style={{ width: 28 }} />
                    ) : (
                      <PrayedCheck day={todayKey(now)} p={p} enabled={times[p] <= now} onMarked={setJustPrayed} />
                    )}
                    <Txt size={17} weight={active ? 'bold' : 'medium'} color={p === 'sunrise' ? 'textSecondary' : 'text'} style={{ flex: 1 }}>
                      {t(p)}
                    </Txt>
                    <Txt size={17} weight={active ? 'bold' : 'normal'} color={active ? 'accent' : 'text'}>
                      {formatTime(times[p], lang)}
                    </Txt>
                  </Row>
                );
              })}
            </Card>

            <WeekLog now={now} />

            <Pressable onPress={() => router.push('/city')} accessibilityRole="button">
              <Row style={{ gap: 8, paddingHorizontal: 4 }}>
                <Icon name="location" size={16} color={c.textSecondary} />
                <Txt size={13} color="textSecondary" style={{ flex: 1 }}>
                  {`${locationLabel(settings.location, lang)} · ${t('methodLabel', { m: t(`method_${resolveMethod(settings)}`) })}`}
                </Txt>
                <Txt size={13} color="accent">
                  {t('changeCity')}
                </Txt>
              </Row>
            </Pressable>
          </>
        )}

        <Row style={{ gap: 12 }}>
          <Shortcut icon="compass" label={t('qibla')} onPress={() => router.push('/qibla')} />
          <Shortcut icon="tasbih" label={t('tasbih')} onPress={() => router.push('/tasbih')} />
        </Row>
      </ScrollView>
      <AfterPrayerPrompt prayer={justPrayed} onClose={() => setJustPrayed(null)} />
    </Screen>
  );
}

function Shortcut({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { theme } = useMushafTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={{ flex: 1 }}>
      {({ pressed }) => (
        <Card style={{ alignItems: 'center', gap: 8, opacity: pressed ? 0.7 : 1 }}>
          <Icon name={icon} size={30} color={theme.colors.accent} />
          <Txt size={15} weight="medium" align="center">
            {label}
          </Txt>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 14, paddingBottom: BottomTabInset + 32 },
  hero: { gap: 4, paddingVertical: 20 },
  timeRow: { paddingHorizontal: 16, paddingVertical: 14 },
  trackerHead: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth },
});

