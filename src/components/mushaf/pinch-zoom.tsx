/**
 * التكبير باللمس (بإصبعين) في القارئ:
 * - وضع الصفحات: تكبير الصفحة نفسها (لحد ٣ أضعاف) مع السحب للتنقل جوه الصفحة.
 *   ترتيب السطور بيفضل زي المصحف. التقليب بيقف وقت التكبير، ويرجع لما تصغّر.
 * - وضع النص المتصل: بيغيّر حجم خط المصحف نفسه (نفس إعداد «حجم الخط») ويتحفظ.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const MAX_ZOOM = 3;

export function PinchZoom({
  mode,
  resetKey,
  onZoomedChange,
  fontPreviewRange,
  onFontPinchEnd,
  children,
}: {
  mode: 'visual' | 'font';
  /** لما يتغير (صفحة جديدة) التكبير بيرجع لطبيعته */
  resetKey?: string | number;
  onZoomedChange?: (zoomed: boolean) => void;
  /** وضع الخط: أقل وأكبر نسبة معاينة مسموحة من الحجم الحالي */
  fontPreviewRange?: [number, number];
  onFontPinchEnd?: (scale: number) => void;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const saved = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);
  const w = useSharedValue(0);
  const h = useSharedValue(0);
  const [minF, maxF] = fontPreviewRange ?? [0.6, 2];
  const [zoomed, setZoomedState] = useState(false);
  const setZoomed = useCallback(
    (z: boolean) => {
      setZoomedState(z);
      onZoomedChange?.(z);
    },
    [onZoomedChange]
  );

  // صفحة جديدة أو وضع جديد: نرجّع التكبير لطبيعته
  useEffect(() => {
    scale.set(1);
    saved.set(1);
    tx.set(0);
    ty.set(0);
    const id = setTimeout(() => setZoomed(false), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, mode]);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      if (mode === 'font') {
        scale.set(Math.min(maxF, Math.max(minF, e.scale)));
      } else {
        scale.set(Math.min(MAX_ZOOM, Math.max(1, saved.get() * e.scale)));
      }
    })
    .onEnd(() => {
      if (mode === 'font') {
        const s = scale.get();
        scale.set(withTiming(1, { duration: 120 }));
        if (onFontPinchEnd) scheduleOnRN(onFontPinchEnd, s);
        return;
      }
      if (scale.get() < 1.08) {
        scale.set(withTiming(1));
        tx.set(withTiming(0));
        ty.set(withTiming(0));
        saved.set(1);
        scheduleOnRN(setZoomed, false);
      } else {
        saved.set(scale.get());
        scheduleOnRN(setZoomed, true);
      }
    });

  // السحب جوه الصفحة المكبّرة بس (من غير تكبير السحب للتقليب)
  const pan = Gesture.Pan()
    .enabled(mode === 'visual' && zoomed)
    .minPointers(1)
    .maxPointers(1)
    .onStart(() => {
      savedX.set(tx.get());
      savedY.set(ty.get());
    })
    .onUpdate((e) => {
      if (mode !== 'visual' || saved.get() <= 1) return;
      const limX = ((saved.get() - 1) * w.get()) / 2;
      const limY = ((saved.get() - 1) * h.get()) / 2;
      tx.set(Math.min(limX, Math.max(-limX, savedX.get() + e.translationX)));
      ty.set(Math.min(limY, Math.max(-limY, savedY.get() + e.translationY)));
    });

  const gesture = mode === 'visual' ? Gesture.Simultaneous(pinch, pan) : pinch;

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.get() }, { translateY: ty.get() }, { scale: scale.get() }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[styles.fill, style]}
        onLayout={(e) => {
          w.set(e.nativeEvent.layout.width);
          h.set(e.nativeEvent.layout.height);
        }}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignSelf: 'stretch', alignItems: 'center' },
});
