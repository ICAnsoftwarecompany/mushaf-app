/**
 * التفسير الميسر + ترجمة المعاني للآية المختارة (بيتحمّلوا من ملفات جوه التطبيق — أوفلاين).
 */
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, Row, Txt } from '@/components/ui';
import { ayahNumber, ayahs, surahLabel, surahOfAyah } from '@/data/quran';
import { getTafsir, getTranslation } from '@/data/quran/extra';
import { useI18n } from '@/i18n';
import { useMushafTheme } from '@/theme/ThemeContext';

export function TafsirSheet({ ayahId, onClose }: { ayahId: number | null; onClose: () => void }) {
  const { t, lang } = useI18n();
  const { theme } = useMushafTheme();
  const c = theme.colors;

  return (
    <Modal visible={ayahId != null} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
        {ayahId != null && (
          <>
            <Row style={[styles.head, { borderColor: c.border }]}>
              <Txt size={17} weight="bold" style={{ flex: 1 }}>
                {`${surahLabel(surahOfAyah(ayahId), lang)} · ${t('ayahN', { n: ayahNumber(ayahId) })}`}
              </Txt>
              <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('close')} hitSlop={10}>
                <Icon name="close" size={22} color={c.accent} />
              </Pressable>
            </Row>
            <TafsirBody key={ayahId} ayahId={ayahId} />
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

/** بيتعاد إنشاؤه لكل آية (key) فبيبدأ فاضي ويحمّل */
function TafsirBody({ ayahId }: { ayahId: number }) {
  const { t } = useI18n();
  const { theme } = useMushafTheme();
  const c = theme.colors;
  const [tafsir, setTafsir] = useState<string | null>(null);
  const [translation, setTranslation] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getTafsir()
      .then((a) => alive && setTafsir(a[ayahId - 1] ?? ''))
      .catch(() => alive && setTafsir(''));
    getTranslation()
      .then((a) => alive && setTranslation(a[ayahId - 1] ?? ''))
      .catch(() => alive && setTranslation(''));
    return () => {
      alive = false;
    };
  }, [ayahId]);

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Txt quran size={24}>
        {ayahs[ayahId - 1]}
      </Txt>
      <View style={[styles.block, { borderColor: c.border }]}>
        <Txt size={14} weight="bold" color="accent">
          {t('tafsirTitle')}
        </Txt>
        <Txt arabic size={17} lineHeight={1.9}>
          {tafsir ?? t('loading')}
        </Txt>
      </View>
      <View style={[styles.block, { borderColor: c.border }]}>
        <Txt size={14} weight="bold" color="accent">
          {t('translationTitle')}
        </Txt>
        <Txt size={16} lineHeight={1.6} style={{ textAlign: 'left', writingDirection: 'ltr' }}>
          {translation ?? t('loading')}
        </Txt>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: { gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  body: { padding: 16, gap: 18, paddingBottom: 48 },
  block: { gap: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14 },
});
