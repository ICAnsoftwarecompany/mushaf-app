/**
 * بيانات إضافية بتتحمّل وقت الحاجة: التفسير الميسر، والترجمة الإنجليزية، ومواضع التجويد.
 * بيتولدوا بـ `npm run build:extra-data` — التفاصيل في docs/data.md
 */
import { loadAssetText } from './load-text';

let tafsir: Promise<string[]> | null = null;
let translation: Promise<string[]> | null = null;
let tajweed: number[][] | null = null;

/* eslint-disable @typescript-eslint/no-require-imports */
export function getTafsir(): Promise<string[]> {
  if (!tafsir) tafsir = loadAssetText(require('@/assets/data/tafsir-muyassar.ytd')).then(JSON.parse);
  tafsir.catch(() => (tafsir = null));
  return tafsir;
}

export function getTranslation(): Promise<string[]> {
  if (!translation) translation = loadAssetText(require('@/assets/data/translation-en.ytd')).then(JSON.parse);
  translation.catch(() => (translation = null));
  return translation;
}

/**
 * مواضع التجويد: لكل آية [بداية، طول، تصنيف، ...] على نص ayahs.json نفسه.
 * التصنيف: 0 مد، 1 غنة وإخفاء، 2 قلقلة، 3 لا يُنطق.
 */
export function getTajweed(): number[][] {
  if (!tajweed) tajweed = require('./tajweed.json');
  return tajweed!;
}
/* eslint-enable @typescript-eslint/no-require-imports */

export type TajweedCategory = 0 | 1 | 2 | 3;
export interface Span {
  text: string;
  cat: TajweedCategory | -1;
}

/**
 * بيقسّم جزء من نص الآية لقطع ملوّنة. القطع لو اتجمعت بترجع نفس النص بالظبط
 * (بنقطّع بس — مفيش أي تعديل في الحروف).
 */
export function tajweedSpans(ayahId: number, text: string, from: number, to: number): Span[] {
  const runs = getTajweed()[ayahId - 1] ?? [];
  const out: Span[] = [];
  let pos = from;
  for (let i = 0; i < runs.length; i += 3) {
    const s = Math.max(runs[i], from);
    const e = Math.min(runs[i] + runs[i + 1], to);
    if (e <= s) continue;
    if (s > pos) out.push({ text: text.slice(pos, s), cat: -1 });
    out.push({ text: text.slice(s, e), cat: runs[i + 2] as TajweedCategory });
    pos = e;
  }
  if (pos < to) out.push({ text: text.slice(pos, to), cat: -1 });
  return out;
}
