/**
 * البحث في نص القرآن (أوفلاين).
 * بنبحث في نسخة «مبسّطة» من النص بتتعمل في الذاكرة بس — النص الأصلي اللي بيتعرض ما بيتغيرش.
 */
import { ayahs } from './index';

/** بيشيل التشكيل وعلامات الوقف ويوحّد أشكال الألف والياء والتاء المربوطة */
export function normalizeArabic(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـࣰ-ࣿ]/g, '')
    .replace(/[ٱأإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ؤ]/g, 'و')
    .replace(/[ئ]/g, 'ي')
    .replace(/[^ء-ي\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

let index: string[] | null = null;

function getIndex(): string[] {
  if (!index) index = ayahs.map(normalizeArabic);
  return index;
}

/** بيرجّع أرقام الآيات (ترقيم عام) اللي فيها الكلام ده */
export function searchQuran(query: string, limit = 200): { results: number[]; total: number } {
  const q = normalizeArabic(query);
  if (q.length < 2) return { results: [], total: 0 };
  const idx = getIndex();
  const results: number[] = [];
  let total = 0;
  for (let i = 0; i < idx.length; i++) {
    if (idx[i].includes(q)) {
      total++;
      if (results.length < limit) results.push(i + 1);
    }
  }
  return { results, total };
}
