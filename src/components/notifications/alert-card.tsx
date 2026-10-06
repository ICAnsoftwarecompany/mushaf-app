/**
 * الكارت اللي فوق: تنبيه الأذان، أو صلاة وقتها خلص من غير ما تتعلّم.
 * بيفضل ظاهر لحد ما المستخدم يدوس «تم الرؤية» (أو «صلّيت»).
 */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AfterPrayerPrompt } from '@/components/prayer/prayer-tracker';
import { Btn, Icon, Row, Txt, useHaptic } from '@/components/ui';
import { MaxContentWidth } from '@/constants/theme';
import { markRead, useInbox } from '@/features/notifications/inbox';
import { muteAdhan } from '@/features/notifications/schedule';
import { useI18n } from '@/i18n';
import { type Salah, useReading } from '@/store/reading-store';
import { useMushafTheme } from '@/theme/ThemeContext';

/** الأذان بيفضل يظهر في الكارت لحد ساعتين من وقته */
const ADHAN_WINDOW = 2 * 3600000;

export function AlertCard() {
  const inbox = useInbox();
  const { prayerLog, togglePrayed } = useReading();
  const { theme } = useMushafTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();
  const c = theme.colors;
  const [prompt, setPrompt] = useState<Salah | null>(null);

  const item = inbox.items.find(
    (i) =>
      !inbox.isRead(i.id) &&
      (i.kind === 'missed' || (i.kind === 'adhan' && inbox.now - i.at < ADHAN_WINDOW)) &&
      !(i.prayer && i.day && prayerLog[i.day]?.[i.prayer])
  );

  return (
    <>
      {item ? (
        <View style={[styles.wrap, { top: insets.top + 8 }]} pointerEvents="box-none">
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: item.kind === 'missed' ? '#C0392B' : c.accent }]} accessibilityLiveRegion="polite">
            <Row style={{ gap: 12 }}>
              <View style={[styles.icon, { backgroundColor: c.highlight }]}>
                <Icon name={item.kind === 'adhan' ? 'speaker' : 'bell'} size={20} color={item.kind === 'missed' ? '#C0392B' : c.accent} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt size={16} weight="bold">
                  {item.title}
                </Txt>
                {item.body ? (
                  <Txt size={13} color="textSecondary" numberOfLines={2}>
                    {item.body}
                  </Txt>
                ) : null}
              </View>
            </Row>
            <Row style={{ gap: 10 }}>
              {item.prayer && item.day ? (
                <Btn
                  title={t('iPrayed')}
                  icon="checkmark"
                  style={{ flex: 1 }}
                  onPress={() => {
                    if (!prayerLog[item.day!]?.[item.prayer!]) togglePrayed(item.day!, item.prayer!);
                    haptic('success');
                    markRead(item.id);
                    setPrompt(item.prayer!);
                  }}
                />
              ) : null}
              {item.kind === 'adhan' ? (
                <Btn title={t('mute')} kind="secondary" icon="speaker" style={{ flex: 1 }} onPress={() => muteAdhan()} />
              ) : null}
              <Btn title={t('seen')} kind="secondary" style={{ flex: 1 }} onPress={() => markRead(item.id)} />
            </Row>
          </View>
        </View>
      ) : null}
      <AfterPrayerPrompt prayer={prompt} onClose={() => setPrompt(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 12, zIndex: 50 },
  card: {
    width: '100%',
    maxWidth: MaxContentWidth,
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
