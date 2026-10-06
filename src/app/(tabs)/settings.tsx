/**
 * الإعدادات الكاملة: عام، المظهر، المصحف، التلاوة، الأذان والمواقيت، الإشعارات، الأذكار، الورد، البيانات، عن التطبيق.
 * كل إعداد بيتحفظ على الجهاز فورًا.
 */
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Icon, Row, Section, Segmented, SettingRow, Stepper, Toggle, Txt } from '@/components/ui';
import { BottomTabInset, QuranFont, QuranFontBold } from '@/constants/theme';
import { ayahs } from '@/data/quran';
import { tajweedSpans } from '@/data/quran/extra';
import { reciterById } from '@/features/audio/reciters';
import { exportBackup, makeBackup, pickBackup } from '@/features/backup';
import { ensurePermission, notificationsSupported } from '@/features/notifications/schedule';
import { locationLabel, resolveMethod, SALAH } from '@/features/prayer/prayer';
import { ARABIC_DIR, useI18n } from '@/i18n';
import { useReading } from '@/store/reading-store';
import { scaleFactor, type Settings, useSettings } from '@/store/settings-store';
import { themeList } from '@/theme/theme';
import { useMushafTheme } from '@/theme/ThemeContext';

/** أول كلمتين من البسملة — من ayahs.json (القاعدة 1) */
const SWATCH_TEXT = ayahs[0].split(' ').slice(0, 2).join(' ');

