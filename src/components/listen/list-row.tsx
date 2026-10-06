/** سطر في قوايم الاستماع (سورة، جزء، قايمة) + زرار أيقونة صغير */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName, Row, Txt } from '@/components/ui';
import { useMushafTheme } from '@/theme/ThemeContext';

export function ListRow({
  number,
  icon,
  title,
  subtitle,
  active,
  onPress,
  children,
}: {
  number?: string;
  icon?: IconName;
  title: string;
  subtitle?: string;
  active: boolean;
  onPress: () => void;
  children?: React.ReactNode;
}) {
  const { theme } = useMushafTheme();
  const c = theme.colors;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
      {({ pressed }) => (
        <Row style={[styles.row, { borderColor: c.border }, (pressed || active) && { backgroundColor: c.highlight }]}>
          <View style={[styles.num, { borderColor: active ? c.accent : c.border }]}>
            {icon ? (
              <Icon name={icon} size={18} color={c.accent} />
            ) : active ? (
              <Icon name="speaker" size={16} color={c.accent} />
            ) : (
              <Txt size={13} color="textSecondary" align="center">
                {number}
              </Txt>
            )}
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt size={16} weight={active ? 'bold' : 'medium'} color={active ? 'accent' : 'text'} numberOfLines={1}>
              {title}
            </Txt>
            {subtitle ? (
              <Txt size={12} color="textSecondary" numberOfLines={1}>
                {subtitle}
              </Txt>
            ) : null}
          </View>
          {children}
        </Row>
      )}
    </Pressable>
  );
}

export function IconBtn({ icon, label, onPress, accent, disabled }: { icon: IconName; label: string; onPress: () => void; accent?: boolean; disabled?: boolean }) {
  const { theme } = useMushafTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} style={[styles.iconBtn, disabled && { opacity: 0.3 }]}>
      <Icon name={icon} size={20} color={accent ? theme.colors.accent : theme.colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: 10, paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderRadius: 8 },
  num: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
});
