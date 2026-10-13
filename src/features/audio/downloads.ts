/**
 * مدير التحميل: طابور تحميلات (سورة أو جزء) بيكمّل حتى لو المستخدم اتنقل بين الشاشات،
 * وكل الشاشات بتشوف نفس التقدّم (شريط التلاوة في القارئ + تاب الاستماع).
 *
 * علشان السور الكبيرة (البقرة = ٢٨٧ ملف) تتحمّل كاملة:
 * - كل ملف بيتجرّب ٣ مرات، والملف اللي فشل ما بيوقفش الباقي، وفي الآخر لفّة تانية للي فشل.
 * - لو النت قطع خالص (٦ ملفات فشلت ورا بعض) بيقف ويكمّل بعدين.
 * - الشاشة بتفضل منورة أثناء التحميل (علشان الموبايل ما يوقفش التطبيق).
 * - الطابور متخزن (yatlu.downloadQueue): أي تحميل ما خلصش بيكمّل لوحده لما التطبيق يتفتح أو يرجع
 *   (resumeDownloads من _layout.tsx) — ومن غير ما يحمّل اللي اتحمّل قبل كده تاني.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useSyncExternalStore } from 'react';

import { getSurah, juzList, surahOfAyah, ayahNumber, TOTAL_AYAHS } from '@/data/quran';

import { canDownload, deleteFiles, downloadAyahFile, downloadedNames } from './offline';
import { ayahFileName } from './reciters';

export type AyahRef = [surah: number, ayah: number];

/** ملفات السورة: آياتها + البسملة (من الفاتحة) لكل السور ما عدا الفاتحة والتوبة */
export function surahFiles(s: number): AyahRef[] {
  const out: AyahRef[] = [];
  if (s !== 1 && s !== 9) out.push([1, 1]);
  for (let a = 1; a <= getSurah(s).ayahs; a++) out.push([s, a]);
  return out;
}

export function juzRange(j: number): [first: number, last: number] {
  const first = juzList[j - 1].ayahId;
  const last = j < 30 ? juzList[j].ayahId - 1 : TOTAL_AYAHS;
  return [first, last];
}

export function juzFiles(j: number): AyahRef[] {
  const [first, last] = juzRange(j);
  const out: AyahRef[] = [];
  const seen = new Set<number>();
  for (let id = first; id <= last; id++) {
    const s = surahOfAyah(id).id;
    const a = ayahNumber(id);
    if (a === 1 && s !== 1 && s !== 9 && !seen.has(1)) {
      seen.add(1);
      out.push([1, 1]);
    }
    out.push([s, a]);
  }
  return out;
}

export interface Job {
  key: string; // مثلًا "Alafasy_128kbps:s2" أو ":j30"
  reciter: string;
  files: AyahRef[];
  done: number;
  failed: boolean;
}

let jobs: Job[] = [];
let version = 0;
let running = false;
const cancelled = new Set<string>();
const listeners = new Set<() => void>();
let snapshot = { jobs, version };

function emit() {
  snapshot = { jobs, version };
  listeners.forEach((l) => l());
}

export const jobKey = (reciter: string, kind: 's' | 'j', n: number) => `${reciter}:${kind}${n}`;

const QUEUE_KEY = 'yatlu.downloadQueue';
const CONCURRENCY = 4;
const MAX_CONSECUTIVE_FAILS = 6;

/** الطابور اللي لسه ما خلصش (بالمفتاح بس — الملفات بتتحسب من المفتاح) */
let pending: string[] = [];
function savePending() {
  AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(pending)).catch(() => {});
}

/** "Alafasy_128kbps:s2" → ملفات سورة ٢ */
function filesForKey(key: string): { reciter: string; files: AyahRef[] } | null {
  const m = key.match(/^(.+):([sj])(\d+)$/);
  if (!m) return null;
  const n = Number(m[3]);
  if (m[2] === 's' && n >= 1 && n <= 114) return { reciter: m[1], files: surahFiles(n) };
  if (m[2] === 'j' && n >= 1 && n <= 30) return { reciter: m[1], files: juzFiles(n) };
  return null;
}

export function startDownload(key: string, reciter: string, files: AyahRef[]) {
  if (!canDownload || jobs.some((j) => j.key === key)) return;
  cancelled.delete(key);
  if (lastFailed === key) lastFailed = null;
  jobs = [...jobs, { key, reciter, files, done: 0, failed: false }];
  if (!pending.includes(key)) {
    pending = [...pending, key];
    savePending();
  }
  emit();
  void run();
}

export function cancelDownload(key: string) {
  cancelled.add(key);
  jobs = jobs.filter((j) => j.key !== key);
  pending = pending.filter((k) => k !== key);
  savePending();
  version++;
  emit();
}

