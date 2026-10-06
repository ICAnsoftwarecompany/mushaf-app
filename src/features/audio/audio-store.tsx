/**
 * مشغّل التلاوة: آية بآية من القارئ المختار.
 * - من القارئ: بيشغّل من آية لحد آخر السورة.
 * - من تاب الاستماع: طابور سور (المصحف كله، أو جزء، أو قايمة استماع) سورة ورا سورة، مع التكرار.
 * البسملة بتتقري قبل أول كل سورة (ما عدا الفاتحة والتوبة)، والتشغيل من الملفات المتحمّلة لو موجودة.
 */
import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { ayahNumber, getSurah, surahLabel, surahOfAyah } from '@/data/quran';
import { useReading } from '@/store/reading-store';
import { useSettings } from '@/store/settings-store';

import { localAyahUri } from './offline';
import { ayahUrl, reciterById } from './reciters';

interface AudioState {
  ayahId: number | null;
  playing: boolean;
  loading: boolean;
  error: boolean;
  /** طابور السور (null = تشغيل من القارئ لحد آخر السورة) */
  queue: number[] | null;
  queueIndex: number;
  /** اسم المصدر (قايمة استماع أو جزء) للعرض */
  queueTitle: string | null;
  loop: boolean;
  /** القارئ اللي بيقرا دلوقتي (قارئ القايمة أو الافتراضي) */
  reciter: string | null;
}

interface AudioContextValue extends AudioState {
  playFrom: (ayahId: number) => void;
  /** تشغيل طابور سور من السورة رقم index (واختياري: من آية معينة جواها) */
  playSurahs: (surahs: number[], index?: number, opts?: { startAyahId?: number; title?: string; reciter?: string }) => void;
  toggle: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  nextSurah: () => void;
  previousSurah: () => void;
  setLoop: (v: boolean) => void;
}

const EMPTY: AudioState = {
  ayahId: null,
  playing: false,
  loading: false,
  error: false,
  queue: null,
  queueIndex: 0,
  queueTitle: null,
  loop: false,
  reciter: null,
};

const AudioContext = createContext<AudioContextValue | null>(null);

