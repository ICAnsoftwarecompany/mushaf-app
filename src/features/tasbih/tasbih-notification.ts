/**
 * السبحة برّه التطبيق (أندرويد): إشعار ثابت بيظهر في شريط الإشعارات ولوحة القفل
 * فيه العدد والذكر و٣ زراير: «سبّح +١» و«الذكر التالي» و«إخفاء».
 *
 * الزراير بتشتغل من غير ما التطبيق يتفتح: expo-notifications بيشغّل مهمة في الخلفية (expo-task-manager)
 * لما المستخدم يدوس زرار والتطبيق في الخلفية أو مقفول (أندرويد بس). والتطبيق مفتوح بيوصل نفس الضغط
 * لـ addNotificationResponseReceivedListener، فبنتجاهل التكرار.
 * العدد متخزن في yatlu.tasbih (tasbih-store.ts) — نفس عدّاد شاشة السبحة.
 *
 * لازم الملف ده يتحمّل بدري (من src/app/_layout.tsx) علشان defineTask تبقى متسجلة قبل ما المهمة تشتغل.
 * iOS: مفيش ضمان إن زراير الإشعار تشتغل في الخلفية من غير ما التطبيق يتفتح، فالميزة لأندرويد بس.
 */
import type * as NotificationsModule from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform, Vibration } from 'react-native';

import { notificationsSupported } from '@/features/notifications/schedule';

import { loadTasbih, PHRASES, saveTasbih, type TasbihState } from './tasbih-store';

export const tasbihNotificationSupported = Platform.OS === 'android' && notificationsSupported;

const TASK = 'yatlu-tasbih-actions';
const NOTIF_ID = 'tasbih';
const CATEGORY = 'tasbih';
const CHANNEL = 'tasbih';
const A_INC = 'tasbih-inc';
const A_NEXT = 'tasbih-next';
const A_HIDE = 'tasbih-hide';

let mod: typeof NotificationsModule | null = null;
function load(): typeof NotificationsModule | null {
  if (!tasbihNotificationSupported) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  if (!mod) mod = require('expo-notifications') as typeof NotificationsModule;
  return mod;
}

type Listener = (s: TasbihState) => void;
const listeners = new Set<Listener>();
/** شاشة السبحة بتسمع هنا علشان العدد يتحدّث لو اتداس زرار الإشعار والتطبيق مفتوح */
export function onTasbihChange(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '٬').replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

let setupDone = false;
async function setup(N: typeof NotificationsModule) {
  if (setupDone) return;
  setupDone = true;
  await N.setNotificationChannelAsync(CHANNEL, {
    name: 'السبحة — Tasbih',
    // DEFAULT (مش LOW) علشان يفضل ظاهر على لوحة القفل، ومن غير صوت ولا اهتزاز
    importance: N.AndroidImportance.DEFAULT,
    sound: null,
    enableVibrate: false,
    showBadge: false,
    lockscreenVisibility: N.AndroidNotificationVisibility.PUBLIC,
  }).catch(() => {});
  await N.setNotificationCategoryAsync(CATEGORY, [
    { identifier: A_INC, buttonTitle: 'سبّح  +١', options: { opensAppToForeground: false } },
    { identifier: A_NEXT, buttonTitle: 'الذكر التالي', options: { opensAppToForeground: false } },
    { identifier: A_HIDE, buttonTitle: 'إخفاء', options: { opensAppToForeground: false } },
  ]).catch(() => {});
}

/** اعرض/حدّث الإشعار بالحالة دي */
async function present(s: TasbihState) {
  const N = load();
  if (!N) return;
  await setup(N);
  const round = s.target > 0 ? `${fmt(s.count % s.target || (s.count ? s.target : 0))} / ${fmt(s.target)}  ·  ` : '';
  await N.scheduleNotificationAsync({
    identifier: NOTIF_ID,
    content: {
      title: `${PHRASES[s.phrase]}  —  ${fmt(s.count)}`,
      body: `${round}اضغط «سبّح» للعد من غير ما تفتح التطبيق`,
      data: { route: '/tasbih' },
      categoryIdentifier: CATEGORY,
      sticky: true,
      autoDismiss: false,
      sound: false,
      priority: N.AndroidNotificationPriority.DEFAULT,
    },
    trigger: { channelId: CHANNEL } as NotificationsModule.NotificationTriggerInput,
  });
}

