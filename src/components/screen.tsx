/**
 * غلاف موحّد للشاشات: خلفية الثيم + عنوان (وزرار رجوع للشاشات الفرعية) + مسافة آمنة.
 */
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, Row, Txt } from '@/components/ui';
import { MaxContentWidth } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { useMushafTheme } from '@/theme/ThemeContext';

interface Props {
  title: string;
  subtitle?: string;
  /** شاشة فرعية: بيظهر زرار رجوع والعنوان أصغر */
  back?: boolean;
  /** عناصر جنب العنوان (أزرار) */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function Screen({ title, subtitle, back, actions, children }: Props) {
  const { theme } = useMushafTheme();
  const { t, dir } = useI18n();
  const c = theme.colors;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: c.background }]}
      edges={Platform.OS === 'web' ? [] : back ? ['top', 'bottom'] : ['top']}>
      <View style={styles.inner}>
        <Row style={styles.header}>
          {back && (
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              accessibilityRole="button"
              accessibilityLabel={t('back')}
              hitSlop={12}
              style={[styles.back, { transform: [{ scaleX: dir.rtl ? -1 : 1 }] }]}>
              <Icon name="back" size={22} color={c.accent} />
            </Pressable>
          )}
          <View style={{ flex: 1, gap: 2 }}>
            <Txt size={back ? 22 : 28} weight="bold" accessibilityRole="header">
              {title}
            </Txt>
            {subtitle ? (
              <Txt size={13} color="textSecondary">
                {subtitle}
              </Txt>
            ) : null}
          </View>
          {actions ? <Row style={{ gap: 6 }}>{actions}</Row> : null}
        </Row>
        <View style={styles.content}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

/** زرار أيقونة صغير للهيدر */
export function HeaderButton({ icon, label, onPress }: { icon: Parameters<typeof Icon>[0]['name']; label: string; onPress: () => void }) {
  const { theme } = useMushafTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.hbtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, opacity: pressed ? 0.6 : 1 }]}>
      <Icon name={icon} size={20} color={theme.colors.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  inner: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 10 },
  back: { padding: 4 },
  content: { flex: 1 },
  hbtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
