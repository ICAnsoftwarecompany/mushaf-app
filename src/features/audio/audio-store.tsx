/**
 * مشغّل التلاوة: آية بآية من القارئ المختار، مع التكرار، والتحكم من شاشة القفل،
 * والتشغيل من الملفات المتحمّلة لو موجودة (من غير إنترنت).
 */
import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { ayahNumber, getSurah, surahOfAyah } from '@/data/quran';
import { useSettings } from '@/store/settings-store';

import { localAyahUri } from './offline';
import { ayahUrl, reciterById } from './reciters';

interface AudioState {
  ayahId: number | null;
  playing: boolean;
  loading: boolean;
  error: boolean;
}

interface AudioContextValue extends AudioState {
  playFrom: (ayahId: number) => void;
  toggle: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [state, setState] = useState<AudioState>({ ayahId: null, playing: false, loading: false, error: false });
  const player = useRef<AudioPlayer | null>(null);
  const current = useRef<number | null>(null);
  const repeatsLeft = useRef(1);
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  /** بيتنادى لما الآية تخلص — ref علشان المستمع بيتسجل مرة واحدة */
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

  const load = useCallback(
    (ayahId: number) => {
      const p = getPlayer();
      const s = surahOfAyah(ayahId);
      const a = ayahNumber(ayahId);
      const reciter = settingsRef.current.reciter;
      const uri = localAyahUri(reciter, s.id, a) ?? ayahUrl(reciter, s.id, a);
      current.current = ayahId;
      repeatsLeft.current = Math.max(1, settingsRef.current.repeatAyah);
      setState({ ayahId, playing: true, loading: true, error: false });
      try {
        p.replace({ uri });
        p.play();
        if (Platform.OS !== 'web') {
          p.setActiveForLockScreen(true, {
            title: `${s.name} · ${a}`,
            artist: reciterById(reciter).ar,
            albumTitle: 'يتلو',
          });
        }
      } catch {
        setState((st) => ({ ...st, playing: false, loading: false, error: true }));
      }
    },
    [getPlayer]
  );

  // نهاية الآية: تكرار، أو الآية اللي بعدها لحد آخر السورة
  const onFinished = useCallback(() => {
    const id = current.current;
    if (id === null) return;
    if (repeatsLeft.current > 1) {
      repeatsLeft.current -= 1;
      player.current?.seekTo(0).then(() => player.current?.play());
      return;
    }
    const s = surahOfAyah(id);
    if (id + 1 <= s.firstAyah + s.ayahs - 1) load(id + 1);
    else {
      current.current = null;
      setState({ ayahId: null, playing: false, loading: false, error: false });
      if (Platform.OS !== 'web') player.current?.setActiveForLockScreen(false);
    }
  }, [load]);
  useEffect(() => {
    finishedRef.current = onFinished;
  }, [onFinished]);

  const stop = useCallback(() => {
    player.current?.pause();
    if (Platform.OS !== 'web') player.current?.setActiveForLockScreen(false);
    current.current = null;
    setState({ ayahId: null, playing: false, loading: false, error: false });
  }, []);

  const toggle = useCallback(() => {
    const p = player.current;
    if (!p || current.current === null) return;
    if (p.playing) p.pause();
    else p.play();
  }, []);

  const next = useCallback(() => {
    const id = current.current;
    if (id !== null && id < 6236) load(id + 1);
  }, [load]);

  const previous = useCallback(() => {
    const id = current.current;
    if (id !== null && id > 1) load(id - 1);
  }, [load]);

  // تغيير القارئ أثناء التشغيل → نكمّل من نفس الآية بالقارئ الجديد
  useEffect(() => {
    if (current.current !== null) load(current.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.reciter]);

  useEffect(() => () => player.current?.release(), []);

  const value = useMemo(
    () => ({ ...state, playFrom: load, toggle, stop, next, previous }),
    [state, load, toggle, stop, next, previous]
  );
  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio لازم يتستخدم جوه AudioProvider');
  return ctx;
}

export { getSurah };
