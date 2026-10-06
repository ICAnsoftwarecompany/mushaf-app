/**
 * تقليب صفحات المصحف (أندرويد و iOS) بقائمة أفقية بتقف عند كل صفحة.
 * الاتجاه من اليمين للشمال: الصفحة الجاية على الشمال زي المصحف الورقي.
 * «العنصر» ممكن يكون صفحة أو صفحتين جنب بعض (التابلت والوضع الأفقي).
 *
 * ليه مش PagerView؟ على أندرويد كانت الصفحة بتظهر فاضية لحد ما المستخدم يلمس الشاشة،
 * لأن محتوى الصفحة بيترسم بعد ما الصفحة نفسها تتضاف. FlatList ما عندهاش المشكلة دي.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, type LayoutChangeEvent, StyleSheet, View, type ViewToken } from 'react-native';

import { IS_RTL_LAYOUT } from '@/constants/rtl';

export interface PagePagerProps {
  count: number;
  /** العنصر الحالي (1..count) — لو اتغير من برّه بنروحله */
  index: number;
  onIndexChange: (index: number) => void;
  renderItem: (index: number) => React.ReactNode;
  /** false وقت تكبير الصفحة علشان السحب يحرّك الصفحة المكبّرة مش يقلّب */
  scrollEnabled?: boolean;
}

/** لو تخطيط الجهاز LTR بنقلب القائمة علشان العنصر الجاي يبقى على الشمال */
const INVERTED = !IS_RTL_LAYOUT;

export function PagePager({ count, index, onIndexChange, renderItem, scrollEnabled = true }: PagePagerProps) {
  const [width, setWidth] = useState(0);
  const list = useRef<FlatList<number>>(null);
  const current = useRef(index);
  const data = useMemo(() => Array.from({ length: count }, (_, i) => i + 1), [count]);
  const onChange = useRef(onIndexChange);
  useEffect(() => {
    onChange.current = onIndexChange;
  }, [onIndexChange]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  // لازم تفضل نفس الدالة طول عمر القائمة (شرط FlatList)
  const [onViewableItemsChanged] = useState(() => ({ viewableItems }: { viewableItems: ViewToken<number>[] }) => {
    const i = viewableItems[0]?.item;
    if (typeof i === 'number' && i !== current.current) {
      current.current = i;
      onChange.current(i);
    }
  });

  // الانتقال من برّه (التلاوة بتقلّب الصفحة، أو تغيير وضع العرض)
  useEffect(() => {
    if (index !== current.current && width > 0) {
      current.current = index;
      list.current?.scrollToIndex({ index: index - 1, animated: false });
    }
  }, [index, width]);

  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 60 }), []);
  const getItemLayout = useCallback(
    (_: ArrayLike<number> | null | undefined, i: number) => ({ length: width, offset: width * i, index: i }),
    [width]
  );
  const render = useCallback(
    ({ item }: { item: number }) => <View style={[styles.page, { width }]}>{renderItem(item)}</View>,
    [width, renderItem]
  );

  return (
    <View style={styles.container} onLayout={onLayout}>
      {width > 0 && (
        <FlatList
          key={`${count}-${width}`}
          ref={list}
          data={data}
          keyExtractor={String}
          renderItem={render}
          horizontal
          inverted={INVERTED}
          pagingEnabled
          scrollEnabled={scrollEnabled}
          showsHorizontalScrollIndicator={false}
          getItemLayout={getItemLayout}
          initialScrollIndex={Math.min(count, Math.max(1, index)) - 1}
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
