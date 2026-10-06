/** اختيار طريقة حساب مواقيت الصلاة */
import { router } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { Screen } from '@/components/screen';
import { Icon, Row, Txt } from '@/components/ui';
import { METHODS, resolveMethod } from '@/features/prayer/prayer';
import { useI18n } from '@/i18n';
import { type CalcMethodId, useSettings } from '@/store/settings-store';
import { useMushafTheme } from '@/theme/ThemeContext';

export default function MethodScreen() {
  const { t } = useI18n();
  const { theme } = useMushafTheme();
  const { settings, update } = useSettings();
  const c = theme.colors;
  const all: CalcMethodId[] = ['auto', ...METHODS];
  return (
    <Screen title={t('calcMethod')} back>
      <FlatList
        data={all}
        keyExtractor={(m) => m}
        renderItem={({ item }) => {
          const sel = item === settings.method;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: sel }}
              onPress={() => {
                update({ method: item });
                router.back();
              }}>
              {({ pressed }) => (
                <Row style={[styles.row, { borderColor: c.border }, pressed ? { backgroundColor: c.highlight } : {}]}>
                  <Txt size={16} weight={sel ? 'bold' : 'normal'} style={{ flex: 1 }}>
                    {item === 'auto' ? `${t('method_auto')} (${t(`method_${resolveMethod({ ...settings, method: 'auto' })}`)})` : t(`method_${item}`)}
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
