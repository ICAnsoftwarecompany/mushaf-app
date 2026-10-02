/**
 * تقليب صفحات المصحف (أندرويد و iOS).
 * الاتجاه من اليمين للشمال: الصفحة الجاية على الشمال زي المصحف الورقي.
 * بنرسم الصفحة الحالية واللي جنبها بس علشان الأداء (604 صفحة).
 */
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';

import { TOTAL_PAGES } from '@/data/quran';

export interface PagePagerProps {
  initialPage: number; // 1..604
  onPageChange: (page: number) => void;
  renderPage: (page: number) => React.ReactNode;
}

const PAGE_NUMBERS = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);
const WINDOW = 1;

export function PagePager({ initialPage, onPageChange, renderPage }: PagePagerProps) {
  const [current, setCurrent] = useState(initialPage);

  const handleSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      const page = e.nativeEvent.position + 1;
      setCurrent(page);
      onPageChange(page);
    },
    [onPageChange]
  );

  return (
    <PagerView
      style={styles.pager}
      initialPage={initialPage - 1}
      layoutDirection="rtl"
      offscreenPageLimit={1}
      onPageSelected={handleSelected}>
      {PAGE_NUMBERS.map((page) => (
        <View key={page} style={styles.page} collapsable={false}>
          {Math.abs(page - current) <= WINDOW ? renderPage(page) : null}
        </View>
      ))}
    </PagerView>
  );
}

const styles = StyleSheet.create({
  pager: { flex: 1 },
  page: { flex: 1 },
});
