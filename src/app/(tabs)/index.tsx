/**
 * الفهرس: متابعة القراءة + السور + الأجزاء
 */
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ROW, TEXT_LEFT, rtlText } from '@/constants/rtl';
import { BottomTabInset } from '@/constants/theme';
import {
  getSurah,
  JUZ_NAMES,
  juzList,
  type Juz,
  type Surah,
  surahs,
  surahsOfPage,
  toArabicDigits,
} from '@/data/quran';
import { useReading } from '@/store/reading-store';
import { useMushafTheme } from '@/theme/ThemeContext';

type Tab = 'surahs' | 'juz';

const openPage = (page: number) => router.push({ pathname: '/mushaf/[page]', params: { page: String(page) } });

export default function IndexScreen() {
  const { theme } = useMushafTheme();
  const c = theme.colors;
  const { lastRead } = useReading();
  const [tab, setTab] = useState<Tab>('surahs');

  const header = (
    <View style={styles.headerBlock}>
      {lastRead && (
        <Pressable
          onPress={() => openPage(lastRead.page)}
          style={[styles.continueCard, { backgroundColor: c.surface, borderColor: c.accent }]}>
          <Text style={[styles.continueLabel, { color: c.textSecondary }]}>متابعة القراءة</Text>
          <Text style={[styles.continueTitle, { color: c.text }]}>
            {`سورة ${surahsOfPage(lastRead.page)[0].name}`}
          </Text>
          <Text style={[styles.continueMeta, { color: c.accent }]}>{`صفحة ${toArabicDigits(lastRead.page)}`}</Text>
        </Pressable>
      )}

      <View style={[styles.segment, { backgroundColor: c.surface, borderColor: c.border }]}>
        {(['surahs', 'juz'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.segmentItem, tab === t && { backgroundColor: c.background, borderColor: c.accent }]}>
            <Text style={{ color: tab === t ? c.accent : c.textSecondary, fontWeight: '600' }}>
              {t === 'surahs' ? 'السور' : 'الأجزاء'}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <Screen title="يتلو" subtitle="المصحف الشريف · رواية حفص عن عاصم · مصحف المدينة">
      {tab === 'surahs' ? (
        <FlashList
          key="surahs"
          data={surahs}
          keyExtractor={(s) => String(s.id)}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <SurahRow surah={item} />}
        />
      ) : (
        <FlashList
          key="juz"
          data={juzList}
          keyExtractor={(j) => String(j.id)}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <JuzRow juz={item} />}
        />
      )}
    </Screen>
  );
}

function NumberBadge({ n }: { n: number }) {
  const { theme } = useMushafTheme();
  return (
    <View style={[styles.badge, { borderColor: theme.colors.accent }]}>
      <Text style={{ color: theme.colors.accent, fontWeight: '700', fontSize: 13 }}>{toArabicDigits(n)}</Text>
    </View>
  );
}

function SurahRow({ surah }: { surah: Surah }) {
  const { theme } = useMushafTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={() => openPage(surah.page)}
      style={({ pressed }) => [styles.row, { borderColor: c.border }, pressed && { backgroundColor: c.highlight }]}>
      <NumberBadge n={surah.id} />
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: c.text }]}>{surah.name}</Text>
        <Text style={[styles.rowMeta, { color: c.textSecondary }]}>
          {`${surah.type === 'meccan' ? 'مكية' : 'مدنية'} · ${toArabicDigits(surah.ayahs)} آية`}
        </Text>
      </View>
      <Text style={[styles.page, { color: c.textSecondary }]}>{toArabicDigits(surah.page)}</Text>
    </Pressable>
  );
}

function JuzRow({ juz }: { juz: Juz }) {
  const { theme } = useMushafTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={() => openPage(juz.page)}
      style={({ pressed }) => [styles.row, { borderColor: c.border }, pressed && { backgroundColor: c.highlight }]}>
      <NumberBadge n={juz.id} />
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: c.text }]}>{`الجزء ${JUZ_NAMES[juz.id - 1]}`}</Text>
        <Text style={[styles.rowMeta, { color: c.textSecondary }]}>
          {`يبدأ من ${getSurah(juz.surah).name} · آية ${toArabicDigits(juz.ayah)}`}
        </Text>
      </View>
      <Text style={[styles.page, { color: c.textSecondary }]}>{toArabicDigits(juz.page)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: BottomTabInset + 24 },
  headerBlock: { paddingHorizontal: 16, gap: 14, paddingBottom: 8 },
  continueCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 4 },
  continueLabel: { fontSize: 13, ...rtlText },
  continueTitle: { fontSize: 20, fontWeight: '700', ...rtlText },
  continueMeta: { fontSize: 14, fontWeight: '600', ...rtlText },
  segment: { flexDirection: ROW, borderWidth: 1, borderRadius: 12, padding: 4 },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  row: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 17, fontWeight: '600', ...rtlText },
  rowMeta: { fontSize: 13, ...rtlText },
  page: { fontSize: 14, minWidth: 32, textAlign: TEXT_LEFT },
});
