/**
 * الإعدادات: المظهر + ألوان التجويد + مصادر البيانات (ذكر المصدر مطلوب في التراخيص)
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { rtlText } from '@/constants/rtl';
import { useMushafTheme } from '@/theme/ThemeContext';
import ThemePicker from '@/theme/ThemePicker';

const SOURCES = [
  'نص القرآن (الرسم العثماني، رواية حفص): موسوعة القرآن الكريم QuranEnc.com عبر حزمة quran-json — CC BY 4.0',
  'ترتيب السطور والصفحات (مصحف المدينة، 604 صفحة): حزمة quran-qcf4 — بيانات JSON برخصة MIT',
  'الأجزاء والأحزاب والسجدات: حزمة quran-meta — MIT',
  'خط النص: Scheherazade New من SIL International — SIL Open Font License',
];

export default function SettingsScreen() {
  const { theme } = useMushafTheme();
  const c = theme.colors;

  return (
    <Screen title="الإعدادات">
      <ThemePicker>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.cardTitle, { color: c.text }]}>مصادر البيانات</Text>
          {SOURCES.map((s) => (
            <Text key={s} style={[styles.source, { color: c.textSecondary }]}>
              {`• ${s}`}
            </Text>
          ))}
          <Text style={[styles.note, { color: c.textSecondary }]}>
            التطبيق شغال بالكامل من غير إنترنت، والنص معروض كما ورد في مصدره بدون أي تعديل.
          </Text>
        </View>
      </ThemePicker>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', ...rtlText },
  source: { fontSize: 13, lineHeight: 20, ...rtlText },
  note: { fontSize: 12, lineHeight: 18, marginTop: 4, ...rtlText },
});
