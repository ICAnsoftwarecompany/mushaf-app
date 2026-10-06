/**
 * تاب المصحف: متابعة القراءة + الورد اليومي + السور / الأجزاء / الأحزاب
 */
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { HeaderButton, Screen } from '@/components/screen';
import { Btn, Card, Row, Segmented, Txt } from '@/components/ui';
import { BottomTabInset } from '@/constants/theme';
import { getSurah, juzLabel, juzList, type Juz, quarterLabel, quarters, type Surah, surahLabel, surahs, surahsOfPage } from '@/data/quran';
import { useI18n } from '@/i18n';
import { todayKey, useReading } from '@/store/reading-store';
import { useSettings } from '@/store/settings-store';
import { useMushafTheme } from '@/theme/ThemeContext';

type Tab = 'surahs' | 'juz' | 'hizb';

export const openPage = (page: number, ayah?: number) =>
  router.push({ pathname: '/mushaf/[page]', params: ayah ? { page: String(page), ayah: String(ayah) } : { page: String(page) } });

const hizbStarts = quarters.filter((q) => (q.id - 1) % 4 === 0);

export default function IndexScreen() {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<Tab>('surahs');

  const header = (
    <View style={styles.headerBlock}>
      <ContinueCard />
      <WirdCard />
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'surahs', label: t('surahs') },
          { value: 'juz', label: t('juzs') },
          { value: 'hizb', label: t('ahzab') },
        ]}
      />
    </View>
  );

  return (
    <Screen
      title={t('appName')}
      subtitle={t('indexSubtitle')}
      actions={
        <>
          <HeaderButton icon="search" label={t('tabSearch')} onPress={() => router.push('/search')} />
          <HeaderButton icon="goto" label={t('goTo')} onPress={() => router.push('/goto')} />
          <HeaderButton icon="bookmark" label={t('bookmarks')} onPress={() => router.push('/bookmarks')} />
        </>
      }>
      {tab === 'surahs' && (
        <FlashList
          key="s"
          data={surahs}
          keyExtractor={(s) => String(s.id)}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <SurahRow surah={item} />}
        />
      )}
      {tab === 'juz' && (
        <FlashList
          key="j"
          data={juzList}
          keyExtractor={(j) => String(j.id)}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <JuzRow juz={item} />}
        />
      )}
      {tab === 'hizb' && (
        <FlashList
          key="h"
          data={hizbStarts}
          keyExtractor={(q) => String(q.id)}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ListRow
              n={item.hizb}
              title={quarterLabel(item, lang)}
              meta={t('startsAt', { surah: surahLabel(getSurah(item.surah), lang), ayah: item.ayah })}
              page={item.page}
              onPress={() => openPage(item.page, item.ayahId)}
            />
          )}
        />
      )}
    </Screen>
  );
}

function ContinueCard() {
  const { t, lang } = useI18n();
  const { lastRead } = useReading();
  const { theme } = useMushafTheme();
  if (!lastRead) return null;
  const s = surahsOfPage(lastRead.page)[0];
  return (
    <Pressable onPress={() => openPage(lastRead.page)} accessibilityRole="button">
      {({ pressed }) => (
        <Card style={{ borderColor: theme.colors.accent, opacity: pressed ? 0.8 : 1, gap: 4 }}>
          <Txt size={13} color="textSecondary">
            {t('continueReading')}
          </Txt>
          <Txt size={20} weight="bold">
            {t('surahName', { name: surahLabel(s, lang) })}
          </Txt>
          <Txt size={14} weight="medium" color="accent">
            {t('pageN', { n: lastRead.page })}
          </Txt>
        </Card>
      )}
    </Pressable>
  );
}

function WirdCard() {
  const { t } = useI18n();
  const { khatma, markWirdDone, newKhatma } = useReading();
  const { settings } = useSettings();
  const { theme } = useMushafTheme();
  const per = settings.wirdPagesPerDay;
  const from = khatma.nextPage;
  const finished = from > 604;
  const to = Math.min(604, from + per - 1);
  const doneToday = khatma.lastDoneDay === todayKey();
  const progress = Math.round(((Math.min(from, 605) - 1) / 604) * 100);
  const daysLeft = Math.ceil((605 - from) / per);

  return (
    <Card style={{ gap: 8 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt size={15} weight="bold">
          {t('dailyWird')}
        </Txt>
        <Txt size={13} color="accent" weight="medium">
          {t('khatmaProgress', { p: progress })}
        </Txt>
      </Row>
      <View style={[styles.progress, { backgroundColor: theme.colors.border }]}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.colors.accent }]} />
      </View>
      {finished ? (
        <>
          <Txt size={14}>{t('khatmaDone')}</Txt>
          <Btn title={t('newKhatma')} onPress={newKhatma} />
        </>
      ) : doneToday ? (
        <Txt size={14} color="textSecondary">
          {`${t('wirdDone')} · ${t('daysLeft', { n: daysLeft })}`}
        </Txt>
      ) : (
        <>
          <Txt size={14} color="textSecondary">
            {`${t('wirdTodayRange', { from, to })} · ${t('daysLeft', { n: daysLeft })}`}
          </Txt>
          <Row style={{ gap: 8 }}>
            <Btn title={t('startWird')} icon="book" onPress={() => openPage(from)} style={{ flex: 1 }} />
            <Btn title={t('markWirdDone')} icon="check" kind="secondary" onPress={() => markWirdDone(per)} style={{ flex: 1 }} />
          </Row>
        </>
      )}
    </Card>
  );
}

function NumberBadge({ n }: { n: number }) {
  const { theme } = useMushafTheme();
  const { num } = useI18n();
  return (
    <View style={[styles.badge, { borderColor: theme.colors.accent }]}>
      <Txt size={13} weight="bold" color="accent" align="center">
        {num(n)}
      </Txt>
    </View>
  );
}

function ListRow({ n, title, meta, page, onPress }: { n: number; title: string; meta: string; page: number; onPress: () => void }) {
  const { theme } = useMushafTheme();
  const { num } = useI18n();
  const c = theme.colors;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
      {({ pressed }) => (
        <Row style={[styles.row, { borderColor: c.border }, pressed ? { backgroundColor: c.highlight } : {}]}>
          <NumberBadge n={n} />
          <View style={styles.rowText}>
            <Txt size={17} weight="medium">
              {title}
            </Txt>
            <Txt size={13} color="textSecondary">
              {meta}
            </Txt>
          </View>
          <Txt size={14} color="textSecondary" align="end" style={{ minWidth: 32 }}>
            {num(page)}
          </Txt>
        </Row>
      )}
    </Pressable>
  );
}

function SurahRow({ surah }: { surah: Surah }) {
  const { t, lang } = useI18n();
  return (
    <ListRow
      n={surah.id}
      title={surahLabel(surah, lang)}
      meta={`${surah.type === 'meccan' ? t('meccan') : t('medinan')} · ${t('ayahsCount', { n: surah.ayahs })}`}
      page={surah.page}
      onPress={() => openPage(surah.page)}
    />
  );
}

function JuzRow({ juz }: { juz: Juz }) {
  const { t, lang } = useI18n();
  return (
    <ListRow
      n={juz.id}
      title={juzLabel(juz.id, lang)}
      meta={t('startsAt', { surah: surahLabel(getSurah(juz.surah), lang), ayah: juz.ayah })}
      page={juz.page}
      onPress={() => openPage(juz.page)}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: BottomTabInset + 24 },
  headerBlock: { paddingHorizontal: 16, gap: 12, paddingBottom: 8 },
  progress: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  row: { gap: 14, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  badge: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
});
