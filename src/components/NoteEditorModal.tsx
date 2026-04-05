import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ModalMode, Note } from '../types';
import { useAppTheme } from '../store/ThemeContext';
import { AppModal } from './AppModal';
import { showThemedAlert } from './themedAlert';
import { Button } from './Button';
import { FormField } from './FormField';
import { TextInputField } from './TextInputField';

type Props = {
  visible: boolean;
  mode: ModalMode;
  initial?: Note | null;
  projectIds: { id: string; name: string }[];
  onClose: () => void;
  onRequestEdit?: () => void;
  onSave: (n: Note) => void;
  onDelete?: (id: string) => void;
};

function emptyNote(): Note {
  return {
    id: '',
    title: '',
    projectId: null,
    description: '',
  };
}

export function NoteEditorModal({
  visible,
  mode,
  initial,
  projectIds,
  onClose,
  onRequestEdit,
  onSave,
  onDelete,
}: Props) {
  const t = useAppTheme();
  const [draft, setDraft] = useState<Note>(() => emptyNote());

  useEffect(() => {
    if (!visible) return;
    if (mode === 'create' || !initial) {
      setDraft(emptyNote());
      return;
    }
    setDraft(initial);
  }, [visible, mode, initial]);

  const readOnly = mode === 'view';

  const persist = () => {
    if (!draft.title.trim()) {
      showThemedAlert('Назва', 'Вкажіть заголовок.');
      return;
    }
    onSave(draft);
    onClose();
  };

  const title =
    mode === 'create' ? 'Нова нотатка' : mode === 'view' ? 'Нотатка' : 'Редагування';

  const footer = (
    <>
      {mode === 'view' && onRequestEdit ? (
        <Button title="Редагувати" variant="secondary" style={{ flex: 1 }} onPress={onRequestEdit} />
      ) : null}
      {mode === 'view' && initial?.id && onDelete ? (
        <Button
          title="Видалити"
          variant="danger"
          style={{ flex: 1 }}
          onPress={() => {
            showThemedAlert('Видалити нотатку?', '', [
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
      <FormField label="Заголовок">
        <TextInputField
          value={draft.title}
          editable={!readOnly}
          onChangeText={(x) => setDraft((d) => ({ ...d, title: x }))}
          placeholder="Ідея, ціль…"
        />
      </FormField>
      <FormField label="Проєкт (необов’язково)">
        <View style={styles.chips}>
          <Pressable
            disabled={readOnly}
            onPress={() => setDraft((d) => ({ ...d, projectId: null }))}
            style={[
              styles.chip,
              { borderColor: t.colors.border, backgroundColor: t.colors.background },
              draft.projectId === null && {
                borderColor: t.colors.accent,
                backgroundColor: t.dark ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.08)',
              },
            ]}
          >
            <Text
              style={[
                styles.chipLabel,
                { color: t.colors.text },
                draft.projectId === null && { color: t.colors.accent },
              ]}
            >
              Без проєкту
            </Text>
          </Pressable>
          {projectIds.map((p) => {
            const on = draft.projectId === p.id;
            return (
              <Pressable
                key={p.id}
                disabled={readOnly}
                onPress={() => setDraft((d) => ({ ...d, projectId: p.id }))}
                style={[
                  styles.chip,
                  { borderColor: t.colors.border, backgroundColor: t.colors.background },
                  on && {
                    borderColor: t.colors.accent,
                    backgroundColor: t.dark ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.08)',
                  },
                ]}
              >
                <Text style={[styles.chipLabel, { color: t.colors.text }, on && { color: t.colors.accent }]}>
                  {p.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </FormField>
      <FormField label="Опис">
        <TextInputField
          value={draft.description}
          editable={!readOnly}
          onChangeText={(x) => setDraft((d) => ({ ...d, description: x }))}
          placeholder="Текст…"
          multiline
        />
      </FormField>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipLabel: { fontWeight: '600', fontSize: 14 },
});
