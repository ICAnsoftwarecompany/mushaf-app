/**
 * الشاشة الافتتاحية: اللوجو (اسم «يتلو» بخط الرقعة) + الآية اللي منها الاسم (البينة ٢).
 * بتظهر فوق التطبيق كل مرة يفتح، وبتختفي لوحدها بعد شوية، أو بضغطة.
 * التطبيق بيتحمّل تحتها في نفس الوقت، فمفيش أي تأخير إضافي.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StatusBar, StyleSheet, Text, useWindowDimensions } from 'react-native';

import { Brand, NAME_AYAH, NAME_AYAH_TEXT, NAME_SURAH } from '@/constants/brand';
import { QuranFont } from '@/constants/theme';
import { getSurah, toArabicDigits } from '@/data/quran';
import { useI18n } from '@/i18n';

const SHOW_MS = 2600;
const FADE_MS = 450;

export function IntroScreen({ onDone }: { onDone: () => void }) {
  const { width } = useWindowDimensions();
  const { t } = useI18n();
  const [opacity] = useState(() => new Animated.Value(1));
  const [content] = useState(() => new Animated.Value(0));
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

  const logo = Math.min(220, width * 0.52);
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
            accessibilityLabel={Brand.name}
            accessibilityIgnoresInvertColors
          />

          <Text style={[styles.ayah, { fontSize: ayahSize, lineHeight: ayahSize * 1.9 }]}>
            {`﴿${NAME_AYAH_TEXT}﴾`}
          </Text>
          <Text style={styles.ref}>{`[${getSurah(NAME_SURAH).name}: ${toArabicDigits(NAME_AYAH)}]`}</Text>
        </Animated.View>

        <Animated.Text style={[styles.tagline, { opacity: content }]}>{t('tagline')}</Animated.Text>
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
  ayah: {
    fontFamily: QuranFont,
    color: Brand.colors.cream,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 8,
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
