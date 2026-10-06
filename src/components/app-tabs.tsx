import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { IS_RTL_LAYOUT } from '@/constants/rtl';

import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';

/** التابات الأصلية (أندرويد و iOS). في العربي بتترتب من اليمين. */
export default function AppTabs() {
  const colors = useTheme();
  const { t, dir } = useI18n();

  const tabs = [
    <NativeTabs.Trigger key="index" name="index">
      <NativeTabs.Trigger.Label>{t('tabMushaf')}</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf="book.fill" md="menu_book" />
    </NativeTabs.Trigger>,
    <NativeTabs.Trigger key="prayer" name="prayer">
      <NativeTabs.Trigger.Label>{t('tabPrayer')}</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf="clock.fill" md="schedule" />
    </NativeTabs.Trigger>,
    <NativeTabs.Trigger key="azkar" name="azkar">
      <NativeTabs.Trigger.Label>{t('tabAzkar')}</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf="sparkles" md="auto_awesome" />
    </NativeTabs.Trigger>,
    <NativeTabs.Trigger key="listen" name="listen">
      <NativeTabs.Trigger.Label>{t('tabListen')}</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf="headphones" md="headphones" />
    </NativeTabs.Trigger>,
    <NativeTabs.Trigger key="settings" name="settings">
      <NativeTabs.Trigger.Label>{t('tabSettings')}</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
    </NativeTabs.Trigger>,
  ];

  // شريط التابات بيتبع اتجاه الجهاز؛ لو مختلف عن اتجاه اللغة نعكس الترتيب
  const ordered = dir.rtl !== IS_RTL_LAYOUT ? [...tabs].reverse() : tabs;

  return (
    <NativeTabs
      backgroundColor={colors.backgroundElement}
      indicatorColor={colors.backgroundSelected}
      // ألوان صريحة للأيقونات والأسماء علشان تبان في الثيمات الغامقة
      iconColor={{ default: colors.textSecondary, selected: colors.accent }}
      // اسم كل صفحة تحت أيقونتها على طول (مش للتاب المختار بس)
      labelVisibilityMode="labeled"
      labelStyle={{ default: { color: colors.textSecondary }, selected: { color: colors.accent } }}>
      {ordered}
    </NativeTabs>
  );
}
