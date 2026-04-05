import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../store/ThemeContext';
import type { DailyCheckIn } from '../types';
import { AppModal } from './AppModal';
import { Button } from './Button';
import { FormField } from './FormField';
import { TextInputField } from './TextInputField';

const MOODS = ['😄', '🙂', '😐', '😕', '😫'];

type Props = {
  visible: boolean;
  dateKey: string;
  initial?: DailyCheckIn | null;
  onClose: () => void;
  onSave: (m: DailyCheckIn) => void;
};

export function EveningCheckInModal({ visible, dateKey, initial, onClose, onSave }: Props) {
  const t = useAppTheme();
  const [mood, setMood] = useState('🙂');
  const [reflection, setReflection] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (initial && initial.dateKey === dateKey) {
      setMood(initial.mood || '🙂');
      setReflection(initial.reflection ?? '');
    } else {
      setMood('🙂');
      setReflection('');
    }
  }, [visible, dateKey, initial]);

  const footer = (
    <>
      <Button
        title="Зберегти"
        style={{ flex: 1 }}
        onPress={() => {
          onSave({ dateKey, mood, reflection: reflection.trim() || undefined });
          onClose();
        }}
      />
      <Button title="Скасувати" variant="ghost" style={{ flex: 1 }} onPress={onClose} />
    </>
  );

  return (
    <AppModal visible={visible} title="Вечірній чек-ін" onClose={onClose} footer={footer}>
      <FormField label="Настрій">
        <View style={styles.moods}>
          {MOODS.map((m) => (
            <Pressable
              key={m}
              onPress={() => setMood(m)}
              style={[
                styles.moodBtn,
                { borderColor: t.colors.border },
                mood === m && { borderColor: t.colors.accent, backgroundColor: t.dark ? '#1e3a5f' : '#EFF6FF' },
              ]}
            >
              <Text style={styles.moodEmoji}>{m}</Text>
            </Pressable>
          ))}
        </View>
      </FormField>
      <FormField label="Коротке резюме дня (необов’язково)">
        <TextInputField
          value={reflection}
          onChangeText={setReflection}
          placeholder="Що вдалося, що ні…"
          multiline
        />
      </FormField>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  moods: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  moodBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  moodEmoji: { fontSize: 28 },
});
