/** الويب: مفيش إشعارات برّه التطبيق (docs/platforms.md) — مركز التنبيهات والكارت اللي فوق شغالين عادي */
import type { Settings } from '@/store/settings-store';

import type { PlannedNotif } from './plan';

export const notificationsSupported = false;
export const isExpoGoAndroid = false;
export const adhanSoundAvailable = false;

export async function ensurePermission(): Promise<boolean> {
  return false;
}
export async function scheduleOnDevice(_plan: PlannedNotif[], _s: Settings): Promise<void> {}
export async function muteAdhan(_id?: string): Promise<void> {}
export function onNotificationTap(_cb: (route: string, id: string) => void): () => void {
  return () => {};
}
