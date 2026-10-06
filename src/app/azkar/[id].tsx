/**
 * قسم أذكار: كل ذكر بعدّاد. اضغط على الذكر علشان تعد، ولما يخلص بيختفي (لو مفعّل في الإعدادات).
 */
import { useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Vibration, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Btn, Card, Row, Txt, useHaptic } from '@/components/ui';
import { getCategory, type Zekr } from '@/data/azkar';
import { ayahs, getSurah, surahOfAyah } from '@/data/quran';
import { useI18n } from '@/i18n';
import { useSettings } from '@/store/settings-store';
import { useMushafTheme } from '@/theme/ThemeContext';

/** نسخة الويب: صفحة HTML لكل قسم */
export async function generateStaticParams(): Promise<Record<string, string>[]> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { azkarCategories } = require('@/data/azkar') as typeof import('@/data/azkar');
  return azkarCategories.map((c) => ({ id: String(c.id) }));
}

export default function AzkarCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cat = getCategory(Number(id));
  const { t } = useI18n();
  const { settings } = useSettings();
  const haptic = useHaptic();
  const [left, setLeft] = useState<number[]>(() => cat?.items.map((z) => z.count) ?? []);

  const remaining = useMemo(() => left.filter((n) => n > 0).length, [left]);
  if (!cat) return null;

  const tap = (i: number) => {
    if (left[i] <= 0) return;
    const n = left[i] - 1;
    setLeft((prev) => prev.map((v, k) => (k === i ? n : v)));
    if (n === 0) {
      haptic('success');
      if (settings.vibrateOnFinish && Platform.OS !== 'web') Vibration.vibrate(80);
    } else haptic();
  };

  return (
    <Screen title={cat.name} back>
      <ScrollView contentContainerStyle={styles.body}>
        {cat.items.map((z, i) => {
          const done = left[i] <= 0;
          if (done && settings.removeFinishedAzkar) return null;
          return <ZekrCard key={i} z={z} left={left[i]} done={done} onPress={() => tap(i)} />;
        })}
        {remaining === 0 && (
          <Card style={{ gap: 12, alignItems: 'center' }}>
            <Txt size={18} weight="bold" align="center">
              {t('allDone')}
            </Txt>
            <Btn title={t('resetCounts')} kind="secondary" icon="reset" onPress={() => setLeft(cat.items.map((z) => z.count))} />
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

function ZekrCard({ z, left, done, onPress }: { z: Zekr; left: number; done: boolean; onPress: () => void }) {
  const { t, num } = useI18n();
  const { theme } = useMushafTheme();
  const c = theme.colors;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityHint={t('tapToCount')} disabled={done}>
      {({ pressed }) => (
        <Card style={{ gap: 10, opacity: done ? 0.45 : pressed ? 0.85 : 1 }}>
          {z.intro ? (
            <Txt arabic size={14} color="textSecondary">
              {z.intro}
            </Txt>
          ) : null}
          {z.quran ? (
            <View style={{ gap: 6 }}>
              {z.quran.map(([a, b]) => (
                <QuranRange key={`${a}-${b}`} from={a} to={b} />
              ))}
            </View>
          ) : (
            <Txt arabic size={19} lineHeight={1.9}>
              {z.text}
            </Txt>
          )}
          {z.note ? (
            <Txt arabic size={13} color="textSecondary" lineHeight={1.6}>
              {z.note}
            </Txt>
          ) : null}
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt arabic size={12} color="textSecondary" style={{ flex: 1 }}>
              {z.ref ?? ''}
            </Txt>
            <View style={[styles.counter, { backgroundColor: done ? c.border : c.accent }]}>
              <Txt size={15} weight="bold" color={c.background} align="center">
                {done ? '✓' : num(left)}
              </Txt>
            </View>
          </Row>
        </Card>
      )}
    </Pressable>
  );
}

/** آيات من المصحف نفسه (ayahs.json) — بسملة قبل السورة لو بنقرأها من أولها */
function QuranRange({ from, to }: { from: number; to: number }) {
  const s = surahOfAyah(from);
  const whole = from === s.firstAyah && s.id !== 1 && s.id !== 9;
  const text = [];
  for (let id = from; id <= to; id++) text.push(`${ayahs[id - 1]} ﴿${toAr(id - s.firstAyah + 1)}﴾`);
  return (
    <View>
      {whole ? (
        <Txt quran size={20} align="center" color="textSecondary">
          {ayahs[0]}
        </Txt>
      ) : null}
      <Txt quran size={21}>
        {text.join(' ')}
      </Txt>
      <Txt arabic size={12} color="accent">
        {`[${getSurah(s.id).name}]`}
      </Txt>
    </View>
  );
}

const toAr = (n: number) => String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12, paddingBottom: 48 },
  counter: { minWidth: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
});
