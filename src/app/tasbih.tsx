/**
 * السبحة الإلكترونية: اضغط في أي مكان على الدايرة للعد، واهتزاز عند الوصول للهدف.
 */
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Vibration, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Btn, Segmented, Txt, useHaptic } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useReading } from '@/store/reading-store';
import { useSettings } from '@/store/settings-store';
import { useMushafTheme } from '@/theme/ThemeContext';

const PHRASES = ['سبحان الله', 'الحمد لله', 'الله أكبر', 'لا إله إلا الله', 'أستغفر الله'];

export default function TasbihScreen() {
  const { t, num } = useI18n();
  const { theme } = useMushafTheme();
  const c = theme.colors;
  const { settings } = useSettings();
  const haptic = useHaptic();
  const { markActivity } = useReading();
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [phrase, setPhrase] = useState(0);

  const tap = () => {
    const n = count + 1;
    setCount(n);
    // أول ما يوصل للهدف (أو ٣٣ لو من غير حد) → «أنا مسلم»
    if (n === (target || 33)) markActivity('tasbih');
    if (target > 0 && n % target === 0) {
      haptic('success');
      if (settings.vibrateOnFinish && Platform.OS !== 'web') Vibration.vibrate(120);
    } else haptic();
  };

  return (
    <Screen title={t('tasbihTitle')} back>
      <View style={styles.body}>
        <Pressable onPress={() => setPhrase((p) => (p + 1) % PHRASES.length)} accessibilityRole="button" hitSlop={10}>
          <Txt arabic size={26} weight="bold" color="accent" align="center">
            {PHRASES[phrase]}
          </Txt>
        </Pressable>

        <Pressable
          onPress={tap}
          accessibilityRole="button"
          accessibilityLabel={`${PHRASES[phrase]} ${count}`}
          style={({ pressed }) => [
            styles.circle,
            { borderColor: c.accent, backgroundColor: pressed ? c.highlight : c.surface, transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}>
          <Txt size={64} weight="bold" align="center">
            {num(count)}
          </Txt>
          {target > 0 ? (
            <Txt size={15} color="textSecondary" align="center">
              {`${num(count % target || (count ? target : 0))} / ${num(target)}`}
            </Txt>
          ) : null}
        </Pressable>

        <Segmented
          value={target}
          onChange={setTarget}
          options={[
            { value: 33, label: num(33) },
            { value: 100, label: num(100) },
            { value: 0, label: '∞' },
          ]}
        />
        <Btn title={t('reset')} kind="secondary" icon="reset" onPress={() => setCount(0)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: 20, gap: 24, alignItems: 'stretch', justifyContent: 'center' },
  circle: {
    alignSelf: 'center',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
