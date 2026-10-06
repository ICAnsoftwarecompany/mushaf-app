/**
 * اللغة والاتجاه.
 *   const { t, lang, isAr, dir, num } = useI18n();
 *   t('pageN', { n: 5 })     →  «صفحة ٥» أو «Page 5»
 *   dir.row                  →  صف بيبدأ من اليمين في العربي ومن الشمال في الإنجليزي
 *   dir.start / dir.end      →  محاذاة النص لبداية/نهاية السطر حسب اللغة
 *
 * الاتجاه بيتحسب نسبةً لاتجاه الجهاز الأصلي (I18nManager.isRTL)، فبيشتغل صح
 * سواء الموبايل لغته عربي أو إنجليزي، ومن غير إعادة تشغيل لما المستخدم يغيّر اللغة.
 */
import { useMemo } from 'react';
import { I18nManager, Platform } from 'react-native';

import { type Language, useSettings } from '@/store/settings-store';

import { type StringKey, strings } from './strings';

/** على الويب I18nManager.isRTL مش معرّف — الاتجاه الأصلي هناك LTR */
const NATIVE_RTL = Platform.OS === 'web' ? false : !!I18nManager.isRTL;
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export type FlexRow = 'row' | 'row-reverse';
export type TextAlign = 'left' | 'right';

export interface Direction {
  rtl: boolean;
  row: FlexRow;
  /** محاذاة لبداية السطر (يمين في العربي) */
  start: TextAlign;
  /** محاذاة لنهاية السطر */
  end: TextAlign;
  writingDirection: 'rtl' | 'ltr';
}

/** على أندرويد و iOS، left/right بيتقلبوا لما الجهاز RTL — فبنعكسهم */
const physical = (side: TextAlign): TextAlign => (NATIVE_RTL ? (side === 'left' ? 'right' : 'left') : side);

export function directionFor(lang: Language): Direction {
  const rtl = lang === 'ar';
  return {
    rtl,
    row: rtl === NATIVE_RTL ? 'row' : 'row-reverse',
    start: physical(rtl ? 'right' : 'left'),
    end: physical(rtl ? 'left' : 'right'),
    writingDirection: rtl ? 'rtl' : 'ltr',
  };
}

/** اتجاه النص العربي (القرآن والأذكار) — دايمًا من اليمين مهما كانت لغة الواجهة */
export const ARABIC_DIR = directionFor('ar');

export function translate(lang: Language, key: StringKey, vars?: Record<string, string | number>): string {
  let s: string = strings[lang][key] ?? strings.ar[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(formatNumber(lang, v));
  return s;
}

export function formatNumber(lang: Language, v: string | number): string {
  const s = String(v);
  return lang === 'ar' ? s.replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)]) : s;
}

export function useI18n() {
  const { settings } = useSettings();
  const lang = settings.language;
  return useMemo(
    () => ({
      lang,
      isAr: lang === 'ar',
      dir: directionFor(lang),
      t: (key: StringKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
      num: (v: string | number) => formatNumber(lang, v),
    }),
    [lang]
  );
}

export type { StringKey };
