/**
 * حالة القراءة: آخر صفحة اتقرت + العلامات المحفوظة + الختمة والورد اليومي.
 * كله بيتخزن على الجهاز (أوفلاين) بـ AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const LAST_READ_KEY = 'mushaf.lastRead';
const BOOKMARKS_KEY = 'mushaf.bookmarks';
const KHATMA_KEY = 'yatlu.khatma';

/** الختمة والورد اليومي */
export interface Khatma {
  nextPage: number; // أول صفحة في ورد النهارده (605 = الختمة خلصت)
  startedAt: number;
  lastDoneDay: string | null; // "YYYY-MM-DD"
  completed: number; // عدد الختمات اللي خلصت
}

const NEW_KHATMA = (): Khatma => ({ nextPage: 1, startedAt: Date.now(), lastDoneDay: null, completed: 0 });
export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export interface LastRead {
  page: number;
  at: number; // وقت آخر قراءة (ms)
}

export interface Bookmark {
  id: string;
  page: number;
  ayahId?: number; // لو العلامة على آية معينة
  createdAt: number;
}

interface ReadingContextValue {
  lastRead: LastRead | null;
  setLastPage: (page: number) => void;
  bookmarks: Bookmark[];
  isPageBookmarked: (page: number) => boolean;
  togglePageBookmark: (page: number) => void;
  addAyahBookmark: (ayahId: number, page: number) => void;
  removeBookmark: (id: string) => void;
  khatma: Khatma;
  markWirdDone: (pagesPerDay: number) => void;
  newKhatma: () => void;
  /** للنسخ الاحتياطي */
  exportData: () => { lastRead: LastRead | null; bookmarks: Bookmark[]; khatma: Khatma };
  importData: (d: { lastRead?: LastRead | null; bookmarks?: Bookmark[]; khatma?: Khatma }) => void;
  ready: boolean;
}

const ReadingContext = createContext<ReadingContextValue | null>(null);

function persist(key: string, value: unknown) {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
}

export function ReadingProvider({ children }: { children: React.ReactNode }) {
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [khatma, setKhatma] = useState<Khatma>(NEW_KHATMA);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [lr, bm, kh] = await Promise.all([
          AsyncStorage.getItem(LAST_READ_KEY),
          AsyncStorage.getItem(BOOKMARKS_KEY),
          AsyncStorage.getItem(KHATMA_KEY),
        ]);
        if (lr) setLastRead(JSON.parse(lr));
        if (bm) setBookmarks(JSON.parse(bm));
        if (kh) setKhatma({ ...NEW_KHATMA(), ...JSON.parse(kh) });
      } catch {
        // نكمل بالقيم الفاضية
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setLastPage = useCallback((page: number) => {
    const value = { page, at: Date.now() };
    setLastRead(value);
    // بنأخر الحفظ شوية علشان التقليب السريع ما يكتبش على التخزين كل صفحة
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(LAST_READ_KEY, value), 800);
  }, []);

  const updateBookmarks = useCallback((fn: (prev: Bookmark[]) => Bookmark[]) => {
    setBookmarks((prev) => {
      const next = fn(prev);
      persist(BOOKMARKS_KEY, next);
      return next;
    });
  }, []);

  const isPageBookmarked = useCallback(
    (page: number) => bookmarks.some((b) => b.page === page && b.ayahId === undefined),
    [bookmarks]
  );

  const togglePageBookmark = useCallback(
    (page: number) =>
      updateBookmarks((prev) =>
        prev.some((b) => b.page === page && b.ayahId === undefined)
          ? prev.filter((b) => !(b.page === page && b.ayahId === undefined))
          : [{ id: `p${page}-${Date.now()}`, page, createdAt: Date.now() }, ...prev]
      ),
    [updateBookmarks]
  );

  const addAyahBookmark = useCallback(
    (ayahId: number, page: number) =>
      updateBookmarks((prev) =>
        prev.some((b) => b.ayahId === ayahId)
          ? prev
          : [{ id: `a${ayahId}-${Date.now()}`, page, ayahId, createdAt: Date.now() }, ...prev]
      ),
    [updateBookmarks]
  );

  const removeBookmark = useCallback(
    (id: string) => updateBookmarks((prev) => prev.filter((b) => b.id !== id)),
    [updateBookmarks]
  );

  const markWirdDone = useCallback((pagesPerDay: number) => {
    setKhatma((k) => {
      const next = {
        ...k,
        nextPage: Math.min(605, k.nextPage + pagesPerDay),
        lastDoneDay: todayKey(),
      };
      if (next.nextPage >= 605) next.completed = k.completed + 1;
      persist(KHATMA_KEY, next);
      return next;
    });
  }, []);

  const newKhatma = useCallback(() => {
    setKhatma((k) => {
      const next = { ...NEW_KHATMA(), completed: k.completed };
      persist(KHATMA_KEY, next);
      return next;
    });
  }, []);

  const exportData = useCallback(() => ({ lastRead, bookmarks, khatma }), [lastRead, bookmarks, khatma]);

  const importData = useCallback((d: { lastRead?: LastRead | null; bookmarks?: Bookmark[]; khatma?: Khatma }) => {
    if (d.lastRead !== undefined) {
      setLastRead(d.lastRead);
      persist(LAST_READ_KEY, d.lastRead);
    }
    if (Array.isArray(d.bookmarks)) {
      setBookmarks(d.bookmarks);
      persist(BOOKMARKS_KEY, d.bookmarks);
    }
    if (d.khatma) {
      const k = { ...NEW_KHATMA(), ...d.khatma };
      setKhatma(k);
      persist(KHATMA_KEY, k);
    }
  }, []);

  const value = useMemo(
    () => ({
      lastRead,
      setLastPage,
      bookmarks,
      isPageBookmarked,
      togglePageBookmark,
      addAyahBookmark,
      removeBookmark,
      khatma,
      markWirdDone,
      newKhatma,
      exportData,
      importData,
      ready,
    }),
    [lastRead, setLastPage, bookmarks, isPageBookmarked, togglePageBookmark, addAyahBookmark, removeBookmark, khatma, markWirdDone, newKhatma, exportData, importData, ready]
  );

  return <ReadingContext.Provider value={value}>{children}</ReadingContext.Provider>;
}

export function useReading() {
  const ctx = useContext(ReadingContext);
  if (!ctx) throw new Error('useReading لازم يتستخدم جوه ReadingProvider');
  return ctx;
}
