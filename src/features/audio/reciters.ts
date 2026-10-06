/**
 * القرّاء — التلاوات بتتشغل آية بآية من EveryAyah.com (ملف لكل آية بترقيم حفص).
 * ⚠️ أسماء الفولدرات لازم تتأكد على الجهاز قبل النشر (docs/data.md).
 */
export interface Reciter {
  id: string; // اسم الفولدر في EveryAyah
  ar: string;
  en: string;
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
];

export const reciterById = (id: string) => RECITERS.find((r) => r.id === id) ?? RECITERS[0];

const pad3 = (n: number) => String(n).padStart(3, '0');
export const ayahFileName = (surah: number, ayah: number) => `${pad3(surah)}${pad3(ayah)}.mp3`;
export const ayahUrl = (reciter: string, surah: number, ayah: number) =>
  `https://everyayah.com/data/${reciter}/${ayahFileName(surah, ayah)}`;
