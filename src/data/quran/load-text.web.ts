/** قراءة ملف asset نصي (الويب) — الـ service worker بيحفظه للاستخدام بدون إنترنت */
import { Asset } from 'expo-asset';

export async function loadAssetText(mod: number): Promise<string> {
  const res = await fetch(Asset.fromModule(mod).uri);
  return res.text();
}