export default function SettingsScreen() {
  const { t, lang, num } = useI18n();
  const { settings: s, update, reset, replaceAll } = useSettings();
  const { theme, mode, setMode, tajweedEnabled, setTajweedEnabled } = useMushafTheme();
  const reading = useReading();
  const c = theme.colors;
  const [notifDenied, setNotifDenied] = useState(false);

  /** تشغيل أي إشعار بيطلب الإذن الأول */
  const setNotify = async (patch: Partial<Settings>) => {
    const turningOn = Object.values(patch).some((v) => v === true);
    if (turningOn && notificationsSupported) {
      const ok = await ensurePermission();
      setNotifDenied(!ok);
      if (!ok) return;
    }
    update(patch);
  };

  const doExport = async () => {
    const ok = await exportBackup(makeBackup(s, reading.exportData()));
    if (ok && Platform.OS === 'web') Alert.alert?.(t('backupDone'));
  };
  const doImport = async () => {
    const b = await pickBackup();
    if (b === 'cancel') return;
    if (!b) return Alert.alert(t('importFailed'));
    replaceAll(b.settings as Partial<Settings>);
    reading.importData(b.reading as Parameters<typeof reading.importData>[0]);
    Alert.alert(t('importDone'));
  };
  const doReset = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(t('resetConfirm'))) {
        reset();
        setMode('system');
      }
      return;
    }
    Alert.alert(t('resetSettings'), t('resetConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('resetSettings'),
        style: 'destructive',
        onPress: () => {
          reset();
          setMode('system');
        },
      },
    ]);
  };

  const previewSize = 24 * scaleFactor(s.mushafScale);
  const tajColors = [theme.tajweed.madd, theme.tajweed.ghunnah, theme.tajweed.tafkheem, theme.tajweed.silent];
  const preview = ayahs[0];

  return (
    <Screen title={t('settingsTitle')}>
      <ScrollView contentContainerStyle={styles.body}>
        {/* ───── عام ───── */}
        <Section title={t('secGeneral')}>
          <SettingRow icon="globe" label={t('language')} vertical>
            <Segmented
              value={s.language}
              onChange={(v) => update({ language: v })}
              options={[
                { value: 'ar', label: t('langAr') },
                { value: 'en', label: t('langEn') },
              ]}
            />
          </SettingRow>
          <SettingRow icon="textSize" label={t('fontSize')}>
            <Stepper value={s.uiScale} min={1} max={10} onChange={(v) => update({ uiScale: v })} />
          </SettingRow>
          <SettingRow icon="bold" label={t('fontWeight')} vertical>
            <Segmented
              value={s.uiBold ? 1 : 0}
              onChange={(v) => update({ uiBold: v === 1 })}
              options={[
                { value: 0, label: t('weightNormal') },
                { value: 1, label: t('weightBold') },
              ]}
            />
          </SettingRow>
          <SettingRow icon="sparkles" label={t('showIntro')}>
            <Toggle label={t('showIntro')} value={s.showIntro} onChange={(v) => update({ showIntro: v })} />
          </SettingRow>
          {Platform.OS !== 'web' && (
            <SettingRow icon="vibrate" label={t('haptics')}>
              <Toggle label={t('haptics')} value={s.haptics} onChange={(v) => update({ haptics: v })} />
            </SettingRow>
          )}
          {Platform.OS !== 'web' && (
            <SettingRow icon="sun" label={t('keepAwake')} last>
              <Toggle label={t('keepAwake')} value={s.keepAwake} onChange={(v) => update({ keepAwake: v })} />
            </SettingRow>
          )}
        </Section>

        {/* ───── المظهر ───── */}
        <Section title={t('secAppearance')}>
          <SettingRow icon="palette" label={t('themeAuto')} onPress={() => setMode('system')}>
            {mode === 'system' ? <Icon name="check" size={20} color={c.accent} /> : null}
          </SettingRow>
          <View style={styles.themeGrid}>
            {themeList.map((th) => {
              const sel = mode === th.id;
              return (
                <Pressable
                  key={th.id}
                  onPress={() => setMode(th.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: sel }}
                  accessibilityLabel={lang === 'ar' ? th.name : th.nameEn}
                  style={[
                    styles.swatch,
                    { backgroundColor: th.colors.background, borderColor: sel ? th.colors.accent : th.colors.border, borderWidth: sel ? 3 : 1 },
                  ]}>
                  <Text style={{ fontFamily: QuranFont, fontSize: 17, color: th.colors.text }}>{SWATCH_TEXT}</Text>
                  <View style={{ width: '60%', height: 3, borderRadius: 2, backgroundColor: th.colors.accent }} />
                  <Text style={{ fontSize: 12, color: th.colors.textSecondary }}>{lang === 'ar' ? th.name : th.nameEn}</Text>
                </Pressable>
              );
            })}
          </View>
          <SettingRow icon="moon" label={t('nightByPrayer')} last>
            <Toggle label={t('nightByPrayer')} value={s.nightByPrayer} onChange={(v) => update({ nightByPrayer: v })} />
          </SettingRow>
        </Section>

        {/* ───── المصحف ───── */}
        <Section title={t('secMushaf')} footer={s.mushafMode === 'pages' ? t('pagesModeNote') : undefined}>
          <View style={[styles.preview, { borderColor: c.border }]}>
            <Text
              style={{
                fontFamily: s.mushafBold ? QuranFontBold : QuranFont,
                fontSize: previewSize,
                lineHeight: previewSize * 1.8,
                color: c.text,
                textAlign: 'center',
                writingDirection: 'rtl',
              }}>
              {tajweedEnabled
                ? tajweedSpans(1, preview, 0, preview.length).map((sp, k) =>
                    sp.cat < 0 ? sp.text : <Text key={k} style={{ color: tajColors[sp.cat] }}>{sp.text}</Text>
                  )
                : preview}
              <Text style={{ color: c.accent }}>{' ﴿١﴾'}</Text>
            </Text>
          </View>
          <SettingRow icon="book" label={t('readingMode')} vertical>
            <Segmented
              value={s.mushafMode}
              onChange={(v) => update({ mushafMode: v })}
              options={[
                { value: 'pages', label: t('readingModePages') },
                { value: 'text', label: t('readingModeText') },
              ]}
            />
          </SettingRow>
          <SettingRow icon="textSize" label={t('fontSize')}>
            <Stepper value={s.mushafScale} min={1} max={10} onChange={(v) => update({ mushafScale: v })} />
          </SettingRow>
          <SettingRow icon="bold" label={t('fontWeight')} vertical>
            <Segmented
              value={s.mushafBold ? 1 : 0}
              onChange={(v) => update({ mushafBold: v === 1 })}
              options={[
                { value: 0, label: t('weightThin') },
                { value: 1, label: t('weightBold') },
              ]}
            />
          </SettingRow>
          <SettingRow icon="palette" label={t('tajweedColors')} hint={t('tajweedLegend')}>
            <Toggle label={t('tajweedColors')} value={tajweedEnabled} onChange={setTajweedEnabled} />
          </SettingRow>
          <SettingRow icon="eye" label={t('showMargins')}>
            <Toggle label={t('showMargins')} value={s.showMargins} onChange={(v) => update({ showMargins: v })} />
          </SettingRow>
          <SettingRow icon="translate" label={t('showTranslation')} last>
            <Toggle label={t('showTranslation')} value={s.showTranslation} onChange={(v) => update({ showTranslation: v })} />
          </SettingRow>
        </Section>

        {/* ───── التلاوة ───── */}
        <Section title={t('secRecitation')}>
          <SettingRow icon="person" label={t('reciter')} hint={lang === 'ar' ? reciterById(s.reciter).ar : reciterById(s.reciter).en} onPress={() => router.push('/reciter')}>
            <Chevron />
          </SettingRow>
          <SettingRow icon="repeat" label={t('repeat')} last>
            <Stepper value={s.repeatAyah} min={1} max={10} onChange={(v) => update({ repeatAyah: v })} format={(v) => t('repeatN', { n: v })} />
          </SettingRow>
        </Section>

        {/* ───── الأذان والمواقيت ───── */}
        <Section title={t('secPrayer')}>
          <SettingRow icon="list" label={t('madhab')} vertical>
            <Segmented
              value={s.madhab}
              onChange={(v) => update({ madhab: v })}
              options={[
                { value: 'shafi', label: t('madhabShafi') },
                { value: 'hanafi', label: t('madhabHanafi') },
              ]}
            />
          </SettingRow>
          <SettingRow
            icon="calc"
            label={t('calcMethod')}
            hint={s.method === 'auto' ? `${t('method_auto')} — ${t(`method_${resolveMethod(s)}`)}` : t(`method_${s.method}`)}
            onPress={() => router.push('/method')}>
            <Chevron />
          </SettingRow>
          <SettingRow icon="sun" label={t('dst')}>
            <Toggle label={t('dst')} value={s.dst} onChange={(v) => update({ dst: v })} />
          </SettingRow>
          <SettingRow icon="house" label={t('city')} hint={s.location ? locationLabel(s.location, lang) : '—'} onPress={() => router.push('/city')}>
            <Txt size={13} color="accent">
              {t('changeCity')}
            </Txt>
          </SettingRow>
          <SettingRow icon="location" label={t('autoLocation')}>
            <Toggle label={t('autoLocation')} value={s.autoLocation} onChange={(v) => update({ autoLocation: v })} />
          </SettingRow>
          {Platform.OS !== 'web' && (
            <SettingRow icon="globe" label={t('useInternetForCity')}>
              <Toggle label={t('useInternetForCity')} value={s.useInternetForCity} onChange={(v) => update({ useInternetForCity: v })} />
            </SettingRow>
          )}
          <SettingRow icon="clock" label={t('adjustments')} vertical last>
            <View style={{ gap: 8 }}>
              {SALAH.map((p) => (
                <Row key={p} style={{ justifyContent: 'space-between' }}>
                  <Txt size={14}>{t(p)}</Txt>
                  <Stepper
                    value={s.adjust[p]}
                    min={-30}
                    max={30}
                    onChange={(v) => update({ adjust: { ...s.adjust, [p]: v } })}
                    format={(v) => num(v > 0 ? `+${v}` : String(v))}
                  />
                </Row>
              ))}
            </View>
          </SettingRow>
        </Section>

        {/* ───── الإشعارات ───── */}
        <Section
          title={t('secNotifications')}
          footer={!notificationsSupported ? t('notificationsWebNote') : notifDenied ? t('notificationsDenied') : undefined}>
          <SettingRow icon="bell" label={t('notifyAdhan')}>
            <Toggle label={t('notifyAdhan')} value={s.notifyAdhan} onChange={(v) => setNotify({ notifyAdhan: v })} />
          </SettingRow>
          {s.notifyAdhan && (
            <View style={[styles.chips, { flexDirection: ARABIC_DIR.row === 'row' && lang === 'ar' ? 'row' : undefined }]}>
              {SALAH.map((p) => {
                const on = s.notifyPrayers[p];
                return (
                  <Pressable
                    key={p}
                    onPress={() => update({ notifyPrayers: { ...s.notifyPrayers, [p]: !on } })}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    style={[styles.chip, { borderColor: on ? c.accent : c.border, backgroundColor: on ? c.highlight : 'transparent' }]}>
                    <Txt size={13} color={on ? 'accent' : 'textSecondary'}>
                      {t(p)}
                    </Txt>
                  </Pressable>
                );
              })}
            </View>
          )}
          <SettingRow icon="speaker" label={t('adhanSound')}>
            <Toggle label={t('adhanSound')} value={s.adhanSound} onChange={(v) => update({ adhanSound: v })} />
          </SettingRow>
          <SettingRow icon="clock" label={t('preReminder')}>
            <Stepper
              value={s.preReminder}
              min={0}
              max={60}
              step={5}
              onChange={(v) => update({ preReminder: v })}
              format={(v) => (v === 0 ? t('preReminderOff') : num(`${v} ${t('minutesShort')}`))}
            />
          </SettingRow>
          <SettingRow icon="sparkles" label={t('notifyAzkar')}>
            <Toggle label={t('notifyAzkar')} value={s.notifyAzkar} onChange={(v) => setNotify({ notifyAzkar: v })} />
          </SettingRow>
          {s.notifyAzkar && (
            <>
              <SettingRow label={t('morningAzkar')}>
                <TimeStepper value={s.morningAzkarTime} onChange={(v) => update({ morningAzkarTime: v })} />
              </SettingRow>
              <SettingRow label={t('eveningAzkar')}>
                <TimeStepper value={s.eveningAzkarTime} onChange={(v) => update({ eveningAzkarTime: v })} />
              </SettingRow>
            </>
          )}
          <SettingRow icon="book" label={t('notifyWird')}>
            <Toggle label={t('notifyWird')} value={s.notifyWird} onChange={(v) => setNotify({ notifyWird: v })} />
          </SettingRow>
          {s.notifyWird && (
            <SettingRow label={t('dailyWird')}>
              <TimeStepper value={s.wirdTime} onChange={(v) => update({ wirdTime: v })} />
            </SettingRow>
          )}
          <SettingRow icon="calendar" label={t('notifyKahf')} last>
            <Toggle label={t('notifyKahf')} value={s.notifyKahf} onChange={(v) => setNotify({ notifyKahf: v })} />
          </SettingRow>
        </Section>

        {/* ───── الأذكار ───── */}
        <Section title={t('secAzkar')}>
          <SettingRow icon="check" label={t('removeFinishedAzkar')}>
            <Toggle label={t('removeFinishedAzkar')} value={s.removeFinishedAzkar} onChange={(v) => update({ removeFinishedAzkar: v })} />
          </SettingRow>
          <SettingRow icon="vibrate" label={t('vibrateOnFinish')} last>
            <Toggle label={t('vibrateOnFinish')} value={s.vibrateOnFinish} onChange={(v) => update({ vibrateOnFinish: v })} />
          </SettingRow>
        </Section>

        {/* ───── الورد ───── */}
        <Section title={t('secWird')}>
          <SettingRow icon="book" label={t('wirdPagesPerDay')} last>
            <Stepper value={s.wirdPagesPerDay} min={1} max={40} onChange={(v) => update({ wirdPagesPerDay: v })} />
          </SettingRow>
        </Section>

        {/* ───── البيانات ───── */}
        <Section title={t('secData')}>
          <SettingRow icon="export" label={t('exportBackup')} onPress={doExport}>
            <Chevron />
          </SettingRow>
          <SettingRow icon="import" label={t('importBackup')} onPress={doImport}>
            <Chevron />
          </SettingRow>
          <SettingRow icon="reset" label={t('resetSettings')} onPress={doReset} last>
            <Chevron />
          </SettingRow>
        </Section>

        {/* ───── عن التطبيق ───── */}
        <Section title={t('secAbout')}>
          <SettingRow icon="info" label={t('secAbout')} onPress={() => router.push('/about')} last>
            <Chevron />
          </SettingRow>
        </Section>
      </ScrollView>
    </Screen>
  );
}

