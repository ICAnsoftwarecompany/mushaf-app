/**
 * تقليب الصفحات على الويب: أزرار في الركنين + أسهم الكيبورد.
 * السهم الشمال = الصفحة الجاية زي المصحف.
 */
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useMushafTheme } from '@/theme/ThemeContext';

import type { PagePagerProps } from './page-pager';

export function PagePager({ count, index, onIndexChange, renderItem }: PagePagerProps) {
  const { theme } = useMushafTheme();

  const go = (i: number) => {
    const next = Math.min(count, Math.max(1, i));
    if (next !== index) onIndexChange(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') go(index + 1);
      if (e.key === 'ArrowRight') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <View style={styles.container}>
      <View style={styles.page}>{renderItem(index)}</View>
      <Pressable
        onPress={() => go(index + 1)}
        disabled={index === count}
        accessibilityLabel="next"
        style={[styles.arrow, styles.left, { backgroundColor: theme.colors.surface, opacity: index === count ? 0.3 : 0.9 }]}>
        <Text style={[styles.arrowText, { color: theme.colors.accent }]}>‹</Text>
      </Pressable>
      <Pressable
        onPress={() => go(index - 1)}
        disabled={index === 1}
        accessibilityLabel="previous"
        style={[styles.arrow, styles.right, { backgroundColor: theme.colors.surface, opacity: index === 1 ? 0.3 : 0.9 }]}>
        <Text style={[styles.arrowText, { color: theme.colors.accent }]}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignSelf: 'stretch' },
  page: { flex: 1, alignItems: 'center' },
  arrow: {
    position: 'absolute',
    bottom: 4,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  left: { left: 8 },
  right: { right: 8 },
  arrowText: { fontSize: 26, lineHeight: 28, fontWeight: '700' },
});
