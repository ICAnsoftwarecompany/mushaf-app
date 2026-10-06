/**
 * التكبير باللمس (بإصبعين) في القارئ — بيكبّر الخط بس، مش الصفحة:
 * وقت الحركة بنعرض معاينة، ولما الإصبعين يتشالوا بنحفظ حجم الخط الجديد
 * (وضع الصفحات: «تكبير خط الصفحات»، وضع النص: «حجم الخط»).
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export function PinchZoom({
  previewRange,
  onPinchEnd,
  children,
}: {
  /** أقل وأكبر نسبة معاينة مسموحة من الحجم الحالي */
  previewRange: [number, number];
  onPinchEnd: (scale: number) => void;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const [minF, maxF] = previewRange;

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.set(Math.min(maxF, Math.max(minF, e.scale)));
    })
    .onEnd(() => {
      const s = scale.get();
      scale.set(withTiming(1, { duration: 120 }));
      scheduleOnRN(onPinchEnd, s);
    });

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <GestureDetector gesture={pinch}>
      <Animated.View style={[styles.fill, style]}>{children}</Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignSelf: 'stretch', alignItems: 'center' },
});
