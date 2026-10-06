/** زرار تحميل لسورة أو جزء: تحميل ← نسبة (اضغط للإلغاء) ← ✓ (اضغط للحذف لو مسموح) */
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Icon, Txt } from '@/components/ui';
import { type AyahRef, cancelDownload, startDownload, useDownloads } from '@/features/audio/downloads';
import { canDownload } from '@/features/audio/offline';
import { useI18n } from '@/i18n';
import { useSettings } from '@/store/settings-store';
import { useMushafTheme } from '@/theme/ThemeContext';

export function DownloadButton({
  jobKey,
  files,
  label,
  onDelete,
  reciter,
}: {
  jobKey: string;
  files: AyahRef[];
  label: string;
  onDelete?: () => void;
  /** قارئ غير الافتراضي (قارئ القايمة) */
  reciter?: string;
}) {
  const { theme } = useMushafTheme();
  const { t, num } = useI18n();
  const { settings } = useSettings();
  const rid = reciter ?? settings.reciter;
  const dl = useDownloads(rid);
  const c = theme.colors;
  if (!canDownload) return null;

  const job = dl.job(jobKey);
  if (job) {
    return (
      <Pressable onPress={() => cancelDownload(jobKey)} accessibilityRole="button" accessibilityLabel={t('cancel')} hitSlop={6} style={styles.btn}>
        <Txt size={11} color="accent" weight="bold">
          {`${num(Math.round((job.done / job.files.length) * 100))}%`}
        </Txt>
      </Pressable>
    );
  }
  if (dl.isComplete(files)) {
    return (
      <Pressable onPress={onDelete} disabled={!onDelete} accessibilityRole="button" accessibilityLabel={onDelete ? t('deleteDownload') : t('downloaded')} hitSlop={6} style={styles.btn}>
        <Icon name="check" size={20} color={c.accent} />
      </Pressable>
    );
  }
  return (
    <Pressable onPress={() => startDownload(jobKey, rid, files)} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} style={styles.btn}>
      <Icon name="download" size={20} color={c.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
});
