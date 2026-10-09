/**
 * السبحة الإلكترونية: اضغط على الدايرة للعد، واهتزاز عند الوصول للهدف.
 * - العدد والذكر والهدف بيتحفظوا على الجهاز (yatlu.tasbih) — تقفل التطبيق وترجع تلاقي نفس الرقم،
 *   ومش بيتصفّر غير من زرار «تصفير» (بتأكيد). بيعدّ لحد ملايين.
 * - الذكر فوق زرار: اضغط عليه (أو على الأسهم) علشان تغيّره.
 * - أندرويد: «السبحة في الإشعارات ولوحة القفل» — إشعار ثابت فيه زرار «سبّح» والعداد (tasbih-notification.ts).
 */
import React, { useEffect, useRef, useState } from 'react';
import { AppState, Platform, Pressable, ScrollView, StyleSheet, Vibration, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Btn, Card, Icon, Row, Segmented, Toggle, Txt, useHaptic } from '@/components/ui';
import {
  onTasbihChange,
  setTasbihPinned,
  syncTasbihNotification,
  tasbihNotificationSupported,
} from '@/features/tasbih/tasbih-notification';
import { DEFAULT_TASBIH, loadTasbih, PHRASES, saveTasbih, type TasbihState } from '@/features/tasbih/tasbih-store';
import { useI18n } from '@/i18n';
import { useReading } from '@/store/reading-store';
import { useSettings } from '@/store/settings-store';
import { useMushafTheme } from '@/theme/ThemeContext';

/** حجم رقم العداد حسب عدد الخانات علشان المليون يدخل في الدايرة */
const countSize = (digits: number) => (digits <= 4 ? 64 : digits <= 5 ? 56 : digits <= 7 ? 46 : 36);

