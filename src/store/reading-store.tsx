/**
 * حالة القراءة: آخر صفحة اتقرت + العلامات المحفوظة.
 * كله بيتخزن على الجهاز (أوفلاين) بـ AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const LAST_READ_KEY = 'mushaf.lastRead';
const BOOKMARKS_KEY = 'mushaf.bookmarks';

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
  ready: boolean;
}

const ReadingContext = createContext<ReadingContextValue | null>(null);

function persist(key: string, value: unknown) {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
}

export function ReadingProvider({ children }: { children: React.ReactNode }) {
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [lr, bm] = await Promise.all([
          AsyncStorage.getItem(LAST_READ_KEY),
          AsyncStorage.getItem(BOOKMARKS_KEY),
        ]);
        if (lr) setLastRead(JSON.parse(lr));
        if (bm) setBookmarks(JSON.parse(bm));
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

  const value = useMemo(
    () => ({
      lastRead,
      setLastPage,
      bookmarks,
      isPageBookmarked,
      togglePageBookmark,
      addAyahBookmark,
      removeBookmark,
      ready,
    }),
    [lastRead, setLastPage, bookmarks, isPageBookmarked, togglePageBookmark, addAyahBookmark, removeBookmark, ready]
  );

  return <ReadingContext.Provider value={value}>{children}</ReadingContext.Provider>;
}

export function useReading() {
  const ctx = useContext(ReadingContext);
  if (!ctx) throw new Error('useReading لازم يتستخدم جوه ReadingProvider');
  return ctx;
}
