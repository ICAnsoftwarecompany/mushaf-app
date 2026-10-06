/** اسم قايمة الاستماع للعرض: القوايم المقترحة بتتترجم لحد ما المستخدم يغيّر اسمها */
import type { translate } from '@/i18n';
import type { Playlist } from '@/store/reading-store';

type T = (k: Parameters<typeof translate>[1], v?: Record<string, string | number>) => string;

export function playlistName(p: Playlist, t: T): string {
  if (p.suggested && !p.renamed) return t(`pl_${p.suggested}` as Parameters<typeof translate>[1]);
  return p.name;
}
