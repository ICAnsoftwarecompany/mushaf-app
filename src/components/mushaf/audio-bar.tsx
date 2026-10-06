/**
 * شريط التلاوة: القارئ + السابقة/تشغيل/التالية/إيقاف + التكرار + تحميل السورة.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName, Row, Txt } from '@/components/ui';
import { ayahNumber, surahLabel, surahOfAyah } from '@/data/quran';
import { useAudio } from '@/features/audio/audio-store';
import { cancelDownload, jobKey, startDownload, surahFiles, useDownloads } from '@/features/audio/downloads';
import { canDownload } from '@/features/audio/offline';
import { reciterById } from '@/features/audio/reciters';
import { useI18n } from '@/i18n';
import { useSettings } from '@/store/settings-store';
import { useMushafTheme } from '@/theme/ThemeContext';

export function AudioBar() {
  const audio = useAudio();
  const { t, lang } = useI18n();
  const { theme } = useMushafTheme();
  const { settings, update } = useSettings();
  const c = theme.colors;
  const reciterId = audio.reciter ?? settings.reciter;
  const dl = useDownloads(reciterId);

  if (audio.ayahId == null) return null;
  const s = surahOfAyah(audio.ayahId);
  const reciter = reciterById(reciterId);
  const key = jobKey(reciterId, 's', s.id);
  const files = surahFiles(s.id);
  const downloaded = dl.isComplete(files);
  const job = dl.job(key);
  const progress = job ? job.done / job.files.length : null;
  const download = () => startDownload(key, reciterId, files);

  return (
    <View style={[styles.bar, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Row style={{ justifyContent: 'space-between', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Txt size={14} weight="bold" numberOfLines={1}>
            {`${surahLabel(s, lang)} · ${t('ayahN', { n: ayahNumber(audio.ayahId) })}`}
          </Txt>
          <Txt size={12} color="textSecondary" numberOfLines={1}>
            {lang === 'ar' ? reciter.ar : reciter.en}
          </Txt>
        </View>
        <Pressable
          onPress={() => update({ repeatAyah: settings.repeatAyah >= 5 ? 1 : settings.repeatAyah + 1 })}
          accessibilityRole="button"
          accessibilityLabel={t('repeat')}
          style={[styles.repeat, { borderColor: settings.repeatAyah > 1 ? c.accent : c.border }]}>
          <Row style={{ gap: 4 }}>
            <Icon name="repeat" size={16} color={settings.repeatAyah > 1 ? c.accent : c.textSecondary} />
            <Txt size={13} color={settings.repeatAyah > 1 ? 'accent' : 'textSecondary'}>
              {t('repeatN', { n: settings.repeatAyah })}
            </Txt>
          </Row>
        </Pressable>
      </Row>

      {audio.error ? (
        <Txt size={12} color="#C0392B">
          {t('audioError')}
        </Txt>
      ) : null}

      <Row style={{ justifyContent: 'center', gap: 18 }}>
        <Ctrl icon="stop" label={t('stop')} onPress={audio.stop} />
        {/* «السابقة» على اليمين في العربي */}
        <Ctrl icon="forward" label={t('next')} onPress={audio.next} />
        <Ctrl icon={audio.playing ? 'pause' : 'play'} label={audio.playing ? t('pause') : t('play')} onPress={audio.toggle} big />
        <Ctrl icon="backward" label={t('previous')} onPress={audio.previous} />
        {canDownload &&
          (downloaded ? (
            <View style={styles.ctrl}>
              <Icon name="check" size={20} color={c.accent} />
            </View>
          ) : progress != null ? (
            <Pressable
              onPress={() => cancelDownload(key)}
              style={styles.ctrl}
              accessibilityLabel={t('cancel')}>
              <Txt size={11} color="accent">{`${Math.round(progress * 100)}%`}</Txt>
            </Pressable>
          ) : (
            <Ctrl icon="download" label={t('downloadSurah')} onPress={download} />
          ))}
      </Row>
    </View>
  );
}

function Ctrl({ icon, label, onPress, big }: { icon: IconName; label: string; onPress: () => void; big?: boolean }) {
  const { theme } = useMushafTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={[styles.ctrl, big && { backgroundColor: c.accent, width: 48, height: 48, borderRadius: 24 }]}>
      <Icon name={icon} size={big ? 24 : 20} color={big ? c.background : c.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, gap: 8 },
  ctrl: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  repeat: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 8, paddingVertical: 3 },
});
