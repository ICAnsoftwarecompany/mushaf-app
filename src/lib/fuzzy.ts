/**
 * بحث مرن (أوفلاين بالكامل) — مستخدم في الأذكار والاستماع:
 * - من غير تشكيل، وبيوحّد أ/إ/آ/ٱ → ا، ى → ي، ة → ه، ؤ → و، ئ → ي (زي بحث المصحف).
 * - عربي أو إنجليزي (حروف صغيرة/كبيرة واحد)، والأرقام العربية زي الإنجليزية.
 * - كذا كلمة بأي ترتيب، وجزء من الكلمة كفاية («بقر» تلاقي «البقرة»)، و«ال» في أول الكلمة اختيارية.
 * - بيسامح في غلطة حرف واحد للكلمات من ٤ حروف أو أكتر («الكهق» تلاقي «الكهف»).
 */

const DIACRITICS = /[ؐ-ؚـً-ٰٟۖ-ۭ࣓-ࣿ]/g;

export function normalizeSearch(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(DIACRITICS, '')
    .replace(/[ٱأإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .toLowerCase()
    .replace(/[^ء-يa-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface Searchable {
  text: string; // النص بعد التوحيد
  words: string[];
}

/** حضّر نص العنصر مرة واحدة (مش مع كل حرف بيتكتب) */
export function searchable(...parts: (string | number | null | undefined)[]): Searchable {
  const text = normalizeSearch(parts.filter((p) => p !== null && p !== undefined).join(' '));
  return { text, words: Array.from(new Set(text.split(' '))) };
}

export function queryTokens(query: string): string[] {
  return normalizeSearch(query).split(' ').filter(Boolean);
}

/** فرق حرف واحد بالكتير (تبديل/زيادة/نقص) بين الكلمة وبداية كلمة في النص */
function nearPrefix(token: string, word: string): boolean {
  if (word.length < token.length - 1) return false;
  for (const w of [word.slice(0, token.length), word.slice(0, token.length - 1), word.slice(0, token.length + 1)]) {
    if (editDistanceAtMost1(token, w)) return true;
  }
  return false;
}

function editDistanceAtMost1(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/**
 * درجة التطابق: 0 = مش مطابق. أعلى = أحسن (كلمة كاملة > بداية كلمة > جزء > غلطة حرف).
 */
export function matchScore(item: Searchable, tokens: string[]): number {
  if (!tokens.length) return 1;
  let score = 0;
  for (const raw of tokens) {
    // «ال» في أول الكلمة اختيارية: «البقره» = «بقره»
    const tk = raw.length > 3 && raw.startsWith('ال') ? raw.slice(2) : raw;
    if (item.words.includes(tk) || item.words.includes(`ال${tk}`)) score += 4;
    else if (item.words.some((w) => w.startsWith(tk) || w.startsWith(`ال${tk}`))) score += 3;
    else if (item.text.includes(tk) || item.text.replace(/ /g, '').includes(tk)) score += 2;
    else if (raw.length >= 4 && item.words.some((w) => nearPrefix(tk, w) || (w.startsWith('ال') && nearPrefix(tk, w.slice(2))))) score += 1;
    else return 0;
  }
  return score;
}

/** فلترة ورتّب: الأحسن تطابقًا الأول، ولو متساويين يفضل الترتيب الأصلي */
export function fuzzyFilter<T>(items: T[], query: string, key: (item: T) => Searchable): T[] {
  const tokens = queryTokens(query);
  if (!tokens.length) return items;
  return items
    .map((item, i) => ({ item, i, s: matchScore(key(item), tokens) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.item);
}
