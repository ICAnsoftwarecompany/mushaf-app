/**
 * مركز التنبيهات جوه التطبيق: التنبيهات اللي وقتها جه (من خطة التنبيهات) + المقروء منها.
 * بيتخزن على الجهاز (yatlu.inbox) وبيشتغل على كل المنصات حتى من غير إذن الإشعارات أو نت.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import type { PlannedNotif } from './plan';

const KEY = 'yatlu.inbox';
const KEEP_DAYS = 14;

interface State {
  items: PlannedNotif[]; // كل الخطة المعروفة (اللي فات + الجاي)
  read: string[];
  /** أول مرة المركز اشتغل — اللي قبلها ما اتبعتش فعلًا فمش بنعرضه */
  since: number;
  loaded: boolean;
  /** «دلوقتي» — بيتحدث كل دقيقة */
  now: number;
}

let state: State = { items: [], read: [], since: 0, loaded: false, now: Date.now() };
const listeners = new Set<() => void>();

function emit() {
  state = { ...state, now: Date.now() };
  listeners.forEach((l) => l());
}
function persist() {
  AsyncStorage.setItem(KEY, JSON.stringify({ items: state.items, read: state.read, since: state.since })).catch(() => {});
}

export async function loadInbox() {
  if (state.loaded) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw);
      state.items = Array.isArray(v.items) ? v.items : [];
      state.read = Array.isArray(v.read) ? v.read : [];
      state.since = typeof v.since === 'number' ? v.since : 0;
    }
  } catch {}
  state.loaded = true;
  emit();
}

/** دمج خطة جديدة: اللي وقته جه بيفضل زي ما هو (اتبعت خلاص)، واللي جاي بيتبدّل بالخطة الجديدة */
export function syncInbox(plan: PlannedNotif[], now = Date.now()) {
  // أول مرة خالص (تثبيت جديد): اللي فات قبلها ما اتبعتش، فبنعرض من ساعة قبلها بس
  if (!state.since) state.since = now - 3600000;
  const minAt = Math.max(state.since, now - KEEP_DAYS * 86400000);
  const past = state.items.filter((i) => i.at <= now && i.at >= minAt);
  const pastIds = new Set(past.map((i) => i.id));
  const fromPlan = plan.filter((i) => !pastIds.has(i.id) && i.at >= minAt);
  state.items = [...past, ...fromPlan].sort((a, b) => a.at - b.at);
  const ids = new Set(state.items.map((i) => i.id));
  state.read = state.read.filter((id) => ids.has(id));
  persist();
  emit();
}

export function markRead(id: string) {
  if (state.read.includes(id)) return;
  state.read = [...state.read, id];
  persist();
  emit();
}

export function markAllRead() {
  const now = Date.now();
  state.read = Array.from(new Set([...state.read, ...state.items.filter((i) => i.at <= now).map((i) => i.id)]));
  persist();
  emit();
}

/** بيتنادى كل دقيقة علشان التنبيهات اللي وقتها جه تظهر */
export function refreshInboxClock() {
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useInbox() {
  const s = useSyncExternalStore(subscribe, () => state, () => state);
  const delivered = s.items.filter((i) => i.at <= s.now).reverse();
  const read = new Set(s.read);
  return {
    loaded: s.loaded,
    items: delivered,
    isRead: (id: string) => read.has(id),
    unread: delivered.filter((i) => !read.has(i.id)).length,
    now: s.now,
  };
}
