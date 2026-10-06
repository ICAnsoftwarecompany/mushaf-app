/** كارت «أنا مسلم» في الصفحة الرئيسية: التقدّم والنشاط الجاي — بيفتح خريطة اليوم */
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Icon, Row, Txt } from '@/components/ui';
import { activityTitle } from '@/features/muslim/day-plan';
import { useDayPlan } from '@/features/muslim/use-day-plan';
import { formatTime } from '@/features/prayer/prayer';
import { useI18n } from '@/i18n';
import { useMushafTheme } from '@/theme/ThemeContext';

export function MuslimCard() {
  const { t, lang, num } = useI18n();
  const { theme } = useMushafTheme();
  const c = theme.colors;
  const plan = useDayPlan();
  const pct = plan.total ? Math.round((plan.done / plan.total) * 100) : 0;
  const complete = plan.total > 0 && plan.done === plan.total;

  return (
    <Pressable onPress={() => router.push('/muslim')} accessibilityRole="button" accessibilityLabel={t('muslimTitle')}>
      {({ pressed }) => (
        <Card style={[{ gap: 8, backgroundColor: c.highlight, borderColor: c.accent }, pressed && { opacity: 0.8 }]}>
          <Row style={{ gap: 10 }}>
            <Icon name="star" size={22} color={c.accent} />
            <View style={{ flex: 1 }}>
              <Txt size={16} weight="bold">
                {t('muslimTitle')}
              </Txt>
              <Txt size={12} color="textSecondary" numberOfLines={1}>
                {complete
                  ? t('dayComplete')
                  : plan.next
                    ? t('nextActivity', { a: `${activityTitle(plan.next, t)} · ${formatTime(new Date(plan.next.at), lang)}` })
                    : t('muslimSubtitle')}
              </Txt>
            </View>
            <Txt size={14} weight="bold" color="accent">
              {t('dayProgress', { n: num(plan.done), m: num(plan.total) })}
            </Txt>
            <Icon name="chevron" size={16} color={c.textSecondary} />
          </Row>
          <View style={[styles.track, { backgroundColor: c.border }]}>
            <View style={[styles.fill, { width: `${pct}%`, backgroundColor: c.accent }]} />
          </View>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { height: 5, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 5, borderRadius: 3 },
});