let resumedOnce = false;
/** كمّل أي تحميل ما خلصش (التطبيق اتقفل أو النت قطع) — بيتنادى لما التطبيق يفتح أو يرجع */
export async function resumeDownloads(): Promise<void> {
  if (!canDownload) return;
  if (!resumedOnce) {
    resumedOnce = true;
    try {
      const saved = JSON.parse((await AsyncStorage.getItem(QUEUE_KEY)) ?? '[]');
      if (Array.isArray(saved)) pending = Array.from(new Set([...pending, ...saved.filter((k) => typeof k === 'string')]));
    } catch {}
  }
  for (const key of pending) {
    const spec = filesForKey(key);
    if (!spec) continue;
    if (!jobs.some((j) => j.key === key)) jobs = [...jobs, { key, reciter: spec.reciter, files: spec.files, done: 0, failed: false }];
  }
  emit();
  void run();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** ملف واحد بـ ٣ محاولات */
async function fetchFile(reciter: string, s: number, a: number): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (await downloadAyahFile(reciter, s, a)) return true;
    await sleep(700 * (attempt + 1));
  }
  return false;
}

async function run() {
  if (running || !jobs.length) return;
  running = true;
  activateKeepAwakeAsync('downloads').catch(() => {});
  try {
    while (jobs.length) {
      const job = jobs[0];
      const have = downloadedNames(job.reciter);
      let todo = job.files.filter(([s, a]) => !have.has(ayahFileName(s, a)));
      let done = job.files.length - todo.length;
      let offline = false;
      jobs = jobs.map((j) => (j.key === job.key ? { ...j, done } : j));
      emit();
      // لفّتين: الأولى لكل الملفات، والتانية للي فشل
      for (let pass = 0; pass < 2 && todo.length && !offline && !cancelled.has(job.key); pass++) {
        const failedFiles: AyahRef[] = [];
        let streak = 0;
        for (let i = 0; i < todo.length && !cancelled.has(job.key); i += CONCURRENCY) {
          const batch = todo.slice(i, i + CONCURRENCY);
          const res = await Promise.all(batch.map(([s, a]) => fetchFile(job.reciter, s, a)));
          res.forEach((ok, k) => {
            if (ok) {
              done++;
              streak = 0;
            } else {
              failedFiles.push(batch[k]);
              streak++;
            }
          });
          jobs = jobs.map((j) => (j.key === job.key ? { ...j, done } : j));
          emit();
          if (streak >= MAX_CONSECUTIVE_FAILS) {
            offline = true; // النت قطع غالبًا — نكمّل بعدين
            break;
          }
        }
        todo = failedFiles;
      }
      const nowHave = downloadedNames(job.reciter);
      const complete = !cancelled.has(job.key) && job.files.every(([s, a]) => nowHave.has(ayahFileName(s, a)));
      jobs = jobs.filter((j) => j.key !== job.key);
      if (complete) {
        pending = pending.filter((k) => k !== job.key);
        savePending();
        if (lastFailed === job.key) lastFailed = null;
      } else if (!cancelled.has(job.key)) {
        lastFailed = job.key; // بيفضل في الطابور المتخزن ويكمّل لوحده بعدين
      }
      version++;
      emit();
      if (offline) {
        // ما نجربش باقي الطابور والنت قاطع — كله متخزن في pending ويكمّل لما التطبيق يرجع
        jobs = [];
        emit();
        break;
      }
    }
  } finally {
    running = false;
    deactivateKeepAwake('downloads').catch(() => {});
  }
}

/** آخر تحميل فشل (غالبًا مفيش إنترنت) */
export let lastFailed: string | null = null;
export function clearFailed() {
  lastFailed = null;
  emit();
}

export function deleteSurahFiles(reciter: string, s: number) {
  const names: string[] = [];
  for (let a = 1; a <= getSurah(s).ayahs; a++) names.push(ayahFileName(s, a));
  deleteFiles(reciter, names);
  version++;
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** حالة التحميلات + دالة بتقول الملفات متحمّلة ولا لأ (بتتحدث بعد كل تحميل أو حذف) */
export function useDownloads(reciter: string) {
  const snap = useSyncExternalStore(subscribe, () => snapshot, () => snapshot);
  const names = cachedNames(reciter, snap.version);
  return {
    jobs: snap.jobs,
    failedKey: lastFailed,
    job: (key: string) => snap.jobs.find((j) => j.key === key),
    isComplete: (files: AyahRef[]) => canDownload && files.every(([s, a]) => names.has(ayahFileName(s, a))),
    downloadedSurahs: () => {
      if (!canDownload) return [] as number[];
      const out: number[] = [];
      for (let s = 1; s <= 114; s++) if (surahFiles(s).every(([x, a]) => names.has(ayahFileName(x, a)))) out.push(s);
      return out;
    },
  };
}

let cache: { key: string; names: Set<string> } | null = null;
function cachedNames(reciter: string, v: number) {
  const key = `${reciter}@${v}`;
  if (cache?.key !== key) cache = { key, names: downloadedNames(reciter) };
  return cache.names;
}
