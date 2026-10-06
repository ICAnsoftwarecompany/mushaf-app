/**
 * شاشة قراءة المصحف: /mushaf/[page]?ayah=<رقم الآية العام>
 * - وضعين: صفحات المصحف (15 سطر) أو نص متصل (خط أكبر + ترجمة المعاني)
 * - صفحتين جنب بعض على الشاشات العريضة (تابلت/وضع أفقي/كمبيوتر)
 * - ضغطة على آية: علامة، نسخ، مشاركة، تفسير، استماع
 * - التلاوة بتظلّل الآية وتقلّب الصفحة لوحدها
 * - آخر صفحة بتتحفظ تلقائيًا، والشاشة بتفضل منورة (لو مفعّل)
 */
import * as Clipboard from 'expo-clipboard';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { type LayoutChangeEvent, Platform, Pressable, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioBar } from '@/components/mushaf/audio-bar';
import { MushafPage } from '@/components/mushaf/mushaf-page';
import { PagePager } from '@/components/mushaf/page-pager';
import { TafsirSheet } from '@/components/mushaf/tafsir-sheet';
import { TextReader } from '@/components/mushaf/text-reader';
import { Icon, type IconName, Row, Txt, useHaptic } from '@/components/ui';
import {
  ayahNumber,
  ayahs,
  firstAyahOfPage,
  juzLabel,
  juzOfPage,
  pageOfAyah,
  surahLabel,
  surahOfAyah,
  surahsOfPage,
  TOTAL_PAGES,
} from '@/data/quran';
import { getTranslation } from '@/data/quran/extra';
import { useAudio } from '@/features/audio/audio-store';
import { ARABIC_DIR, useI18n } from '@/i18n';
import { useReading } from '@/store/reading-store';
import { useSettings } from '@/store/settings-store';
import { useMushafTheme } from '@/theme/ThemeContext';

/** نسبة عرض لارتفاع صفحة المصحف تقريبًا */
const PAGE_ASPECT = 0.66;

/** نسخة الويب: بنبني صفحة HTML لكل صفحة من الـ 604 وقت البناء، علشان أي لينك زي /mushaf/50 يفتح مباشرة */
export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return Array.from({ length: TOTAL_PAGES }, (_, i) => ({ page: String(i + 1) }));
}

const clampPage = (p: number) => Math.min(TOTAL_PAGES, Math.max(1, Math.round(p)));

