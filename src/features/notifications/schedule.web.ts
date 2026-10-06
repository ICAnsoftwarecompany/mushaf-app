/** الويب: الإشعارات المجدولة مش مدعومة (docs/platforms.md) */
import type { Settings } from '@/store/settings-store';

export async function ensurePermission(): Promise<boolean> {
  return false;
}
 
export async function rescheduleAll(_s: Settings): Promise<void> {}
export const notificationsSupported = false;
