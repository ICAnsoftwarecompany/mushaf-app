/**
 * حالة القراءة: آخر صفحة اتقرت + العلامات المحفوظة + الختمة والورد اليومي + قوايم الاستماع.
 * كله بيتخزن على الجهاز (أوفلاين) بـ AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const LAST_READ_KEY = 'mushaf.lastRead';
const BOOKMARKS_KEY = 'mushaf.bookmarks';
const KHATMA_KEY = 'yatlu.khatma';
const PLAYLISTS_KEY = 'yatlu.playlists';
const PRAYER_LOG_KEY = 'yatlu.prayerLog';

export type Salah = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
/** سجل الفروض: اليوم "YYYY-MM-DD" ← الصلاة ← وقت التعليم (ms) */
export type PrayerLog = Record<string, Partial<Record<Salah, number>>>;
/** بنحتفظ بآخر 30 يوم بس */
const LOG_DAYS = 30;

/** قايمة استماع: سور بترتيب يختاره المستخدم */
export interface Playlist {
  id: string;
  name: string;
  surahs: number[];
  createdAt: number;
  /** قايمة مقترحة (مفتاح الاسم في strings: pl_<key>) */
  suggested?: string;
  /** المستخدم غيّر اسم القايمة المقترحة */
  renamed?: boolean;
  /** قارئ خاص بالقايمة (غير كده القارئ الافتراضي) */
  reciter?: string;
}

const SEEDED_KEY = 'yatlu.suggestedSeeded';
/**
 * القوايم المقترحة — بتتضاف مرة واحدة، وبعدها المستخدم يعدّلها أو يخفيها.
 * ⚠️ اختيار السور محتاج مراجعة شرعية (docs/roadmap.md).
 */
const SUGGESTED: { key: string; surahs: number[] }[] = [
  { key: 'ruqyah', surahs: [1, 2, 112, 113, 114] },
  { key: 'sleep', surahs: [32, 67, 17, 39, 112, 113, 114] },
  { key: 'morning', surahs: [1, 36, 55, 56] },
  { key: 'rizq', surahs: [56, 51, 65] },
  { key: 'hasad', surahs: [1, 112, 113, 114, 68] },
  { key: 'hamm', surahs: [94, 93, 12, 21] },
];

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
  playlists: Playlist[];
  prayerLog: PrayerLog;
  /** بيرجّع true لو الصلاة اتعلّمت (مش اتشالت) */
  togglePrayed: (day: string, p: Salah) => boolean;
  createPlaylist: (name: string, surahs?: number[]) => string;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (id: string, surah: number) => void;
  removeFromPlaylist: (id: string, index: number) => void;
  movePlaylistItem: (id: string, from: number, to: number) => void;
  setPlaylistReciter: (id: string, reciter: string | undefined) => void;
  /** للنسخ الاحتياطي */
  exportData: () => ExportedData;
  importData: (d: Partial<ExportedData>) => void;
  ready: boolean;
}

type ExportedData = { lastRead: LastRead | null; bookmarks: Bookmark[]; khatma: Khatma; playlists: Playlist[]; prayerLog: PrayerLog };

const ReadingContext = createContext<ReadingContextValue | null>(null);

function persist(key: string, value: unknown) {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
}

