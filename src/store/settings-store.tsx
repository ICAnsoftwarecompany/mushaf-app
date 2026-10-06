/**
 * كل إعدادات التطبيق في مكان واحد — بتتحفظ على الجهاز (AsyncStorage) وبتشتغل أوفلاين.
 * الثيم وألوان التجويد لسه في src/theme/ThemeContext.tsx.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type Language = 'ar' | 'en';
export type PrayerKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type CalcMethodId =
  | 'auto'
  | 'Egyptian'
  | 'MuslimWorldLeague'
  | 'UmmAlQura'
  | 'Karachi'
  | 'NorthAmerica'
  | 'Dubai'
  | 'Kuwait'
  | 'Qatar'
  | 'Singapore'
  | 'Turkey'
  | 'Tehran'
  | 'MoonsightingCommittee';

export interface SavedLocation {
  lat: number;
  lng: number;
  name: string; // اسم المدينة بالإنجليزي (أو اللي رجع من GPS)
  nameAr?: string;
  country?: string; // كود الدولة ISO (EG, SA, …)
  source: 'gps' | 'city';
}

export interface Settings {
  // عام
  language: Language;
  uiScale: number; // 1..10 (5 = عادي)
  uiBold: boolean;
  showIntro: boolean;
  haptics: boolean;
  keepAwake: boolean;
  /** الوضع الغامق تلقائي بعد المغرب والفاتح بعد الفجر (بيستخدم مواقيت الصلاة) */
  nightByPrayer: boolean;

  // المصحف
  mushafMode: 'pages' | 'text';
  mushafScale: number; // 1..10 — في وضع «نص متصل» وفي الشاشات التانية
  /** تكبير الخط في وضع الصفحات (1 = ترتيب سطور المصحف بالظبط، أكبر = السطور بتلف) */
  pageZoom: number;
  mushafBold: boolean;
  showMargins: boolean;
  showTranslation: boolean; // ترجمة المعاني تحت الآية في وضع النص المتصل
  reciter: string;
  repeatAyah: number; // عدد مرات تكرار الآية في التلاوة (1 = من غير تكرار)

  // مواقيت الصلاة
  method: CalcMethodId;
  madhab: 'shafi' | 'hanafi';
  dst: boolean; // التوقيت الصيفي: +1 ساعة
  adjust: Record<Exclude<PrayerKey, 'sunrise'>, number>; // تعديل يدوي بالدقايق
  location: SavedLocation | null;
  autoLocation: boolean; // تحديد الموقع بالـ GPS
  useInternetForCity: boolean; // اسم المدينة من الإنترنت بعد الـ GPS

  // الإشعارات
  notifyAdhan: boolean;
  notifyPrayers: Record<Exclude<PrayerKey, 'sunrise'>, boolean>;
  adhanSound: boolean;
  preReminder: number; // دقايق قبل الصلاة (0 = لأ)
  notifyAzkar: boolean;
  morningAzkarTime: string; // "HH:MM"
  eveningAzkarTime: string;
  notifyWird: boolean;
  wirdTime: string;
  notifyKahf: boolean;
  /** تذكير قبل خروج وقت الصلاة لو ما اتعلّمش عليها في قايمة الفروض */
  notifyMissedPrayer: boolean;
  missedReminderMin: number;

  // الأذكار
  removeFinishedAzkar: boolean;
  vibrateOnFinish: boolean;

  // الورد
  wirdPagesPerDay: number;
}

const deviceLanguage = (): Language => {
  try {
    return getLocales()[0]?.languageCode === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
};

export const DEFAULT_SETTINGS: Settings = {
  language: deviceLanguage(),
  uiScale: 5,
  uiBold: false,
  showIntro: true,
  haptics: true,
  keepAwake: true,
  nightByPrayer: false,

  mushafMode: 'pages',
  mushafScale: 5,
  pageZoom: 1,
  mushafBold: false,
  showMargins: true,
  showTranslation: false,
  reciter: 'Alafasy_128kbps',
  repeatAyah: 1,

  method: 'auto',
  madhab: 'shafi',
  dst: false,
  adjust: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
  location: null,
  autoLocation: true,
  useInternetForCity: true,

  notifyAdhan: true,
  notifyPrayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
  adhanSound: true,
  preReminder: 0,
  notifyAzkar: true,
  morningAzkarTime: '06:30',
  eveningAzkarTime: '17:00',
  notifyWird: false,
  wirdTime: '20:00',
  notifyKahf: true,
  notifyMissedPrayer: true,
  missedReminderMin: 30,

  removeFinishedAzkar: true,
  vibrateOnFinish: true,

  wirdPagesPerDay: 4,
};

const KEY = 'yatlu.settings';

interface SettingsContextValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
  /** للاستيراد من نسخة احتياطية */
  replaceAll: (s: Partial<Settings>) => void;
  ready: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/** بيدمج الإعدادات المحفوظة مع الافتراضية (علشان الإعدادات الجديدة في التحديثات تاخد قيمتها الافتراضية) */
function merge(saved: Partial<Settings> | null): Settings {
  const s = { ...DEFAULT_SETTINGS, ...(saved ?? {}) };
  s.adjust = { ...DEFAULT_SETTINGS.adjust, ...(saved?.adjust ?? {}) };
  s.notifyPrayers = { ...DEFAULT_SETTINGS.notifyPrayers, ...(saved?.notifyPrayers ?? {}) };
  s.uiScale = clamp(s.uiScale, 1, 10);
  s.mushafScale = clamp(s.mushafScale, 1, 10);
  s.pageZoom = clamp(s.pageZoom, 1, 2.5);
  return s;
}

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, Math.round(Number(n) || 5)));

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setSettings(merge(JSON.parse(raw))))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const persist = useCallback((s: Settings) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {}), 300);
  }, []);

  const update = useCallback(
    (patch: Partial<Settings>) =>
      setSettings((prev) => {
        const next = merge({ ...prev, ...patch });
        persist(next);
        return next;
      }),
    [persist]
  );

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    persist(DEFAULT_SETTINGS);
  }, [persist]);

  const replaceAll = useCallback(
    (s: Partial<Settings>) => {
      const next = merge(s);
      setSettings(next);
      persist(next);
    },
    [persist]
  );

  const value = useMemo(() => ({ settings, update, reset, replaceAll, ready }), [settings, update, reset, replaceAll, ready]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings لازم يتستخدم جوه SettingsProvider');
  return ctx;
}

/** معامل حجم الخط من القيمة 1..10 (5 = 1.0) */
export const scaleFactor = (n: number) => 1 + (n - 5) * 0.07;
