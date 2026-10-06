/**
 * وضع «النص المتصل»: آية تحت آية (للخط الكبير وترجمة المعاني).
 * النص من ayahs.json زي ما هو، والتجويد بيلوّن بس.
 */
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewToken } from 'react-native';

import { Txt } from '@/components/ui';
import { QuranFont, QuranFontBold } from '@/constants/theme';
import { ayahs, BASMALA, isSajda, quarterLabel, quarterStartingAt, surahs, toArabicDigits } from '@/data/quran';
import { tajweedSpans } from '@/data/quran/extra';
import { ARABIC_DIR, useI18n } from '@/i18n';
import { scaleFactor, useSettings } from '@/store/settings-store';
import { useMushafTheme } from '@/theme/ThemeContext';

type Item = { k: 'h'; surah: number } | { k: 'b'; surah: number } | { k: 'a'; id: number; n: number };

const ITEMS: Item[] = (() => {
  const out: Item[] = [];
  for (const s of surahs) {
    out.push({ k: 'h', surah: s.id });
    if (s.id !== 1 && s.id !== 9) out.push({ k: 'b', surah: s.id });
    for (let n = 1; n <= s.ayahs; n++) out.push({ k: 'a', id: s.firstAyah + n - 1, n });
  }
  return out;
})();
const INDEX_OF_AYAH = new Map<number, number>();
ITEMS.forEach((it, i) => it.k === 'a' && INDEX_OF_AYAH.set(it.id, i));

interface Props {
  startAyah: number;
  selectedAyah: number | null;
  playingAyah: number | null;
  translation: string[] | null;
  tajweed: boolean;
  onAyahPress: (id: number) => void;
  onVisibleAyah: (id: number) => void;
}

export function TextReader({ startAyah, selectedAyah, playingAyah, translation, tajweed, onAyahPress, onVisibleAyah }: Props) {
  const { theme } = useMushafTheme();
  const { settings } = useSettings();
  const { lang } = useI18n();
  const c = theme.colors;
  const list = useRef<FlashListRef<Item>>(null);
  const fs = 24 * scaleFactor(settings.mushafScale);
  const font = settings.mushafBold ? QuranFontBold : QuranFont;
  const tajColors = [theme.tajweed.madd, theme.tajweed.ghunnah, theme.tajweed.tafkheem, theme.tajweed.silent];
  const initialIndex = useMemo(() => Math.max(0, (INDEX_OF_AYAH.get(startAyah) ?? 1) - 1), [startAyah]);

  // التلاوة بتنزّل القائمة مع الآية اللي بتتقرأ
  useEffect(() => {
    if (playingAyah == null) return;
    const i = INDEX_OF_AYAH.get(playingAyah);
    if (i !== undefined) list.current?.scrollToIndex({ index: i, animated: true, viewPosition: 0.3 });
  }, [playingAyah]);

  const visibleCb = useRef(onVisibleAyah);
  useEffect(() => {
    visibleCb.current = onVisibleAyah;
  }, [onVisibleAyah]);
  const [onViewable] = useState(() => ({ viewableItems }: { viewableItems: ViewToken<Item>[] }) => {
    const first = viewableItems.find((v) => v.item?.k === 'a');
    if (first?.item && first.item.k === 'a') visibleCb.current(first.item.id);
  });

  return (
    <FlashList
      ref={list}
      data={ITEMS}
      initialScrollIndex={initialIndex}
      keyExtractor={(it) => (it.k === 'a' ? `a${it.id}` : `${it.k}${it.surah}`)}
      getItemType={(it) => it.k}
      onViewableItemsChanged={onViewable}
      contentContainerStyle={{ paddingBottom: 160, paddingTop: 70 }}
      extraData={[selectedAyah, playingAyah, translation, tajweed, settings.mushafScale, settings.mushafBold, theme.id]}
      renderItem={({ item }) => {
        if (item.k === 'h') {
          const s = surahs[item.surah - 1];
          return (
            <View style={[styles.header, { borderColor: c.accent, backgroundColor: c.surface }]}>
              <Text style={{ fontFamily: font, fontSize: fs * 0.9, color: c.accent, textAlign: 'center' }}>{`سُورَةُ ${s.name}`}</Text>
              {lang === 'en' ? (
                <Txt size={12} color="textSecondary" align="center">
                  {s.nameEn}
                </Txt>
              ) : null}
            </View>
          );
        }
        if (item.k === 'b') {
          return <Text style={{ fontFamily: font, fontSize: fs, color: c.text, textAlign: 'center', marginBottom: 6 }}>{BASMALA}</Text>;
        }
        const text = ayahs[item.id - 1];
        const q = quarterStartingAt(item.id);
        const active = selectedAyah === item.id || playingAyah === item.id;
        return (
          <Pressable onPress={() => onAyahPress(item.id)} accessibilityRole="button">
            <View style={[styles.ayah, { borderColor: c.border }, active ? { backgroundColor: c.highlight } : null]}>
              {q ? <Text style={[styles.quarter, { color: c.accent, textAlign: ARABIC_DIR.start }]}>{`۞ ${quarterLabel(q, 'ar')}`}</Text> : null}
              <Text
                style={{
                  fontFamily: font,
                  fontSize: fs,
                  lineHeight: fs * 1.9,
                  color: c.text,
                  textAlign: ARABIC_DIR.start,
                  writingDirection: 'rtl',
                }}>
                {tajweed
                  ? tajweedSpans(item.id, text, 0, text.length).map((s, k) =>
                      s.cat < 0 ? s.text : <Text key={k} style={{ color: tajColors[s.cat] }}>{s.text}</Text>
                    )
                  : text}
                <Text style={{ color: c.accent }}>{` ﴿${toArabicDigits(item.n)}﴾`}</Text>
                {isSajda(item.id) ? <Text style={{ color: c.accent }}>{' ۩'}</Text> : null}
              </Text>
              {translation ? (
                <Txt size={15} color="textSecondary" lineHeight={1.5} style={{ textAlign: 'left', writingDirection: 'ltr' }}>
                  {`${item.n}. ${translation[item.id - 1]}`}
                </Txt>
              ) : null}
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  header: { marginHorizontal: 16, marginTop: 18, marginBottom: 8, borderWidth: 1.5, borderRadius: 10, paddingVertical: 4 },
  ayah: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 6 },
  quarter: { fontSize: 13, fontWeight: '600' },
});
