/**
 * الشاشة الافتتاحية: اللوجو + اسم «يتلو» + الآية اللي منها الاسم (البينة ٢).
 * بتظهر فوق التطبيق كل مرة يفتح، وبتختفي لوحدها بعد شوية، أو بضغطة.
 * التطبيق بيتحمّل تحتها في نفس الوقت، فمفيش أي تأخير إضافي.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StatusBar, StyleSheet, Text, useWindowDimensions } from 'react-native';

import { Brand, NAME_AYAH, NAME_AYAH_TEXT, NAME_SURAH } from '@/constants/brand';
import { QuranFont } from '@/constants/theme';
import { getSurah, toArabicDigits } from '@/data/quran';

const SHOW_MS = 2600;
const FADE_MS = 450;

export function IntroScreen({ onDone }: { onDone: () => void }) {
  const { width } = useWindowDimensions();
  const opacity = useRef(new Animated.Value(1)).current;
  const content = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(() => onDone());
  };

  useEffect(() => {
    Animated.timing(content, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    const t = setTimeout(close, SHOW_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logo = Math.min(150, width * 0.36);
  const ayahSize = Math.min(30, width * 0.068);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={Brand.colors.green} />
      <Pressable style={styles.press} onPress={close} accessibilityRole="button" accessibilityLabel="ابدأ">
        <Animated.View
          style={[
            styles.content,
            {
              opacity: content,
              transform: [{ translateY: content.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
            },
          ]}>
          <Image
            source={require('@/assets/images/splash-icon.png')}
            style={{ width: logo, height: logo }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <Text style={[styles.name, { fontSize: logo * 0.42 }]}>{Brand.name}</Text>

          <Text style={[styles.ayah, { fontSize: ayahSize, lineHeight: ayahSize * 1.9 }]}>
            {`﴿${NAME_AYAH_TEXT}﴾`}
          </Text>
          <Text style={styles.ref}>{`[${getSurah(NAME_SURAH).name}: ${toArabicDigits(NAME_AYAH)}]`}</Text>
        </Animated.View>

        <Animated.Text style={[styles.tagline, { opacity: content }]}>{Brand.tagline}</Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: Brand.colors.green,
    zIndex: 100,
  },
  press: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  content: {
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: QuranFont,
    color: Brand.colors.goldLight,
    marginTop: 4,
    textAlign: 'center',
  },
  ayah: {
    fontFamily: QuranFont,
    color: Brand.colors.cream,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 18,
  },
  ref: {
    color: Brand.colors.gold,
    fontSize: 14,
    writingDirection: 'rtl',
  },
  tagline: {
    position: 'absolute',
    bottom: 48,
    color: Brand.colors.gold,
    fontSize: 13,
    letterSpacing: 1,
    opacity: 0.8,
  },
});
