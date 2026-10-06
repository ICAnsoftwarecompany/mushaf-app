/**
 * البحث في نص القرآن (أوفلاين) — من غير تشكيل، وبيتجاهل اختلاف أشكال الألف والياء
 */
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import React, { useDeferredValue, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Txt } from '@/components/ui';
import { BottomTabInset } from '@/constants/theme';
import { ayahNumber, ayahs, pageOfAyah, surahLabel, surahOfAyah } from '@/data/quran';
import { searchQuran } from '@/data/quran/search';
import { ARABIC_DIR, useI18n } from '@/i18n';
import { useMushafTheme } from '@/theme/ThemeContext';

export default function SearchScreen() {
  const { theme } = useMushafTheme();
  const { t, lang } = useI18n();
  const c = theme.colors;
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const { results, total } = useMemo(() => searchQuran(deferred), [deferred]);

  return (
    <Screen title={t('tabSearch')} subtitle={t('searchSubtitle')}>
      <View style={styles.inputWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor={c.textSecondary}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel={t('tabSearch')}
          style={[
            styles.input,
            { color: c.text, backgroundColor: c.surface, borderColor: c.border, textAlign: ARABIC_DIR.start, writingDirection: 'rtl' },
          ]}
        />
        {deferred.trim().length >= 2 && (
          <Txt size={13} color="textSecondary">
            {total === 0
              ? t('noResults')
              : total > results.length
                ? t('resultsCountLimited', { n: total, m: results.length })
                : t('resultsCount', { n: total })}
          </Txt>
        )}
      </View>

      <FlashList
        data={results}
        keyExtractor={(id) => String(id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        renderItem={({ item: id }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/mushaf/[page]', params: { page: String(pageOfAyah(id)), ayah: String(id) } })}>
            {({ pressed }) => (
              <View style={[styles.result, { borderColor: c.border }, pressed ? { backgroundColor: c.highlight } : null]}>
                <Txt size={13} weight="medium" color="accent">
                  {`${surahLabel(surahOfAyah(id), lang)} · ${t('ayahN', { n: ayahNumber(id) })} · ${t('pageN', { n: pageOfAyah(id) })}`}
                </Txt>
                <Txt quran size={21} numberOfLines={3}>
                  {ayahs[id - 1]}
                </Txt>
              </View>
            )}
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  inputWrap: { paddingHorizontal: 16, gap: 6, paddingBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 17 },
  list: { paddingBottom: BottomTabInset + 24 },
  result: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 4 },
});