function shiftTime(hhmm: string, mins: number) {
  const [h, m] = hhmm.split(':').map(Number);
  const total = (((h * 60 + m + mins) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** وقت بخطوات ربع ساعة (− 6:30 ص +) */
function TimeStepper({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { lang, num } = useI18n();
  const [h, m] = value.split(':').map(Number);
  const ampm = h < 12 ? (lang === 'ar' ? 'ص' : 'AM') : lang === 'ar' ? 'م' : 'PM';
  return (
    <Row style={{ gap: 8 }}>
      <SmallBtn label="−" onPress={() => onChange(shiftTime(value, -15))} />
      <Txt size={15} weight="bold" style={{ minWidth: 76 }} align="center">
        {num(`${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${ampm}`)}
      </Txt>
      <SmallBtn label="+" onPress={() => onChange(shiftTime(value, 15))} />
    </Row>
  );
}

function Chevron() {
  const { theme } = useMushafTheme();
  const { dir } = useI18n();
  return (
    <View style={{ transform: [{ scaleX: dir.rtl ? -1 : 1 }] }}>
      <Icon name="chevron" size={18} color={theme.colors.textSecondary} />
    </View>
  );
}

function SmallBtn({ label, onPress }: { label: string; onPress: () => void }) {
  const { theme } = useMushafTheme();
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" style={[styles.small, { borderColor: theme.colors.border }]}>
      <Text style={{ color: theme.colors.accent, fontSize: 20, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: BottomTabInset + 40 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 12 },
  swatch: { width: '30%', flexGrow: 1, aspectRatio: 0.9, borderRadius: 12, padding: 8, alignItems: 'center', justifyContent: 'space-between' },
  preview: { margin: 12, padding: 12, borderWidth: 1, borderRadius: 12 },
  chips: { flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, paddingBottom: 10, flexDirection: 'row' },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5 },
  small: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
