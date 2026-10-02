/**
 * صفحة واحدة من المصحف بنفس ترتيب سطور مصحف المدينة (15 سطر).
 * النص بيتعرض من ayahs.json زي ما هو — الكومبوننت ده بيرتّب الكلمات بس.
 */
import React, { memo, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { QuranFont } from '@/constants/theme';
import {
  ayahNumber,
  ayahs,
  BASMALA,
  getSurah,
  JUZ_NAMES,
  juzOfPage,
  type PageLine,
  pages,
  type Segment,
  surahsOfPage,
  toArabicDigits,
} from '@/data/quran';
import { useMushafTheme } from '@/theme/ThemeContext';

const LINES_PER_PAGE = 15;
const LINE_HEIGHT_FACTOR = 1.75;
/** حجم خط القياس: بنقيس عرض كل سطر بالحجم ده مرة واحدة، وبعدين نكبّر/نصغّر علشان أطول سطر ييجي على عرض الصفحة */
const MEASURE_FONT = 20;
/** أقل مسافة بين الكلمات (نسبة من حجم الخط) */
const WORD_GAP_EM = 0.22;

/** عرض سطور كل صفحة بحجم MEASURE_FONT — مش بيتغير مع الثيم ولا مقاس الشاشة فبنحفظه */
const widthCache = new Map<number, number[]>();

interface Props {
  page: number;
  width: number;
  height: number;
  selectedAyah?: number | null;
  onAyahPress?: (ayahId: number) => void;
  onBackgroundPress?: () => void;
}

interface Word {
  ayahId: number;
  text: string;
  end: boolean; // بعد الكلمة دي علامة نهاية الآية
}

const ayahWords = new Map<number, string[]>();
function wordsOf(ayahId: number): string[] {
  let w = ayahWords.get(ayahId);
  if (!w) {
    w = ayahs[ayahId - 1].split(' ');
    ayahWords.set(ayahId, w);
  }
  return w;
}

function lineWords(line: PageLine): Word[] {
  if (line[0] !== 'w') return [];
  const out: Word[] = [];
  for (const [id, from, to, end] of line.slice(1) as Segment[]) {
    const w = wordsOf(id);
    for (let i = from; i <= to; i++) out.push({ ayahId: id, text: w[i], end: !!end && i === to });
    // علامة نهاية الآية لوحدها في أول السطر
    if (from > to && end) out.push({ ayahId: id, text: '', end: true });
  }
  return out;
}

function MushafPageView({ page, width, height, selectedAyah, onAyahPress, onBackgroundPress }: Props) {
  const { theme } = useMushafTheme();
  const c = theme.colors;
  const data = pages[page - 1];
  const isOpening = page <= 2; // الفاتحة وأول البقرة بيتعرضوا في النص

  const lines = useMemo(() => data.lines.map((line) => ({ line, words: lineWords(line) })), [data]);
  const wordLineCount = useMemo(() => lines.filter((l) => l.line[0] === 'w').length, [lines]);

  const [widths, setWidths] = useState<number[] | null>(() => widthCache.get(page) ?? null);
  const measuring = useRef<number[]>([]);
  const measuredCount = useRef(0);

  const onMeasure = (i: number, w: number) => {
    if (measuring.current[i] === undefined) measuredCount.current++;
    measuring.current[i] = w;
    if (measuredCount.current === wordLineCount) {
      const result = lines.map((_, k) => measuring.current[k] ?? 0);
      widthCache.set(page, result);
      setWidths(result);
    }
  };

  const padX = Math.max(12, width * 0.04);
  const headerH = 28;
  const footerH = 28;
  const textW = width - padX * 2;
  const textH = height - headerH - footerH - 8;
  const lineH = isOpening ? textH / 8.5 : textH / LINES_PER_PAGE;
  const maxW = widths ? Math.max(...widths, 1) : 1;
  const fitFont = (MEASURE_FONT * textW * 0.98) / maxW;
  const fontSize = Math.min(isOpening ? fitFont * 0.8 : fitFont, lineH / LINE_HEIGHT_FACTOR);

  const firstSurah = surahsOfPage(page)[0];
  const juz = juzOfPage(page);

  return (
    <Pressable
      onPress={onBackgroundPress}
      style={[styles.page, { width, height, backgroundColor: c.background, paddingHorizontal: padX }]}>
      <View style={[styles.margin, { height: headerH }]}>
        <Text style={[styles.marginText, { color: c.textSecondary }]}>{`سورة ${firstSurah.name}`}</Text>
        <Text style={[styles.marginText, { color: c.textSecondary }]}>{`الجزء ${JUZ_NAMES[juz - 1]}`}</Text>
      </View>

      <View style={[styles.body, isOpening && styles.bodyCentered, { height: textH }]}>
        {widths && lines.map(({ line, words }, i) => {
          if (line[0] === 'h') {
            return (
              <View key={i} style={[styles.lineBox, { height: lineH }]}>
                <View style={[styles.surahHeader, { borderColor: c.accent, backgroundColor: c.surface }]}>
                  <Text
                    style={{ fontFamily: QuranFont, fontSize: fontSize * 0.9, color: c.accent, writingDirection: 'rtl' }}>
                    {`سُورَةُ ${getSurah(line[1]).name}`}
                  </Text>
                </View>
              </View>
            );
          }
          if (line[0] === 'b') {
            return (
              <View key={i} style={[styles.lineBox, { height: lineH }]}>
                <Text style={{ fontFamily: QuranFont, fontSize, color: c.text, writingDirection: 'rtl' }}>
                  {BASMALA}
                </Text>
              </View>
            );
          }
          const justify = !isOpening && widths[i] >= maxW * 0.6;
          return (
            <View
              key={i}
              style={[
                styles.wordLine,
                { height: lineH, justifyContent: justify ? 'space-between' : 'center', columnGap: justify ? fontSize * WORD_GAP_EM : fontSize * 0.3 },
              ]}>
              {words.map((w, k) => {
                const selected = selectedAyah === w.ayahId;
                return (
                  <Pressable
                    key={k}
                    onPress={() => onAyahPress?.(w.ayahId)}
                    style={[styles.word, selected && { backgroundColor: c.highlight, borderRadius: 4 }]}>
                    {w.text !== '' && (
                      <Text
                        style={{
                          fontFamily: QuranFont,
                          fontSize,
                          lineHeight: lineH,
                          color: c.text,
                          writingDirection: 'rtl',
                        }}>
                        {w.text}
                      </Text>
                    )}
                    {w.end && (
                      <View
                        style={[
                          styles.ayahMark,
                          {
                            width: fontSize * 1.05,
                            height: fontSize * 1.05,
                            borderRadius: fontSize,
                            borderColor: c.accent,
                            marginRight: w.text ? fontSize * 0.15 : 0,
                          },
                        ]}>
                        <Text style={{ fontSize: fontSize * 0.42, color: c.accent, fontWeight: '600' }}>
                          {toArabicDigits(ayahNumber(w.ayahId))}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </View>

      {!widths && (
        <View style={styles.measureLayer} pointerEvents="none">
          {lines.map(({ line, words }, i) =>
            line[0] === 'w' ? (
              <View
                key={i}
                style={[styles.measureRow, { columnGap: MEASURE_FONT * WORD_GAP_EM }]}
                onLayout={(e) => onMeasure(i, e.nativeEvent.layout.width)}>
                {words.map((w, k) => (
                  <View key={k} style={styles.word}>
                    {w.text !== '' && <Text style={{ fontFamily: QuranFont, fontSize: MEASURE_FONT }}>{w.text}</Text>}
                    {w.end && <View style={{ width: MEASURE_FONT * 1.2, height: 1 }} />}
                  </View>
                ))}
              </View>
            ) : null
          )}
        </View>
      )}

      <View style={[styles.margin, styles.footer, { height: footerH }]}>
        <Text style={[styles.marginText, { color: c.textSecondary }]}>{toArabicDigits(page)}</Text>
      </View>
    </Pressable>
  );
}

export const MushafPage = memo(MushafPageView);

const styles = StyleSheet.create({
  page: {
    paddingTop: 4,
  },
  margin: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footer: {
    justifyContent: 'center',
  },
  marginText: {
    fontSize: 13,
    writingDirection: 'rtl',
  },
  body: {
    justifyContent: 'flex-start',
  },
  bodyCentered: {
    justifyContent: 'center',
  },
  lineBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahHeader: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 28,
    paddingVertical: 1,
    minWidth: '70%',
    alignItems: 'center',
  },
  wordLine: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  word: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  measureLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4000, // عريض كفاية إن السطر ما يتكسرش أثناء القياس
    opacity: 0,
  },
  measureRow: {
    flexDirection: 'row-reverse',
    alignSelf: 'flex-start',
  },
  ayahMark: {
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
