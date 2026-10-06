/** سياسة الخصوصية — نفس النص منشور في docs/privacy.md وعلى الويب في /privacy */
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Screen } from '@/components/screen';
import { Txt } from '@/components/ui';
import { useI18n } from '@/i18n';

export default function PrivacyScreen() {
  const { t } = useI18n();
  return (
    <Screen title={t('privacyTitle')} back>
      <ScrollView contentContainerStyle={styles.body}>
        <Txt size={16} lineHeight={1.7}>
          {t('privacyBody')}
        </Txt>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({ body: { padding: 16, paddingBottom: 48 } });
