/**
 * «الأذان مش بيوصل؟» — خطوات علشان الأذان والتنبيهات توصل والتطبيق مقفول (أندرويد).
 * كل خطوة بزرار بيفتح شاشة الإعدادات الصح، ونصيحة مخصوصة لشركة الموبايل، وفي الآخر «جرّب الأذان».
 */
import React, { useEffect, useState } from 'react';
import { AppState, ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Btn, Card, Row, Txt } from '@/components/ui';
import {
  batteryUnrestricted,
  exactAlarmAllowed,
  exactAlarmSupported,
  openAppDetails,
  openBatterySettings,
  openExactAlarmSettings,
  openNotificationSettings,
  phoneBrand,
  phoneName,
} from '@/features/notifications/phone-settings';
import { notificationPermissionGranted, testAdhan } from '@/features/notifications/schedule';
import { useI18n } from '@/i18n';
import { useSettings } from '@/store/settings-store';
import { useMushafTheme } from '@/theme/ThemeContext';

export default function NotifHelpScreen() {
  const { t, num } = useI18n();
  const { theme } = useMushafTheme();
  const c = theme.colors;
  const { settings } = useSettings();
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const brand = phoneBrand();
  const name = phoneName();
  // حالة كل إعداد (بتتحدث لما المستخدم يرجع من الإعدادات)
  const [status, setStatus] = useState<{ notif: boolean | null; alarm: boolean | null; battery: boolean | null }>({
    notif: null,
    alarm: null,
    battery: null,
  });
  useEffect(() => {
    const check = () =>
      notificationPermissionGranted().then((notif) => setStatus({ notif, alarm: exactAlarmAllowed(), battery: batteryUnrestricted() }));
    check();
    const sub = AppState.addEventListener('change', (st) => st === 'active' && check());
    return () => sub.remove();
  }, []);
  const label = (v: boolean | null, off = t('nhNotAllowed')) => (v === null ? undefined : v ? t('nhAllowed') : off);

  const steps: { title: string; body: string; status?: string; ok?: boolean | null; action?: { label: string; onPress: () => void } }[] = [
    {
      title: t('nhNotifTitle'),
      body: t('nhNotifBody'),
      status: label(status.notif),
      ok: status.notif,
      action: { label: t('nhOpen'), onPress: openNotificationSettings },
    },
    ...(exactAlarmSupported
      ? [
          {
            title: t('nhAlarmTitle'),
            body: t('nhAlarmBody'),
            status: label(status.alarm),
            ok: status.alarm,
            action: { label: t('nhOpen'), onPress: openExactAlarmSettings },
          },
        ]
      : []),
    {
      title: t('nhBatteryTitle'),
      body: t('nhBatteryBody'),
      status: label(status.battery, t('nhBatteryOptimized')),
      ok: status.battery,
      action: { label: t('nhOpen'), onPress: openBatterySettings },
    },
    {
      title: name ? t('nhBrandTitleNamed', { name }) : t('nhBrandTitle'),
      body: t(`nhBrand_${brand}`),
      action: { label: t('nhOpenApp'), onPress: openAppDetails },
    },
    { title: t('nhSilentTitle'), body: t('nhSilentBody') },
  ];

  return (
    <Screen title={t('nhTitle')} back>
      <ScrollView contentContainerStyle={styles.body}>
        <Txt size={14} color="textSecondary" lineHeight={1.7}>
          {t('nhIntro')}
        </Txt>
        {steps.map((st, i) => (
          <Card key={st.title} style={{ gap: 8 }}>
            <Row style={{ gap: 10 }}>
              <View style={[styles.num, { backgroundColor: c.accent }]}>
                <Txt fixed size={13} weight="bold" color={c.background} align="center">
                  {num(i + 1)}
                </Txt>
              </View>
              <Txt size={15} weight="bold" style={{ flex: 1 }}>
                {st.title}
              </Txt>
            </Row>
            {st.status ? (
              <Txt size={13} weight="bold" color={st.ok ? c.accent : '#C0392B'}>
                {st.status}
              </Txt>
            ) : null}
            <Txt size={13} lineHeight={1.7}>
              {st.body}
            </Txt>
            {st.action ? <Btn title={st.action.label} kind="secondary" icon="gear" onPress={st.action.onPress} /> : null}
          </Card>
        ))}
        <Card style={{ gap: 8, borderColor: c.accent }}>
          <Txt size={15} weight="bold">
            {t('nhTestTitle')}
          </Txt>
          <Txt size={13} lineHeight={1.7}>
            {testMsg ?? t('nhTestBody')}
          </Txt>
          <Btn
            title={t('testAdhan')}
            icon="play"
            onPress={async () => {
              const ok = await testAdhan(settings);
              setTestMsg(ok ? t('testAdhanSent') : t('testAdhanDenied'));
            }}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12, paddingBottom: 48 },
  num: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
