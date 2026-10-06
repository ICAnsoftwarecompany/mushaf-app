/**
 * بيانات المصحف (أوفلاين) — الملفات اللي جنبه بيولّدها `npm run build:quran-data`
 * ممنوع تعديل ملفات JSON دي بإيدك. التفاصيل في docs/data.md
 */

/** سطر في صفحة المصحف */
export type Segment = [ayahId: number, fromWord: number, toWord: number, endsAyah: 0 | 1];
export type PageLine = ['h', number] | ['b'] | ['w', ...Segment[]];
export interface MushafPageData {
  page: number;
  lines: PageLine[];
}

export interface Surah {
  id: number;
  name: string;
  nameEn: string;
  type: 'meccan' | 'medinan';
  ayahs: number;
  firstAyah: number; // رقم أول آية في الترقيم العام (1..6236)
  page: number;
}

export interface Juz {
  id: number;
  ayahId: number;
  surah: number;
  ayah: number;
  page: number;
}

export interface Quarter extends Juz {
  hizb: number;
  juz: number;
}

 
export const ayahs: string[] = require('./ayahs.json');
export const surahs: Surah[] = require('./surahs.json');
export const pages: MushafPageData[] = require('./pages.json');
export const juzList: Juz[] = require('./juz.json');
export const quarters: Quarter[] = require('./quarters.json');
export const sajdas: number[] = require('./sajdas.json');
 

export const TOTAL_PAGES = 604;
export const TOTAL_AYAHS = 6236;

/** نص البسملة كما ورد في أول آية من الفاتحة (من غير كتابة يدوية) */
export const BASMALA = ayahs[0];

export function getSurah(id: number): Surah {
  return surahs[id - 1];
}

/** السورة اللي فيها الآية رقم ayahId (ترقيم عام) */
export function surahOfAyah(ayahId: number): Surah {
  let lo = 0;
  let hi = surahs.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (surahs[mid].firstAyah <= ayahId) lo = mid;
    else hi = mid - 1;
  }
  return surahs[lo];
}

/** رقم الآية داخل سورتها */
export function ayahNumber(ayahId: number): number {
  return ayahId - surahOfAyah(ayahId).firstAyah + 1;
}

let pageIndex: Int16Array | null = null;
/** الصفحة اللي بتبدأ فيها الآية */
export function pageOfAyah(ayahId: number): number {
  if (!pageIndex) {
    pageIndex = new Int16Array(TOTAL_AYAHS + 1);
    for (const p of pages)
      for (const line of p.lines)
        if (line[0] === 'w')
          for (const seg of line.slice(1) as Segment[]) if (seg[1] === 0) pageIndex[seg[0]] = p.page;
  }
  return pageIndex[ayahId];
}

/** أول آية في الصفحة */
export function firstAyahOfPage(page: number): number {
  for (const line of pages[page - 1].lines)
    if (line[0] === 'w' && line.length > 1) return (line[1] as Segment)[0];
  return 1;
}

/** رقم الجزء للصفحة (حسب أول آية فيها) */
export function juzOfPage(page: number): number {
  const first = firstAyahOfPage(page);
  let j = 1;
  for (const juz of juzList) if (juz.ayahId <= first) j = juz.id;
  return j;
}

/** الربع اللي فيه أول آية في الصفحة */
export function quarterOfPage(page: number): Quarter {
  const first = firstAyahOfPage(page);
  let q = quarters[0];
  for (const quarter of quarters) if (quarter.ayahId <= first) q = quarter;
  return q;
}

/** السور اللي بتظهر في الصفحة (أول سورة فيها هي اللي بتتكتب في العنوان) */
export function surahsOfPage(page: number): Surah[] {
  const ids = new Set<number>();
  for (const line of pages[page - 1].lines) {
    if (line[0] === 'h') ids.add(line[1]);
    if (line[0] === 'w') for (const seg of line.slice(1) as Segment[]) ids.add(surahOfAyah(seg[0]).id);
  }
  return [...ids].map(getSurah);
}

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export function toArabicDigits(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)]);
}

export const JUZ_NAMES = [
  'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر',
  'الحادي عشر', 'الثاني عشر', 'الثالث عشر', 'الرابع عشر', 'الخامس عشر', 'السادس عشر', 'السابع عشر',
  'الثامن عشر', 'التاسع عشر', 'العشرون', 'الحادي والعشرون', 'الثاني والعشرون', 'الثالث والعشرون',
  'الرابع والعشرون', 'الخامس والعشرون', 'السادس والعشرون', 'السابع والعشرون', 'الثامن والعشرون',
  'التاسع والعشرون', 'الثلاثون',
];

// ───────────────────────── الأحزاب والسجدات واللغة ─────────────────────────

const quarterStart = new Map<number, Quarter>();
for (const q of quarters) quarterStart.set(q.ayahId, q);
const sajdaSet = new Set(sajdas);

/** لو الآية دي بداية ربع حزب → بيانات الربع */
export function quarterStartingAt(ayahId: number): Quarter | undefined {
  return quarterStart.get(ayahId);
}

export function isSajda(ayahId: number): boolean {
  return sajdaSet.has(ayahId);
}

/** أرباع الأحزاب اللي بتبدأ في الصفحة */
export function quartersOnPage(page: number): Quarter[] {
  return quarters.filter((q) => q.page === page);
}

export function surahLabel(s: Surah, lang: 'ar' | 'en'): string {
  return lang === 'ar' ? s.name : s.nameEn;
}

export function juzLabel(id: number, lang: 'ar' | 'en'): string {
  return lang === 'ar' ? `الجزء ${JUZ_NAMES[id - 1]}` : `Juz ${id}`;
}

/** «ربع الحزب ٣» … حسب موضع الربع (1..4) */
export function quarterLabel(q: Quarter, lang: 'ar' | 'en'): string {
  const pos = (q.id - 1) % 4;
  const n = lang === 'ar' ? toArabicDigits(q.hizb) : String(q.hizb);
  if (pos === 0) return lang === 'ar' ? `الحزب ${n}` : `Hizb ${n}`;
  const ar = ['', 'ربع', 'نصف', 'ثلاثة أرباع'][pos];
  const en = ['', '¼', '½', '¾'][pos];
  return lang === 'ar' ? `${ar} الحزب ${n}` : `${en} Hizb ${n}`;
}
