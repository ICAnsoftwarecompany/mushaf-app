/**
 * اختيار المدينة (من قايمة جوه التطبيق — بتشتغل من غير إنترنت) أو تحديد الموقع بالـ GPS.
 */
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Btn, Row, Txt } from '@/components/ui';
import { detectLocation } from '@/features/prayer/locate';
import { cityToLocation, countries, searchCities } from '@/features/prayer/prayer';
import { useI18n } from '@/i18n';
import { useSettings } from '@/store/settings-store';
import { useMushafTheme } from '@/theme/ThemeContext';

export default function CityScreen() {
  const { t, lang, dir } = useI18n();
  const { theme } = useMushafTheme();
  const c = theme.colors;
  const { settings, update } = useSettings();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const list = useMemo(() => searchCities(q), [q]);

  const gps = async () => {
    setBusy(true);
    setMsg(null);
    const r = await detectLocation(settings.useInternetForCity);
    setBusy(false);
    if (r.ok) {
      update({ location: r.location, autoLocation: true });
      router.back();
    } else setMsg(r.reason === 'denied' ? t('locationDenied') : t('locationFailed'));
  };

  return (
    <Screen title={t('chooseCity')} back>
      <View style={styles.top}>
        <Btn title={busy ? t('locating') : t('detectLocation')} icon="location" onPress={gps} disabled={busy} />
        {msg ? (
          <Txt size={13} color="textSecondary">
            {msg}
          </Txt>
        ) : null}
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t('searchCity')}
          placeholderTextColor={c.textSecondary}
          autoCorrect={false}
          accessibilityLabel={t('searchCity')}
          style={[styles.input, { color: c.text, backgroundColor: c.surface, borderColor: c.border, textAlign: dir.start }]}
        />
      </View>
      <FlatList
        data={list}
        keyExtractor={(x) => `${x[2]}-${x[0]}-${x[3]}`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => {
          const country = countries[item[2]];
          const name = lang === 'ar' ? item[1] || item[0] : item[0];
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                update({ location: cityToLocation(item), autoLocation: false });
                router.back();
              }}>
              {({ pressed }) => (
                <Row style={[styles.row, { borderColor: c.border }, pressed ? { backgroundColor: c.highlight } : {}]}>
                  <Txt size={16} style={{ flex: 1 }}>
                    {name}
                  </Txt>
                  <Txt size={13} color="textSecondary">
                    {country ? country[lang === 'ar' ? 0 : 1] : item[2]}
                  </Txt>
                </Row>
              )}
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 16, gap: 10, paddingBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  row: { gap: 10, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
});
