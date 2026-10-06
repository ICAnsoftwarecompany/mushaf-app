/** اختيار القارئ */
import { router } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { Screen } from '@/components/screen';
import { Icon, Row, Txt } from '@/components/ui';
import { RECITERS } from '@/features/audio/reciters';
import { useI18n } from '@/i18n';
import { useSettings } from '@/store/settings-store';
import { useMushafTheme } from '@/theme/ThemeContext';

export default function ReciterScreen() {
  const { t, lang } = useI18n();
  const { theme } = useMushafTheme();
  const { settings, update } = useSettings();
  const c = theme.colors;
  return (
    <Screen title={t('reciter')} subtitle="EveryAyah.com" back>
      <FlatList
        data={RECITERS}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => {
          const sel = item.id === settings.reciter;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: sel }}
              onPress={() => {
                update({ reciter: item.id });
                router.back();
              }}>
              {({ pressed }) => (
                <Row style={[styles.row, { borderColor: c.border }, pressed ? { backgroundColor: c.highlight } : {}]}>
                  <Txt size={16} weight={sel ? 'bold' : 'normal'} style={{ flex: 1 }}>
                    {lang === 'ar' ? item.ar : item.en}
                  </Txt>
                  {sel ? <Icon name="check" size={20} color={c.accent} /> : null}
                </Row>
              )}
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { gap: 10, paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth },
});
