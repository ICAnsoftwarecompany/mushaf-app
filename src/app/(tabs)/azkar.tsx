/**
 * تاب الأذكار: الأقسام الأساسية فوق، وبعدها كل أقسام حصن المسلم.
 * زرار البحث فوق بيدوّر في أسماء الأقسام ونص الأذكار (بحث مرن على الجهاز — src/lib/fuzzy.ts).
 */
import { router } from 'expo-router';
import React, { useDeferredValue, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { HeaderButton, Screen } from '@/components/screen';
import { SearchBar } from '@/components/search-bar';
import { Card, Icon, Row, Txt } from '@/components/ui';
import { BottomTabInset } from '@/constants/theme';
import { azkarCategories, featuredCategories } from '@/data/azkar';
import { searchAzkar } from '@/data/azkar-search';
import { GAZA_CATEGORY_ID } from '@/data/gaza-duas';
import { useI18n } from '@/i18n';
import { useMushafTheme } from '@/theme/ThemeContext';

const open = (id: number, item?: number) =>
  router.push({
    pathname: '/azkar/[id]',
    params: item === undefined ? { id: String(id) } : { id: String(id), item: String(item) },
  });

const BASE_LIST = azkarCategories.filter((x) => !featuredCategories.includes(x) && x.id !== GAZA_CATEGORY_ID);

export default function AzkarScreen() {
  const { t, isAr, num } = useI18n();
  const { theme } = useMushafTheme();
  const c = theme.colors;
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const q = useDeferredValue(query);
  const results = searching && q.trim() ? searchAzkar(q) : null;

  return (
    <Screen
      title={t('tabAzkar')}
      subtitle={isAr ? t('azkarSubtitle') : `${t('azkarSubtitle')} · ${t('azkarArabicOnly')}`}
      actions={
        <HeaderButton
          icon={searching ? 'close' : 'search'}
          label={t('tabSearch')}
          onPress={() => {
            setSearching((v) => !v);
            setQuery('');
          }}
        />
      }>
      {searching ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <SearchBar value={query} onChange={setQuery} placeholder={t('searchAzkarPlaceholder')} onClose={() => setSearching(false)} />
        </View>
      ) : null}
      {results ? (
        <AzkarResults results={results} />
      ) : (
        <FlatList
          data={BASE_LIST}
          keyExtractor={(x) => String(x.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: BottomTabInset + 24 }}
          ListHeaderComponent={
            searching ? null : (
              <View style={styles.grid}>
                {/* الدعاء لغزة */}
                <Pressable onPress={() => open(GAZA_CATEGORY_ID)} accessibilityRole="button" style={{ width: '100%' }}>
                  {({ pressed }) => (
                    <Card
                      style={{
                        opacity: pressed ? 0.8 : 1,
                        backgroundColor: c.highlight,
                        borderColor: c.accent,
                      }}>
                      <Row style={{ gap: 12 }}>
                        <Icon name="heart" size={26} color={c.accent} />
                        <View style={{ flex: 1, gap: 2 }}>
                          <Txt size={17} weight="bold">
                            {t('gazaDuas')}
                          </Txt>
                          <Txt size={13} color="textSecondary">
                            {t('gazaDuasHint')}
                          </Txt>
                        </View>
                        <Icon name="chevron" size={18} color={c.textSecondary} />
                      </Row>
                    </Card>
                  )}
                </Pressable>
                {featuredCategories.map((cat) => (
                  <Pressable key={cat.id} onPress={() => open(cat.id)} accessibilityRole="button" style={styles.tile}>
                    {({ pressed }) => (
                      <Card
                        style={{
                          alignItems: 'center',
                          gap: 6,
                          opacity: pressed ? 0.75 : 1,
                          minHeight: 96,
                          justifyContent: 'center',
                        }}>
                        <Icon name="sparkles" size={24} color={c.accent} />
                        <Txt arabic size={15} weight="bold" align="center">
                          {cat.name}
                        </Txt>
                      </Card>
                    )}
                  </Pressable>
                ))}
                <Pressable onPress={() => router.push('/tasbih')} accessibilityRole="button" style={{ width: '100%' }}>
                  {({ pressed }) => (
                    <Card style={{ opacity: pressed ? 0.75 : 1 }}>
                      <Row style={{ gap: 10, justifyContent: 'center' }}>
                        <Icon name="tasbih" size={22} color={c.accent} />
                        <Txt size={16} weight="bold">
                          {t('tasbih')}
                        </Txt>
                      </Row>
                    </Card>
                  )}
                </Pressable>
              </View>
            )
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => open(item.id)} accessibilityRole="button">
              {({ pressed }) => (
                <Row style={[styles.row, { borderColor: c.border }, pressed ? { backgroundColor: c.highlight } : {}]}>
                  <Txt arabic size={16} style={{ flex: 1 }}>
                    {item.name}
                  </Txt>
                  <Txt size={13} color="textSecondary">
                    {num(item.items.length)}
                  </Txt>
                </Row>
              )}
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

function AzkarResults({ results }: { results: ReturnType<typeof searchAzkar> }) {
  const { t, num } = useI18n();
  const { theme } = useMushafTheme();
  const c = theme.colors;
  type R =
    | { k: 'cat'; id: number; name: string; n: number }
    | { k: 'zekr'; catId: number; catName: string; index: number; text: string; quran: boolean }
    | { k: 'head'; title: string };
  const rows: R[] = [];
  if (results.cats.length) {
    rows.push({ k: 'head', title: t('azkarSections') });
    results.cats.forEach((x) => rows.push({ k: 'cat', id: x.id, name: x.name, n: x.items.length }));
  }
  if (results.zekrs.length) {
    rows.push({
      k: 'head',
      title: t('azkarMatches', { n: num(results.zekrs.length) }),
    });
    results.zekrs.forEach((z) =>
      rows.push({
        k: 'zekr',
        catId: z.cat.id,
        catName: z.cat.name,
        index: z.index,
        text: z.text,
        quran: z.quran,
      })
    );
  }
  return (
    <FlatList
      data={rows}
      keyExtractor={(r, i) => `${r.k}${i}`}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: BottomTabInset + 24,
        gap: 8,
      }}
      ListEmptyComponent={
        <View style={{ paddingVertical: 40, gap: 6 }}>
          <Txt size={16} weight="bold" align="center">
            {t('noResults')}
          </Txt>
          <Txt size={13} color="textSecondary" align="center">
            {t('searchFlexHint')}
          </Txt>
        </View>
      }
      renderItem={({ item: r }) => {
        if (r.k === 'head')
          return (
            <Txt size={13} weight="bold" color="textSecondary" style={{ marginTop: 8 }}>
              {r.title}
            </Txt>
          );
        if (r.k === 'cat')
          return (
            <Pressable onPress={() => open(r.id)} accessibilityRole="button">
              {({ pressed }) => (
                <Card style={{ opacity: pressed ? 0.8 : 1 }}>
                  <Row style={{ gap: 10 }}>
                    <Icon name="sparkles" size={18} color={c.accent} />
                    <Txt arabic size={16} weight="bold" style={{ flex: 1 }}>
                      {r.name}
                    </Txt>
                    <Txt size={13} color="textSecondary">
                      {num(r.n)}
                    </Txt>
                  </Row>
                </Card>
              )}
            </Pressable>
          );
        return (
          <Pressable onPress={() => open(r.catId, r.index)} accessibilityRole="button">
            {({ pressed }) => (
              <Card style={{ gap: 6, opacity: pressed ? 0.8 : 1 }}>
                <Txt size={12} color="accent" weight="bold">
                  {r.catName}
                </Txt>
                <Txt arabic={!r.quran} quran={r.quran} size={16} numberOfLines={3}>
                  {r.text}
                </Txt>
              </Card>
            )}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 16,
    paddingTop: 4,
  },
  tile: { width: '48%', flexGrow: 1 },
  row: {
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
