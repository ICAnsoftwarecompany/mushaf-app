/**
 * مركز التنبيهات: كل التنبيهات اللي وصلت (آخر ١٤ يوم)، مقسّمة بالأيام.
 * الضغط على تنبيه بيعلّمه مقروء ويفتح الشاشة بتاعته. شغال من غير نت وعلى الويب كمان.
 */
import { router } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { HeaderButton, Screen } from '@/components/screen';
import { Icon, type IconName, Row, Txt } from '@/components/ui';
import { markAllRead, markRead, useInbox } from '@/features/notifications/inbox';
import type { NotifKind, PlannedNotif } from '@/features/notifications/plan';
import { formatTime } from '@/features/prayer/prayer';
import { useI18n } from '@/i18n';
import { todayKey } from '@/store/reading-store';
import { useMushafTheme } from '@/theme/ThemeContext';

const KIND_ICON: Record<NotifKind, IconName> = {
  adhan: 'speaker',
  pre: 'clock',
  missed: 'checkmark',
  azkarMorning: 'sun',
  azkarEvening: 'moon',
  wird: 'book',
  kahf: 'calendar',
  tasbih: 'tasbih',
  lastRead: 'bookmark',
  gaza: 'heart',
};

type ListRow = { k: 'day'; label: string } | { k: 'item'; item: PlannedNotif };

export default function NotificationsScreen() {
  const { t, lang } = useI18n();
  const { theme } = useMushafTheme();
  const inbox = useInbox();
  const c = theme.colors;

  const today = todayKey(new Date(inbox.now));
  const yesterday = todayKey(new Date(inbox.now - 86400000));
  const rows: ListRow[] = [];
  let lastDay = '';
  for (const it of inbox.items) {
    const d = todayKey(new Date(it.at));
    if (d !== lastDay) {
      lastDay = d;
      rows.push({
        k: 'day',
        label: d === today ? t('today') : d === yesterday ? t('yesterday') : new Date(it.at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }),
      });
    }
    rows.push({ k: 'item', item: it });
  }

  return (
    <Screen
      title={t('notifications')}
      subtitle={t('notificationsSubtitle')}
      back
      actions={inbox.unread ? <HeaderButton icon="checkmark" label={t('markAllRead')} onPress={markAllRead} /> : undefined}>
      <FlatList
        data={rows}
        keyExtractor={(r, i) => (r.k === 'item' ? r.item.id : `d${i}`)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="bell" size={36} color={c.textSecondary} />
            <Txt size={15} color="textSecondary" align="center">
              {t('noNotifications')}
            </Txt>
          </View>
        }
        renderItem={({ item: r }) => {
          if (r.k === 'day') {
            return (
              <Txt size={13} weight="bold" color="accent" style={styles.day}>
                {r.label}
              </Txt>
            );
          }
          const it = r.item;
          const unread = !inbox.isRead(it.id);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${it.title}. ${it.body}`}
              onPress={() => {
                markRead(it.id);
                router.push(it.route as never);
              }}>
              {({ pressed }) => (
                <Row style={[styles.item, { borderColor: c.border, backgroundColor: unread ? c.surface : 'transparent' }, pressed && { opacity: 0.7 }]}>
                  <View style={[styles.icon, { backgroundColor: c.highlight }]}>
                    <Icon name={KIND_ICON[it.kind]} size={18} color={c.accent} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt size={15} weight={unread ? 'bold' : 'medium'} numberOfLines={2}>
                      {it.title}
                    </Txt>
                    {it.body ? (
                      <Txt size={13} color="textSecondary" numberOfLines={2}>
                        {it.body}
                      </Txt>
                    ) : null}
                  </View>
                  <View style={{ alignItems: 'center', gap: 6 }}>
                    <Txt size={12} color="textSecondary">
                      {formatTime(new Date(it.at), lang)}
                    </Txt>
                    {unread ? <View style={[styles.dot, { backgroundColor: c.accent }]} /> : null}
                  </View>
                </Row>
              )}
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { paddingVertical: 60, alignItems: 'center', gap: 10 },
  day: { paddingTop: 16, paddingBottom: 6 },
  item: { gap: 12, padding: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, marginBottom: 8 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
