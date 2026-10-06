/**
 * «أنا مسلم»: خريطة طريق لليوم — كل نشاط في وقته (الصلوات، الأذكار، الورد، سماع القرآن،
 * الدعاء لغزة، التسبيح، الكهف يوم الجمعة). الضغط على النشاط بيوديك له، وبيتعلّم لوحده لما يخلص،
 * أو تعلّمه بنفسك من الدايرة.
 */
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Btn, Card, Icon, Row, Txt, useHaptic } from '@/components/ui';
import { activityTitle, type DayItem } from '@/features/muslim/day-plan';
import { useDayPlan } from '@/features/muslim/use-day-plan';
import { gregorianDate, hijriDate } from '@/features/prayer/hijri';
import { formatTime } from '@/features/prayer/prayer';
import { translate, useI18n } from '@/i18n';
import { todayKey, useReading } from '@/store/reading-store';
import { useMushafTheme } from '@/theme/ThemeContext';

type Key = Parameters<typeof translate>[1];

export default function MuslimScreen() {
  const { t, lang, num } = useI18n();
  const { theme } = useMushafTheme();
  const c = theme.colors;
  const plan = useDayPlan();
  const { togglePrayed, toggleActivity } = useReading();
  const haptic = useHaptic();
  const nowMs = plan.now.getTime();
  const pct = plan.total ? Math.round((plan.done / plan.total) * 100) : 0;
  // مكان خط «دلوقتي» في الخريطة
  const nowIndex = plan.items.findIndex((i) => i.at > nowMs);

  const toggle = (item: DayItem) => {
    if (item.kind === 'prayer' && item.prayer) {
      if (item.at > nowMs && !item.done) return; // الصلاة لسه وقتها ما جاش
      togglePrayed(todayKey(plan.now), item.prayer);
    } else toggleActivity(item.id);
    haptic(item.done ? 'light' : 'success');
  };

  return (
    <Screen title={t('muslimTitle')} subtitle={`${hijriDate(plan.now, lang)} · ${gregorianDate(plan.now, lang)}`} back>
      <ScrollView contentContainerStyle={styles.body}>
        {/* التقدّم */}
        <Card style={[styles.hero, { backgroundColor: c.accent, borderColor: c.accent }]}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt size={15} weight="bold" color={c.background}>
              {t('muslimSubtitle')}
            </Txt>
            <Txt size={15} weight="bold" color={c.background}>
              {t('dayProgress', { n: num(plan.done), m: num(plan.total) })}
            </Txt>
          </Row>
          <View style={[styles.track, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
            <View style={[styles.fill, { width: `${pct}%`, backgroundColor: c.background }]} />
          </View>
          <Txt size={14} color={c.background}>
            {plan.done === plan.total && plan.total > 0
              ? t('dayComplete')
              : plan.next
                ? t('nextActivity', { a: `${activityTitle(plan.next, t)} · ${formatTime(new Date(plan.next.at), lang)}` })
                : ''}
          </Txt>
        </Card>

        {!plan.hasPrayers ? (
          <Card style={{ gap: 8 }}>
            <Txt size={14}>{t('planNeedsLocation')}</Txt>
            <Btn title={t('chooseCity')} kind="secondary" icon="location" onPress={() => router.push('/city')} />
          </Card>
        ) : null}

        <Txt size={12} color="textSecondary">
          {t('planHint')}
        </Txt>

        {/* خريطة اليوم */}
        <View>
          {plan.items.map((item, i) => {
            const isNext = plan.next?.id === item.id;
            const late = !item.done && item.at <= nowMs && !isNext;
            const last = i === plan.items.length - 1;
            return (
              <View key={item.id}>
                {i === nowIndex ? <NowLine label={`${t('nowLabel')} · ${formatTime(plan.now, lang)}`} /> : null}
                <Row style={{ alignItems: 'stretch', gap: 10 }}>
                  {/* الوقت */}
                  <View style={styles.timeCol}>
                    <Txt size={12} weight={isNext ? 'bold' : 'normal'} color={isNext ? 'accent' : 'textSecondary'} align="center">
                      {formatTime(new Date(item.at), lang)}
                    </Txt>
                  </View>
                  {/* الخط والدايرة */}
                  <View style={styles.nodeCol}>
                    <View style={[styles.line, { backgroundColor: i === 0 ? 'transparent' : c.border }]} />
                    <Pressable
                      onPress={() => toggle(item)}
                      hitSlop={10}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: item.done }}
                      accessibilityLabel={activityTitle(item, t)}
                      style={[
                        styles.node,
                        {
                          borderColor: item.done || isNext ? c.accent : c.border,
                          backgroundColor: item.done ? c.accent : isNext ? c.highlight : c.background,
                        },
                      ]}>
                      {item.done ? <Icon name="checkmark" size={16} color={c.background} /> : <Icon name={item.icon} size={14} color={isNext ? c.accent : c.textSecondary} />}
                    </Pressable>
                    <View style={[styles.line, { flex: 1, backgroundColor: last ? 'transparent' : item.done ? c.accent : c.border }]} />
                  </View>
                  {/* النشاط */}
                  <Pressable
                    style={{ flex: 1, paddingBottom: 12 }}
                    onPress={() => router.push(item.route as never)}
                    accessibilityRole="button"
                    accessibilityLabel={activityTitle(item, t)}>
                    {({ pressed }) => (
                      <Card
                        style={[
                          styles.card,
                          isNext && { borderColor: c.accent, backgroundColor: c.highlight },
                          item.done && { opacity: 0.6 },
                          pressed && { opacity: 0.7 },
                        ]}>
                        <Row style={{ gap: 10 }}>
                          <View style={{ flex: 1, gap: 2 }}>
                            <Txt size={16} weight={isNext ? 'bold' : 'medium'} style={item.done ? { textDecorationLine: 'line-through' } : undefined}>
                              {activityTitle(item, t)}
                            </Txt>
                            <Txt size={12} color={late ? '#C0392B' : 'textSecondary'}>
                              {t(`actHint_${item.kind === 'gaza' ? 'gaza' : item.kind}` as Key)}
                            </Txt>
                          </View>
                          <Icon name="chevron" size={16} color={c.textSecondary} />
                        </Row>
                      </Card>
                    )}
                  </Pressable>
                </Row>
              </View>
            );
          })}
          {nowIndex === -1 && plan.items.length ? <NowLine label={`${t('nowLabel')} · ${formatTime(plan.now, lang)}`} /> : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

function NowLine({ label }: { label: string }) {
  const { theme } = useMushafTheme();
  return (
    <Row style={{ gap: 8, marginVertical: 6 }}>
      <View style={[styles.nowDot, { backgroundColor: '#C0392B' }]} />
      <View style={{ flex: 1, height: 1.5, backgroundColor: '#C0392B', opacity: 0.6 }} />
      <Txt size={11} weight="bold" color="#C0392B">
        {label}
      </Txt>
      <View style={{ width: 8, height: 1, backgroundColor: theme.colors.border }} />
    </Row>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  hero: { gap: 10 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  timeCol: { width: 58, paddingTop: 16 },
  nodeCol: { width: 30, alignItems: 'center' },
  line: { width: 2, height: 14 },
  node: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  card: { paddingVertical: 12 },
  nowDot: { width: 8, height: 8, borderRadius: 4 },
});
