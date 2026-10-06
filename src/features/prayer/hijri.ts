/**
 * التاريخ الهجري (أم القرى) — من غير إنترنت.
 */
import { toHijri } from 'hijri-converter';

const MONTHS_AR = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
const MONTHS_EN = ['Muharram', 'Safar', 'Rabiʿ al-Awwal', 'Rabiʿ al-Thani', 'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', 'Shaʿban', 'Ramadan', 'Shawwal', 'Dhu al-Qaʿdah', 'Dhu al-Hijjah'];
const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function hijriDate(d: Date, lang: 'ar' | 'en'): string {
  try {
    const h = toHijri(d.getFullYear(), d.getMonth() + 1, d.getDate());
    if (lang === 'ar') {
      const n = (x: number) => String(x).replace(/[0-9]/g, (c) => '٠١٢٣٤٥٦٧٨٩'[Number(c)]);
      return `${DAYS_AR[d.getDay()]} ${n(h.hd)} ${MONTHS_AR[h.hm - 1]} ${n(h.hy)} هـ`;
    }
    return `${DAYS_EN[d.getDay()]}, ${h.hd} ${MONTHS_EN[h.hm - 1]} ${h.hy} AH`;
  } catch {
    return '';
  }
}

export function gregorianDate(d: Date, lang: 'ar' | 'en'): string {
  try {
    return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return d.toDateString();
  }
}
