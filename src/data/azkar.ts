/**
 * الأذكار (حصن المسلم) — بتتولد بـ `npm run build:extra-data` (docs/data.md).
 * الأذكار اللي هي آيات بتشاور على أرقام الآيات، والنص بيتعرض من ayahs.json (القاعدة 1).
 */
export interface Zekr {
  text: string | null;
  quran?: [number, number][]; // [من آية، إلى آية] بالترقيم العام
  intro?: string;
  note?: string;
  count: number;
  ref?: string;
}

export interface AzkarCategory {
  id: number;
  name: string;
  items: Zekr[];
}

 
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { gazaCategory } = require('./gaza-duas') as typeof import('./gaza-duas');
const data: { categories: AzkarCategory[] } = require('./azkar.json');

/** مجموعة «الدعاء لغزة» (مكتوبة بالإيد) + أقسام حصن المسلم */
export const azkarCategories: AzkarCategory[] = [gazaCategory, ...data.categories];
export const getCategory = (id: number) => azkarCategories.find((c) => c.id === id);

/** الأقسام الأساسية اللي بتظهر فوق */
export const FEATURED = ['أذكار الصباح', 'أذكار المساء', 'الأذكار بعد السلام من الصلاة', 'أذكار النوم'];
export const featuredCategories = FEATURED.map((n) => azkarCategories.find((c) => c.name === n)).filter(Boolean) as AzkarCategory[];