export function ReadingProvider({ children }: { children: React.ReactNode }) {
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [khatma, setKhatma] = useState<Khatma>(NEW_KHATMA);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [prayerLog, setPrayerLog] = useState<PrayerLog>({});
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [lr, bm, kh, pl, pr] = await Promise.all([
          AsyncStorage.getItem(LAST_READ_KEY),
          AsyncStorage.getItem(BOOKMARKS_KEY),
          AsyncStorage.getItem(KHATMA_KEY),
          AsyncStorage.getItem(PLAYLISTS_KEY),
          AsyncStorage.getItem(PRAYER_LOG_KEY),
        ]);
        let lists: Playlist[] = pl ? JSON.parse(pl) : [];
        if (!(await AsyncStorage.getItem(SEEDED_KEY))) {
          const t0 = Date.now();
          lists = [...SUGGESTED.map((x, i) => ({ id: `sg-${x.key}`, name: x.key, surahs: x.surahs, createdAt: t0 + i, suggested: x.key })), ...lists];
          persist(PLAYLISTS_KEY, lists);
          AsyncStorage.setItem(SEEDED_KEY, '1').catch(() => {});
        }
        setPlaylists(lists);
        if (pr) setPrayerLog(JSON.parse(pr));
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

  const updatePlaylists = useCallback((fn: (prev: Playlist[]) => Playlist[]) => {
    setPlaylists((prev) => {
      const next = fn(prev);
      persist(PLAYLISTS_KEY, next);
      return next;
    });
  }, []);
  const editPlaylist = useCallback(
    (id: string, fn: (p: Playlist) => Playlist) => updatePlaylists((prev) => prev.map((p) => (p.id === id ? fn(p) : p))),
    [updatePlaylists]
  );

  const createPlaylist = useCallback(
    (name: string, surahs: number[] = []) => {
      const id = `pl${Date.now().toString(36)}`;
      updatePlaylists((prev) => [...prev, { id, name: name.trim() || '—', surahs, createdAt: Date.now() }]);
      return id;
    },
    [updatePlaylists]
  );
  const renamePlaylist = useCallback(
    (id: string, name: string) => editPlaylist(id, (p) => (name.trim() ? { ...p, name: name.trim(), renamed: true } : p)),
    [editPlaylist]
  );
  const setPlaylistReciter = useCallback(
    (id: string, reciter: string | undefined) => editPlaylist(id, (p) => ({ ...p, reciter })),
    [editPlaylist]
  );
  const deletePlaylist = useCallback((id: string) => updatePlaylists((prev) => prev.filter((p) => p.id !== id)), [updatePlaylists]);
  const addToPlaylist = useCallback((id: string, surah: number) => editPlaylist(id, (p) => ({ ...p, surahs: [...p.surahs, surah] })), [editPlaylist]);
  const removeFromPlaylist = useCallback(
    (id: string, index: number) => editPlaylist(id, (p) => ({ ...p, surahs: p.surahs.filter((_, i) => i !== index) })),
    [editPlaylist]
  );
  const movePlaylistItem = useCallback(
    (id: string, from: number, to: number) =>
      editPlaylist(id, (p) => {
        if (to < 0 || to >= p.surahs.length) return p;
        const surahs = [...p.surahs];
        const [x] = surahs.splice(from, 1);
        surahs.splice(to, 0, x);
        return { ...p, surahs };
      }),
    [editPlaylist]
  );

  const togglePrayed = useCallback(
    (day: string, p: Salah) => {
      const marked = !prayerLog[day]?.[p];
      setPrayerLog((prev) => {
        const dayLog = { ...(prev[day] ?? {}) };
        if (marked) dayLog[p] = Date.now();
        else delete dayLog[p];
        const next: PrayerLog = { ...prev, [day]: dayLog };
        // نشيل الأيام القديمة
        const keep = Object.keys(next).sort().slice(-LOG_DAYS);
        const pruned: PrayerLog = {};
        for (const k of keep) pruned[k] = next[k];
        persist(PRAYER_LOG_KEY, pruned);
        return pruned;
      });
      return marked;
    },
    [prayerLog]
  );

  const exportData = useCallback(
    () => ({ lastRead, bookmarks, khatma, playlists, prayerLog }),
    [lastRead, bookmarks, khatma, playlists, prayerLog]
  );

  const importData = useCallback((d: Partial<ExportedData>) => {
    if (d.prayerLog && typeof d.prayerLog === 'object') {
      setPrayerLog(d.prayerLog);
      persist(PRAYER_LOG_KEY, d.prayerLog);
    }
    if (Array.isArray(d.playlists)) {
      setPlaylists(d.playlists);
      persist(PLAYLISTS_KEY, d.playlists);
    }
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
      playlists,
      prayerLog,
      togglePrayed,
      createPlaylist,
      renamePlaylist,
      deletePlaylist,
      addToPlaylist,
      removeFromPlaylist,
      movePlaylistItem,
      setPlaylistReciter,
      exportData,
      importData,
      ready,
    }),
    [lastRead, setLastPage, bookmarks, isPageBookmarked, togglePageBookmark, addAyahBookmark, removeBookmark, khatma, markWirdDone, newKhatma, playlists, prayerLog, togglePrayed, createPlaylist, renamePlaylist, deletePlaylist, addToPlaylist, removeFromPlaylist, movePlaylistItem, setPlaylistReciter, exportData, importData, ready]
  );

  return <ReadingContext.Provider value={value}>{children}</ReadingContext.Provider>;
}

export function useReading() {
  const ctx = useContext(ReadingContext);
  if (!ctx) throw new Error('useReading لازم يتستخدم جوه ReadingProvider');
  return ctx;
}
