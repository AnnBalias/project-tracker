import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ModalMode, Task, TaskStatus } from '../types';
import { theme } from '../theme/theme';
import {
  calendarKeyToDisplay,
  combineDateAndTime,
  displayToCalendarKey,
  formatDateKey,
  parseDateKey,
  toTimeString,
} from '../utils/dateTime';
import { getTaskCalendarDay } from '../utils/calendarHelpers';
import { AppModal } from './AppModal';
import { Button } from './Button';
import { FormField } from './FormField';
import { TextInputField } from './TextInputField';
import { format } from 'date-fns';

type Props = {
  visible: boolean;
  mode: ModalMode;
  onClose: () => void;
  dateKey: string;
  initial?: Task | null;
  projectIds: { id: string; name: string }[];
  onSave: (t: Task) => void;
  onDelete?: (id: string) => void;
  onRequestEdit?: () => void;
};

const STATUSES: { key: TaskStatus; label: string }[] = [
  { key: 'planned', label: 'Заплановано' },
  { key: 'in_progress', label: 'В роботі' },
  { key: 'done', label: 'Готово' },
  { key: 'canceled', label: 'Скасовано' },
  { key: 'moved', label: 'Перенесено' },
];

function emptyTask(dateKey: string, projectId: string): Task {
  const d = parseDateKey(dateKey);
  return {
    id: '',
    title: '',
    description: '',
    startTime: combineDateAndTime(d, '09:00'),
    endTime: combineDateAndTime(d, '10:00'),
    projectId,
    status: 'planned',
  };
}

export function TaskEditorModal({
  visible,
  mode,
  onClose,
  dateKey,
  initial,
  projectIds,
  onSave,
  onDelete,
  onRequestEdit,
}: Props) {
  const defaultProjectId = projectIds[0]?.id ?? '';
  const [draft, setDraft] = useState<Task>(() => emptyTask(dateKey, defaultProjectId));
  const [startHm, setStartHm] = useState('09:00');
  const [endHm, setEndHm] = useState('10:00');
  const [movedDateDisplay, setMovedDateDisplay] = useState(() =>
    calendarKeyToDisplay(dateKey),
  );

  useEffect(() => {
    if (!visible) return;
    if (mode === 'create' || !initial) {
      const base = emptyTask(dateKey, defaultProjectId || '');
      setDraft(base);
      setStartHm('09:00');
      setEndHm('10:00');
      setMovedDateDisplay(calendarKeyToDisplay(dateKey));
      return;
    }
    setDraft(initial);
    setStartHm(toTimeString(initial.startTime));
    setEndHm(toTimeString(initial.endTime));
    setMovedDateDisplay(calendarKeyToDisplay(formatDateKey(getTaskCalendarDay(initial))));
  }, [visible, mode, initial, dateKey, defaultProjectId]);

  const readOnly = mode === 'view';

  const persist = () => {
    const dayKey =
      draft.status === 'moved'
        ? displayToCalendarKey(movedDateDisplay)
        : dateKey;
    if (draft.status === 'moved' && !dayKey) {
      Alert.alert('Дата перенесення', 'Формат дд/мм/рррр.');
      return;
    }
    const d = parseDateKey(dayKey ?? dateKey);
    const startTime = combineDateAndTime(d, startHm);
    const endTime = combineDateAndTime(d, endHm);
    if (new Date(endTime) <= new Date(startTime)) {
      Alert.alert('Час', 'Кінець має бути після початку.');
      return;
    }
    if (!draft.title.trim()) {
      Alert.alert('Назва', 'Вкажіть назву.');
      return;
    }
    if (!draft.projectId) {
      Alert.alert('Проєкт', 'Додайте проєкт у профілі.');
      return;
    }
    if (draft.status === 'moved') {
      onSave({
        ...draft,
        startTime,
        endTime,
        movedToDate: parseDateKey(dayKey!).toISOString(),
      });
    } else {
      onSave({
        ...draft,
        startTime,
        endTime,
        movedToDate: undefined,
      });
    }
    onClose();
  };

  const title =
    mode === 'create'
      ? 'Нова задача'
      : mode === 'view'
        ? 'Задача'
        : 'Редагування задачі';

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
            Alert.alert('Видалити задачу?', '', [
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
          value={draft.title}
          editable={!readOnly}
          onChangeText={(t) => setDraft((x) => ({ ...x, title: t }))}
          placeholder="Що зробити"
        />
      </FormField>
      <FormField label="Опис">
        <TextInputField
          value={draft.description}
          editable={!readOnly}
          onChangeText={(t) => setDraft((x) => ({ ...x, description: t }))}
          placeholder="Деталі…"
          multiline
        />
      </FormField>
      {draft.status === 'moved' && !readOnly ? (
        <FormField label="Нова дата (перенесення)" hint="дд/мм/рррр">
          <TextInputField
            value={movedDateDisplay}
            onChangeText={setMovedDateDisplay}
            placeholder="15/04/2026"
            keyboardType="numbers-and-punctuation"
          />
        </FormField>
      ) : null}
      <View style={styles.row}>
        <View style={styles.flex}>
          <FormField label="Початок">
            <TextInputField
              value={startHm}
              editable={!readOnly}
              onChangeText={setStartHm}
              placeholder="09:00"
            />
          </FormField>
        </View>
        <View style={styles.flex}>
          <FormField label="Кінець">
            <TextInputField
              value={endHm}
              editable={!readOnly}
              onChangeText={setEndHm}
              placeholder="10:00"
            />
          </FormField>
        </View>
      </View>
      <FormField label="Статус">
        <View style={styles.chips}>
          {STATUSES.map((s) => {
            const active = draft.status === s.key;
            return (
              <Pressable
                key={s.key}
                disabled={readOnly}
                onPress={() =>
                  setDraft((x) => ({
                    ...x,
                    status: s.key,
                    movedToDate:
                      s.key === 'moved'
                        ? x.movedToDate ?? parseDateKey(dateKey).toISOString()
                        : undefined,
                  }))
                }
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </FormField>
      <FormField label="Проєкт">
        <View style={styles.chips}>
          {projectIds.map((p) => {
            const active = draft.projectId === p.id;
            return (
              <Pressable
                key={p.id}
                disabled={readOnly}
                onPress={() => setDraft((x) => ({ ...x, projectId: p.id }))}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {p.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </FormField>
      {readOnly && draft.status === 'moved' && draft.movedToDate ? (
        <Text style={styles.meta}>
          Показ у календарі: {format(new Date(draft.movedToDate), 'd MMM yyyy')}
        </Text>
      ) : null}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: {
    paddingHorizontal: theme.spacing.sm + 4,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  chipActive: {
    borderColor: theme.colors.task,
    backgroundColor: '#FFFBEB',
  },
  chipLabel: { color: theme.colors.text, fontWeight: '600', fontSize: 13 },
  chipLabelActive: { color: theme.colors.task },
  meta: { fontSize: 13, color: theme.colors.muted, marginBottom: theme.spacing.sm },
});
