/**
 * شاشات إعدادات أندرويد اللي بتخلّي الأذان والتنبيهات توصل والتطبيق مقفول (شاشة «الأذان مش بيوصل؟»).
 * الشركات (شاومي، أوبو، فيفو، هواوي، سامسونج…) بتقفل التطبيقات اللي في الخلفية علشان البطارية،
 * فبنفتح للمستخدم الشاشة الصح بزرار بدل ما يدوّر عليها.
 */
import * as Device from 'expo-device';
import * as IntentLauncher from 'expo-intent-launcher';
import { Linking, Platform } from 'react-native';

import { LINKS } from '@/constants/brand';

import { canScheduleExactAlarms, isIgnoringBatteryOptimizations } from '../../../modules/yatlu-alarms';

const PKG = LINKS.androidPackage;

async function open(action: string, params?: IntentLauncher.IntentLauncherParams): Promise<void> {
  try {
    await IntentLauncher.startActivityAsync(action, params);
  } catch {
    await Linking.openSettings().catch(() => {});
  }
}

/** إشعارات التطبيق (والقنوات: الأذان، التذكيرات…) */
export const openNotificationSettings = () =>
  open(IntentLauncher.ActivityAction.APP_NOTIFICATION_SETTINGS, { extra: { 'android.provider.extra.APP_PACKAGE': PKG } });

/** «المنبهات والتذكيرات» — أندرويد ١٢+ (من غيرها الأذان ممكن يتأخر دقايق) */
export const exactAlarmSupported = Platform.OS === 'android' && Number(Platform.Version) >= 31;
export const openExactAlarmSettings = () => open(IntentLauncher.ActivityAction.REQUEST_SCHEDULE_EXACT_ALARM, { data: `package:${PKG}` });

/** قايمة «تحسين البطارية» — المستخدم يختار يتلو ← «غير مقيّد» */
export const openBatterySettings = () => open(IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS);

/** صفحة التطبيق في الإعدادات (التشغيل التلقائي والبطارية في أغلب الشركات من هنا) */
export const openAppDetails = () => open(IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS, { data: `package:${PKG}` });

export type PhoneBrand = 'xiaomi' | 'samsung' | 'oppo' | 'vivo' | 'huawei' | 'other';

export function phoneBrand(): PhoneBrand {
  const m = `${Device.manufacturer ?? ''} ${Device.brand ?? ''}`.toLowerCase();
  if (/xiaomi|redmi|poco/.test(m)) return 'xiaomi';
  if (/samsung/.test(m)) return 'samsung';
  if (/oppo|realme|oneplus/.test(m)) return 'oppo';
  if (/vivo|iqoo/.test(m)) return 'vivo';
  if (/huawei|honor/.test(m)) return 'huawei';
  return 'other';
}

export const phoneName = () => [Device.manufacturer, Device.modelName].filter(Boolean).join(' ');

/** حالة الإعدادات (null = مش معروف: Expo Go أو موبايل قديم من غير الموديول) */
export const exactAlarmAllowed = (): boolean | null => (Platform.OS === 'android' ? canScheduleExactAlarms() : null);
export const batteryUnrestricted = (): boolean | null => (Platform.OS === 'android' ? isIgnoringBatteryOptimizations() : null);
