/**
 * الاستماع: القارئ + «بيتقري دلوقتي» + السور / الأجزاء / قوايم الاستماع / المتحمّل.
 * الاستماع محتاج نت، إلا اللي اتحمّل (docs/rules.md القاعدة 2).
 */
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AddToPlaylist } from '@/components/listen/add-to-playlist';
import { DownloadButton } from '@/components/listen/download-button';
import { IconBtn, ListRow } from '@/components/listen/list-row';
import { NamePrompt } from '@/components/listen/name-prompt';
import { NowPlaying } from '@/components/listen/now-playing';
import { HeaderButton, Screen } from '@/components/screen';
import { Btn, Card, Icon, Row, Segmented, Txt } from '@/components/ui';
import { BottomTabInset } from '@/constants/theme';
import { getSurah, juzLabel, juzList, surahLabel, surahOfAyah, surahs } from '@/data/quran';
import { useAudio } from '@/features/audio/audio-store';
import { deleteSurahFiles, juzFiles, jobKey, surahFiles, useDownloads } from '@/features/audio/downloads';
import { canDownload, totalDownloadedBytes } from '@/features/audio/offline';
import { reciterById } from '@/features/audio/reciters';
import { useI18n } from '@/i18n';
import { type Playlist, useReading } from '@/store/reading-store';
import { useSettings } from '@/store/settings-store';
import { useMushafTheme } from '@/theme/ThemeContext';

type Tab = 'surahs' | 'juz' | 'playlists' | 'downloads';
type Item =
  | { k: 'surah'; id: number; del?: boolean }
  | { k: 'juz'; id: number }
  | { k: 'pl'; p: Playlist }
  | { k: 'newpl' }
  | { k: 'empty'; title: string; hint: string };

const ALL_SURAHS = surahs.map((s) => s.id);

