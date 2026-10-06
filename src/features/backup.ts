/**
 * النسخ الاحتياطي: تصدير واستيراد الإعدادات والعلامات والختمة كملف JSON (أندرويد و iOS).
 */
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export interface Backup {
  app: 'yatlu';
  version: 1;
  createdAt: string;
  settings: unknown;
  reading: unknown;
}

export function makeBackup(settings: unknown, reading: unknown): Backup {
  return { app: 'yatlu', version: 1, createdAt: new Date().toISOString(), settings, reading };
}

export function parseBackup(text: string): Backup | null {
  try {
    const b = JSON.parse(text);
    return b && b.app === 'yatlu' && b.version === 1 ? (b as Backup) : null;
  } catch {
    return null;
  }
}

export async function exportBackup(b: Backup): Promise<boolean> {
  const f = new File(Paths.cache, `yatlu-backup-${b.createdAt.slice(0, 10)}.json`);
  if (f.exists) f.delete();
  f.create();
  f.write(JSON.stringify(b, null, 2));
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(f.uri, { mimeType: 'application/json', dialogTitle: 'Yatlu backup' });
  return true;
}

export async function pickBackup(): Promise<Backup | null | 'cancel'> {
  const res = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.[0]) return 'cancel';
  return parseBackup(await new File(res.assets[0].uri).text());
}
