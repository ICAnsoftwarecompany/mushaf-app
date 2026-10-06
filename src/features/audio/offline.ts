/**
 * ملفات التلاوة المتحمّلة على الجهاز (أندرويد و iOS) — للاستماع من غير إنترنت.
 * المكان: <Documents>/audio/<القارئ>/<SSSAAA>.mp3
 */
import { Directory, File, Paths } from 'expo-file-system';

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

/** أسماء الملفات المتحمّلة للقارئ (قراءة واحدة للفولدر بدل ما نسأل عن كل ملف) */
export function downloadedNames(reciter: string): Set<string> {
  try {
    const d = dirFor(reciter);
    if (!d.exists) return new Set();
    return new Set(d.list().map((e) => e.name));
  } catch {
    return new Set();
  }
}

export async function downloadAyahFile(reciter: string, surah: number, ayah: number): Promise<boolean> {
  const dir = dirFor(reciter);
  dir.create({ intermediates: true, idempotent: true });
  const f = new File(dir, ayahFileName(surah, ayah));
  if (f.exists) return true;
  const tmp = new File(dir, `${ayahFileName(surah, ayah)}.part`);
  try {
    if (tmp.exists) tmp.delete();
    await File.downloadFileAsync(ayahUrl(reciter, surah, ayah), tmp);
    tmp.move(f);
    return true;
  } catch {
    try {
      if (tmp.exists) tmp.delete();
    } catch {}
    return false;
  }
}

export function deleteFiles(reciter: string, names: string[]) {
  const dir = dirFor(reciter);
  for (const n of names) {
    try {
      const f = new File(dir, n);
      if (f.exists) f.delete();
    } catch {}
  }
}

/** الحجم المستخدم بالبايت لكل القرّاء */
export function totalDownloadedBytes(): number {
  try {
    const r = root();
    if (!r.exists) return 0;
    let total = 0;
    for (const d of r.list()) {
      if (d instanceof Directory) for (const f of d.list()) if (f instanceof File) total += f.size ?? 0;
    }
    return total;
  } catch {
    return 0;
  }
}

export const canDownload = true;
