/**
 * شاشة قراءة المصحف: /mushaf/[page]?ayah=<رقم الآية العام>
 * - تقليب الصفحات من اليمين للشمال
 * - ضغطة على الصفحة بتظهر/تخفي شريط الأدوات
 * - ضغطة على آية بتحددها (علامة / مشاركة)
 * - آخر صفحة بتتحفظ تلقائيًا
 */
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { type LayoutChangeEvent, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MushafPage } from '@/components/mushaf/mushaf-page';
import { PagePager } from '@/components/mushaf/page-pager';
import {
  ayahNumber,
  ayahs,
  JUZ_NAMES,
  juzOfPage,
  pageOfAyah,
  surahOfAyah,
  surahsOfPage,
  toArabicDigits,
  TOTAL_PAGES,
} from '@/data/quran';
import { useReading } from '@/store/reading-store';
import { useMushafTheme } from '@/theme/ThemeContext';
import { ROW, rtlText } from '@/constants/rtl';

/** نسبة عرض لارتفاع صفحة المصحف تقريبًا — بنستخدمها على الشاشات العريضة (الويب والتابلت) */
const PAGE_ASPECT = 0.66;

/** نسخة الويب: بنبني صفحة HTML لكل صفحة من الـ 604 وقت البناء، علشان أي لينك زي /mushaf/50 يفتح مباشرة */
export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return Array.from({ length: TOTAL_PAGES }, (_, i) => ({ page: String(i + 1) }));
}

export default function MushafScreen() {
  const params = useLocalSearchParams<{ page: string; ayah?: string }>();
  const initialAyah = params.ayah ? Number(params.ayah) : null;
  const initialPage = clampPage(Number(params.page) || (initialAyah ? pageOfAyah(initialAyah) : 1));

  const { theme } = useMushafTheme();
  const c = theme.colors;
  const { setLastPage, isPageBookmarked, togglePageBookmark, addAyahBookmark } = useReading();

  const [page, setPage] = useState(initialPage);
  const [selectedAyah, setSelectedAyah] = useState<number | null>(initialAyah);
  const [chrome, setChrome] = useState(true);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setLastPage(page);
  }, [page, setLastPage]);

  // شريط الأدوات بيظهر أول ما الشاشة تفتح وبعدين يختفي علشان الصفحة تبان كاملة
  useEffect(() => {
    const t = setTimeout(() => setChrome(false), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 1800);
    return () => clearTimeout(t);
  }, [notice]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width: Math.min(width, height * PAGE_ASPECT), height });
  };

  const onPageChange = useCallback((p: number) => {
    setPage(p);
    setSelectedAyah(null);
  }, []);

  const onAyahPress = useCallback((id: number) => {
    setSelectedAyah((cur) => (cur === id ? null : id));
  }, []);

  const toggleChrome = useCallback(() => {
    setSelectedAyah(null);
    setChrome((v) => !v);
  }, []);

  const renderPage = useCallback(
    (p: number) =>
      size ? (
        <MushafPage
          page={p}
          width={size.width}
          height={size.height}
          selectedAyah={p === page ? selectedAyah : null}
          onAyahPress={onAyahPress}
          onBackgroundPress={toggleChrome}
        />
      ) : null,
    [size, page, selectedAyah, onAyahPress, toggleChrome]
  );

  const surah = surahsOfPage(page)[0];
  const bookmarked = isPageBookmarked(page);

  const shareAyah = async (id: number) => {
    const s = surahOfAyah(id);
    await Share.share({ message: `${ayahs[id - 1]}\n[${s.name}: ${toArabicDigits(ayahNumber(id))}]` });
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
      <View style={styles.pagerArea} onLayout={onLayout}>
        {size && <PagePager initialPage={initialPage} onPageChange={onPageChange} renderPage={renderPage} />}
      </View>

      {chrome && (
        <View style={[styles.topBar, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={12}>
            <Text style={[styles.action, { color: c.accent }]}>رجوع</Text>
          </Pressable>
          <View style={styles.titleBox}>
            <Text style={[styles.title, { color: c.text }]}>{surah.name}</Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>
              {`الجزء ${JUZ_NAMES[juzOfPage(page) - 1]} · صفحة ${toArabicDigits(page)}`}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              togglePageBookmark(page);
              setNotice(bookmarked ? 'اتشالت العلامة' : 'اتحفظت الصفحة في العلامات');
            }}
            hitSlop={12}>
            <Text style={[styles.action, { color: c.accent }]}>{bookmarked ? '★ علامة' : '☆ علامة'}</Text>
          </Pressable>
        </View>
      )}

      {selectedAyah !== null && (
        <View style={[styles.ayahBar, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.ayahLabel, { color: c.text }]}>
            {`${surahOfAyah(selectedAyah).name} · آية ${toArabicDigits(ayahNumber(selectedAyah))}`}
          </Text>
          <View style={styles.ayahActions}>
            <Pressable
              onPress={() => {
                addAyahBookmark(selectedAyah, page);
                setNotice('اتحفظت الآية في العلامات');
              }}>
              <Text style={[styles.action, { color: c.accent }]}>علامة</Text>
            </Pressable>
            {Platform.OS !== 'web' && (
              <Pressable onPress={() => shareAyah(selectedAyah)}>
                <Text style={[styles.action, { color: c.accent }]}>مشاركة</Text>
              </Pressable>
            )}
            <Pressable onPress={() => setSelectedAyah(null)}>
              <Text style={[styles.action, { color: c.textSecondary }]}>إغلاق</Text>
            </Pressable>
          </View>
        </View>
      )}

      {notice && (
        <View style={[styles.notice, { backgroundColor: c.text }]} pointerEvents="none">
          <Text style={{ color: c.background }}>{notice}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function clampPage(p: number) {
  return Math.min(TOTAL_PAGES, Math.max(1, Math.round(p)));
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  pagerArea: { flex: 1, alignItems: 'center' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleBox: { alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  action: { fontSize: 15, fontWeight: '600' },
  ayahBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  ayahLabel: { fontSize: 15, fontWeight: '600', ...rtlText },
  ayahActions: { flexDirection: ROW, gap: 24 },
  notice: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
