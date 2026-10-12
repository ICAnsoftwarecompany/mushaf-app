/**
 * رقم إصدار التطبيق اللي بيظهر في الإعدادات و«عن التطبيق».
 * - الإصدار (X.Y.Z): من التطبيق المتثبّت نفسه (أندرويد/iOS)، أو app.json على الويب. بيزيد مع كل رفع على GitHub.
 * - البناء: رقم بيزيد مع كل APK/AAB (EAS) — مش موجود على الويب.
 * - الكود: أول ٧ حروف من الكوميت اللي اتبنى منه (app.config.js → extra.commit).
 */
import * as Application from 'expo-application';
import Constants from 'expo-constants';

export interface AppVersion {
  version: string;
  build: string | null;
  commit: string | null;
}

export function getAppVersion(): AppVersion {
  const extra = Constants.expoConfig?.extra as { commit?: string } | undefined;
  return {
    version: Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '1.0.0',
    build: Application.nativeBuildVersion ?? null,
    commit: extra?.commit ?? null,
  };
}

/** «الإصدار ١.١.٠ · بناء ١٢» — الكوميت بيتعرض لوحده (حروف إنجليزي) */
export function versionLabel(v: AppVersion, t: (key: 'version' | 'buildN', vars?: Record<string, string | number>) => string, num: (n: number | string) => string): string {
  const parts = [`${t('version')} ${num(v.version)}`];
  if (v.build) parts.push(t('buildN', { n: num(v.build) }));
  return parts.join(' · ');
}
