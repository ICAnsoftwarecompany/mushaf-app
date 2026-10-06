/**
 * مكونات الواجهة المشتركة: بتطبّق الثيم، وحجم ووزن الخط من الإعدادات، والاتجاه حسب اللغة.
 * استخدمها في الشاشات بدل Text و View العاديين علشان كل الإعدادات تتطبق تلقائي.
 */
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  Platform,
  Pressable,
  type PressableProps,
  StyleSheet,
  Switch,
  Text,
  type TextProps,
  type TextStyle,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { QuranFont, QuranFontBold } from '@/constants/theme';
import { ARABIC_DIR, useI18n } from '@/i18n';
import { scaleFactor, useSettings } from '@/store/settings-store';
import { useMushafTheme } from '@/theme/ThemeContext';

type ColorKey = 'text' | 'textSecondary' | 'accent' | 'background' | 'surface' | 'border';

export interface TxtProps extends TextProps {
  size?: number;
  weight?: 'normal' | 'medium' | 'bold';
  color?: ColorKey | (string & {});
  align?: 'start' | 'end' | 'center';
  /** نص قرآني: خط المصحف + حجم ووزن خط المصحف + اتجاه عربي */
  quran?: boolean;
  /** نص عربي (أذكار…): اتجاه عربي مهما كانت لغة الواجهة */
  arabic?: boolean;
  lineHeight?: number;
}

const COLOR_KEYS: readonly string[] = ['text', 'textSecondary', 'accent', 'background', 'surface', 'border'];

export function Txt({ size = 16, weight = 'normal', color = 'text', align = 'start', quran, arabic, lineHeight, style, ...rest }: TxtProps) {
  const { theme } = useMushafTheme();
  const { settings } = useSettings();
  const { dir } = useI18n();
  const d = quran || arabic ? ARABIC_DIR : dir;
  const scale = scaleFactor(quran ? settings.mushafScale : settings.uiScale);
  const fs = size * scale;
  const bold = weight === 'bold' || (!quran && settings.uiBold && weight !== 'normal') || (!quran && settings.uiBold);
  const s: TextStyle = {
    color: COLOR_KEYS.includes(color) ? theme.colors[color as ColorKey] : color,
    fontSize: fs,
    textAlign: align === 'center' ? 'center' : align === 'end' ? d.end : d.start,
    writingDirection: d.writingDirection,
  };
  if (quran) {
    s.fontFamily = settings.mushafBold ? QuranFontBold : QuranFont;
    s.lineHeight = (lineHeight ?? 1.9) * fs;
  } else {
    s.fontWeight = weight === 'bold' || bold ? '700' : weight === 'medium' ? '600' : '400';
    if (lineHeight) s.lineHeight = lineHeight * fs;
  }
  return <Text {...rest} style={[s, style]} />;
}

/** صف بيبدأ من اليمين في العربي */
export function Row({ style, ...rest }: ViewProps & { style?: ViewStyle | ViewStyle[] }) {
  const { dir } = useI18n();
  return <View {...rest} style={[{ flexDirection: dir.row, alignItems: 'center' }, style]} />;
}

export function Card({ style, ...rest }: ViewProps) {
  const { theme } = useMushafTheme();
  return (
    <View
      {...rest}
      style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, style]}
    />
  );
}

export function useHaptic() {
  const { settings } = useSettings();
  return (kind: 'light' | 'success' = 'light') => {
    if (!settings.haptics || Platform.OS === 'web') return;
    if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };
}

export function Btn({
  title,
  onPress,
  kind = 'primary',
  icon,
  style,
  disabled,
  ...rest
}: Omit<PressableProps, 'style'> & {
  title: string;
  kind?: 'primary' | 'secondary' | 'ghost';
  icon?: IconName;
  style?: ViewStyle;
}) {
  const { theme } = useMushafTheme();
  const haptic = useHaptic();
  const c = theme.colors;
  const bg = kind === 'primary' ? c.accent : kind === 'secondary' ? c.surface : 'transparent';
  const fg = kind === 'primary' ? c.background : c.accent;
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={(e) => {
        haptic();
        onPress?.(e);
      }}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: kind === 'secondary' ? c.border : bg, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
        style,
      ]}>
      <Row style={{ gap: 6, justifyContent: 'center' }}>
        {icon && <Icon name={icon} size={18} color={fg} />}
        <Txt size={15} weight="medium" color={fg} align="center">
          {title}
        </Txt>
      </Row>
    </Pressable>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const { theme } = useMushafTheme();
  const haptic = useHaptic();
  return (
    <Switch
      value={value}
      accessibilityLabel={label}
      onValueChange={(v) => {
        haptic();
        onChange(v);
      }}
      trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
      thumbColor={Platform.OS === 'android' ? (value ? theme.colors.surface : '#f4f3f4') : undefined}
    />
  );
}

/** اختيار من بين خيارات قليلة (زي Shafi / Hanafi) */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const { theme } = useMushafTheme();
  const haptic = useHaptic();
  const c = theme.colors;
  return (
    <Row style={[styles.segment, { backgroundColor: c.background, borderColor: c.border }]}>
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: sel }}
            onPress={() => {
              haptic();
              onChange(o.value);
            }}
            style={[styles.segmentItem, sel && { backgroundColor: c.surface, borderColor: c.accent }]}>
            <Txt size={14} weight={sel ? 'bold' : 'normal'} color={sel ? 'accent' : 'textSecondary'} align="center">
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </Row>
  );
}

