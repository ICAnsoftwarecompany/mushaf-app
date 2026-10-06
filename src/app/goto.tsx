/**
 * الانتقال السريع: لصفحة برقمها، أو لآية بالسورة والرقم.
 */
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Btn, Card, Row, Segmented, Txt } from '@/components/ui';
import { getSurah, pageOfAyah, surahLabel, surahs, TOTAL_PAGES } from '@/data/quran';
import { normalizeArabic } from '@/data/quran/search';
import { useI18n } from '@/i18n';
import { useMushafTheme } from '@/theme/ThemeContext';

/** أرقام عربية أو إنجليزية → رقم */
const parseNum = (s: string) => Number(s.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[^0-9]/g, ''));

export default function GoToScreen() {
  const { t, lang, dir } = useI18n();
  const { theme } = useMushafTheme();
  const c = theme.colors;
  const [mode, setMode] = useState<'page' | 'ayah'>('page');
  const [page, setPage] = useState('');
  const [query, setQuery] = useState('');
  const [surah, setSurah] = useState<number | null>(null);
  const [ayah, setAyah] = useState('');
  const [error, setError] = useState<string | null>(null);

  const input = [styles.input, { color: c.text, backgroundColor: c.background, borderColor: c.border, textAlign: dir.start }];

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return surahs;
    const n = parseNum(q);
    return surahs.filter(
      (s) => (n && s.id === n) || normalizeArabic(s.name).includes(normalizeArabic(q)) || s.nameEn.toLowerCase().includes(q.toLowerCase())
    );
  }, [query]);

  const goPage = () => {
    const p = parseNum(page);
    if (!(p >= 1 && p <= TOTAL_PAGES)) return setError(t('invalidPage'));
    router.replace({ pathname: '/mushaf/[page]', params: { page: String(p) } });
  };

  const goAyah = () => {
    if (!surah) return;
    const s = getSurah(surah);
    const a = parseNum(ayah) || 1;
    if (a < 1 || a > s.ayahs) return setError(t('invalidAyah', { n: s.ayahs }));
    const id = s.firstAyah + a - 1;
    router.replace({ pathname: '/mushaf/[page]', params: { page: String(pageOfAyah(id)), ayah: String(id) } });
  };

  return (
    <Screen title={t('goToTitle')} back>
      <View style={styles.body}>
        <Segmented
          value={mode}
          onChange={(m) => {
            setMode(m);
            setError(null);
          }}
          options={[
            { value: 'page', label: t('goToPage') },
            { value: 'ayah', label: t('goToAyah') },
          ]}
        />

        {mode === 'page' ? (
          <Card style={{ gap: 10 }}>
            <Txt size={14} color="textSecondary">
              {t('pageNumber')}
            </Txt>
            <TextInput
              value={page}
              onChangeText={(v) => {
                setPage(v);
                setError(null);
              }}
              keyboardType="number-pad"
              returnKeyType="go"
              onSubmitEditing={goPage}
              autoFocus
              style={input}
              accessibilityLabel={t('pageNumber')}
            />
            <Btn title={t('go')} onPress={goPage} />
          </Card>
        ) : surah ? (
          <Card style={{ gap: 10 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt size={17} weight="bold">
                {surahLabel(getSurah(surah), lang)}
              </Txt>
              <Pressable onPress={() => setSurah(null)} hitSlop={8}>
                <Txt size={14} color="accent">
                  {t('chooseSurah')}
                </Txt>
              </Pressable>
            </Row>
            <Txt size={14} color="textSecondary">{`${t('ayahNumber')} (1–${getSurah(surah).ayahs})`}</Txt>
            <TextInput
              value={ayah}
              onChangeText={(v) => {
                setAyah(v);
                setError(null);
              }}
              keyboardType="number-pad"
              returnKeyType="go"
              onSubmitEditing={goAyah}
              autoFocus
              style={input}
              accessibilityLabel={t('ayahNumber')}
            />
            <Btn title={t('go')} onPress={goAyah} />
          </Card>
        ) : (
          <View style={{ flex: 1, gap: 8 }}>
            <TextInput value={query} onChangeText={setQuery} placeholder={t('chooseSurah')} placeholderTextColor={c.textSecondary} style={input} />
            <FlatList
              data={filtered}
              keyExtractor={(s) => String(s.id)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable onPress={() => setSurah(item.id)} accessibilityRole="button">
                  {({ pressed }) => (
                    <Row style={[styles.surahRow, { borderColor: c.border }, pressed ? { backgroundColor: c.highlight } : {}]}>
                      <Txt size={13} color="accent" style={{ width: 36 }} align="center">
                        {lang === 'ar' ? String(item.id).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]) : String(item.id)}
                      </Txt>
                      <Txt size={16} style={{ flex: 1 }}>
                        {surahLabel(item, lang)}
                      </Txt>
                    </Row>
                  )}
                </Pressable>
              )}
            />
          </View>
        )}

        {error ? (
          <Txt size={14} color="#C0392B" align="center">
            {error}
          </Txt>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: 16, gap: 14 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18 },
  surahRow: { gap: 10, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
});
