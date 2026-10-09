/**
 * فهرس البحث في الأذكار (على الجهاز): أسماء الأقسام + نص كل ذكر.
 * الأذكار اللي هي آيات بيتبحث فيها بنصها من ayahs.json (القاعدة 1 — مفيش نص قرآن مكتوب هنا).
 */
import { type AzkarCategory, azkarCategories } from '@/data/azkar';
import { ayahs } from '@/data/quran';
import { fuzzyFilter, queryTokens, type Searchable, searchable } from '@/lib/fuzzy';

export interface ZekrHit {
  cat: AzkarCategory;
  index: number;
  text: string; // النص المعروض في النتيجة
  quran: boolean; // آيات (تتعرض بخط المصحف)
}

let catIndex: { cat: AzkarCategory; s: Searchable }[] | null = null;
let zekrIndex: (ZekrHit & { s: Searchable })[] | null = null;

export function zekrDisplayText(z: AzkarCategory['items'][number]): string {
  if (z.text) return z.text;
  return (z.quran ?? []).map(([from, to]) => ayahs.slice(from - 1, to).join(' ')).join(' ');
}

function build() {
  if (catIndex && zekrIndex) return;
  catIndex = azkarCategories.map((cat) => ({ cat, s: searchable(cat.name) }));
  zekrIndex = azkarCategories.flatMap((cat) =>
    cat.items.map((z, index) => {
      const text = zekrDisplayText(z);
      return { cat, index, text, quran: !z.text, s: searchable(z.intro, text, z.note, z.ref) };
    })
  );
}

export function searchAzkar(query: string, limit = 60): { cats: AzkarCategory[]; zekrs: ZekrHit[] } {
  if (!queryTokens(query).length) return { cats: [], zekrs: [] };
  build();
  const cats = fuzzyFilter(catIndex!, query, (x) => x.s).map((x) => x.cat);
  const zekrs = fuzzyFilter(zekrIndex!, query, (x) => x.s).slice(0, limit);
  return { cats, zekrs };
}

