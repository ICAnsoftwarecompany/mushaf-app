// theme.ts
// ثيمات تطبيق المصحف — كل ثيم فيه نفس المفاتيح بالظبط

export type ThemeId =
  | 'classic'
  | 'white'
  | 'sepia'
  | 'mint'
  | 'night'
  | 'navy'
  | 'oled';

export type ThemeMode = ThemeId | 'system'; // system = يتبع إعداد الموبايل

export interface TajweedColors {
  madd: string;      // المد اللازم والواجب
  ghunnah: string;   // الغنة والإخفاء
  tafkheem: string;  // التفخيم
  silent: string;    // الحروف التي لا تُنطق
}

export interface MushafTheme {
  id: ThemeId;
  name: string;            // الاسم اللي يظهر للمستخدم
  nameEn: string;
  isDark: boolean;
  colors: {
    background: string;    // خلفية الصفحة
    surface: string;       // خلفية الكروت والقوائم والشريط السفلي
    text: string;          // نص الآيات
    textSecondary: string; // نصوص ثانوية (تفسير، أرقام الصفحات)
    accent: string;        // الإطار، أسماء السور، أرقام الآيات
    accentSoft: string;    // علامات الأجزاء والأحزاب والسجدة
    highlight: string;     // تظليل الآية المختارة أو اللي بتتقرأ
    border: string;        // الفواصل والخطوط
    statusBar: 'light-content' | 'dark-content';
  };
  tajweed: TajweedColors;
}

// ألوان تجويد للثيمات الفاتحة والغامقة (الغامقة أفتح شوية علشان تبان)
const tajweedLight: TajweedColors = {
  madd: '#D32F2F',
  ghunnah: '#388E3C',
  tafkheem: '#1976D2',
  silent: '#9E9E9E',
};

const tajweedDark: TajweedColors = {
  madd: '#EF7A7A',
  ghunnah: '#7BC67E',
  tafkheem: '#6FA8E8',
  silent: '#7A7A7A',
};

export const themes: Record<ThemeId, MushafTheme> = {
  classic: {
    id: 'classic',
    name: 'كلاسيك',
    nameEn: 'Classic',
    isDark: false,
    colors: {
      background: '#FDF6E3',
      surface: '#F6EDD5',
      text: '#2B2B2B',
      textSecondary: '#6B6253',
      accent: '#B08D57',
      accentSoft: '#D4BC8E',
      highlight: 'rgba(176,141,87,0.18)',
      border: '#E8DCC0',
      statusBar: 'dark-content',
    },
    tajweed: tajweedLight,
  },

  white: {
    id: 'white',
    name: 'أبيض',
    nameEn: 'White',
    isDark: false,
    colors: {
      background: '#FAFAF7',
      surface: '#F0F0EB',
      text: '#1F1F1F',
      textSecondary: '#5F5F5A',
      accent: '#2E7D5B',
      accentSoft: '#8CC2A8',
      highlight: 'rgba(46,125,91,0.14)',
      border: '#E3E3DD',
      statusBar: 'dark-content',
    },
    tajweed: tajweedLight,
  },

  sepia: {
    id: 'sepia',
    name: 'سيبيا',
    nameEn: 'Sepia',
    isDark: false,
    colors: {
      background: '#F1E7D0',
      surface: '#E8DBBE',
      text: '#3B2F24',
      textSecondary: '#6E5B47',
      accent: '#8B5E34',
      accentSoft: '#BF9A72',
      highlight: 'rgba(139,94,52,0.18)',
      border: '#DCCBA8',
      statusBar: 'dark-content',
    },
    tajweed: tajweedLight,
  },

  mint: {
    id: 'mint',
    name: 'أخضر هادي',
    nameEn: 'Mint',
    isDark: false,
    colors: {
      background: '#EEF5EE',
      surface: '#E1EDE2',
      text: '#1E2B22',
      textSecondary: '#4F6355',
      accent: '#3E7D57',
      accentSoft: '#94BFA2',
      highlight: 'rgba(62,125,87,0.16)',
      border: '#D2E2D4',
      statusBar: 'dark-content',
    },
    tajweed: tajweedLight,
  },

  night: {
    id: 'night',
    name: 'ليلي',
    nameEn: 'Night',
    isDark: true,
    colors: {
      background: '#1A1A1A',
      surface: '#242424',
      text: '#E6E0D4',
      textSecondary: '#A39E93',
      accent: '#C9A86A',
      accentSoft: '#8A7550',
      highlight: 'rgba(201,168,106,0.22)',
      border: '#333333',
      statusBar: 'light-content',
    },
    tajweed: tajweedDark,
  },

  navy: {
    id: 'navy',
    name: 'كحلي',
    nameEn: 'Navy',
    isDark: true,
    colors: {
      background: '#141B26',
      surface: '#1C2533',
      text: '#E3E6EC',
      textSecondary: '#9AA3B2',
      accent: '#D2B57A',
      accentSoft: '#8C7A55',
      highlight: 'rgba(210,181,122,0.2)',
      border: '#2A3546',
      statusBar: 'light-content',
    },
    tajweed: tajweedDark,
  },

  oled: {
    id: 'oled',
    name: 'أسود',
    nameEn: 'Black',
    isDark: true,
    colors: {
      background: '#000000',
      surface: '#0F0F0F',
      text: '#D9D4C7',
      textSecondary: '#8F8A80',
      accent: '#A88B55',
      accentSoft: '#6E5C3A',
      highlight: 'rgba(168,139,85,0.22)',
      border: '#1F1F1F',
      statusBar: 'light-content',
    },
    tajweed: tajweedDark,
  },
};

export const themeList: MushafTheme[] = Object.values(themes);

// الثيم اللي يتطبق لما المستخدم يختار "تلقائي"
export const SYSTEM_LIGHT: ThemeId = 'classic';
export const SYSTEM_DARK: ThemeId = 'night';
export const DEFAULT_MODE: ThemeMode = 'system';
