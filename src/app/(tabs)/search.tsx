/**
 * البحث في نص القرآن (أوفلاين) — من غير تشكيل، وبيتجاهل اختلاف أشكال الألف والياء
 */
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import React, { useDeferredValue, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { rtlText, Screen } from '@/components/screen';
import { BottomTabInset, QuranFont } from '@/constants/theme';
import { ayahNumber, ayahs, pageOfAyah, surahOfAyah, toArabicDigits } from '@/data/quran';
import { searchQuran } from '@/data/quran/search';
import { useMushafTheme } from '@/theme/ThemeContext';

export default function SearchScreen() {
  const { theme } = useMushafTheme();
  const c = theme.colors;
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const { results, total } = useMemo(() => searchQuran(deferred), [deferred]);

  return (
    <Screen title="البحث" subtitle="ابحث بكلمة أو جزء من آية">
      <View style={styles.inputWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="مثال: الرحمن الرحيم"
          placeholderTextColor={c.textSecondary}
          autoCorrect={false}
          returnKeyType="search"
          style={[styles.input, { color: c.text, backgroundColor: c.surface, borderColor: c.border }]}
        />
        {deferred.trim().length >= 2 && (
          <Text style={[styles.count, { color: c.textSecondary }]}>
            {total === 0
              ? 'مفيش نتائج'
              : total > results.length
                ? `${toArabicDigits(total)} نتيجة (أول ${toArabicDigits(results.length)})`
                : `${toArabicDigits(total)} نتيجة`}
          </Text>
        )}
      </View>

      <FlashList
        data={results}
        keyExtractor={(id) => String(id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        renderItem={({ item: id }) => (
          <Pressable
            onPress={() =>
              router.push({ pathname: '/mushaf/[page]', params: { page: String(pageOfAyah(id)), ayah: String(id) } })
            }
            style={({ pressed }) => [styles.result, { borderColor: c.border }, pressed && { backgroundColor: c.highlight }]}>
            <Text style={[styles.ref, { color: c.accent }]}>
              {`${surahOfAyah(id).name} · آية ${toArabicDigits(ayahNumber(id))} · صفحة ${toArabicDigits(pageOfAyah(id))}`}
            </Text>
            <Text style={[styles.ayah, { color: c.text }]} numberOfLines={3}>
              {ayahs[id - 1]}
            </Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  inputWrap: { paddingHorizontal: 16, gap: 6, paddingBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    ...rtlText,
  },
  count: { fontSize: 13, ...rtlText },
  list: { paddingBottom: BottomTabInset + 24 },
  result: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 4 },
  ref: { fontSize: 13, fontWeight: '600', ...rtlText },
  ayah: { fontFamily: QuranFont, fontSize: 21, lineHeight: 38, ...rtlText },
});