export default function TasbihScreen() {
  const { t, num, isAr } = useI18n();
  const { theme } = useMushafTheme();
  const c = theme.colors;
  const { settings } = useSettings();
  const haptic = useHaptic();
  const { markActivity } = useReading();
  const [s, setS] = useState<TasbihState>(DEFAULT_TASBIH);
  const [loaded, setLoaded] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pinError, setPinError] = useState(false);
  const sessionTaps = useRef(0);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // تحميل العدد المحفوظ، وإعادة تحميله لما التطبيق يرجع (ممكن يكون اتعدّ من الإشعار)
  useEffect(() => {
    let alive = true;
    const reload = () =>
      loadTasbih().then((v) => {
        if (alive) {
          setS(v);
          setLoaded(true);
        }
      });
    reload();
    const sub = AppState.addEventListener('change', (st) => st === 'active' && reload());
    const off = onTasbihChange((v) => alive && setS(v));
    return () => {
      alive = false;
      sub.remove();
      off();
    };
  }, []);

  useEffect(() => {
    if (!confirmReset) return;
    const id = setTimeout(() => setConfirmReset(false), 3000);
    return () => clearTimeout(id);
  }, [confirmReset]);

  const commit = (next: TasbihState) => {
    setS(next);
    saveTasbih(next);
    if (next.pinned) {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => syncTasbihNotification(next), 400);
    }
  };

  const tap = () => {
    if (!loaded) return;
    const n = s.count + 1;
    commit({ ...s, count: n });
    sessionTaps.current += 1;
    // أول ما يوصل للهدف (أو ٣٣ لو من غير حد) في الجلسة دي → «أنا مسلم»
    if (sessionTaps.current === (s.target || 33)) markActivity('tasbih');
    if (s.target > 0 && n % s.target === 0) {
      haptic('success');
      if (settings.vibrateOnFinish && Platform.OS !== 'web') Vibration.vibrate(120);
    } else haptic();
  };

  const changePhrase = (step: number) => {
    haptic();
    commit({ ...s, phrase: (s.phrase + step + PHRASES.length) % PHRASES.length });
  };

  const reset = () => {
    if (s.count > 0 && !confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    sessionTaps.current = 0;
    commit({ ...s, count: 0 });
  };

  const togglePin = async (v: boolean) => {
    setPinError(false);
    const ok = await setTasbihPinned(v, s);
    if (!ok && v) {
      setPinError(true);
      return;
    }
    commit({ ...s, pinned: v });
  };

  const sep = isAr ? '٬' : ',';
  const grouped = (n: number) => num(String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep));
  const round = s.target > 0 ? s.count % s.target || (s.count ? s.target : 0) : 0;
  const rounds = s.target > 0 ? Math.floor(s.count / s.target) : 0;
  // «السابق» في بداية السطر (يمين في العربي) وسهمه بيشاور لبرّه
  const prevIcon = isAr ? 'right' : 'left';
  const nextIcon = isAr ? 'left' : 'right';

  return (
    <Screen title={t('tasbihTitle')} back>
      <ScrollView contentContainerStyle={styles.body}>
        {/* الذكر: زرار واضح إنه بيتغيّر */}
        <View style={{ gap: 6 }}>
          <Row style={[styles.phraseBox, { borderColor: c.accent, backgroundColor: c.highlight }]}>
            <Pressable onPress={() => changePhrase(-1)} accessibilityRole="button" accessibilityLabel={t('tasbihPrevPhrase')} hitSlop={10} style={styles.arrow}>
              <Icon name={prevIcon} size={22} color={c.accent} />
            </Pressable>
            <Pressable
              onPress={() => changePhrase(1)}
              accessibilityRole="button"
              accessibilityLabel={t('tasbihChangePhrase')}
              accessibilityHint={t('tasbihChangeHint')}
              style={({ pressed }) => [styles.phrase, { opacity: pressed ? 0.6 : 1 }]}>
              <Txt arabic size={PHRASES[s.phrase].length > 18 ? 20 : 26} weight="bold" color="accent" align="center">
                {PHRASES[s.phrase]}
              </Txt>
              <Txt size={11} color="textSecondary" align="center">
                {`${num(s.phrase + 1)} / ${num(PHRASES.length)}`}
              </Txt>
            </Pressable>
            <Pressable onPress={() => changePhrase(1)} accessibilityRole="button" accessibilityLabel={t('tasbihNextPhrase')} hitSlop={10} style={styles.arrow}>
              <Icon name={nextIcon} size={22} color={c.accent} />
            </Pressable>
          </Row>
          <Row style={{ gap: 6, justifyContent: 'center' }}>
            <Icon name="swap" size={14} color={c.textSecondary} />
            <Txt size={12} color="textSecondary" align="center">
              {t('tasbihChangeHint')}
            </Txt>
          </Row>
        </View>

        <Pressable
          onPress={tap}
          accessibilityRole="button"
          accessibilityLabel={`${PHRASES[s.phrase]} ${s.count}`}
          style={({ pressed }) => [
            styles.circle,
            { borderColor: c.accent, backgroundColor: pressed ? c.highlight : c.surface, transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}>
          <Txt size={countSize(String(s.count).length)} weight="bold" align="center" numberOfLines={1} adjustsFontSizeToFit style={{ maxWidth: 210 }}>
            {grouped(s.count)}
          </Txt>
          {s.target > 0 ? (
            <Txt size={15} color="textSecondary" align="center">
              {`${num(round)} / ${num(s.target)}`}
            </Txt>
          ) : null}
          {rounds > 0 ? (
            <Txt size={12} color="textSecondary" align="center">
              {t('tasbihRounds', { n: grouped(rounds) })}
            </Txt>
          ) : null}
        </Pressable>

        <Segmented
          value={s.target}
          onChange={(v) => commit({ ...s, target: v })}
          options={[
            { value: 33, label: num(33) },
            { value: 100, label: num(100) },
            { value: 1000, label: num(1000) },
            { value: 0, label: '∞' },
          ]}
        />
        <Btn
          title={confirmReset ? t('tasbihResetConfirm', { n: grouped(s.count) }) : t('reset')}
          kind={confirmReset ? 'primary' : 'secondary'}
          icon="reset"
          onPress={reset}
        />
        <Txt size={12} color="textSecondary" align="center">
          {t('tasbihSavedNote')}
        </Txt>

        {tasbihNotificationSupported ? (
          <Card style={{ gap: 6 }}>
            <Row style={{ gap: 10 }}>
              <Icon name="bell" size={20} color={c.accent} />
              <Txt size={15} weight="bold" style={{ flex: 1 }}>
                {t('tasbihPin')}
              </Txt>
              <Toggle label={t('tasbihPin')} value={s.pinned} onChange={togglePin} />
            </Row>
            <Txt size={12} color="textSecondary">
              {pinError ? t('tasbihPinDenied') : t('tasbihPinHint')}
            </Txt>
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, padding: 20, paddingBottom: 40, gap: 18, alignItems: 'stretch', justifyContent: 'center' },
  phraseBox: { borderWidth: 1.5, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 6, gap: 4 },
  phrase: { flex: 1, gap: 2, alignItems: 'center' },
  arrow: { padding: 8 },
  circle: {
    alignSelf: 'center',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