const needsBasmala = (ayahId: number) => {
  const s = surahOfAyah(ayahId);
  return ayahId === s.firstAyah && s.id !== 1 && s.id !== 9;
};

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const { markActivity } = useReading();
  const [state, setState] = useState<AudioState>(EMPTY);
  const player = useRef<AudioPlayer | null>(null);
  const current = useRef<number | null>(null);
  /** بنقرا البسملة دلوقتي، والآية دي هي اللي بعدها */
  const basmalaFor = useRef<number | null>(null);
  const repeatsLeft = useRef(1);
  const queue = useRef<{ surahs: number[]; index: number } | null>(null);
  const loop = useRef(false);
  /** قارئ القايمة (لو ليها قارئ خاص) */
  const reciterOverride = useRef<string | null>(null);
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  /** بيتنادى لما الملف يخلص — ref علشان المستمع بيتسجل مرة واحدة */
  const finishedRef = useRef<() => void>(() => {});

  const getPlayer = useCallback(() => {
    if (!player.current) {
      setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(() => {});
      const p = createAudioPlayer(null, { updateInterval: 500 });
      p.addListener('playbackStatusUpdate', (st) => {
        if (st.didJustFinish) finishedRef.current();
        else setState((s) => ({ ...s, playing: st.playing, loading: !st.isLoaded && s.ayahId !== null }));
      });
      player.current = p;
    }
    return player.current;
  }, []);

  const playFile = useCallback(
    (surah: number, ayah: number, shownAyahId: number) => {
      const p = getPlayer();
      const reciter = reciterOverride.current ?? settingsRef.current.reciter;
      const uri = localAyahUri(reciter, surah, ayah) ?? ayahUrl(reciter, surah, ayah);
      setState((st) => ({ ...st, ayahId: shownAyahId, playing: true, loading: true, error: false, reciter }));
      try {
        p.replace({ uri });
        p.play();
        if (Platform.OS !== 'web') {
          const s = surahOfAyah(shownAyahId);
          const lang = settingsRef.current.language;
          const r = reciterById(reciter);
          p.setActiveForLockScreen(true, {
            title: `${surahLabel(s, lang)} · ${ayahNumber(shownAyahId)}`,
            artist: lang === 'ar' ? r.ar : r.en,
            albumTitle: lang === 'ar' ? 'يتلو' : 'Yatlu',
          });
        }
      } catch {
        setState((st) => ({ ...st, playing: false, loading: false, error: true }));
      }
    },
    [getPlayer]
  );

  /** تشغيل آية (والبسملة قبلها لو أول السورة) */
  const load = useCallback(
    (ayahId: number, withBasmala = true) => {
      current.current = ayahId;
      repeatsLeft.current = Math.max(1, settingsRef.current.repeatAyah);
      if (withBasmala && needsBasmala(ayahId)) {
        basmalaFor.current = ayahId;
        playFile(1, 1, ayahId);
      } else {
        basmalaFor.current = null;
        playFile(surahOfAyah(ayahId).id, ayahNumber(ayahId), ayahId);
      }
    },
    [playFile]
  );

  const finishAll = useCallback(() => {
    current.current = null;
    basmalaFor.current = null;
    queue.current = null;
    player.current?.pause();
    setState((st) => ({ ...EMPTY, loop: st.loop }));
    if (Platform.OS !== 'web') player.current?.setActiveForLockScreen(false);
  }, []);

  const startQueueAt = useCallback(
    (index: number, startAyahId?: number) => {
      const q = queue.current;
      if (!q) return;
      q.index = index;
      setState((st) => ({ ...st, queueIndex: index }));
      load(startAyahId ?? getSurah(q.surahs[index]).firstAyah);
    },
    [load]
  );

  // نهاية الملف: البسملة ← الآية، أو تكرار، أو الآية اللي بعدها، أو السورة اللي بعدها في الطابور
  const onFinished = useCallback(() => {
    const id = current.current;
    if (id === null) return;
    if (basmalaFor.current !== null) {
      basmalaFor.current = null;
      load(id, false);
      return;
    }
    if (repeatsLeft.current > 1) {
      repeatsLeft.current -= 1;
      player.current?.seekTo(0).then(() => player.current?.play());
      return;
    }
    const s = surahOfAyah(id);
    if (id < s.firstAyah + s.ayahs - 1) return load(id + 1);
    // سورة خلصت للآخر → «سماع القرآن» في «أنا مسلم»
    markActivity('listen');
    const q = queue.current;
    if (q) {
      if (q.index + 1 < q.surahs.length) return startQueueAt(q.index + 1);
      if (loop.current && q.surahs.length) return startQueueAt(0);
    }
    finishAll();
  }, [load, startQueueAt, finishAll, markActivity]);
  useEffect(() => {
    finishedRef.current = onFinished;
  }, [onFinished]);

  const playFrom = useCallback(
    (ayahId: number) => {
      queue.current = null;
      reciterOverride.current = null;
      setState((st) => ({ ...st, queue: null, queueIndex: 0, queueTitle: null }));
      load(ayahId);
    },
    [load]
  );

  const playSurahs = useCallback(
    (surahs: number[], index = 0, opts?: { startAyahId?: number; title?: string; reciter?: string }) => {
      if (!surahs.length) return;
      reciterOverride.current = opts?.reciter ?? null;
      queue.current = { surahs, index };
      setState((st) => ({ ...st, queue: surahs, queueIndex: index, queueTitle: opts?.title ?? null }));
      startQueueAt(index, opts?.startAyahId);
    },
    [startQueueAt]
  );

  const stop = useCallback(() => finishAll(), [finishAll]);

  const toggle = useCallback(() => {
    const p = player.current;
    if (!p || current.current === null) return;
    if (p.playing) p.pause();
    else p.play();
  }, []);

  const next = useCallback(() => {
    const id = current.current;
    if (id === null) return;
    const s = surahOfAyah(id);
    if (id < s.firstAyah + s.ayahs - 1) load(id + 1, false);
    else if (queue.current && queue.current.index + 1 < queue.current.surahs.length) startQueueAt(queue.current.index + 1);
    else if (!queue.current && id < 6236) load(id + 1);
  }, [load, startQueueAt]);

  const previous = useCallback(() => {
    const id = current.current;
    if (id !== null && id > 1) load(id - 1, false);
  }, [load]);

  const nextSurah = useCallback(() => {
    const q = queue.current;
    if (q) {
      if (q.index + 1 < q.surahs.length) startQueueAt(q.index + 1);
      else if (loop.current) startQueueAt(0);
      return;
    }
    const id = current.current;
    if (id !== null) {
      const s = surahOfAyah(id);
      if (s.id < 114) load(getSurah(s.id + 1).firstAyah);
    }
  }, [load, startQueueAt]);

  const previousSurah = useCallback(() => {
    const id = current.current;
    if (id === null) return;
    const s = surahOfAyah(id);
    // لو عدّينا أول آيتين، نرجع لأول نفس السورة
    if (ayahNumber(id) > 2) return load(s.firstAyah);
    const q = queue.current;
    if (q) {
      if (q.index > 0) startQueueAt(q.index - 1);
      else load(s.firstAyah);
      return;
    }
    if (s.id > 1) load(getSurah(s.id - 1).firstAyah);
  }, [load, startQueueAt]);

  const setLoop = useCallback((v: boolean) => {
    loop.current = v;
    setState((st) => ({ ...st, loop: v }));
  }, []);

  // تغيير القارئ الافتراضي أثناء التشغيل → نكمّل من نفس الآية بالقارئ الجديد (لو مش قايمة بقارئ خاص)
  useEffect(() => {
    if (current.current !== null && !reciterOverride.current) load(current.current, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.reciter]);

  useEffect(() => () => player.current?.release(), []);

  const value = useMemo(
    () => ({ ...state, playFrom, playSurahs, toggle, stop, next, previous, nextSurah, previousSurah, setLoop }),
    [state, playFrom, playSurahs, toggle, stop, next, previous, nextSurah, previousSurah, setLoop]
  );
  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio لازم يتستخدم جوه AudioProvider');
  return ctx;
}
