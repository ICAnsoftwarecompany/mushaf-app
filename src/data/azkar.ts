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

 
const data: { categories: AzkarCategory[] } = require('./azkar.json');

export const azkarCategories = data.categories;
export const getCategory = (id: number) => azkarCategories.find((c) => c.id === id);

/** الأقسام الأساسية اللي بتظهر فوق */
export const FEATURED = ['أذكار الصباح', 'أذكار المساء', 'الأذكار بعد السلام من الصلاة', 'أذكار النوم'];
export const featuredCategories = FEATURED.map((n) => azkarCategories.find((c) => c.name === n)).filter(Boolean) as AzkarCategory[];
