/** الويب: مفيش إشعار للسبحة برّه التطبيق (docs/platforms.md) */
import type { TasbihState } from './tasbih-store';

export const tasbihNotificationSupported = false;
export function onTasbihChange(_l: (s: TasbihState) => void): () => void {
  return () => {};
}
export async function startTasbihNotification(): Promise<void> {}
export async function setTasbihPinned(_pinned: boolean, _current: TasbihState): Promise<boolean> {
  return false;
}
export async function syncTasbihNotification(_s: TasbihState): Promise<void> {}
