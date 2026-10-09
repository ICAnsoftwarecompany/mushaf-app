/**
 * حالة السبحة (العدد، الذكر، الهدف، وهل هي مثبّتة في الإشعارات) — متخزنة على الجهاز (yatlu.tasbih)
 * ومشتركة بين شاشة السبحة وإشعار السبحة (اللي بيشتغل والتطبيق مقفول).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TASBIH_KEY = 'yatlu.tasbih';
export const PHRASES = ['سبحان الله', 'الحمد لله', 'الله أكبر', 'لا إله إلا الله', 'أستغفر الله', 'سبحان الله وبحمده', 'سبحان الله العظيم', 'لا حول ولا قوة إلا بالله', 'اللهم صل وسلم على نبينا محمد'];

export interface TasbihState {
  count: number;
  phrase: number;
  target: number; // 0 = من غير حد
  pinned: boolean; // ظاهرة في الإشعارات ولوحة القفل
}

export const DEFAULT_TASBIH: TasbihState = { count: 0, phrase: 0, target: 33, pinned: false };

export async function loadTasbih(): Promise<TasbihState> {
  try {
    const raw = await AsyncStorage.getItem(TASBIH_KEY);
    const v = raw ? JSON.parse(raw) : {};
    const s = { ...DEFAULT_TASBIH, ...v };
    if (s.phrase >= PHRASES.length) s.phrase = 0;
    return s;
  } catch {
    return { ...DEFAULT_TASBIH };
  }
}

export async function saveTasbih(s: TasbihState): Promise<void> {
  await AsyncStorage.setItem(TASBIH_KEY, JSON.stringify(s)).catch(() => {});
}
