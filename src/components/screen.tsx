/**
 * غلاف موحّد لشاشات التابات: خلفية الثيم + عنوان + مسافة آمنة.
 */
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth } from '@/constants/theme';
import { useMushafTheme } from '@/theme/ThemeContext';

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function Screen({ title, subtitle, children }: Props) {
  const { theme } = useMushafTheme();
  const c = theme.colors;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: c.background }]}
      edges={Platform.OS === 'web' ? [] : ['top']}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text> : null}
        </View>
        <View style={styles.content}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

export const rtlText = { textAlign: 'right', writingDirection: 'rtl' } as const;

const styles = StyleSheet.create({
  safe: { flex: 1 },
  inner: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 2 },
  title: { fontSize: 28, fontWeight: '700', ...rtlText },
  subtitle: { fontSize: 14, ...rtlText },
  content: { flex: 1 },
});
