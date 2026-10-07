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
/**
 * علامات التشكيل والضبط (حركات، شدة، سكون، مدّ، علامات الوقف الصغيرة…) — لازم تفضل لازقة في الحرف اللي قبلها.
 * ⚠️ لو التلوين قسم الحرف عن تشكيله، أندرويد بيرسم التشكيل لوحده بعيد عن الحرف (والكلمة بتتكسر).
 * نفس القايمة في scripts/tests/data.test.mjs.
 */
export const COMBINING = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u08D3-\u08FF]/;
const isMark = (ch: string | undefined) => !!ch && COMBINING.test(ch);

export function tajweedSpans(ayahId: number, text: string, from: number, to: number): Span[] {
  const runs = getTajweed()[ayahId - 1] ?? [];
  const out: Span[] = [];
  let pos = from;
  for (let i = 0; i < runs.length; i += 3) {
    let s = Math.max(runs[i], from);
    let e = Math.min(runs[i] + runs[i + 1], to);
    // حدود اللون على «حرف كامل بتشكيله» بس: البداية ترجع للحرف، والنهاية تاخد التشكيل اللي بعدها
    while (s > from && isMark(text[s])) s--;
    while (e < to && isMark(text[e])) e++;
    s = Math.max(s, pos);
    if (e <= s) continue;
    if (s > pos) out.push({ text: text.slice(pos, s), cat: -1 });
    out.push({ text: text.slice(s, e), cat: runs[i + 2] as TajweedCategory });
    pos = e;
  }
  if (pos < to) out.push({ text: text.slice(pos, to), cat: -1 });
  return out;
}
