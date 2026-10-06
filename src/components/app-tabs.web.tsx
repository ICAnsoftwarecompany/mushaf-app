/**
 * التابات على الويب: شريط علوي (الموبايل بيستخدم app-tabs.tsx بالتابات الأصلية)
 */
import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName, Txt } from '@/components/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { useMushafTheme } from '@/theme/ThemeContext';

const TABS: { name: string; href: '/' | '/prayer' | '/azkar' | '/listen' | '/settings'; label: 'tabMushaf' | 'tabPrayer' | 'tabAzkar' | 'tabListen' | 'tabSettings'; icon: IconName }[] = [
  { name: 'index', href: '/', label: 'tabMushaf', icon: 'book' },
  { name: 'prayer', href: '/prayer', label: 'tabPrayer', icon: 'clock' },
  { name: 'azkar', href: '/azkar', label: 'tabAzkar', icon: 'sparkles' },
  { name: 'listen', href: '/listen', label: 'tabListen', icon: 'headphones' },
  { name: 'settings', href: '/settings', label: 'tabSettings', icon: 'gear' },
];

export default function AppTabs() {
  const { t } = useI18n();
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <CustomTabList>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton icon={tab.icon}>{t(tab.label)}</TabButton>
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, icon, ...props }: TabTriggerSlotProps & { icon: IconName }) {
  const { theme } = useMushafTheme();
  const c = theme.colors;
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
      <View style={[styles.pill, isFocused && { backgroundColor: c.highlight }]}>
        <Icon name={icon} size={22} color={isFocused ? c.accent : c.textSecondary} />
      </View>
      <Txt size={11} weight={isFocused ? 'bold' : 'normal'} color={isFocused ? 'accent' : 'textSecondary'} align="center">
        {children as string}
      </Txt>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const { theme } = useMushafTheme();
  const { dir } = useI18n();
  return (
    <View {...props} style={[styles.bar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={[styles.inner, { flexDirection: dir.row }]}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.one,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    justifyContent: 'space-around',
  },
  tab: { alignItems: 'center', gap: 2, paddingVertical: 2, minWidth: 64 },
  pill: { paddingHorizontal: 16, paddingVertical: 3, borderRadius: 14 },
  pressed: { opacity: 0.7 },
});
