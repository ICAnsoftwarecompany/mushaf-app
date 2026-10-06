/**
 * مواقيت الصلاة والقبلة — بتتحسب على الجهاز بمكتبة adhan (من غير إنترنت).
 */
import { CalculationMethod, Coordinates, HighLatitudeRule, Madhab, PrayerTimes, Qibla } from 'adhan';

import type { CalcMethodId, PrayerKey, SavedLocation, Settings } from '@/store/settings-store';

 
/** [الاسم بالإنجليزي، الاسم بالعربي، كود الدولة، خط العرض، خط الطول] */
export type City = [string, string, string, number, number];
export const cities: City[] = require('@/data/cities.json');
/** كود الدولة → [عربي، إنجليزي] */
export const countries: Record<string, [string, string]> = require('@/data/countries.json');
 

export const PRAYERS: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
export const SALAH: Exclude<PrayerKey, 'sunrise'>[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const METHODS: Exclude<CalcMethodId, 'auto'>[] = [
  'Egyptian',
  'MuslimWorldLeague',
  'UmmAlQura',
  'Karachi',
  'NorthAmerica',
  'Dubai',
  'Kuwait',
  'Qatar',
  'Singapore',
  'Turkey',
  'Tehran',
  'MoonsightingCommittee',
];

/** الطريقة المعتمدة في كل بلد (الباقي: رابطة العالم الإسلامي) */
const METHOD_BY_COUNTRY: Record<string, Exclude<CalcMethodId, 'auto'>> = {
  EG: 'Egyptian', SD: 'Egyptian', LY: 'Egyptian', SY: 'Egyptian', LB: 'Egyptian', IQ: 'Egyptian', JO: 'Egyptian', PS: 'Egyptian',
  SA: 'UmmAlQura', YE: 'UmmAlQura', BH: 'UmmAlQura', OM: 'UmmAlQura',
  AE: 'Dubai', KW: 'Kuwait', QA: 'Qatar',
  PK: 'Karachi', IN: 'Karachi', BD: 'Karachi', AF: 'Karachi',
  US: 'NorthAmerica', CA: 'NorthAmerica',
  SG: 'Singapore', MY: 'Singapore', ID: 'Singapore', BN: 'Singapore',
  TR: 'Turkey', IR: 'Tehran',
  GB: 'MoonsightingCommittee',
};

export function resolveMethod(s: Pick<Settings, 'method' | 'location'>): Exclude<CalcMethodId, 'auto'> {
  if (s.method !== 'auto') return s.method;
  return (s.location?.country && METHOD_BY_COUNTRY[s.location.country]) || 'MuslimWorldLeague';
}

export type DayTimes = Record<PrayerKey, Date>;

export function computeTimes(
  s: Pick<Settings, 'method' | 'location' | 'madhab' | 'adjust' | 'dst'>,
  date = new Date()
): DayTimes | null {
  if (!s.location) return null;
  const params = CalculationMethod[resolveMethod(s)]();
  params.madhab = s.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  params.highLatitudeRule = HighLatitudeRule.recommended(new Coordinates(s.location.lat, s.location.lng));
  params.adjustments = { ...params.adjustments, ...s.adjust, sunrise: params.adjustments.sunrise };
  const t = new PrayerTimes(new Coordinates(s.location.lat, s.location.lng), date, params);
  const shift = s.dst ? 60 * 60 * 1000 : 0;
  const out = {} as DayTimes;
  for (const p of PRAYERS) out[p] = new Date(t[p].getTime() + shift);
  return out;
}

/** الصلاة الجاية (لو العشاء عدّى، فجر بكرة) */
export function nextPrayer(
  s: Parameters<typeof computeTimes>[0],
  now = new Date()
): { key: PrayerKey; time: Date } | null {
  const today = computeTimes(s, now);
  if (!today) return null;
  for (const p of PRAYERS) if (today[p] > now) return { key: p, time: today[p] };
  const tomorrow = computeTimes(s, new Date(now.getTime() + 24 * 3600 * 1000));
  return tomorrow ? { key: 'fajr', time: tomorrow.fajr } : null;
}

/** هل الوقت دلوقتي بين المغرب والفجر؟ (للوضع الليلي التلقائي) */
export function isNight(s: Parameters<typeof computeTimes>[0], now = new Date()): boolean | null {
  const t = computeTimes(s, now);
  if (!t) return null;
  return now >= t.maghrib || now < t.fajr;
}

export function qiblaDirection(loc: SavedLocation): number {
  return Qibla(new Coordinates(loc.lat, loc.lng));
}

/** أقرب مدينة (من غير إنترنت) — لمعرفة اسم المدينة والبلد بعد الـ GPS */
export function nearestCity(lat: number, lng: number): City {
  let best = cities[0];
  let bestD = Infinity;
  const cos = Math.cos((lat * Math.PI) / 180);
  for (const c of cities) {
    const dLat = c[3] - lat;
    const dLng = (c[4] - lng) * cos;
    const d = dLat * dLat + dLng * dLng;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

export function cityToLocation(c: City, source: SavedLocation['source'] = 'city'): SavedLocation {
  return { name: c[0], nameAr: c[1] || undefined, country: c[2], lat: c[3], lng: c[4], source };
}

export function locationLabel(loc: SavedLocation, lang: 'ar' | 'en'): string {
  const city = lang === 'ar' ? loc.nameAr || loc.name : loc.name;
  const country = loc.country ? countries[loc.country]?.[lang === 'ar' ? 0 : 1] : undefined;
  return country && country !== city ? `${city}، ${country}`.replace('،', lang === 'ar' ? '،' : ',') : city;
}

export function searchCities(q: string, limit = 60): City[] {
  const s = q.trim().toLowerCase();
  if (!s) return cities.slice(0, limit);
  const out: City[] = [];
  for (const c of cities) {
    const country = countries[c[2]];
    if (
      c[0].toLowerCase().includes(s) ||
      c[1].includes(q.trim()) ||
      country?.[0].includes(q.trim()) ||
      country?.[1].toLowerCase().includes(s)
    ) {
      out.push(c);
      if (out.length >= limit) break;
    }
  }
  return out;
}

export function formatTime(d: Date, lang: 'ar' | 'en'): string {
  try {
    return d.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: 'numeric', minute: '2-digit' });
  } catch {
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${((h + 11) % 12) + 1}:${m} ${h < 12 ? (lang === 'ar' ? 'ص' : 'AM') : lang === 'ar' ? 'م' : 'PM'}`;
  }
}

export function formatDuration(ms: number, lang: 'ar' | 'en'): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const str = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return lang === 'ar' ? str.replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]) : str;
}
