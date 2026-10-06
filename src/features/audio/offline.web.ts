/** الويب: مفيش تحميل للاستماع بدون إنترنت — التلاوة بتتشغل من الإنترنت مباشرة */
export function localAyahUri(): string | null {
  return null;
}
export function isSurahDownloaded(): boolean {
  return false;
}
export async function downloadSurah(): Promise<boolean> {
  return false;
}
export const canDownload = false;
