/** عن التطبيق: الإصدار، الخصوصية، التقييم، المشاركة، التواصل، ومصادر البيانات (ذكر المصدر مطلوب في التراخيص) */
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import React from 'react';
import { Image, Linking, Platform, ScrollView, Share, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Section, SettingRow, Txt } from '@/components/ui';
import { Brand, LINKS } from '@/constants/brand';
import { useI18n } from '@/i18n';

const SOURCES = [
  'نص القرآن (الرسم العثماني، رواية حفص): موسوعة القرآن الكريم QuranEnc.com عبر حزمة quran-json — CC BY 4.0',
  'ترتيب السطور والصفحات (مصحف المدينة، 604 صفحة): حزمة quran-qcf4 — بيانات JSON برخصة MIT',
  'الأجزاء والأحزاب والسجدات: حزمة quran-meta — MIT',
  'أحكام التجويد: مكتبة ghunna — MIT',
  'التفسير الميسر: مجمع الملك فهد لطباعة المصحف الشريف، عبر tafsir_api',
  'ترجمة المعاني الإنجليزية: مركز رواد الترجمة (QuranEnc.com)، عبر quran-api',
  'الأذكار: حصن المسلم، عبر azkar-db',
  'المدن: GeoNames عبر all-the-cities — CC BY 4.0',
  'مواقيت الصلاة والقبلة: مكتبة adhan — MIT',
  'التلاوات: EveryAyah.com',
  'صوت الأذان: sonically_sound عبر Freesound.org (رقم 639494) — مكتوب CC0، والمصدر الأصلي غير مؤكد (docs/data.md)',
  'الخطوط: Scheherazade New (SIL) و Aref Ruqaa — SIL Open Font License',
];

export default function AboutScreen() {
  const { t, num } = useI18n();
  const version = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '1.0.0';

  const rate = () => {
    if (Platform.OS === 'android') Linking.openURL(`market://details?id=${LINKS.androidPackage}`).catch(() => {});
    else if (Platform.OS === 'ios' && LINKS.appStoreId) Linking.openURL(`itms-apps://apps.apple.com/app/id${LINKS.appStoreId}?action=write-review`);
    else Linking.openURL(LINKS.website);
  };

  return (
    <Screen title={t('secAbout')} back>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.hero, { backgroundColor: Brand.colors.green }]}>
          <Image source={require('@/assets/images/splash-icon.png')} style={{ width: 120, height: 120 }} resizeMode="contain" accessibilityLabel={Brand.name} />
          <Txt size={13} color={Brand.colors.gold} align="center">{`${t('version')} ${num(version)}`}</Txt>
        </View>

        <Section>
          <SettingRow icon="shield" label={t('privacy')} onPress={() => router.push('/privacy')} />
          <SettingRow icon="star" label={t('rateApp')} onPress={rate} />
          <SettingRow icon="share" label={t('shareApp')} onPress={() => Share.share({ message: t('shareAppMessage') }).catch(() => {})} last={!LINKS.contactEmail} />
          {LINKS.contactEmail ? (
            <SettingRow icon="mail" label={t('contact')} onPress={() => Linking.openURL(`mailto:${LINKS.contactEmail}`)} last />
          ) : null}
        </Section>

        <Section title={t('sources')} footer={t('sourcesNote')}>
          <View style={{ padding: 14, gap: 8 }}>
            {SOURCES.map((s) => (
              <Txt key={s} arabic size={13} color="textSecondary" lineHeight={1.5}>
                {`• ${s}`}
              </Txt>
            ))}
          </View>
        </Section>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 48 },
  hero: { borderRadius: 16, alignItems: 'center', paddingVertical: 20, gap: 4, marginBottom: 18 },
});
