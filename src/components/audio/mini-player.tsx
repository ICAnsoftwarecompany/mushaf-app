/**
 * المشغّل الصغير: بيظهر فوق التابات وفي كل الشاشات لما في تلاوة شغالة
 * (ما عدا القارئ وتاب الاستماع لأن فيهم تحكم كامل).
 * ضغطة على الاسم بتفتح تاب الاستماع.
 */
import { router, usePathname } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName, Row, Txt } from '@/components/ui';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { ayahNumber, surahLabel, surahOfAyah } from '@/data/quran';
import { useAudio } from '@/features/audio/audio-store';
import { reciterById } from '@/features/audio/reciters';
import { useI18n } from '@/i18n';
import { useSettings } from '@/store/settings-store';
import { useMushafTheme } from '@/theme/ThemeContext';

const TAB_PATHS = ['/', '/prayer', '/azkar', '/settings', '/listen'];
/** ارتفاع المشغّل الصغير + مسافة — الشاشات بتسيب المساحة دي تحت */
export const MINI_PLAYER_SPACE = 72;

export function useMiniPlayerVisible() {
  const audio = useAudio();
  const path = usePathname();
  return audio.ayahId != null && !path.startsWith('/mushaf') && path !== '/listen';
}

export function MiniPlayer() {
  const visible = useMiniPlayerVisible();
  const audio = useAudio();
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const { t, lang, num, dir } = useI18n();
  const { theme } = useMushafTheme();
  const { settings } = useSettings();
  const c = theme.colors;
  if (!visible || audio.ayahId == null) return null;

  const onTab = TAB_PATHS.includes(path);
  const bottom = Platform.OS === 'web' ? (onTab ? 68 : 8) : insets.bottom + (onTab ? BottomTabInset : 0) + 8;
  const s = surahOfAyah(audio.ayahId);
  const r = reciterById(settings.reciter);

  return (
    <View style={[styles.wrap, { bottom }]} pointerEvents="box-none">
      <Row style={[styles.bar, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => router.push('/listen')}
          accessibilityRole="button"
          accessibilityLabel={`${t('nowPlaying')}: ${surahLabel(s, lang)}`}>
          <Row style={{ gap: 10 }}>
            <View style={[styles.icon, { backgroundColor: c.highlight }]}>
              <Icon name="headphones" size={18} color={c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={14} weight="bold" numberOfLines={1}>
                {`${surahLabel(s, lang)} · ${t('ayahN', { n: num(ayahNumber(audio.ayahId)) })}`}
              </Txt>
              <Txt size={11} color="textSecondary" numberOfLines={1}>
                {lang === 'ar' ? r.ar : r.en}
              </Txt>
            </View>
          </Row>
        </Pressable>
        <Ctrl icon="backward" label={t('previousSurah')} onPress={audio.previousSurah} flip={dir.rtl} />
        <Ctrl icon={audio.playing ? 'pause' : 'play'} label={audio.playing ? t('pause') : t('play')} onPress={audio.toggle} main />
        <Ctrl icon="forward" label={t('nextSurah')} onPress={audio.nextSurah} flip={dir.rtl} />
        <Ctrl icon="close" label={t('stop')} onPress={audio.stop} />
      </Row>
    </View>
  );
}

function Ctrl({ icon, label, onPress, main, flip }: { icon: IconName; label: string; onPress: () => void; main?: boolean; flip?: boolean }) {
  const { theme } = useMushafTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={[styles.ctrl, main && { backgroundColor: c.accent }, flip && { transform: [{ scaleX: -1 }] }]}>
      <Icon name={icon} size={main ? 20 : 18} color={main ? c.background : c.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 10 },
  bar: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: 4,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  ctrl: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