export default function MushafScreen() {
  const params = useLocalSearchParams<{ page: string; ayah?: string }>();
  const initialAyah = params.ayah ? Number(params.ayah) : null;
  const initialPage = clampPage(Number(params.page) || (initialAyah ? pageOfAyah(initialAyah) : 1));

  const { theme, tajweedEnabled } = useMushafTheme();
  const c = theme.colors;
  const { t, lang, dir } = useI18n();
  const { settings, update } = useSettings();
  const { setLastPage, isPageBookmarked, togglePageBookmark, addAyahBookmark } = useReading();
  const audio = useAudio();
  const haptic = useHaptic();

  const [page, setPage] = useState(initialPage);
  const [selectedAyah, setSelectedAyah] = useState<number | null>(initialAyah);
  const [chrome, setChrome] = useState(true);
  const [area, setArea] = useState<{ width: number; height: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tafsirAyah, setTafsirAyah] = useState<number | null>(null);
  const [translation, setTranslation] = useState<string[] | null>(null);

  const textMode = settings.mushafMode === 'text';
  const spread = !!area && area.width > area.height * 1.15; // صفحتين جنب بعض

  useEffect(() => {
    setLastPage(page);
  }, [page, setLastPage]);

  // الشاشة منورة أثناء القراءة
  useEffect(() => {
    if (!settings.keepAwake || Platform.OS === 'web') return;
    activateKeepAwakeAsync('reader').catch(() => {});
    return () => {
      deactivateKeepAwake('reader').catch(() => {});
    };
  }, [settings.keepAwake]);

  // شريط الأدوات بيظهر أول ما الشاشة تفتح وبعدين يختفي
  useEffect(() => {
    const id = setTimeout(() => setChrome(false), 2500);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 1800);
    return () => clearTimeout(id);
  }, [notice]);

  // ترجمة المعاني تحت الآيات في وضع النص المتصل (بتتحمّل مرة واحدة)
  const showTranslation = textMode && (settings.showTranslation || lang === 'en');
  useEffect(() => {
    if (!showTranslation || translation) return;
    let alive = true;
    getTranslation()
      .then((tr) => alive && setTranslation(tr))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [showTranslation, translation]);

  // التلاوة بتقلّب الصفحة لوحدها (تحديث الحالة وقت الرسم لما الآية تتغير — نمط React الموصى بيه)
  const [lastAudioAyah, setLastAudioAyah] = useState<number | null>(audio.ayahId);
  if (audio.ayahId !== lastAudioAyah) {
    setLastAudioAyah(audio.ayahId);
    if (audio.ayahId != null && pageOfAyah(audio.ayahId) !== page) setPage(pageOfAyah(audio.ayahId));
  }

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea({ width, height });
  };

  const onAyahPress = useCallback((id: number) => setSelectedAyah((cur) => (cur === id ? null : id)), []);
  const toggleChrome = useCallback(() => {
    setSelectedAyah(null);
    setChrome((v) => !v);
  }, []);

  // ───── الصفحات: عنصر = صفحة أو صفحتين ─────
  const count = spread ? Math.ceil(TOTAL_PAGES / 2) : TOTAL_PAGES;
  const index = spread ? Math.ceil(page / 2) : page;
  const pageW = area ? (spread ? Math.min(area.width / 2, area.height * PAGE_ASPECT) : Math.min(area.width, area.height * PAGE_ASPECT)) : 0;

  const renderPageView = (p: number) => (
    <MushafPage
      key={p}
      page={p}
      width={pageW}
      height={area!.height}
      selectedAyah={selectedAyah}
      playingAyah={audio.ayahId}
      tajweed={tajweedEnabled}
      bold={settings.mushafBold}
      showMargins={settings.showMargins}
      onAyahPress={onAyahPress}
      onBackgroundPress={toggleChrome}
    />
  );

  const renderItem = (i: number) => {
    if (!area) return null;
    if (!spread) return renderPageView(i);
    const right = i * 2 - 1; // الصفحة الفردية على اليمين
    const left = i * 2;
    return (
      <View style={{ flexDirection: ARABIC_DIR.row, justifyContent: 'center' }}>
        {renderPageView(right)}
        {left <= TOTAL_PAGES ? renderPageView(left) : <View style={{ width: pageW }} />}
      </View>
    );
  };

  const onIndexChange = (i: number) => {
    setSelectedAyah(null);
    setPage(spread ? i * 2 - 1 : i);
  };

  const surah = surahsOfPage(page)[0];
  const bookmarked = isPageBookmarked(page);
  const ref = (id: number) => `${surahOfAyah(id).name}: ${ayahNumber(id)}`;

  const actions: { icon: IconName; label: string; onPress: () => void; hidden?: boolean }[] = selectedAyah
    ? [
        {
          icon: 'play',
          label: t('listen'),
          onPress: () => {
            audio.playFrom(selectedAyah);
            setSelectedAyah(null);
          },
        },
        { icon: 'translate', label: t('tafsir'), onPress: () => setTafsirAyah(selectedAyah) },
        {
          icon: 'bookmark',
          label: t('bookmark'),
          onPress: () => {
            addAyahBookmark(selectedAyah, pageOfAyah(selectedAyah));
            haptic('success');
            setNotice(t('ayahSaved'));
          },
        },
        {
          icon: 'copy',
          label: t('copy'),
          onPress: async () => {
            await Clipboard.setStringAsync(`${ayahs[selectedAyah - 1]}\n[${ref(selectedAyah)}]`);
            haptic();
            setNotice(t('copied'));
          },
        },
        {
          icon: 'share',
          label: t('share'),
          onPress: async () => {
            const message = `${ayahs[selectedAyah - 1]}\n[${ref(selectedAyah)}]`;
            try {
              if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'share' in navigator) {
                await navigator.share({ text: message });
              } else if (Platform.OS === 'web') {
                await Clipboard.setStringAsync(message);
                setNotice(t('copied'));
              } else await Share.share({ message });
            } catch {
              // المستخدم لغى المشاركة
            }
          },
        },
      ]
    : [];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
      <View style={styles.area} onLayout={onLayout}>
        {area &&
          (textMode ? (
            <View style={{ flex: 1, alignSelf: 'stretch' }}>
            <TextReader
              startAyah={selectedAyah ?? firstAyahOfPage(page)}
              selectedAyah={selectedAyah}
              playingAyah={audio.ayahId}
              translation={showTranslation ? translation : null}
              tajweed={tajweedEnabled}
              onAyahPress={onAyahPress}
              onVisibleAyah={(id) => {
                const p = pageOfAyah(id);
                if (p !== page) setPage(p);
              }}
            />
            </View>
          ) : (
            <PagePager key={spread ? 'spread' : 'single'} count={count} index={index} onIndexChange={onIndexChange} renderItem={renderItem} />
          ))}
      </View>

      {(chrome || textMode) && (
        <Row style={[styles.topBar, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('back')}
            style={{ transform: [{ scaleX: dir.rtl ? -1 : 1 }] }}>
            <Icon name="back" size={22} color={c.accent} />
          </Pressable>
          <View style={styles.titleBox}>
            <Txt size={16} weight="bold" align="center">
              {surahLabel(surah, lang)}
            </Txt>
            <Txt size={12} color="textSecondary" align="center">
              {`${juzLabel(juzOfPage(page), lang)} · ${t('pageN', { n: page })}`}
            </Txt>
          </View>
          <Row style={{ gap: 14 }}>
            <Pressable
              onPress={() => update({ mushafMode: textMode ? 'pages' : 'text' })}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={textMode ? t('readingModePages') : t('readingModeText')}>
              <Icon name={textMode ? 'book' : 'list'} size={22} color={c.accent} />
            </Pressable>
            <Pressable
              onPress={() => {
                togglePageBookmark(page);
                haptic('success');
                setNotice(bookmarked ? t('pageRemoved') : t('pageSaved'));
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('bookmark')}>
              <Icon name={bookmarked ? 'bookmark' : 'bookmarkOutline'} size={22} color={c.accent} />
            </Pressable>
          </Row>
        </Row>
      )}

      {selectedAyah !== null && (
        <View style={[styles.ayahBar, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt size={15} weight="bold">
              {`${surahLabel(surahOfAyah(selectedAyah), lang)} · ${t('ayahN', { n: ayahNumber(selectedAyah) })}`}
            </Txt>
            <Pressable onPress={() => setSelectedAyah(null)} hitSlop={10} accessibilityLabel={t('close')}>
              <Icon name="close" size={20} color={c.textSecondary} />
            </Pressable>
          </Row>
          <Row style={{ justifyContent: 'space-around' }}>
            {actions.map((a) => (
              <Pressable key={a.label} onPress={a.onPress} accessibilityRole="button" accessibilityLabel={a.label} style={styles.action}>
                <Icon name={a.icon} size={22} color={c.accent} />
                <Txt size={12} color="accent" align="center">
                  {a.label}
                </Txt>
              </Pressable>
            ))}
          </Row>
        </View>
      )}

      {selectedAyah === null && <AudioBar />}

      {notice && (
        <View style={[styles.notice, { backgroundColor: c.text, pointerEvents: 'none' }]}>
          <Txt size={14} color={c.background} align="center">
            {notice}
          </Txt>
        </View>
      )}

      <TafsirSheet ayahId={tafsirAyah} onClose={() => setTafsirAyah(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  area: { flex: 1, alignItems: 'center' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleBox: { flex: 1, alignItems: 'center' },
  ayahBar: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
  action: { alignItems: 'center', gap: 2, minWidth: 54 },
  notice: { position: 'absolute', bottom: 120, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
});
