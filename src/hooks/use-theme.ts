/**
 * بيرجّع ألوان الثيم اللي المستخدم اختاره من ثيمات المصحف (src/theme)،
 * بنفس المفاتيح اللي ThemedText و ThemedView والتابات بيستخدموها.
 */

import { useMemo } from 'react';

import { useMushafTheme } from '@/theme/ThemeContext';

export function useTheme() {
  const { theme } = useMushafTheme();
  const c = theme.colors;

  return useMemo(
    () => ({
      text: c.text,
      background: c.background,
      backgroundElement: c.surface,
      backgroundSelected: c.highlight,
      textSecondary: c.textSecondary,
      accent: c.accent,
    }),
    [c]
  );
}
