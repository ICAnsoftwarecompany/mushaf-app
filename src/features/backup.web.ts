/**
 * النسخ الاحتياطي على الويب: تنزيل ملف JSON، واستيراده باختيار ملف.
 */
import * as DocumentPicker from 'expo-document-picker';

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
  const blob = new Blob([JSON.stringify(b, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `yatlu-backup-${b.createdAt.slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return true;
}

export async function pickBackup(): Promise<Backup | null | 'cancel'> {
  const res = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
  if (res.canceled || !res.assets?.[0]) return 'cancel';
  const asset = res.assets[0];
  const text = asset.file ? await asset.file.text() : await (await fetch(asset.uri)).text();
  return parseBackup(text);
}
