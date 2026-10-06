/**
 * اتجاه القبلة: بوصلة بتلف مع الموبايل (أندرويد و iOS).
 * على الويب أو الأجهزة من غير بوصلة: بنعرض الزاوية من الشمال بس.
 */
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Btn, Card, Txt, useHaptic } from '@/components/ui';
import { qiblaDirection } from '@/features/prayer/prayer';
import { useI18n } from '@/i18n';
import { useSettings } from '@/store/settings-store';
import { useMushafTheme } from '@/theme/ThemeContext';

export default function QiblaScreen() {
  const { t } = useI18n();
  const { theme } = useMushafTheme();
  const c = theme.colors;
  const { settings } = useSettings();
  const haptic = useHaptic();
  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState(3);
  const [unavailable, setUnavailable] = useState(Platform.OS === 'web');
  const wasAligned = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) {
          setUnavailable(true);
          return;
        }
        sub = await Location.watchHeadingAsync((h) => {
          setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading);
          setAccuracy(h.accuracy);
        });
      } catch {
        setUnavailable(true);
      }
    })();
    return () => sub?.remove();
  }, []);

  // اهتزاز خفيف أول ما الموبايل يتجه للقبلة
  const alignedNow = (() => {
    if (!settings.location || heading === null) return false;
    const r = (qiblaDirection(settings.location) - heading + 360) % 360;
    return Math.min(r, 360 - r) < 5;
  })();
  useEffect(() => {
    if (alignedNow && !wasAligned.current) haptic('success');
    wasAligned.current = alignedNow;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alignedNow]);

  if (!settings.location) {
    return (
      <Screen title={t('qiblaTitle')} back>
        <View style={styles.body}>
          <Card style={{ gap: 10 }}>
            <Txt size={16}>{t('setLocationHint')}</Txt>
            <Btn title={t('chooseCity')} onPress={() => router.replace('/city')} />
          </Card>
        </View>
      </Screen>
    );
  }

  const qibla = qiblaDirection(settings.location);
  const deg = Math.round(qibla);
  const rel = heading === null ? qibla : (qibla - heading + 360) % 360;
  const diff = Math.min(rel, 360 - rel);
  const aligned = heading !== null && diff < 5;

  const size = 280;
  return (
    <Screen title={t('qiblaTitle')} subtitle={t('qiblaFromNorth', { d: deg })} back>
      <View style={styles.body}>
        <View style={[styles.dial, { width: size, height: size, borderRadius: size / 2, borderColor: aligned ? c.accent : c.border, backgroundColor: c.surface }]}>
          {/* الشمال بيلف عكس اتجاه الموبايل */}
          <View style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${-(heading ?? 0)}deg` }] }]}>
            <Txt size={16} weight="bold" color="textSecondary" align="center" style={styles.north}>
              N
            </Txt>
          </View>
          {/* سهم القبلة */}
          <View style={[StyleSheet.absoluteFill, styles.center, { transform: [{ rotate: `${rel}deg` }] }]}>
            <View style={styles.arrowWrap}>
              <View style={[styles.arrowHead, { borderBottomColor: aligned ? c.accent : c.text }]} />
              <View style={[styles.arrowBody, { backgroundColor: aligned ? c.accent : c.text }]} />
            </View>
          </View>
          <Txt size={30} align="center">
            🕋
          </Txt>
        </View>

        <Txt size={18} weight="bold" align="center" color={aligned ? 'accent' : 'text'}>
          {unavailable ? t('compassUnavailable', { d: deg }) : aligned ? t('qiblaAligned') : t('qiblaHint')}
        </Txt>
        {!unavailable && accuracy < 2 ? (
          <Txt size={13} color="textSecondary" align="center">
            {t('calibrate')}
          </Txt>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', padding: 20, gap: 22 },
  dial: { borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  north: { position: 'absolute', top: 8, left: 0, right: 0 },
  center: { alignItems: 'center' },
  arrowWrap: { alignItems: 'center', marginTop: 18 },
  arrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 24,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowBody: { width: 6, height: 70, borderRadius: 3 },
});
