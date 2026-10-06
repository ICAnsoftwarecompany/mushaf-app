/**
 * تاب الأذكار: الأقسام الأساسية فوق، وبعدها كل أقسام حصن المسلم.
 */
import { router } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Card, Icon, Row, Txt } from '@/components/ui';
import { BottomTabInset } from '@/constants/theme';
import { azkarCategories, featuredCategories } from '@/data/azkar';
import { useI18n } from '@/i18n';
import { useMushafTheme } from '@/theme/ThemeContext';

const open = (id: number) => router.push({ pathname: '/azkar/[id]', params: { id: String(id) } });

export default function AzkarScreen() {
  const { t, isAr, num } = useI18n();
  const { theme } = useMushafTheme();
  const c = theme.colors;

  return (
    <Screen title={t('tabAzkar')} subtitle={isAr ? t('azkarSubtitle') : `${t('azkarSubtitle')} · ${t('azkarArabicOnly')}`}>
      <FlatList
        data={azkarCategories.filter((x) => !featuredCategories.includes(x))}
        keyExtractor={(x) => String(x.id)}
        contentContainerStyle={{ paddingBottom: BottomTabInset + 24 }}
        ListHeaderComponent={
          <View style={styles.grid}>
            {featuredCategories.map((cat) => (
              <Pressable key={cat.id} onPress={() => open(cat.id)} accessibilityRole="button" style={styles.tile}>
                {({ pressed }) => (
                  <Card style={{ alignItems: 'center', gap: 6, opacity: pressed ? 0.75 : 1, minHeight: 96, justifyContent: 'center' }}>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16, paddingTop: 4 },
  tile: { width: '48%', flexGrow: 1 },
  row: { gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
});
