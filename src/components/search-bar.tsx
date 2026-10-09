/** خانة بحث صغيرة بتظهر تحت عنوان الشاشة (الأذكار والاستماع) — البحث كله على الجهاز */
import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useMushafTheme } from '@/theme/ThemeContext';

export function SearchBar({ value, onChange, placeholder, onClose }: { value: string; onChange: (v: string) => void; placeholder: string; onClose: () => void }) {
  const { t, dir } = useI18n();
  const { theme } = useMushafTheme();
  const c = theme.colors;
  return (
    <View style={[styles.box, { backgroundColor: c.surface, borderColor: c.accent }]}>
      <Icon name="search" size={18} color={c.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.textSecondary}
        autoFocus
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={placeholder}
        style={[styles.input, { color: c.text, textAlign: dir.start }]}
      />
      <Pressable
        onPress={() => (value ? onChange('') : onClose())}
        accessibilityRole="button"
        accessibilityLabel={value ? t('clear') : t('close')}
        hitSlop={10}>
        <Icon name="close" size={18} color={c.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, minHeight: 46 },
  input: { flex: 1, fontSize: 16, paddingVertical: 10 },
});
