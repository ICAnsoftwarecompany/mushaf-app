/**
 * العلامات: الصفحات والآيات المحفوظة (متخزنة على الجهاز)
 */
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ROW, rtlText } from '@/constants/rtl';
import { BottomTabInset, QuranFont } from '@/constants/theme';
import { ayahNumber, ayahs, surahOfAyah, surahsOfPage, toArabicDigits } from '@/data/quran';
import { type Bookmark, useReading } from '@/store/reading-store';
import { useMushafTheme } from '@/theme/ThemeContext';

function formatDate(ms: number) {
  const d = new Date(ms);
  return toArabicDigits(`${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`);
}

export default function BookmarksScreen() {
  const { theme } = useMushafTheme();
  const c = theme.colors;
  const { bookmarks, removeBookmark } = useReading();

  const open = (b: Bookmark) =>
    router.push({
      pathname: '/mushaf/[page]',
      params: b.ayahId ? { page: String(b.page), ayah: String(b.ayahId) } : { page: String(b.page) },
    });

  return (
    <Screen title="العلامات" subtitle="الصفحات والآيات اللي حفظتها">
      {bookmarks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: c.text }]}>مفيش علامات لسه</Text>
          <Text style={[styles.emptyText, { color: c.textSecondary }]}>
            من صفحة المصحف اضغط «علامة» علشان تحفظ الصفحة، أو اضغط على آية واختار «علامة».
          </Text>
        </View>
      ) : (
        <FlashList
          data={bookmarks}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          renderItem={({ item: b }) => (
            <Pressable
              onPress={() => open(b)}
              style={({ pressed }) => [styles.row, { borderColor: c.border }, pressed && { backgroundColor: c.highlight }]}>
              <View style={styles.rowText}>
                <Text style={[styles.title, { color: c.text }]}>
                  {b.ayahId
                    ? `${surahOfAyah(b.ayahId).name} · آية ${toArabicDigits(ayahNumber(b.ayahId))}`
                    : `سورة ${surahsOfPage(b.page)[0].name}`}
                </Text>
                {b.ayahId ? (
                  <Text style={[styles.ayah, { color: c.text }]} numberOfLines={2}>
                    {ayahs[b.ayahId - 1]}
                  </Text>
                ) : null}
                <Text style={[styles.meta, { color: c.textSecondary }]}>
                  {`صفحة ${toArabicDigits(b.page)} · ${formatDate(b.createdAt)}`}
                </Text>
              </View>
              <Pressable onPress={() => removeBookmark(b.id)} hitSlop={10} accessibilityLabel="حذف العلامة">
                <Text style={{ color: c.textSecondary, fontSize: 14 }}>حذف</Text>
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: BottomTabInset + 24 },
  empty: { padding: 32, gap: 8, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22, writingDirection: 'rtl' },
  row: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1, gap: 4 },
  title: { fontSize: 16, fontWeight: '600', ...rtlText },
  ayah: { fontFamily: QuranFont, fontSize: 19, lineHeight: 34, ...rtlText },
  meta: { fontSize: 12, ...rtlText },
});