export default function ListenScreen() {
  const { t, lang, num } = useI18n();
  const { theme } = useMushafTheme();
  const { settings } = useSettings();
  const reading = useReading();
  const audio = useAudio();
  const dl = useDownloads(settings.reciter);
  const c = theme.colors;
  const [tab, setTab] = useState<Tab>('surahs');
  const [adding, setAdding] = useState<number | null>(null);
  const [naming, setNaming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const reciter = reciterById(settings.reciter);
  const playingSurah = audio.ayahId != null ? surahOfAyah(audio.ayahId).id : null;

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  const downloaded = tab === 'downloads' ? dl.downloadedSurahs() : [];
  const items: Item[] = (() => {
    if (tab === 'surahs') return ALL_SURAHS.map((id) => ({ k: 'surah' as const, id }));
    if (tab === 'juz') return juzList.map((j) => ({ k: 'juz' as const, id: j.id }));
    if (tab === 'playlists') {
      const list: Item[] = [{ k: 'newpl' }, ...reading.playlists.map((p) => ({ k: 'pl' as const, p }))];
      if (!reading.playlists.length) list.push({ k: 'empty', title: t('noPlaylists'), hint: t('noPlaylistsHint') });
      return list;
    }
    if (!downloaded.length) return [{ k: 'empty' as const, title: t('noDownloads'), hint: t('noDownloadsHint') }];
    return downloaded.map((id) => ({ k: 'surah' as const, id, del: true }));
  })();

  const playSurah = (id: number) => audio.playSurahs(ALL_SURAHS, id - 1, { title: t('fullQuran') });

  const tabs: { value: Tab; label: string }[] = [
    { value: 'surahs', label: t('surahs') },
    { value: 'juz', label: t('juzs') },
    { value: 'playlists', label: t('playlists') },
    ...(canDownload ? [{ value: 'downloads' as Tab, label: t('downloadsTab') }] : []),
  ];

  const header = (
    <View style={{ gap: 12, paddingBottom: 8 }}>
      <Pressable onPress={() => router.push('/reciter')} accessibilityRole="button" accessibilityLabel={t('reciter')}>
        <Card>
          <Row style={{ gap: 10 }}>
            <Icon name="person" size={20} color={c.accent} />
            <View style={{ flex: 1 }}>
              <Txt size={12} color="textSecondary">
                {t('reciter')}
              </Txt>
              <Txt size={16} weight="bold">
                {lang === 'ar' ? reciter.ar : reciter.en}
              </Txt>
            </View>
            <Icon name="chevron" size={18} color={c.textSecondary} />
          </Row>
        </Card>
      </Pressable>
      <NowPlaying />
      <Segmented value={tab} options={tabs} onChange={setTab} />
      {dl.failedKey ? (
        <Txt size={12} color="#C0392B">
          {t('downloadFailed')}
        </Txt>
      ) : null}
    </View>
  );

  const footer = (
    <View style={{ gap: 6, paddingTop: 12 }}>
      <Txt size={12} color="textSecondary">
        {Platform.OS === 'web' ? t('listenWebNote') : t('listenOfflineNote')}
      </Txt>
      {tab === 'downloads' && canDownload ? (
        <Txt size={12} color="textSecondary">
          {t('storageUsed', { size: formatBytes(totalDownloadedBytes(), num) })}
        </Txt>
      ) : null}
    </View>
  );

  return (
    <Screen
      title={t('tabListen')}
      subtitle={t('listenSubtitle')}
      actions={<HeaderButton icon="person" label={t('reciter')} onPress={() => router.push('/reciter')} />}>
      <FlashList
        data={items}
        keyExtractor={(it, i) => (it.k === 'surah' || it.k === 'juz' ? `${it.k}${it.id}` : it.k === 'pl' ? it.p.id : `${it.k}${i}`)}
        getItemType={(it) => it.k}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: BottomTabInset + 24 }}
        renderItem={({ item }) => {
          switch (item.k) {
            case 'surah': {
              const s = getSurah(item.id);
              const active = playingSurah === s.id;
              return (
                <ListRow
                  number={num(s.id)}
                  title={surahLabel(s, lang)}
                  subtitle={`${s.type === 'meccan' ? t('meccan') : t('medinan')} · ${t('ayahsCount', { n: num(s.ayahs) })}`}
                  active={active}
                  onPress={() => playSurah(s.id)}>
                  <IconBtn icon="playlistAdd" label={t('addToPlaylist')} onPress={() => setAdding(s.id)} />
                  {item.del ? (
                    <IconBtn icon="trash" label={t('deleteDownload')} onPress={() => deleteSurahFiles(settings.reciter, s.id)} />
                  ) : (
                    <DownloadButton jobKey={jobKey(settings.reciter, 's', s.id)} files={surahFiles(s.id)} label={t('downloadSurah')} />
                  )}
                </ListRow>
              );
            }
            case 'juz': {
              const j = juzList[item.id - 1];
              const start = surahOfAyah(j.ayahId);
              return (
                <ListRow
                  number={num(j.id)}
                  title={juzLabel(j.id, lang)}
                  subtitle={t('startsAt', { surah: surahLabel(start, lang), ayah: num(j.ayah) })}
                  active={false}
                  onPress={() => audio.playSurahs(ALL_SURAHS, start.id - 1, { startAyahId: j.ayahId, title: juzLabel(j.id, lang) })}>
                  <DownloadButton jobKey={jobKey(settings.reciter, 'j', j.id)} files={juzFiles(j.id)} label={t('downloadJuz')} />
                </ListRow>
              );
            }
            case 'pl':
              return (
                <ListRow
                  icon="playlist"
                  title={item.p.name}
                  subtitle={t('surahsCountN', { n: num(item.p.surahs.length) })}
                  active={audio.queueTitle === item.p.name && audio.ayahId != null}
                  onPress={() => router.push({ pathname: '/playlist', params: { id: item.p.id } })}>
                  {item.p.surahs.length ? (
                    <IconBtn icon="play" label={t('playAll')} onPress={() => audio.playSurahs(item.p.surahs, 0, { title: item.p.name })} accent />
                  ) : null}
                </ListRow>
              );
            case 'newpl':
              return <Btn title={t('newPlaylist')} icon="plus" kind="secondary" onPress={() => setNaming(true)} style={{ marginVertical: 8 }} />;
            case 'empty':
              return (
                <View style={styles.empty}>
                  <Txt size={16} weight="bold" align="center">
                    {item.title}
                  </Txt>
                  <Txt size={13} color="textSecondary" align="center">
                    {item.hint}
                  </Txt>
                </View>
              );
          }
        }}
      />

      <AddToPlaylist
        surah={adding}
        onClose={(name) => {
          setAdding(null);
          if (name) setToast(t('addedToPlaylist', { name }));
        }}
      />
      <NamePrompt
        visible={naming}
        title={t('newPlaylist')}
        confirmLabel={t('create')}
        onCancel={() => setNaming(false)}
        onSubmit={(name) => {
          const id = reading.createPlaylist(name);
          setNaming(false);
          router.push({ pathname: '/playlist', params: { id } });
        }}
      />
      {toast ? (
        <View style={[styles.toast, { backgroundColor: c.text }]}>
          <Txt size={14} color={c.background} align="center">
            {toast}
          </Txt>
        </View>
      ) : null}
    </Screen>
  );
}

function formatBytes(b: number, num: (n: number | string) => string) {
  if (b < 1024 * 1024) return `${num(Math.round(b / 1024))} KB`;
  const mb = b / (1024 * 1024);
  return mb < 1024 ? `${num(Math.round(mb))} MB` : `${num((mb / 1024).toFixed(1))} GB`;
}

const styles = StyleSheet.create({
  empty: { paddingVertical: 32, gap: 6, alignItems: 'center' },
  toast: { position: 'absolute', bottom: BottomTabInset + 16, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, maxWidth: '90%' },
});
