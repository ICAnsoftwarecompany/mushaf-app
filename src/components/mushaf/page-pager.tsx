/**
 * تقليب صفحات المصحف (أندرويد و iOS) بقائمة أفقية بتقف عند كل صفحة.
 * الاتجاه من اليمين للشمال: الصفحة الجاية على الشمال زي المصحف الورقي.
 *
 * ليه مش PagerView؟ على أندرويد كانت الصفحة بتظهر فاضية لحد ما المستخدم يلمس الشاشة،
 * لأن محتوى الصفحة بيترسم بعد ما الصفحة نفسها تتضاف. FlatList ما عندهاش المشكلة دي.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, type LayoutChangeEvent, StyleSheet, View, type ViewToken } from 'react-native';

import { IS_RTL_LAYOUT } from '@/constants/rtl';
import { TOTAL_PAGES } from '@/data/quran';

export interface PagePagerProps {
  initialPage: number; // 1..604
  onPageChange: (page: number) => void;
  renderPage: (page: number) => React.ReactNode;
}

const PAGE_NUMBERS = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);

/**
 * لو تخطيط الجهاز LTR بنقلب القائمة علشان الصفحة الجاية تبقى على الشمال.
 * لو الجهاز عربي (RTL) القائمة الأفقية بتتقلب لوحدها.
 */
const INVERTED = !IS_RTL_LAYOUT;

export function PagePager({ initialPage, onPageChange, renderPage }: PagePagerProps) {
  const [width, setWidth] = useState(0);
  const current = useRef(initialPage);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken<number>[] }) => {
    const page = viewableItems[0]?.item;
    if (typeof page === 'number' && page !== current.current) {
      current.current = page;
      onPageChange(page);
    }
  }).current;

  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 60 }), []);

  const getItemLayout = useCallback(
    (_: ArrayLike<number> | null | undefined, index: number) => ({ length: width, offset: width * index, index }),
    [width]
  );

  const renderItem = useCallback(
    ({ item }: { item: number }) => <View style={[styles.page, { width }]}>{renderPage(item)}</View>,
    [width, renderPage]
  );

  return (
    <View style={styles.container} onLayout={onLayout}>
      {width > 0 && (
        <FlatList
          data={PAGE_NUMBERS}
          keyExtractor={String}
          renderItem={renderItem}
          horizontal
          inverted={INVERTED}
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          getItemLayout={getItemLayout}
          initialScrollIndex={initialPage - 1}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignSelf: 'stretch' },
  page: { flex: 1, alignItems: 'center' },
});
