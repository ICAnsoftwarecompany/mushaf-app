/**
 * ملفات التلاوة المتحمّلة على الجهاز (أندرويد و iOS) — للاستماع من غير إنترنت.
 * المكان: <Documents>/audio/<القارئ>/<SSSAAA>.mp3
 */
import { Directory, File, Paths } from 'expo-file-system';

import { getSurah } from '@/data/quran';

import { ayahFileName, ayahUrl } from './reciters';

const root = () => new Directory(Paths.document, 'audio');
const dirFor = (reciter: string) => new Directory(root(), reciter);

export function localAyahUri(reciter: string, surah: number, ayah: number): string | null {
  try {
    const f = new File(dirFor(reciter), ayahFileName(surah, ayah));
    return f.exists ? f.uri : null;
  } catch {
    return null;
  }
}

export function isSurahDownloaded(reciter: string, surah: number): boolean {
  const n = getSurah(surah).ayahs;
  for (let a = 1; a <= n; a++) if (!localAyahUri(reciter, surah, a)) return false;
  return true;
}

export async function downloadSurah(
  reciter: string,
  surah: number,
  onProgress: (fraction: number) => void,
  shouldCancel: () => boolean = () => false
): Promise<boolean> {
  const dir = dirFor(reciter);
  dir.create({ intermediates: true, idempotent: true });
  const n = getSurah(surah).ayahs;
  for (let a = 1; a <= n; a++) {
    if (shouldCancel()) return false;
    const f = new File(dir, ayahFileName(surah, a));
    if (!f.exists) {
      try {
        await File.downloadFileAsync(ayahUrl(reciter, surah, a), f);
      } catch {
        return false;
      }
    }
    onProgress(a / n);
  }
  return true;
}

export const canDownload = true;
