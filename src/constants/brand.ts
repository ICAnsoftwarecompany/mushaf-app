/**
 * هوية «يتلو»: الألوان الثابتة للوجو والشاشة الافتتاحية.
 * (ألوان القراءة نفسها في src/theme/theme.ts وبتتغير مع الثيم — دي لأ)
 * المصدر: assets/brand/*.svg — التفاصيل في docs/brand.md
 */
import { ayahs, getSurah } from '@/data/quran';

export const Brand = {
  name: 'يتلو',
  nameEn: 'Yatlu',
  tagline: 'المصحف الشريف',
  colors: {
    green: '#1F463D', // الخلفية الأساسية (شاشة البداية وأيقونة أندرويد)
    greenLight: '#2E6153', // أعلى التدرج
    greenDark: '#1A3D35', // أسفل التدرج
    gold: '#C9A86A',
    goldLight: '#E6CB92',
    cream: '#F6EEDC',
  },
} as const;

/** الآية اللي منها اسم التطبيق: «رَسُولٌ مِّنَ اللَّهِ يَتْلُو صُحُفًا مُّطَهَّرَةً» — البينة ٢ */
export const NAME_SURAH = 98;
export const NAME_AYAH = 2;
/** النص من ayahs.json زي ما هو (القاعدة 1: ممنوع كتابة نص قرآني بالإيد) */
export const NAME_AYAH_TEXT = ayahs[getSurah(NAME_SURAH).firstAyah + NAME_AYAH - 2];

/** روابط «عن التطبيق» — املاها قبل النشر (docs/brand.md) */
export const LINKS = {
  website: 'https://yatlu.app',
  /** إيميل الدعم — فاضي = زرار «تواصل معنا» مش هيظهر */
  contactEmail: '',
  /** رقم التطبيق في App Store بعد النشر (للتقييم على iOS) */
  appStoreId: '',
  androidPackage: 'com.icansoftware.yatlu',
};
