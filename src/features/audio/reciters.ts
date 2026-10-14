/**
 * القرّاء — نوعين:
 * - آية بآية من EveryAyah.com (ملف لكل آية بترقيم حفص) — تظليل الآية وتقليب الصفحة مع التلاوة.
 * - «سورة كاملة» (surahBase + surahs): ملف واحد لكل سورة، والقارئ مسجّل سور معيّنة بس
 *   (الشيخ محمد رفعت من mp3quran.net). من غير تظليل آية، والسور الناقصة بتتخطى.
 * ⚠️ أسماء الفولدرات لازم تتأكد على الجهاز قبل النشر (docs/data.md).
 */
export interface Reciter {
  id: string; // اسم الفولدر في EveryAyah (أو معرّف داخلي لقرّاء السورة الكاملة)
  ar: string;
  en: string;
  /** قارئ «سورة كاملة»: الرابط الأساسي، والملف = base + رقم السورة ٣ خانات + .mp3 */
  surahBase?: string;
  /** السور المسجّلة بس (لقرّاء السورة الكاملة) */
  surahs?: number[];
  /** المصدر (للعرض) — الافتراضي EveryAyah */
  source?: string;
}

export const RECITERS: Reciter[] = [
  { id: 'Alafasy_128kbps', ar: 'مشاري راشد العفاسي', en: 'Mishary Rashid Alafasy' },
  { id: 'Husary_128kbps', ar: 'محمود خليل الحصري', en: 'Mahmoud Khalil Al-Husary' },
  { id: 'Minshawy_Murattal_128kbps', ar: 'محمد صديق المنشاوي (مرتل)', en: 'Mohamed Siddiq Al-Minshawi (Murattal)' },
  { id: 'Abdul_Basit_Murattal_192kbps', ar: 'عبد الباسط عبد الصمد (مرتل)', en: 'Abdul Basit Abdul Samad (Murattal)' },
  { id: 'Abdurrahmaan_As-Sudais_192kbps', ar: 'عبد الرحمن السديس', en: 'Abdul Rahman Al-Sudais' },
  { id: 'Saood_ash-Shuraym_128kbps', ar: 'سعود الشريم', en: 'Saud Al-Shuraim' },
  { id: 'MaherAlMuaiqly128kbps', ar: 'ماهر المعيقلي', en: 'Maher Al-Muaiqly' },
  { id: 'Abu_Bakr_Ash-Shaatree_128kbps', ar: 'أبو بكر الشاطري', en: 'Abu Bakr Al-Shatri' },
  { id: 'Hudhaify_128kbps', ar: 'علي الحذيفي', en: 'Ali Al-Hudhaify' },
  { id: 'Ghamadi_40kbps', ar: 'سعد الغامدي', en: 'Saad Al-Ghamdi' },
  // اتضافوا 2026-10-14 — كلهم متأكدين كاملين على EveryAyah (recitations_ayat.html)
  { id: 'Yasser_Ad-Dussary_128kbps', ar: 'ياسر الدوسري', en: 'Yasser Al-Dosari' },
  { id: 'Nasser_Alqatami_128kbps', ar: 'ناصر القطامي', en: 'Nasser Al-Qatami' },
  { id: 'Muhammad_Ayyoub_128kbps', ar: 'محمد أيوب', en: 'Muhammad Ayyub' },
  { id: 'Abdullah_Basfar_192kbps', ar: 'عبدالله بصفر', en: 'Abdullah Basfar' },
  { id: 'Muhammad_Jibreel_128kbps', ar: 'محمد جبريل', en: 'Muhammad Jibreel' },
  { id: 'Fares_Abbad_64kbps', ar: 'فارس عباد', en: 'Fares Abbad' },
  { id: 'Khaalid_Abdullaah_al-Qahtaanee_192kbps', ar: 'خالد القحطاني', en: 'Khalid Al-Qahtani' },
  { id: 'Salah_Al_Budair_128kbps', ar: 'صلاح البدير', en: 'Salah Al-Budair' },
  { id: 'Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net', ar: 'أحمد العجمي', en: 'Ahmed Al-Ajmi' },
  { id: 'Hani_Rifai_192kbps', ar: 'هاني الرفاعي', en: 'Hani Al-Rifai' },
  { id: 'Ali_Jaber_64kbps', ar: 'علي جابر', en: 'Ali Jaber' },
  { id: 'Abdullaah_3awwaad_Al-Juhaynee_128kbps', ar: 'عبدالله الجهني', en: 'Abdullah Al-Juhany' },
  { id: 'Minshawy_Mujawwad_192kbps', ar: 'محمد صديق المنشاوي (مجوّد)', en: 'Mohamed Siddiq Al-Minshawi (Mujawwad)' },
  { id: 'Abdul_Basit_Mujawwad_128kbps', ar: 'عبد الباسط عبد الصمد (مجوّد)', en: 'Abdul Basit Abdul Samad (Mujawwad)' },
  { id: 'Husary_128kbps_Mujawwad', ar: 'محمود خليل الحصري (مجوّد)', en: 'Mahmoud Khalil Al-Husary (Mujawwad)' },
  { id: 'Husary_Muallim_128kbps', ar: 'محمود خليل الحصري (المعلّم)', en: 'Mahmoud Khalil Al-Husary (Teacher)' },
  // سورة كاملة — mp3quran.net (القارئ 241، مصحف 241: حفص مرتل). «يحق لأي زائر أو مطور استخدام اي مادة» (mp3quran.net/ar/privacy)
  {
    id: 'mp3quran_muhammad-refaat',
    ar: 'محمد رفعت',
    en: 'Mohamed Refaat',
    surahBase: 'https://cdn.mp3quran.net/audio/muhammad-refaat/r1/',
    surahs: [1, 10, 11, 12, 17, 18, 19, 20, 48, 54, 55, 56, 69, 72, 73, 75, 76, 77, 78, 79, 81, 82, 83, 85, 86, 87, 88, 89, 96, 98, 100],
    source: 'mp3quran.net',
  },
];

export const reciterById = (id: string) => RECITERS.find((r) => r.id === id) ?? RECITERS[0];

/** قارئ «سورة كاملة» (ملف لكل سورة)؟ */
export const isSurahReciter = (id: string) => !!reciterById(id).surahBase;
/** القارئ مسجّل السورة دي؟ (قرّاء آية بآية = كل السور) */
export const reciterHasSurah = (id: string, surah: number) => {
  const r = reciterById(id);
  return !r.surahs || r.surahs.includes(surah);
};

const pad3 = (n: number) => String(n).padStart(3, '0');
/** اسم الملف: SSSAAA.mp3 للآية، أو SSS.mp3 للسورة الكاملة (ayah = 0) */
export const ayahFileName = (surah: number, ayah: number) => (ayah === 0 ? `${pad3(surah)}.mp3` : `${pad3(surah)}${pad3(ayah)}.mp3`);
export const ayahUrl = (reciter: string, surah: number, ayah: number) => {
  const r = reciterById(reciter);
  if (r.surahBase) return `${r.surahBase}${pad3(surah)}.mp3`;
  return `https://everyayah.com/data/${reciter}/${ayahFileName(surah, ayah)}`;
};
