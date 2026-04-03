import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ExpenseCategory, ModalMode } from '../types';
import { theme } from '../theme/theme';
import { AppModal } from './AppModal';
import { Button } from './Button';
import { FormField } from './FormField';
import { TextInputField } from './TextInputField';

const PRESET_COLORS = [
  '#DC2626',
  '#F59E0B',
  '#10B981',
  '#2563EB',
  '#7C3AED',
  '#EC4899',
];

type Props = {
  visible: boolean;
  mode: ModalMode;
  onClose: () => void;
  initial?: ExpenseCategory | null;
  onSave: (c: ExpenseCategory) => void;
  onDelete?: (id: string) => void;
  onRequestEdit?: () => void;
};

export function CategoryEditorModal({
  visible,
  mode,
  onClose,
  initial,
  onSave,
  onDelete,
  onRequestEdit,
}: Props) {
  const [draft, setDraft] = useState<ExpenseCategory>({
    id: '',
    name: '',
    color: PRESET_COLORS[0],
  });

  useEffect(() => {
    if (!visible) return;
    if (mode === 'create' || !initial) {
      setDraft({ id: '', name: '', color: PRESET_COLORS[0] });
      return;
    }
    setDraft(initial);
  }, [visible, mode, initial]);

  const readOnly = mode === 'view';

  const persist = () => {
    if (!draft.name.trim()) {
      Alert.alert('Назва', 'Вкажіть назву категорії.');
      return;
    }
    onSave(draft);
    onClose();
  };

  const title =
    mode === 'create'
      ? 'Нова категорія'
      : mode === 'view'
        ? 'Категорія'
        : 'Редагування категорії';

  const footer = (
    <>
      {mode === 'view' && onRequestEdit ? (
        <Button
          title="Редагувати"
          variant="secondary"
          style={{ flex: 1 }}
          onPress={onRequestEdit}
        />
      ) : null}
      {mode === 'view' && initial && onDelete ? (
        <Button
          title="Видалити"
          variant="danger"
          style={{ flex: 1 }}
          onPress={() => {
            Alert.alert('Видалити категорію?', '', [
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
          onChangeText={(t) => setDraft((x) => ({ ...x, name: t }))}
        />
      </FormField>
      <FormField label="Колір">
        <View style={styles.colorsRow}>
          {PRESET_COLORS.map((c) => (
            <Pressable
              key={c}
              disabled={readOnly}
              onPress={() => setDraft((x) => ({ ...x, color: c }))}
              style={[
                styles.swatch,
                { backgroundColor: c },
                draft.color === c && styles.swatchSelected,
              ]}
            />
          ))}
        </View>
        <TextInputField
          value={draft.color}
          editable={!readOnly}
          onChangeText={(t) => setDraft((x) => ({ ...x, color: t }))}
          style={{ marginTop: theme.spacing.sm }}
        />
      </FormField>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  colorsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: { borderColor: theme.colors.text },
});
