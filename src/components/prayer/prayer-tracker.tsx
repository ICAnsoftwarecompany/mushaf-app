/**
 * قايمة الفروض: علامة ✓ لكل صلاة، وسجل آخر ٧ أيام، وسؤال «أذكار ما بعد الصلاة؟» بعد التعليم.
 * كله على الجهاز (yatlu.prayerLog) ومن غير نت.
 */
import { router } from 'expo-router';
import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Btn, Card, Icon, Row, Txt, useHaptic } from '@/components/ui';
import { featuredCategories } from '@/data/azkar';
import { useI18n } from '@/i18n';
import { type Salah, todayKey, useReading } from '@/store/reading-store';
import { useMushafTheme } from '@/theme/ThemeContext';

export const SALAWAT: Salah[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const AFTER_PRAYER = featuredCategories.find((c) => c.name === 'الأذكار بعد السلام من الصلاة');

/** دايرة التعليم جنب الصلاة */
export function PrayedCheck({ day, p, enabled, onMarked }: { day: string; p: Salah; enabled: boolean; onMarked: (p: Salah) => void }) {
  const { theme } = useMushafTheme();
  const { t } = useI18n();
  const { prayerLog, togglePrayed } = useReading();
  const haptic = useHaptic();
  const c = theme.colors;
  const done = !!prayerLog[day]?.[p];
  return (
    <Pressable
      disabled={!enabled && !done}
      onPress={() => {
        const marked = togglePrayed(day, p);
        haptic(marked ? 'success' : 'light');
        if (marked) onMarked(p);
      }}
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done, disabled: !enabled && !done }}
      accessibilityLabel={enabled ? t('markPrayed', { p: t(p) }) : t('notYetTime', { p: t(p) })}
      style={[
        styles.check,
        { borderColor: done ? c.accent : c.border, backgroundColor: done ? c.accent : 'transparent', opacity: enabled || done ? 1 : 0.35 },
      ]}>
      {done ? <Icon name="checkmark" size={16} color={c.background} /> : null}
    </Pressable>
  );
}

/** سجل آخر ٧ أيام: صف لكل يوم ودايرة لكل صلاة (ممكن تعلّم على يوم فات لو نسيت) */
export function WeekLog({ now }: { now: Date }) {
  const { theme } = useMushafTheme();
  const { t, lang, num } = useI18n();
  const { prayerLog, togglePrayed } = useReading();
  const c = theme.colors;
  const days = Array.from({ length: 7 }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
  const total = days.reduce((n, d) => n + SALAWAT.filter((p) => prayerLog[todayKey(d)]?.[p]).length, 0);

  return (
    <Card style={{ gap: 8 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt size={15} weight="bold">
          {t('last7Days')}
        </Txt>
        <Txt size={13} color="accent" weight="medium">
          {t('prayedCount', { n: num(total), m: num(35) })}
        </Txt>
      </Row>
      <Row style={{ gap: 4 }}>
        <View style={styles.dayCol} />
        {SALAWAT.map((p) => (
          <Txt key={p} size={11} color="textSecondary" align="center" style={styles.cell} numberOfLines={1}>
            {t(p)}
          </Txt>
        ))}
      </Row>
      {days.map((d, i) => {
        const key = todayKey(d);
        const log = prayerLog[key] ?? {};
        return (
          <Row key={key} style={{ gap: 4 }}>
            <Txt size={12} color={i === 0 ? 'accent' : 'textSecondary'} weight={i === 0 ? 'bold' : 'normal'} style={styles.dayCol} numberOfLines={1}>
              {i === 0 ? t('today') : d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', day: 'numeric' })}
            </Txt>
            {SALAWAT.map((p) => {
              const done = !!log[p];
              return (
                <Pressable
                  key={p}
                  // اليوم: التعليم من الجدول فوق (بعد دخول الوقت). الأيام اللي فاتت: من هنا
                  disabled={i === 0}
                  onPress={() => togglePrayed(key, p)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: done }}
                  accessibilityLabel={`${t(p)} ${key}`}
                  style={styles.cell}>
                  <View style={[styles.dot, { borderColor: done ? c.accent : c.border, backgroundColor: done ? c.accent : 'transparent' }]}>
                    {done ? <Icon name="checkmark" size={11} color={c.background} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </Row>
        );
      })}
    </Card>
  );
}

/** «تقبّل الله — تحب تقرا أذكار ما بعد الصلاة؟» */
export function AfterPrayerPrompt({ prayer, onClose }: { prayer: Salah | null; onClose: () => void }) {
  const { theme } = useMushafTheme();
  const { t } = useI18n();
  const c = theme.colors;
  return (
    <Modal visible={prayer != null && !!AFTER_PRAYER} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('close')} />
        <View style={[styles.box, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={[styles.badge, { backgroundColor: c.highlight }]}>
            <Icon name="checkmark" size={28} color={c.accent} />
          </View>
          <Txt size={20} weight="bold" align="center">
            {t('accepted')}
          </Txt>
          <Txt size={15} color="textSecondary" align="center">
            {t('afterPrayerAzkarQ')}
          </Txt>
          <Row style={{ gap: 10 }}>
            <Btn
              title={t('yes')}
              style={{ flex: 1 }}
              onPress={() => {
                onClose();
                if (AFTER_PRAYER) router.push({ pathname: '/azkar/[id]', params: { id: String(AFTER_PRAYER.id) } });
              }}
            />
            <Btn title={t('notNow')} kind="secondary" style={{ flex: 1 }} onPress={onClose} />
          </Row>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  check: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dayCol: { width: 70 },
  cell: { flex: 1, alignItems: 'center' },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  box: { borderRadius: 18, borderWidth: 1, padding: 22, gap: 12, width: '100%', maxWidth: 400, alignSelf: 'center', alignItems: 'stretch' },
  badge: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
});