/** − قيمة + */
export function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
}) {
  const { theme } = useMushafTheme();
  const { num } = useI18n();
  const haptic = useHaptic();
  const c = theme.colors;
  const set = (v: number) => {
    const n = Math.min(max, Math.max(min, v));
    if (n !== value) {
      haptic();
      onChange(n);
    }
  };
  const btn = (label: string, v: number, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => set(v)}
      hitSlop={8}
      style={[styles.stepBtn, { borderColor: c.border, opacity: disabled ? 0.35 : 1 }]}>
      <Text style={{ color: c.accent, fontSize: 22, fontWeight: '600', lineHeight: 24 }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={styles.stepper}>
      {btn('−', value - step, value <= min)}
      <Txt size={18} weight="bold" align="center" style={{ minWidth: 44 }}>
        {format ? format(value) : num(value)}
      </Txt>
      {btn('+', value + step, value >= max)}
    </View>
  );
}

export function Section({ title, children, footer }: { title?: string; children: React.ReactNode; footer?: string }) {
  return (
    <View style={styles.section}>
      {title ? (
        <Txt size={14} weight="bold" color="accent" style={styles.sectionTitle}>
          {title}
        </Txt>
      ) : null}
      <Card style={{ padding: 0 }}>{children}</Card>
      {footer ? (
        <Txt size={12} color="textSecondary" style={styles.sectionFooter}>
          {footer}
        </Txt>
      ) : null}
    </View>
  );
}

/** سطر إعداد: أيقونة + عنوان (ووصف) + عنصر تحكم */
export function SettingRow({
  icon,
  label,
  hint,
  children,
  onPress,
  last,
  vertical,
}: {
  icon?: IconName;
  label: string;
  hint?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
  /** العنصر تحت العنوان بدل جنبه (للعناصر العريضة) */
  vertical?: boolean;
}) {
  const { theme } = useMushafTheme();
  const c = theme.colors;
  const body = (
    <View style={[styles.settingRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.border }]}>
      <Row style={{ gap: 12 }}>
        {icon && <Icon name={icon} size={20} color={c.textSecondary} />}
        <View style={{ flex: 1, gap: 2 }}>
          <Txt size={15}>{label}</Txt>
          {hint ? (
            <Txt size={12} color="textSecondary">
              {hint}
            </Txt>
          ) : null}
        </View>
        {!vertical && children}
      </Row>
      {vertical && <View style={{ marginTop: 10 }}>{children}</View>}
    </View>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      {({ pressed }) => <View style={{ opacity: pressed ? 0.6 : 1 }}>{body}</View>}
    </Pressable>
  ) : (
    body
  );
}

// ───────────────────────── الأيقونات ─────────────────────────
// SF Symbols على iOS، و Material Symbols على أندرويد والويب
const ICONS = {
  book: ['book.fill', 'menu_book'],
  clock: ['clock.fill', 'schedule'],
  sparkles: ['sparkles', 'auto_awesome'],
  search: ['magnifyingglass', 'search'],
  gear: ['gearshape.fill', 'settings'],
  bookmark: ['bookmark.fill', 'bookmark'],
  bookmarkOutline: ['bookmark', 'bookmark_border'],
  share: ['square.and.arrow.up', 'share'],
  copy: ['doc.on.doc', 'content_copy'],
  play: ['play.fill', 'play_arrow'],
  pause: ['pause.fill', 'pause'],
  stop: ['stop.fill', 'stop'],
  forward: ['forward.end.fill', 'skip_next'],
  backward: ['backward.end.fill', 'skip_previous'],
  repeat: ['repeat', 'repeat'],
  download: ['arrow.down.circle', 'download'],
  check: ['checkmark.circle.fill', 'check_circle'],
  close: ['xmark', 'close'],
  back: ['chevron.backward', 'arrow_back'],
  chevron: ['chevron.forward', 'chevron_right'],
  location: ['location.fill', 'my_location'],
  compass: ['location.north.line.fill', 'explore'],
  globe: ['globe', 'language'],
  textSize: ['textformat.size', 'format_size'],
  bold: ['bold', 'format_bold'],
  moon: ['moon.fill', 'dark_mode'],
  sun: ['sun.max.fill', 'light_mode'],
  bell: ['bell.fill', 'notifications'],
  speaker: ['speaker.wave.2.fill', 'volume_up'],
  list: ['list.bullet', 'format_list_bulleted'],
  calc: ['function', 'calculate'],
  house: ['house.fill', 'home'],
  info: ['info.circle', 'info'],
  shield: ['lock.shield', 'shield'],
  star: ['star.fill', 'star'],
  mail: ['envelope.fill', 'mail'],
  export: ['square.and.arrow.up.on.square', 'upload'],
  import: ['square.and.arrow.down', 'download'],
  reset: ['arrow.counterclockwise', 'restart_alt'],
  vibrate: ['iphone.radiowaves.left.and.right', 'vibration'],
  eye: ['eye', 'visibility'],
  palette: ['paintpalette.fill', 'palette'],
  goto: ['arrow.right.circle', 'arrow_circle_right'],
  translate: ['character.book.closed', 'translate'],
  tasbih: ['circle.grid.cross', 'radio_button_checked'],
  calendar: ['calendar', 'calendar_today'],
  person: ['person.wave.2.fill', 'record_voice_over'],
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color?: string }) {
  const { theme } = useMushafTheme();
  const [ios, md] = ICONS[name];
  return (
    <SymbolView
       
      name={{ ios, android: md, web: md } as any}
      size={size}
      tintColor={color ?? theme.colors.text}
      resizeMode="scaleAspectFit"
      style={{ width: size, height: size }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  btn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  segment: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { gap: 6, marginBottom: 18 },
  sectionTitle: { paddingHorizontal: 4 },
  sectionFooter: { paddingHorizontal: 4 },
  settingRow: { paddingHorizontal: 14, paddingVertical: 12 },
});
