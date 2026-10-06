/**
 * صفحة واحدة من المصحف بنفس ترتيب سطور مصحف المدينة (15 سطر).
 * النص بيتعرض من ayahs.json زي ما هو — الكومبوننت ده بيرتّب الكلمات بس،
 * وألوان التجويد بتقطّع الكلمة لأجزاء ملوّنة من غير ما تغيّر أي حرف.
 * التكبير (zoom > 1): نفس كلمات الصفحة بخط أكبر والسطور بتلف، والصفحة بتتسحب لتحت.
 */
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { QuranFont, QuranFontBold } from '@/constants/theme';
import {
  ayahNumber,
  ayahs,
  BASMALA,
  getSurah,
  JUZ_NAMES,
  juzOfPage,
  type PageLine,
  pages,
  quarterLabel,
  quartersOnPage,
  type Segment,
  surahsOfPage,
  toArabicDigits,
} from '@/data/quran';
import { tajweedSpans } from '@/data/quran/extra';
import { ARABIC_DIR } from '@/i18n';
import { useMushafTheme } from '@/theme/ThemeContext';

const LINES_PER_PAGE = 15;
const LINE_HEIGHT_FACTOR = 1.75;
/** حجم خط القياس: بنقيس عرض كل سطر بالحجم ده مرة واحدة، وبعدين نكبّر/نصغّر علشان أطول سطر ييجي على عرض الصفحة */
const MEASURE_FONT = 20;
/** أقل مسافة بين الكلمات (نسبة من حجم الخط) */
const WORD_GAP_EM = 0.22;

/** عرض سطور كل صفحة بحجم MEASURE_FONT — مش بيتغير مع الثيم ولا مقاس الشاشة فبنحفظه */
const widthCache = new Map<string, number[]>();

interface Props {
  page: number;
  width: number;
  height: number;
  selectedAyah?: number | null;
  playingAyah?: number | null;
  tajweed?: boolean;
  bold?: boolean;
  showMargins?: boolean;
  /** تكبير الخط (1 = ترتيب السطور زي المصحف) */
  zoom?: number;
  onAyahPress?: (ayahId: number) => void;
  onBackgroundPress?: () => void;
}

interface Word {
  ayahId: number;
  text: string;
  start: number; // موضع الكلمة في نص الآية (للتجويد)
  end: boolean; // بعد الكلمة دي علامة نهاية الآية
}

const ayahWords = new Map<number, { words: string[]; offsets: number[] }>();
function wordsOf(ayahId: number) {
  let w = ayahWords.get(ayahId);
  if (!w) {
    const words = ayahs[ayahId - 1].split(' ');
    const offsets: number[] = [];
    let pos = 0;
    for (const x of words) {
      offsets.push(pos);
      pos += x.length + 1;
    }
    w = { words, offsets };
    ayahWords.set(ayahId, w);
  }
  return w;
}

function lineWords(line: PageLine): Word[] {
  if (line[0] !== 'w') return [];
  const out: Word[] = [];
  for (const [id, from, to, end] of line.slice(1) as Segment[]) {
    const { words, offsets } = wordsOf(id);
    for (let i = from; i <= to; i++) out.push({ ayahId: id, text: words[i], start: offsets[i], end: !!end && i === to });
    // علامة نهاية الآية لوحدها في أول السطر
    if (from > to && end) out.push({ ayahId: id, text: '', start: 0, end: true });
  }
  return out;
}

