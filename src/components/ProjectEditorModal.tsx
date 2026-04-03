import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ModalMode, Project } from '../types';
import { theme } from '../theme/theme';
import { AppModal } from './AppModal';
import { Button } from './Button';
import { FormField } from './FormField';
import { TextInputField } from './TextInputField';
import {
  formatDisplayDate,
  parseFlexibleStartDateToIso,
} from '../utils/dateTime';

const PRESET_COLORS = [
  '#2563EB',
  '#7C3AED',
  '#059669',
  '#DC2626',
  '#F59E0B',
  '#EC4899',
  '#0EA5E9',
  '#64748B',
];

type Props = {
  visible: boolean;
  mode: ModalMode;
  onClose: () => void;
  initial?: Project | null;
  onSave: (p: Project) => void;
  onDelete?: (id: string) => void;
  onRequestEdit?: () => void;
  onRequestComplete?: () => void;
  onRestoreFromArchive?: () => void;
};

export function ProjectEditorModal({
  visible,
  mode,
  onClose,
  initial,
  onSave,
  onDelete,
  onRequestEdit,
  onRequestComplete,
  onRestoreFromArchive,
}: Props) {
  const [draft, setDraft] = useState<Project>({
    id: '',
    name: '',
    color: PRESET_COLORS[0],
    position: '',
    startDate: new Date().toISOString(),
    archived: false,
  });
  const [startDisplay, setStartDisplay] = useState(() => formatDisplayDate(new Date()));

  useEffect(() => {
    if (!visible) return;
    if (mode === 'create' || !initial) {
      setDraft({
        id: '',
        name: '',
        color: PRESET_COLORS[0],
        position: '',
        startDate: startOfTodayIso(),
        archived: false,
      });
      setStartDisplay(formatDisplayDate(new Date()));
      return;
    }
    setDraft(initial);
    setStartDisplay(formatDisplayDate(initial.startDate));
  }, [visible, mode, initial]);

  const readOnly = mode === 'view';

  const persist = () => {
    if (!draft.name.trim()) {
      Alert.alert('Назва', 'Вкажіть назву проєкту.');
      return;
    }
    if (!draft.color.trim()) {
      Alert.alert('Колір', 'Оберіть або введіть колір.');
      return;
    }
    const startIso = parseFlexibleStartDateToIso(startDisplay);
    if (!startIso) {
      Alert.alert('Дата початку', 'Формат дд/мм/рррр (наприклад 15/01/2026).');
      return;
    }
    onSave({ ...draft, startDate: startIso });
    onClose();
  };

  const title =
    mode === 'create'
      ? 'Новий проєкт'
      : mode === 'view'
        ? 'Проєкт'
        : 'Редагування проєкту';

  const showComplete =
    mode === 'view' && initial && !initial.archived && onRequestComplete;
  const showRestore =
    mode === 'view' && initial?.archived && onRestoreFromArchive;

  const footer = (
    <>
      {showComplete ? (
        <Button
          title="Завершити…"
          variant="secondary"
          style={{ flex: 1 }}
          onPress={onRequestComplete}
        />
      ) : null}
      {showRestore ? (
        <Button
          title="З архіву"
          variant="secondary"
          style={{ flex: 1 }}
          onPress={() => {
            Alert.alert(
              'Повернути проєкт?',
              'Проєкт знову з’явиться серед активних.',
              [
                { text: 'Скасувати', style: 'cancel' },
                {
                  text: 'Повернути',
                  onPress: () => onRestoreFromArchive?.(),
                },
              ],
            );
          }}
        />
      ) : null}
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
            Alert.alert('Видалити проєкт?', 'Повʼязані події та задачі теж будуть видалені.', [
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
      {initial?.archived && mode === 'view' ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Архів</Text>
          {initial.endDate ? (
            <Text style={styles.badgeSub}>
              Завершено: {formatDisplayDate(initial.endDate)}
            </Text>
          ) : null}
        </View>
      ) : null}
      <FormField label="Назва">
        <TextInputField
          value={draft.name}
          editable={!readOnly}
          onChangeText={(t) => setDraft((x) => ({ ...x, name: t }))}
        />
      </FormField>
      <FormField label="Посада / роль">
        <TextInputField
          value={draft.position}
          editable={!readOnly}
          onChangeText={(t) => setDraft((x) => ({ ...x, position: t }))}
          placeholder="Напр. Frontend dev"
        />
      </FormField>
      <FormField label="Дата початку" hint="Формат дд/мм/рррр">
        <TextInputField
          value={startDisplay}
          editable={!readOnly}
          onChangeText={setStartDisplay}
          placeholder="15/01/2026"
          keyboardType="numbers-and-punctuation"
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
          placeholder="#2563EB"
          style={{ marginTop: theme.spacing.sm }}
        />
      </FormField>
    </AppModal>
  );
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#E5E7EB',
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    marginBottom: theme.spacing.md,
  },
  badgeText: { fontWeight: '700', color: theme.colors.text },
  badgeSub: { marginTop: 4, fontSize: 13, color: theme.colors.muted },
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
