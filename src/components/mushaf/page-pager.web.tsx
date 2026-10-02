/**
 * تقليب الصفحات على الويب (PagerView مش بيشتغل على الويب):
 * أزرار + أسهم الكيبورد. السهم الشمال = الصفحة الجاية زي المصحف.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TOTAL_PAGES } from '@/data/quran';
import { useMushafTheme } from '@/theme/ThemeContext';

import type { PagePagerProps } from './page-pager';

export function PagePager({ initialPage, onPageChange, renderPage }: PagePagerProps) {
  const [page, setPage] = useState(initialPage);
  const { theme } = useMushafTheme();

  const go = (p: number) => {
    const next = Math.min(TOTAL_PAGES, Math.max(1, p));
    if (next === page) return;
    setPage(next);
    onPageChange(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(page + 1);
      if (e.key === 'ArrowRight') go(page - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <View style={styles.container}>
      <View style={styles.page}>{renderPage(page)}</View>
      <Pressable
        onPress={() => go(page + 1)}
        disabled={page === TOTAL_PAGES}
        accessibilityLabel="الصفحة التالية"
        style={[styles.arrow, styles.left, { backgroundColor: theme.colors.surface, opacity: page === TOTAL_PAGES ? 0.3 : 0.9 }]}>
        <Text style={[styles.arrowText, { color: theme.colors.accent }]}>‹</Text>
      </Pressable>
      <Pressable
        onPress={() => go(page - 1)}
        disabled={page === 1}
        accessibilityLabel="الصفحة السابقة"
        style={[styles.arrow, styles.right, { backgroundColor: theme.colors.surface, opacity: page === 1 ? 0.3 : 0.9 }]}>
        <Text style={[styles.arrowText, { color: theme.colors.accent }]}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
