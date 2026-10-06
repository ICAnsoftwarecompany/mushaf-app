/** كارت «بيتقري دلوقتي» في تاب الاستماع: السورة والآية والتقدّم والتحكم */
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Icon, type IconName, Row, Txt } from '@/components/ui';
import { ayahNumber, pageOfAyah, surahLabel, surahOfAyah } from '@/data/quran';
import { useAudio } from '@/features/audio/audio-store';
import { reciterById } from '@/features/audio/reciters';
import { useI18n } from '@/i18n';
import { useSettings } from '@/store/settings-store';
import { useMushafTheme } from '@/theme/ThemeContext';

export function NowPlaying() {
  const audio = useAudio();
  const { t, lang, num } = useI18n();
  const { theme } = useMushafTheme();
  const { settings } = useSettings();
  const c = theme.colors;
  if (audio.ayahId == null) return null;

  const s = surahOfAyah(audio.ayahId);
  const n = ayahNumber(audio.ayahId);
  const r = reciterById(audio.reciter ?? settings.reciter);
  const fraction = n / s.ayahs;

  return (
    <Card style={{ gap: 10 }}>
      <Row style={{ gap: 10 }}>
        <View style={[styles.badge, { backgroundColor: c.highlight }]}>
          <Icon name="headphones" size={22} color={c.accent} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt size={12} color="accent" weight="bold">
            {audio.queueTitle ? `${t('nowPlaying')} · ${audio.queueTitle}` : t('nowPlaying')}
          </Txt>
          <Txt size={18} weight="bold" numberOfLines={1}>
            {surahLabel(s, lang)}
          </Txt>
          <Txt size={12} color="textSecondary" numberOfLines={1}>
            {`${t('ayahOfN', { n: num(n), m: num(s.ayahs) })} · ${lang === 'ar' ? r.ar : r.en}`}
          </Txt>
        </View>
        <Pressable
          onPress={() => router.push({ pathname: '/mushaf/[page]', params: { page: String(pageOfAyah(audio.ayahId!)), ayah: String(audio.ayahId) } })}
          accessibilityRole="button"
          accessibilityLabel={t('openInMushaf')}
          hitSlop={8}
          style={styles.small}>
          <Icon name="book" size={20} color={c.accent} />
        </Pressable>
      </Row>

      <View style={[styles.track, { backgroundColor: c.border }]}>
        <View style={[styles.fill, { backgroundColor: c.accent, width: `${Math.round(fraction * 100)}%` }]} />
      </View>

      {audio.error ? (
        <Txt size={12} color="#C0392B">
          {t('audioError')}
        </Txt>
      ) : null}

      {/* الترتيب بيتبع اتجاه اللغة: «السابقة» في البداية */}
      <Row style={{ justifyContent: 'space-between' }}>
        <Ctrl icon="repeat" label={t('loop')} onPress={() => audio.setLoop(!audio.loop)} active={audio.loop} />
        <Row style={{ gap: 14 }}>
          <Ctrl icon="backward" label={t('previousSurah')} onPress={audio.previousSurah} flip />
          <Ctrl
            icon={audio.playing ? 'pause' : 'play'}
            label={audio.playing ? t('pause') : t('play')}
            onPress={audio.toggle}
            big
          />
          <Ctrl icon="forward" label={t('nextSurah')} onPress={audio.nextSurah} flip />
        </Row>
        <Ctrl icon="stop" label={t('stop')} onPress={audio.stop} />
      </Row>
    </Card>
  );
}

function Ctrl({ icon, label, onPress, big, active, flip }: { icon: IconName; label: string; onPress: () => void; big?: boolean; active?: boolean; flip?: boolean }) {
  const { theme } = useMushafTheme();
  const { dir } = useI18n();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={active !== undefined ? { selected: active } : undefined}
      hitSlop={6}
      style={[
        styles.ctrl,
        big && { backgroundColor: c.accent, width: 54, height: 54, borderRadius: 27 },
        active && { backgroundColor: c.highlight },
        flip && dir.rtl && { transform: [{ scaleX: -1 }] },
      ]}>
      <Icon name={icon} size={big ? 26 : 20} color={big ? c.background : active === false ? c.textSecondary : c.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  small: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
  ctrl: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
