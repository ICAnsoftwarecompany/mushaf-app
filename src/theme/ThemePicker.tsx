// ThemePicker.tsx
// شاشة/مكوّن اختيار الثيم: معاينة صغيرة لكل ثيم + خيار "تلقائي" + تشغيل ألوان التجويد
import React from 'react';
import { View, Text, Pressable, StyleSheet, Switch, ScrollView } from 'react-native';
import { themeList, MushafTheme, ThemeMode } from './theme';
import { useMushafTheme } from './ThemeContext';

function ThemeSwatch({
  t,
  selected,
  onPress,
}: {
  t: MushafTheme;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`ثيم ${t.name}`}
      style={[
        styles.swatch,
        {
          backgroundColor: t.colors.background,
          borderColor: selected ? t.colors.accent : t.colors.border,
          borderWidth: selected ? 3 : 1,
        },
      ]}
    >
      <Text style={[styles.sample, { color: t.colors.text }]}>بِسْمِ اللَّهِ</Text>
      <View style={[styles.accentBar, { backgroundColor: t.colors.accent }]} />
      <Text style={[styles.swatchName, { color: t.colors.textSecondary }]}>{t.name}</Text>
    </Pressable>
  );
}

export default function ThemePicker({ children }: { children?: React.ReactNode }) {
  const { theme, mode, setMode, tajweedEnabled, setTajweedEnabled } = useMushafTheme();
  const c = theme.colors;

  const select = (m: ThemeMode) => setMode(m);

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: c.text }]}>المظهر</Text>

      {/* خيار تلقائي حسب إعداد الموبايل */}
      <Pressable
        onPress={() => select('system')}
        style={[
          styles.systemRow,
          {
            backgroundColor: c.surface,
            borderColor: mode === 'system' ? c.accent : c.border,
            borderWidth: mode === 'system' ? 2 : 1,
          },
        ]}
      >
        <Text style={[styles.rowText, { color: c.text }]}>تلقائي (حسب إعداد الموبايل)</Text>
        {mode === 'system' && <Text style={{ color: c.accent, fontSize: 18 }}>✓</Text>}
      </Pressable>

      <View style={styles.grid}>
        {themeList.map((t) => (
          <ThemeSwatch
            key={t.id}
            t={t}
            selected={mode === t.id}
            onPress={() => select(t.id)}
          />
        ))}
      </View>

      <View style={[styles.systemRow, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.rowText, { color: c.text }]}>ألوان التجويد</Text>
        <Switch
          value={tajweedEnabled}
          onValueChange={setTajweedEnabled}
          trackColor={{ true: c.accent, false: c.border }}
        />
      </View>

      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 120 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'right' },
  systemRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  rowText: { fontSize: 16 },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
  },
  swatch: {
    width: '30%',
    aspectRatio: 0.8,
    borderRadius: 12,
    padding: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sample: { fontSize: 18, marginTop: 6 },
  accentBar: { width: '60%', height: 3, borderRadius: 2 },
  swatchName: { fontSize: 13 },
});