function MushafPageView({
  page,
  width,
  height,
  selectedAyah,
  playingAyah,
  tajweed,
  bold,
  showMargins = true,
  zoom = 1,
  onAyahPress,
  onBackgroundPress,
}: Props) {
  const { theme } = useMushafTheme();
  const c = theme.colors;
  const font = bold ? QuranFontBold : QuranFont;
  const data = pages[page - 1];
  const isOpening = page <= 2; // الفاتحة وأول البقرة بيتعرضوا في النص
  const cacheKey = `${page}:${bold ? 1 : 0}`;
  const tajColors = [theme.tajweed.madd, theme.tajweed.ghunnah, theme.tajweed.tafkheem, theme.tajweed.silent];

  const lines = useMemo(() => data.lines.map((line) => ({ line, words: lineWords(line) })), [data]);
  const wordLineCount = useMemo(() => lines.filter((l) => l.line[0] === 'w').length, [lines]);

  const [widths, setWidths] = useState<number[] | null>(() => widthCache.get(cacheKey) ?? null);
  const measuring = useRef<number[]>([]);
  const measuredCount = useRef(0);

  // لو الوزن (عادي/عريض) اتغير: نقيس من جديد — مش عند أول ظهور (علشان ما نمسحش قياس شغال)
  const prevKey = useRef(cacheKey);
  useEffect(() => {
    if (prevKey.current === cacheKey) return;
    prevKey.current = cacheKey;
    setWidths(widthCache.get(cacheKey) ?? null);
    measuring.current = [];
    measuredCount.current = 0;
  }, [cacheKey]);

  const onMeasure = (i: number, w: number) => {
    if (measuring.current[i] === undefined) measuredCount.current++;
    measuring.current[i] = w;
    if (measuredCount.current === wordLineCount) {
      const result = lines.map((_, k) => measuring.current[k] ?? 0);
      widthCache.set(cacheKey, result);
      setWidths(result);
    }
  };

  // احتياطي: لو القياس ما خلصش في ثانية (لأي سبب على جهاز معين) نستخدم تقدير بعدد الحروف
  // علشان الصفحة ما تفضلش فاضية أبدًا
  useEffect(() => {
    if (widths) return;
    const t = setTimeout(() => {
      if (widthCache.has(cacheKey)) return setWidths(widthCache.get(cacheKey)!);
      const estimate = lines.map(({ words }) =>
        words.reduce(
          (n, w) => n + (w.text.replace(/[^ء-يٱ]/g, '').length * 0.42 + 0.35 + (w.end ? 1.4 : 0)) * MEASURE_FONT,
          0
        )
      );
      setWidths(estimate);
    }, 1000);
    return () => clearTimeout(t);
  }, [widths, lines, cacheKey]);

  const padX = Math.max(12, width * 0.04);
  const headerH = showMargins ? 28 : 8;
  const footerH = showMargins ? 28 : 8;
  const textW = width - padX * 2;
  const textH = height - headerH - footerH - 8;
  const maxW = widths ? Math.max(...widths, 1) : 1;
  const fitFont = (MEASURE_FONT * textW * 0.98) / maxW;
  // أول صفحتين (الفاتحة وأول البقرة): السطور أقل، فبنكبّر الخط شوية ونقرّب السطور من بعض في النص
  const openingMax = textH / 8.5;
  const fontSize = isOpening
    ? Math.min(fitFont * (page === 1 ? 0.8 : 0.95), openingMax / LINE_HEIGHT_FACTOR)
    : Math.min(fitFont, textH / LINES_PER_PAGE / LINE_HEIGHT_FACTOR);
  const lineH = isOpening ? Math.min(openingMax, fontSize * 2.6) : textH / LINES_PER_PAGE;

  const firstSurah = surahsOfPage(page)[0];
  const juz = juzOfPage(page);
  const quarter = quartersOnPage(page)[0];

  const reflow = zoom > 1.01;
  const zfs = fontSize * zoom;

  const wordText = (w: Word, size = fontSize, lh = lineH) => {
    const base = { fontFamily: font, fontSize: size, lineHeight: lh, color: c.text, writingDirection: 'rtl' as const };
    if (!tajweed) return <Text style={base}>{w.text}</Text>;
    const full = ayahs[w.ayahId - 1];
    const spans = tajweedSpans(w.ayahId, full, w.start, w.start + w.text.length);
    return (
      <Text style={base}>
        {spans.map((s, k) =>
          s.cat < 0 ? (
            s.text
          ) : (
            <Text key={k} style={{ color: tajColors[s.cat] }}>
              {s.text}
            </Text>
          )
        )}
      </Text>
    );
  };

  const renderWord = (w: Word, k: number, size: number, lh: number) => {
    const selected = selectedAyah === w.ayahId;
    const playing = playingAyah === w.ayahId;
    return (
      <Pressable
        key={k}
        onPress={() => onAyahPress?.(w.ayahId)}
        style={[styles.word, { flexDirection: ARABIC_DIR.row }, (selected || playing) && { backgroundColor: c.highlight, borderRadius: 4 }]}>
        {w.text !== '' && wordText(w, size, lh)}
        {w.end && (
          <View
            style={[
              styles.ayahMark,
              {
                width: size * 1.05,
                height: size * 1.05,
                borderRadius: size,
                borderColor: c.accent,
                marginHorizontal: w.text ? size * 0.08 : 0,
              },
            ]}>
            <Text style={{ fontSize: size * 0.42, color: c.accent, fontWeight: '600' }}>{toArabicDigits(ayahNumber(w.ayahId))}</Text>
          </View>
        )}
      </Pressable>
    );
  };

  /** وضع التكبير: الكلمات المتتالية في كتلة واحدة بتلف، والعناوين والبسملة زي ما هي بخط أكبر */
  const renderReflow = () => {
    const blocks: React.ReactNode[] = [];
    let run: Word[] = [];
    const flush = (key: string) => {
      if (!run.length) return;
      const ws = run;
      run = [];
      blocks.push(
        <View
          key={key}
          style={{ flexDirection: ARABIC_DIR.row, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', columnGap: zfs * 0.3 }}>
          {ws.map((w, k) => renderWord(w, k, zfs, zfs * 1.9))}
        </View>
      );
    };
    lines.forEach(({ line, words }, i) => {
      if (line[0] === 'w') return void run.push(...words);
      flush(`r${i}`);
      blocks.push(
        line[0] === 'h' ? (
          <View key={i} style={[styles.lineBox, { paddingVertical: zfs * 0.4 }]}>
            <View style={[styles.surahHeader, { borderColor: c.accent, backgroundColor: c.surface }]}>
              <Text style={{ fontFamily: font, fontSize: zfs * 0.9, color: c.accent, writingDirection: 'rtl' }}>
                {`سُورَةُ ${getSurah(line[1]).name}`}
              </Text>
            </View>
          </View>
        ) : (
          <View key={i} style={[styles.lineBox, { paddingVertical: zfs * 0.2 }]}>
            <Text style={{ fontFamily: font, fontSize: zfs, lineHeight: zfs * 1.9, color: c.text, writingDirection: 'rtl', textAlign: 'center' }}>
              {BASMALA}
            </Text>
          </View>
        )
      );
    });
    flush('end');
    return blocks;
  };

  return (
    <Pressable
      onPress={onBackgroundPress}
      accessibilityLabel={`صفحة ${page}`}
      style={[styles.page, { width, height, backgroundColor: c.background, paddingHorizontal: padX }]}>
      <View style={[styles.margin, { height: headerH, flexDirection: ARABIC_DIR.row }]}>
        {showMargins && (
          <>
            <Text style={[styles.marginText, { color: c.textSecondary }]}>{`سورة ${firstSurah.name}`}</Text>
            {quarter ? (
              <Text style={[styles.marginText, { color: c.accent }]}>{`۞ ${quarterLabel(quarter, 'ar')}`}</Text>
            ) : null}
            <Text style={[styles.marginText, { color: c.textSecondary }]}>{`الجزء ${JUZ_NAMES[juz - 1]}`}</Text>
          </>
        )}
      </View>

      {reflow ? (
        <ScrollView style={{ height: textH }} contentContainerStyle={{ paddingVertical: 8 }} showsVerticalScrollIndicator={false}>
          {widths && renderReflow()}
        </ScrollView>
      ) : (
      <View style={[styles.body, isOpening && styles.bodyCentered, { height: textH }]}>
        {widths &&
          lines.map(({ line, words }, i) => {
            if (line[0] === 'h') {
              return (
                <View key={i} style={[styles.lineBox, { height: lineH }]}>
                  <View style={[styles.surahHeader, { borderColor: c.accent, backgroundColor: c.surface }]}>
                    <Text style={{ fontFamily: font, fontSize: fontSize * 0.9, color: c.accent, writingDirection: 'rtl' }}>
                      {`سُورَةُ ${getSurah(line[1]).name}`}
                    </Text>
                  </View>
                </View>
              );
            }
            if (line[0] === 'b') {
              return (
                <View key={i} style={[styles.lineBox, { height: lineH }]}>
                  <Text style={{ fontFamily: font, fontSize, color: c.text, writingDirection: 'rtl' }}>{BASMALA}</Text>
                </View>
              );
            }
            const justify = !isOpening && widths[i] >= maxW * 0.6;
            return (
              <View
                key={i}
                style={[
                  styles.wordLine,
                  {
                    flexDirection: ARABIC_DIR.row,
                    height: lineH,
                    justifyContent: justify ? 'space-between' : 'center',
                    columnGap: justify ? fontSize * WORD_GAP_EM : fontSize * 0.3,
                  },
                ]}>
                {words.map((w, k) => renderWord(w, k, fontSize, lineH))}
              </View>
            );
          })}
      </View>
      )}

      {!widths && (
        <View style={[styles.measureLayer, { pointerEvents: 'none' }]}>
          {lines.map(({ line, words }, i) =>
            line[0] === 'w' ? (
              <View
                key={i}
                style={[styles.measureRow, { flexDirection: ARABIC_DIR.row, columnGap: MEASURE_FONT * WORD_GAP_EM }]}
                onLayout={(e) => onMeasure(i, e.nativeEvent.layout.width)}>
                {words.map((w, k) => (
                  <View key={k} style={[styles.word, { flexDirection: ARABIC_DIR.row }]}>
                    {w.text !== '' && <Text style={{ fontFamily: font, fontSize: MEASURE_FONT }}>{w.text}</Text>}
                    {w.end && <View style={{ width: MEASURE_FONT * 1.2, height: 1 }} />}
                  </View>
                ))}
              </View>
            ) : null
          )}
        </View>
      )}

      <View style={[styles.margin, styles.footer, { height: footerH }]}>
        {showMargins && <Text style={[styles.marginText, { color: c.textSecondary }]}>{toArabicDigits(page)}</Text>}
      </View>
    </Pressable>
  );
}

export const MushafPage = memo(MushafPageView);

const styles = StyleSheet.create({
  page: { paddingTop: 4 },
  margin: { justifyContent: 'space-between', alignItems: 'center' },
  footer: { justifyContent: 'center' },
  marginText: { fontSize: 13, writingDirection: 'rtl' },
  body: { justifyContent: 'flex-start' },
  bodyCentered: { justifyContent: 'center' },
  lineBox: { alignItems: 'center', justifyContent: 'center' },
  surahHeader: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 28,
    paddingVertical: 1,
    minWidth: '70%',
    alignItems: 'center',
  },
  wordLine: { alignItems: 'center' },
  word: { alignItems: 'center' },
  measureLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4000, // عريض كفاية إن السطر ما يتكسرش أثناء القياس
    opacity: 0,
  },
  measureRow: { alignSelf: 'flex-start' },
  ayahMark: { borderWidth: 1.2, alignItems: 'center', justifyContent: 'center' },
});