async function hide() {
  const N = load();
  if (!N) return;
  await N.dismissNotificationAsync(NOTIF_ID).catch(() => {});
}

// الضغطة الواحدة ممكن توصل مرتين (المهمة + الـ listener والتطبيق مفتوح)
const handled = new Map<string, number>();
let chain: Promise<unknown> = Promise.resolve();

async function handleAction(action: string, key: string) {
  if (action !== A_INC && action !== A_NEXT && action !== A_HIDE) return;
  const now = Date.now();
  for (const [k, at] of handled) if (now - at > 5000) handled.delete(k);
  if (handled.has(key)) return;
  handled.set(key, now);
  // الضغطات ورا بعض بتتنفذ بالترتيب علشان العدد ميضيعش
  chain = chain.then(async () => {
    const s = await loadTasbih();
    if (action === A_INC) {
      s.count += 1;
      if (s.target > 0 && s.count % s.target === 0) Vibration.vibrate(120);
    } else if (action === A_NEXT) s.phrase = (s.phrase + 1) % PHRASES.length;
    else s.pinned = false;
    await saveTasbih(s);
    listeners.forEach((l) => l(s));
    if (s.pinned) await present(s);
    else await hide();
  });
  await chain.catch(() => {});
}

function responseKey(r: NotificationsModule.NotificationResponse) {
  return `${r.notification.request.identifier}:${r.notification.date}:${r.actionIdentifier}`;
}

// المهمة لازم تتعرّف على مستوى الملف (مش جوه component)
if (tasbihNotificationSupported) {
  TaskManager.defineTask(TASK, async ({ data, error }) => {
    if (error || !data || typeof data !== 'object' || !('actionIdentifier' in data)) return;
    const r = data as unknown as NotificationsModule.NotificationResponse;
    if (r.notification?.request?.identifier !== NOTIF_ID) return;
    await handleAction(r.actionIdentifier, responseKey(r));
  });
}

let started = false;
/** بيتنادي مرة لما التطبيق يفتح: يسجّل المهمة، ويسمع للزراير والتطبيق مفتوح، ويرجّع الإشعار لو كان متثبّت */
export async function startTasbihNotification(): Promise<void> {
  const N = load();
  if (!N || started) return;
  started = true;
  await N.registerTaskAsync(TASK).catch(() => {});
  N.addNotificationResponseReceivedListener((r) => {
    if (r.notification.request.identifier !== NOTIF_ID) return;
    handleAction(r.actionIdentifier, responseKey(r));
  });
  const s = await loadTasbih();
  if (s.pinned) {
    const perm = await N.getPermissionsAsync();
    if (perm.granted) await present(s);
  }
}

/** تثبيت/إخفاء السبحة في الإشعارات — بيطلب إذن الإشعارات لو محتاج */
export async function setTasbihPinned(pinned: boolean, current: TasbihState): Promise<boolean> {
  const N = load();
  if (!N) return false;
  if (pinned) {
    const cur = await N.getPermissionsAsync();
    const ok = cur.granted || (cur.canAskAgain && (await N.requestPermissionsAsync()).granted);
    if (!ok) return false;
    await N.registerTaskAsync(TASK).catch(() => {});
    await present({ ...current, pinned: true });
  } else await hide();
  return true;
}

/** شاشة السبحة بتنادي ده بعد كل تغيير (بتأخير صغير) علشان الإشعار يفضل متزامن */
export async function syncTasbihNotification(s: TasbihState): Promise<void> {
  if (!s.pinned) return;
  await present(s).catch(() => {});
}
