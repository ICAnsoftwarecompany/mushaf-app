/**
 * قايمة استماع: تشغيل الكل، ترتيب السور، حذف سورة، إضافة سور، تغيير الاسم، حذف القايمة.
 * (?id=... بدل مسار ديناميكي علشان نسخة الويب الثابتة)
 */
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { DownloadButton } from '@/components/listen/download-button';
import { IconBtn, ListRow } from '@/components/listen/list-row';
import { NamePrompt } from '@/components/listen/name-prompt';
import { NowPlaying } from '@/components/listen/now-playing';
import { HeaderButton, Screen } from '@/components/screen';
import { Btn, Icon, Row, Txt } from '@/components/ui';
import { getSurah, surahLabel, surahOfAyah, surahs } from '@/data/quran';
import { normalizeArabic as normalize } from '@/data/quran/search';
import { useAudio } from '@/features/audio/audio-store';
import { jobKey, surahFiles } from '@/features/audio/downloads';
import { useI18n } from '@/i18n';
import { useReading } from '@/store/reading-store';
import { useSettings } from '@/store/settings-store';
import { useMushafTheme } from '@/theme/ThemeContext';

export default function PlaylistScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t, lang, num } = useI18n();
  const reading = useReading();
  const audio = useAudio();
  const { settings } = useSettings();
  const [renaming, setRenaming] = useState(false);
  const [picking, setPicking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const p = reading.playlists.find((x) => x.id === id);
  if (!p) {
    return (
      <Screen title={t('playlists')} back>
        <View style={styles.empty}>
          <Txt size={15} color="textSecondary" align="center">
            {t('noPlaylists')}
          </Txt>
        </View>
      </Screen>
    );
  }

  const isThis = audio.queueTitle === p.name && audio.ayahId != null;
  const playingIndex = isThis ? audio.queueIndex : -1;
  const playingSurah = audio.ayahId != null ? surahOfAyah(audio.ayahId).id : null;

  return (
    <Screen
      title={p.name}
      subtitle={t('surahsCountN', { n: num(p.surahs.length) })}
      back
      actions={<HeaderButton icon="pencil" label={t('rename')} onPress={() => setRenaming(true)} />}>
      <FlatList
        data={p.surahs}
        keyExtractor={(s, i) => `${s}-${i}`}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          <View style={{ gap: 10, paddingBottom: 8 }}>
            {isThis ? <NowPlaying /> : null}
            <Row style={{ gap: 10 }}>
              <Btn
                title={t('playAll')}
                icon="play"
                onPress={() => audio.playSurahs(p.surahs, 0, { title: p.name })}
                disabled={!p.surahs.length}
                style={{ flex: 1 }}
              />
              <Btn title={t('addSurahs')} icon="plus" kind="secondary" onPress={() => setPicking(true)} style={{ flex: 1 }} />
            </Row>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Txt size={14} color="textSecondary" align="center">
              {t('emptyPlaylist')}
            </Txt>
          </View>
        }
        ListFooterComponent={
          <View style={{ paddingTop: 24 }}>
            <Btn
              title={confirmDelete ? t('confirmDelete') : t('deletePlaylist')}
              icon="trash"
              kind="ghost"
              onPress={() => {
                if (!confirmDelete) return setConfirmDelete(true);
                if (isThis) audio.stop();
                reading.deletePlaylist(p.id);
                router.back();
              }}
            />
          </View>
        }
        renderItem={({ item: s, index }) => {
          const surah = getSurah(s);
          return (
            <ListRow
              number={num(index + 1)}
              title={surahLabel(surah, lang)}
              subtitle={t('ayahsCount', { n: num(surah.ayahs) })}
              active={index === playingIndex && playingSurah === s}
              onPress={() => audio.playSurahs(p.surahs, index, { title: p.name })}>
              <IconBtn icon="up" label="↑" onPress={() => reading.movePlaylistItem(p.id, index, index - 1)} disabled={index === 0} />
              <IconBtn icon="down" label="↓" onPress={() => reading.movePlaylistItem(p.id, index, index + 1)} disabled={index === p.surahs.length - 1} />
              <DownloadButton jobKey={jobKey(settings.reciter, 's', s)} files={surahFiles(s)} label={t('downloadSurah')} />
              <IconBtn icon="close" label={t('delete')} onPress={() => reading.removeFromPlaylist(p.id, index)} />
            </ListRow>
          );
        }}
      />

      <NamePrompt
        visible={renaming}
        title={t('rename')}
        initial={p.name}
        confirmLabel={t('save')}
        onCancel={() => setRenaming(false)}
        onSubmit={(name) => {
          reading.renamePlaylist(p.id, name);
          setRenaming(false);
        }}
      />
      <SurahPicker visible={picking} onClose={() => setPicking(false)} onPick={(s) => reading.addToPlaylist(p.id, s)} added={p.surahs} />
    </Screen>
  );
}

/** اختيار سور للإضافة: بحث بالاسم أو الرقم، وكل ضغطة بتضيف سورة */
function SurahPicker({ visible, onClose, onPick, added }: { visible: boolean; onClose: () => void; onPick: (s: number) => void; added: number[] }) {
  const { theme } = useMushafTheme();
  const { t, lang, num, dir } = useI18n();
  const c = theme.colors;
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const term = q.trim();
    if (!term) return surahs;
    const n = Number(term.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))));
    const nq = normalize(term);
    return surahs.filter((s) => s.id === n || normalize(s.name).includes(nq) || s.nameEn.toLowerCase().includes(term.toLowerCase()));
  }, [q]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.picker, { backgroundColor: c.background }]}>
        <Row style={{ gap: 10, paddingHorizontal: 16, paddingTop: 16 }}>
          <Txt size={20} weight="bold" style={{ flex: 1 }}>
            {t('addSurahs')}
          </Txt>
          <Btn title={t('done')} onPress={onClose} />
        </Row>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t('chooseSurah')}
          placeholderTextColor={c.textSecondary}
          style={[styles.search, { color: c.text, borderColor: c.border, backgroundColor: c.surface, textAlign: dir.start }]}
        />
        <FlatList
          data={list}
          keyExtractor={(s) => String(s.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          renderItem={({ item }) => {
            const count = added.filter((x) => x === item.id).length;
            return (
              <Pressable onPress={() => onPick(item.id)} accessibilityRole="button" accessibilityLabel={surahLabel(item, lang)}>
                {({ pressed }) => (
                  <Row style={[styles.pickRow, { borderColor: c.border }, pressed && { backgroundColor: c.highlight }]}>
                    <Txt size={13} color="textSecondary" style={{ width: 32 }} align="center">
                      {num(item.id)}
                    </Txt>
                    <Txt size={16} style={{ flex: 1 }}>
                      {surahLabel(item, lang)}
                    </Txt>
                    {count ? (
                      <Row style={{ gap: 4 }}>
                        <Icon name="check" size={18} color={c.accent} />
                        {count > 1 ? <Txt size={12} color="accent">{`×${num(count)}`}</Txt> : null}
                      </Row>
                    ) : (
                      <Icon name="plus" size={20} color={c.textSecondary} />
                    )}
                  </Row>
                )}
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  empty: { paddingVertical: 40, paddingHorizontal: 24 },
  picker: { flex: 1, paddingTop: 24, width: '100%', maxWidth: 640, alignSelf: 'center' },
  search: { marginHorizontal: 16, marginVertical: 12, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  pickRow: { gap: 10, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
});
