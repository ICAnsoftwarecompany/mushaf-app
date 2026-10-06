/**
 * مدير التحميل: طابور تحميلات (سورة أو جزء) بيكمّل حتى لو المستخدم اتنقل بين الشاشات،
 * وكل الشاشات بتشوف نفس التقدّم (شريط التلاوة في القارئ + تاب الاستماع).
 */
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

export function startDownload(key: string, reciter: string, files: AyahRef[]) {
  if (!canDownload || jobs.some((j) => j.key === key)) return;
  cancelled.delete(key);
  jobs = [...jobs, { key, reciter, files, done: 0, failed: false }];
  emit();
  void run();
}

export function cancelDownload(key: string) {
  cancelled.add(key);
  jobs = jobs.filter((j) => j.key !== key);
  version++;
  emit();
}

async function run() {
  if (running) return;
  running = true;
  try {
    while (jobs.length) {
      const job = jobs[0];
      const have = downloadedNames(job.reciter);
      const todo = job.files.filter(([s, a]) => !have.has(ayahFileName(s, a)));
      let done = job.files.length - todo.length;
      let failed = false;
      // 3 ملفات في نفس الوقت
      for (let i = 0; i < todo.length && !cancelled.has(job.key); i += 3) {
        const batch = todo.slice(i, i + 3);
        const res = await Promise.all(batch.map(([s, a]) => downloadAyahFile(job.reciter, s, a)));
        if (res.some((ok) => !ok)) {
          failed = true;
          break;
        }
        done += batch.length;
        jobs = jobs.map((j) => (j.key === job.key ? { ...j, done } : j));
        emit();
      }
      jobs = jobs.filter((j) => j.key !== job.key);
      if (failed && !cancelled.has(job.key)) lastFailed = job.key;
      version++;
      emit();
    }
  } finally {
    running = false;
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
