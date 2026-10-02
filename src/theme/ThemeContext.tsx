// ThemeContext.tsx
// بيحفظ اختيار المستخدم على الموبايل (أوفلاين) ويطبقه في كل التطبيق
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  themes,
  MushafTheme,
  ThemeMode,
  DEFAULT_MODE,
  SYSTEM_DARK,
  SYSTEM_LIGHT,
} from './theme';

const STORAGE_KEY = 'mushaf.themeMode';
const TAJWEED_KEY = 'mushaf.tajweedEnabled';

interface ThemeContextValue {
  theme: MushafTheme;          // الثيم المطبق فعلًا
  mode: ThemeMode;             // اختيار المستخدم (ممكن يكون system)
  setMode: (mode: ThemeMode) => void;
  tajweedEnabled: boolean;
  setTajweedEnabled: (v: boolean) => void;
  ready: boolean;              // اتقرا الاختيار المحفوظ ولا لسه
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);
  const [tajweedEnabled, setTajweedState] = useState(false);
  const [ready, setReady] = useState(false);

  // قراءة الاختيارات المحفوظة مرة واحدة عند فتح التطبيق
  useEffect(() => {
    (async () => {
      try {
        const [savedMode, savedTajweed] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(TAJWEED_KEY),
        ]);
        if (savedMode && (savedMode === 'system' || savedMode in themes)) {
          setModeState(savedMode as ThemeMode);
        }
        if (savedTajweed !== null) setTajweedState(savedTajweed === '1');
      } catch {
        // لو التخزين فشل نكمل بالافتراضي
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  };

  const setTajweedEnabled = (v: boolean) => {
    setTajweedState(v);
    AsyncStorage.setItem(TAJWEED_KEY, v ? '1' : '0').catch(() => {});
  };

  const theme = useMemo(() => {
    if (mode === 'system') {
      return themes[systemScheme === 'dark' ? SYSTEM_DARK : SYSTEM_LIGHT];
    }
    return themes[mode];
  }, [mode, systemScheme]);

  const value = useMemo(
    () => ({ theme, mode, setMode, tajweedEnabled, setTajweedEnabled, ready }),
    [theme, mode, tajweedEnabled, ready]
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar barStyle={theme.colors.statusBar} backgroundColor={theme.colors.background} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useMushafTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useMushafTheme لازم يتستخدم جوه ThemeProvider');
  return ctx;
}
