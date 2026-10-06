/** نافذة صغيرة لكتابة اسم (قايمة جديدة أو تغيير الاسم) — شغالة على الموبايل والويب */
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Btn, Row, Txt } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useMushafTheme } from '@/theme/ThemeContext';

export function NamePrompt({
  visible,
  title,
  initial = '',
  confirmLabel,
  onCancel,
  onSubmit,
}: {
  visible: boolean;
  title: string;
  initial?: string;
  confirmLabel: string;
  onCancel: () => void;
  onSubmit: (name: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      {/* key: يبدأ من القيمة الأولية كل مرة النافذة تفتح */}
      {visible ? <Body key={initial} title={title} initial={initial} confirmLabel={confirmLabel} onCancel={onCancel} onSubmit={onSubmit} /> : null}
    </Modal>
  );
}

function Body({
  title,
  initial,
  confirmLabel,
  onCancel,
  onSubmit,
}: {
  title: string;
  initial: string;
  confirmLabel: string;
  onCancel: () => void;
  onSubmit: (name: string) => void;
}) {
  const { theme } = useMushafTheme();
  const { t, dir } = useI18n();
  const c = theme.colors;
  const [name, setName] = useState(initial);
  const submit = () => {
    if (name.trim()) onSubmit(name.trim());
  };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel={t('cancel')} />
      <View style={[styles.box, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Txt size={18} weight="bold">
          {title}
        </Txt>
        <TextInput
          value={name}
          onChangeText={setName}
          autoFocus
          placeholder={t('playlistNamePlaceholder')}
          placeholderTextColor={c.textSecondary}
          onSubmitEditing={submit}
          returnKeyType="done"
          maxLength={40}
          style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background, textAlign: dir.start }]}
        />
        <Row style={{ gap: 10 }}>
          <Btn title={confirmLabel} onPress={submit} disabled={!name.trim()} style={{ flex: 1 }} />
          <Btn title={t('cancel')} kind="secondary" onPress={onCancel} style={{ flex: 1 }} />
        </Row>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  box: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 14, width: '100%', maxWidth: 420, alignSelf: 'center' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
});
