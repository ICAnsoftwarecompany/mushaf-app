/** اختيار قايمة استماع لإضافة سورة ليها (أو إنشاء قايمة جديدة) */
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon, Row, Txt } from '@/components/ui';
import { getSurah, surahLabel } from '@/data/quran';
import { useI18n } from '@/i18n';
import { useReading } from '@/store/reading-store';
import { useMushafTheme } from '@/theme/ThemeContext';

import { NamePrompt } from './name-prompt';

export function AddToPlaylist({ surah, onClose }: { surah: number | null; onClose: (addedTo?: string) => void }) {
  const { theme } = useMushafTheme();
  const { t, lang, num } = useI18n();
  const reading = useReading();
  const c = theme.colors;
  const [naming, setNaming] = useState(false);

  if (surah == null) return null;
  return (
    <>
      <Modal visible={!naming} transparent animationType="slide" onRequestClose={() => onClose()}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => onClose()} accessibilityLabel={t('close')} />
          <View style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Txt size={18} weight="bold">
              {t('addToPlaylist')}
            </Txt>
            <Txt size={14} color="textSecondary">
              {surahLabel(getSurah(surah), lang)}
            </Txt>
            <ScrollView style={{ maxHeight: 360 }}>
              <Pressable onPress={() => setNaming(true)} accessibilityRole="button">
                <Row style={[styles.row, { borderColor: c.border }]}>
                  <Icon name="plus" size={20} color={c.accent} />
                  <Txt size={16} color="accent" weight="medium">
                    {t('newPlaylist')}
                  </Txt>
                </Row>
              </Pressable>
              {reading.playlists.map((p) => (
                <Pressable
                  key={p.id}
                  accessibilityRole="button"
                  onPress={() => {
                    reading.addToPlaylist(p.id, surah);
                    onClose(p.name);
                  }}>
                  {({ pressed }) => (
                    <Row style={[styles.row, { borderColor: c.border }, pressed ? { backgroundColor: c.highlight } : {}]}>
                      <Icon name="playlist" size={20} color={c.textSecondary} />
                      <Txt size={16} style={{ flex: 1 }}>
                        {p.name}
                      </Txt>
                      <Txt size={13} color="textSecondary">
                        {t('surahsCountN', { n: num(p.surahs.length) })}
                      </Txt>
                    </Row>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <NamePrompt
        visible={naming}
        title={t('newPlaylist')}
        confirmLabel={t('create')}
        onCancel={() => setNaming(false)}
        onSubmit={(name) => {
          reading.createPlaylist(name, [surah]);
          setNaming(false);
          onClose(name);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    padding: 18,
    paddingBottom: 32,
    gap: 8,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  row: { gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
});
