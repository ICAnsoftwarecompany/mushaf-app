/**
 * موديول أندرويد محلي صغير (modules/yatlu-alarms): بيقول هل «المنبهات والتذكيرات» مسموحة
 * وهل البطارية «غير مقيّد». null = مش معروف (الويب، iOS، Expo Go) — ساعتها ما بنعرضش تنبيه.
 */
import { requireOptionalNativeModule } from 'expo';

interface YatluAlarmsNative {
  canScheduleExactAlarms(): boolean;
  isIgnoringBatteryOptimizations(): boolean;
}

const native = requireOptionalNativeModule<YatluAlarmsNative>('YatluAlarms');

export function canScheduleExactAlarms(): boolean | null {
  try {
    return native ? native.canScheduleExactAlarms() : null;
  } catch {
    return null;
  }
}

export function isIgnoringBatteryOptimizations(): boolean | null {
  try {
    return native ? native.isIgnoringBatteryOptimizations() : null;
  } catch {
    return null;
  }
}
