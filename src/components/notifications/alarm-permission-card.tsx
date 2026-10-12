/**
 * كارت بيظهر في الرئيسية والمواقيت (أندرويد) لو «المنبهات والتذكيرات» مقفولة ليتلو والأذان مفعّل:
 * من غيرها الأذان ممكن يتأخر أو ما يوصلش والتطبيق مقفول. بيتشيك تاني كل ما التطبيق يرجع
 * (وساعتها التنبيهات بتتجدول من جديد بالظبط — _layout.tsx). «مش دلوقتي» بيخفيه ٣ أيام.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { AppState, Platform, View } from 'react-native';

import { Btn, Card, Icon, Row, Txt } from '@/components/ui';
import { exactAlarmAllowed, openExactAlarmSettings } from '@/features/notifications/phone-settings';
import { useI18n } from '@/i18n';
import { useSettings } from '@/store/settings-store';

const KEY = 'yatlu.alarmCardSnooze';
const SNOOZE = 3 * 86400000;

export function AlarmPermissionCard() {
  const { t } = useI18n();
  const { settings } = useSettings();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [snoozed, setSnoozed] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const check = () => setAllowed(exactAlarmAllowed());
    check();
    AsyncStorage.getItem(KEY)
      .then((v) => setSnoozed(!!v && Date.now() - Number(v) < SNOOZE))
      .catch(() => setSnoozed(false));
    const sub = AppState.addEventListener('change', (st) => st === 'active' && check());
    return () => sub.remove();
  }, []);

  if (Platform.OS !== 'android' || allowed !== false || snoozed || !settings.notifyAdhan) return null;

  return (
    <Card style={{ gap: 10, borderColor: '#C0392B', borderWidth: 1.5 }}>
      <Row style={{ gap: 10 }}>
        <Icon name="bell" size={22} color="#C0392B" />
        <Txt size={15} weight="bold" style={{ flex: 1 }}>
          {t('alarmCardTitle')}
        </Txt>
      </Row>
      <Txt size={13} lineHeight={1.7}>
        {t('alarmCardBody')}
      </Txt>
      <Row style={{ gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Btn title={t('alarmCardAllow')} icon="check" onPress={openExactAlarmSettings} />
        </View>
        <View style={{ flex: 1 }}>
          <Btn title={t('alarmCardHow')} kind="secondary" icon="info" onPress={() => router.push('/notif-help')} />
        </View>
      </Row>
      <Btn
        title={t('notNow')}
        kind="ghost"
        onPress={() => {
          setSnoozed(true);
          AsyncStorage.setItem(KEY, String(Date.now())).catch(() => {});
        }}
      />
    </Card>
  );
}
