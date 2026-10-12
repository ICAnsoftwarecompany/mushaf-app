/** الويب: مفيش إعدادات موبايل (docs/platforms.md) */
export const exactAlarmSupported = false;
export const openNotificationSettings = async () => {};
export const openExactAlarmSettings = async () => {};
export const openBatterySettings = async () => {};
export const openAppDetails = async () => {};
export type PhoneBrand = 'xiaomi' | 'samsung' | 'oppo' | 'vivo' | 'huawei' | 'other';
export const phoneBrand = (): PhoneBrand => 'other';
export const phoneName = () => '';
