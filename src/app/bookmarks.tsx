/**
 * العلامات: الصفحات والآيات المحفوظة (متخزنة على الجهاز)
 */
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Icon, Row, Txt } from '@/components/ui';
import { ayahNumber, ayahs, surahLabel, surahOfAyah, surahsOfPage } from '@/data/quran';
import { useI18n } from '@/i18n';
import { type Bookmark, useReading } from '@/store/reading-store';
import { useMushafTheme } from '@/theme/ThemeContext';

export default function BookmarksScreen() {
  const { theme } = useMushafTheme();
  const { t, lang, num } = useI18n();
  const c = theme.colors;
  const { bookmarks, removeBookmark } = useReading();

  const open = (b: Bookmark) =>
    router.push({
      pathname: '/mushaf/[page]',
      params: b.ayahId ? { page: String(b.page), ayah: String(b.ayahId) } : { page: String(b.page) },
    });

  const date = (ms: number) => {
    const d = new Date(ms);
    return num(`${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`);
  };

  return (
    <Screen title={t('bookmarks')} subtitle={t('bookmarksSubtitle')} back>
      {bookmarks.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="bookmarkOutline" size={40} color={c.accent} />
          <Txt size={18} weight="bold" align="center">
            {t('noBookmarks')}
          </Txt>
          <Txt size={14} color="textSecondary" align="center" lineHeight={1.6}>
            {t('noBookmarksHint')}
          </Txt>
        </View>
      ) : (
        <FlashList
          data={bookmarks}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item: b }) => (
            <Pressable onPress={() => open(b)} accessibilityRole="button">
              {({ pressed }) => (
                <Row style={[styles.row, { borderColor: c.border }, pressed ? { backgroundColor: c.highlight } : {}]}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Txt size={16} weight="medium">
                      {b.ayahId
                        ? `${surahLabel(surahOfAyah(b.ayahId), lang)} · ${t('ayahN', { n: ayahNumber(b.ayahId) })}`
                        : t('surahName', { name: surahLabel(surahsOfPage(b.page)[0], lang) })}
                    </Txt>
                    {b.ayahId ? (
                      <Txt quran size={19} numberOfLines={2}>
                        {ayahs[b.ayahId - 1]}
                      </Txt>
                    ) : null}
                    <Txt size={12} color="textSecondary">
                      {`${t('pageN', { n: b.page })} · ${date(b.createdAt)}`}
                    </Txt>
                  </View>
                  <Pressable onPress={() => removeBookmark(b.id)} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('delete')}>
                    <Txt size={14} color="textSecondary">
                      {t('delete')}
                    </Txt>
                  </Pressable>
                </Row>
              )}
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { padding: 32, gap: 10, alignItems: 'center' },
  row: { gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
});
