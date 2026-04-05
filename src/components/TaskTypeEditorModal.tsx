import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ModalMode, TaskType } from '../types';
import { useAppTheme } from '../store/ThemeContext';
import { AppModal } from './AppModal';
import { showThemedAlert } from './themedAlert';
import { Button } from './Button';
import { FormField } from './FormField';
import { TextInputField } from './TextInputField';

const PRESET_COLORS = [
  '#2563EB',
  '#7C3AED',
  '#DC2626',
  '#F59E0B',
  '#10B981',
  '#EC4899',
];

type Props = {
  visible: boolean;
  mode: ModalMode;
  onClose: () => void;
  initial?: TaskType | null;
  onSave: (c: TaskType) => void;
  onDelete?: (id: string) => void;
  onRequestEdit?: () => void;
};

export function TaskTypeEditorModal({
  visible,
  mode,
  onClose,
  initial,
  onSave,
  onDelete,
  onRequestEdit,
}: Props) {
  const t = useAppTheme();
  const [draft, setDraft] = useState<TaskType>({
    id: '',
    name: '',
    color: PRESET_COLORS[0],
    archived: false,
  });

  useEffect(() => {
    if (!visible) return;
    if (mode === 'create' || !initial) {
      setDraft({ id: '', name: '', color: PRESET_COLORS[0], archived: false });
      return;
    }
    setDraft(initial);
  }, [visible, mode, initial]);

  const readOnly = mode === 'view';

  const persist = () => {
    if (!draft.name.trim()) {
      showThemedAlert('Назва', 'Вкажіть назву типу.');
      return;
    }
    onSave(draft);
    onClose();
  };

  const title =
    mode === 'create'
      ? 'Новий тип задачі'
      : mode === 'view'
        ? 'Тип задачі'
        : 'Редагування типу';

  const footer = (
    <>
      {mode === 'view' && onRequestEdit ? (
        <Button title="Редагувати" variant="secondary" style={{ flex: 1 }} onPress={onRequestEdit} />
      ) : null}
      {mode === 'view' && initial?.id ? (
        <Button
          title={draft.archived ? 'Відновити' : 'У архів'}
          variant="secondary"
          style={{ flex: 1 }}
          onPress={() => {
            onSave({ ...draft, archived: !draft.archived });
            onClose();
          }}
        />
      ) : null}
      {mode === 'view' && initial?.id && onDelete ? (
        <Button
          title="Видалити"
          variant="danger"
          style={{ flex: 1 }}
          onPress={() => {
            showThemedAlert('Видалити тип?', '', [
              { text: 'Скасувати', style: 'cancel' },
              {
                text: 'Видалити',
                style: 'destructive',
                onPress: () => {
                  onDelete(initial.id);
                  onClose();
                },
              },
            ]);
          }}
        />
      ) : null}
      {mode === 'view' ? (
        <Button title="Закрити" variant="ghost" style={{ flex: 1 }} onPress={onClose} />
      ) : (
        <Button title="Зберегти" style={{ flex: 1 }} onPress={persist} />
      )}
    </>
  );

  return (
    <AppModal visible={visible} title={title} onClose={onClose} footer={footer}>
      <FormField label="Назва">
        <TextInputField
          value={draft.name}
          editable={!readOnly}
          onChangeText={(x) => setDraft((d) => ({ ...d, name: x }))}
          placeholder="Баг, фіча, рутина…"
        />
      </FormField>
      <FormField label="Колір">
        <View style={styles.colors}>
          {PRESET_COLORS.map((c) => {
            const on = draft.color === c;
            return (
              <Pressable
                key={c}
                disabled={readOnly}
                onPress={() => setDraft((d) => ({ ...d, color: c }))}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  on && { borderColor: t.colors.text, borderWidth: 3 },
                ]}
              />
            );
          })}
        </View>
      </FormField>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatch: { width: 36, height: 36, borderRadius: 18 },
});
