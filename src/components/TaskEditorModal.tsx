import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ModalMode, Task, TaskPriority, TaskStage, TaskStatus } from '../types';
import { useAppTheme } from '../store/ThemeContext';
import {
  calendarKeyToDisplay,
  displayToCalendarKey,
  formatDateKey,
  parseDateKey,
} from '../utils/dateTime';
import { getTaskCalendarDay } from '../utils/calendarHelpers';
import { AppModal } from './AppModal';
import { showThemedAlert } from './themedAlert';
import { Button } from './Button';
import { FormField } from './FormField';
import { TextInputField } from './TextInputField';
import { format } from 'date-fns';
import { useAppData } from '../store/AppDataContext';

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

type Props = {
  visible: boolean;
  mode: ModalMode;
  onClose: () => void;
  dateKey: string;
  initial?: Task | null;
  projectIds: { id: string; name: string }[];
  taskTypes?: { id: string; name: string; color: string }[];
  onSave: (t: Task) => void;
  onDelete?: (id: string) => void;
  onRequestEdit?: () => void;
  onStartFocus?: (task: Task) => void;
};

const PRIORITIES: { key: TaskPriority; label: string }[] = [
  { key: 'low', label: 'Низький' },
  { key: 'medium', label: 'Середній' },
  { key: 'high', label: 'Високий' },
];

const STATUSES: { key: TaskStatus; label: string }[] = [
  { key: 'planned', label: 'Заплановано' },
  { key: 'in_progress', label: 'В роботі' },
  { key: 'done', label: 'Готово' },
  { key: 'canceled', label: 'Скасовано' },
  { key: 'moved', label: 'Перенесено' },
];

const STAGES: { key: TaskStage; label: string }[] = [
  { key: 'planned', label: 'Заплановано' },
  { key: 'in_progress', label: 'В процесі' },
  { key: 'review', label: 'Перевірка' },
  { key: 'testing', label: 'Тестування' },
  { key: 'done', label: 'Виконано' },
];

function emptyTask(dateKey: string, projectId: string): Task {
  const ymd = dateKey;
  return {
    id: '',
    title: '',
    description: '',
    projectId,
    status: 'planned',
    typeId: null,
    number: 0,
    priority: 'medium',
    stage: 'planned',
    startDate: ymd,
    endDate: ymd,
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
  onStartFocus,
  taskTypes = [],
}: Props) {
  const t = useAppTheme();
  const { focusSessions } = useAppData();
  const defaultProjectId = projectIds[0]?.id ?? '';
  const [draft, setDraft] = useState<Task>(() => emptyTask(dateKey, defaultProjectId));
  const [movedDateDisplay, setMovedDateDisplay] = useState(() =>
    calendarKeyToDisplay(dateKey),
  );
  const [startDateDisplay, setStartDateDisplay] = useState(() =>
    calendarKeyToDisplay(dateKey),
  );
  const [endDateDisplay, setEndDateDisplay] = useState(() =>
    calendarKeyToDisplay(dateKey),
  );

  useEffect(() => {
    if (!visible) return;
    if (mode === 'create' || !initial) {
      const base = emptyTask(dateKey, defaultProjectId || '');
      setDraft(base);
      setMovedDateDisplay(calendarKeyToDisplay(dateKey));
      const dpy = calendarKeyToDisplay(dateKey);
      setStartDateDisplay(dpy);
      setEndDateDisplay(dpy);
      return;
    }
    setDraft(initial);
    setMovedDateDisplay(calendarKeyToDisplay(formatDateKey(getTaskCalendarDay(initial))));
    setStartDateDisplay(calendarKeyToDisplay(initial.startDate.slice(0, 10)));
    setEndDateDisplay(calendarKeyToDisplay(initial.endDate.slice(0, 10)));
  }, [visible, mode, initial, dateKey, defaultProjectId]);

  const readOnly = mode === 'view';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: 'row', gap: t.spacing.sm },
        flex: { flex: 1 },
        chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
        chip: {
          paddingHorizontal: t.spacing.sm + 4,
          paddingVertical: t.spacing.sm,
          borderRadius: t.radius.sm,
          borderWidth: 1,
          borderColor: t.colors.border,
          backgroundColor: t.colors.surface,
        },
        chipActive: {
          borderColor: t.colors.task,
          backgroundColor: t.dark ? 'rgba(217, 119, 6, 0.22)' : '#FFFBEB',
        },
        chipLabel: { color: t.colors.text, fontWeight: '600', fontSize: 13 },
        chipLabelActive: { color: t.colors.task },
        meta: { fontSize: 13, color: t.colors.muted, marginBottom: t.spacing.sm },
      }),
    [t],
  );

  const persist = () => {
    const dayKey =
      draft.status === 'moved'
        ? displayToCalendarKey(movedDateDisplay)
        : dateKey;
    if (draft.status === 'moved' && !dayKey) {
      showThemedAlert('Дата перенесення', 'Формат дд/мм/рррр.');
      return;
    }
    if (!draft.title.trim()) {
      showThemedAlert('Назва', 'Вкажіть назву.');
      return;
    }
    if (!draft.projectId) {
      showThemedAlert('Проєкт', 'Додайте проєкт у профілі.');
      return;
    }
    const sdKey =
      displayToCalendarKey(startDateDisplay) ?? dateKey;
    const edKey = displayToCalendarKey(endDateDisplay) ?? dateKey;
    const completedDateKey =
      draft.status === 'done'
        ? draft.completedDateKey ?? formatDateKey(new Date())
        : undefined;
    onSave({
      ...draft,
      startDate: sdKey,
      endDate: edKey,
      completedDateKey,
      movedToDate:
        draft.status === 'moved'
          ? parseDateKey(dayKey!).toISOString()
          : undefined,
    });
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
      {mode === 'view' && initial && onStartFocus ? (
        <Button
          title="Фокус"
          style={{ flex: 1 }}
          onPress={() => {
            onStartFocus(initial);
            onClose();
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
            showThemedAlert('Видалити задачу?', '', [
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
      {draft.number > 0 ? (
        <Text style={styles.meta}>№ {draft.number}</Text>
      ) : null}
      {mode === 'view' && initial ? (
        (() => {
          const secs = focusSessions
            .filter((s) => s.taskId === initial.id)
            .reduce((a, s) => a + s.durationSeconds, 0);
          const sessionsCount = focusSessions.filter((s) => s.taskId === initial.id).length;
          return (
            <Text style={styles.meta}>
              Фокус: {formatElapsed(secs)} · сесій: {sessionsCount}
            </Text>
          );
        })()
      ) : null}
      <View style={styles.row}>
        <View style={styles.flex}>
          <FormField label="Дата поч. (дд/мм/рррр)">
            <TextInputField
              value={startDateDisplay}
              editable={!readOnly}
              onChangeText={setStartDateDisplay}
              keyboardType="numbers-and-punctuation"
            />
          </FormField>
        </View>
        <View style={styles.flex}>
          <FormField label="Дата кін. (дд/мм/рррр)">
            <TextInputField
              value={endDateDisplay}
              editable={!readOnly}
              onChangeText={setEndDateDisplay}
              keyboardType="numbers-and-punctuation"
            />
          </FormField>
        </View>
      </View>
      <FormField label="Етап / стадія">
        <View style={styles.chips}>
          {STAGES.map((s) => {
            const active = draft.stage === s.key;
            return (
              <Pressable
                key={s.key}
                disabled={readOnly}
                onPress={() => setDraft((x) => ({ ...x, stage: s.key }))}
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
      <FormField label="Пріоритет">
        <View style={styles.chips}>
          {PRIORITIES.map((p) => {
            const active = draft.priority === p.key;
            return (
              <Pressable
                key={p.key}
                disabled={readOnly}
                onPress={() => setDraft((x) => ({ ...x, priority: p.key }))}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </FormField>
      {taskTypes.length > 0 ? (
        <FormField label="Тип задачі">
          <View style={styles.chips}>
            <Pressable
              disabled={readOnly}
              onPress={() => setDraft((x) => ({ ...x, typeId: null }))}
              style={[styles.chip, draft.typeId == null && styles.chipActive]}
            >
              <Text style={styles.chipLabel}>—</Text>
            </Pressable>
            {taskTypes.map((tt) => {
              const active = draft.typeId === tt.id;
              return (
                <Pressable
                  key={tt.id}
                  disabled={readOnly}
                  onPress={() => setDraft((x) => ({ ...x, typeId: tt.id }))}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                    {tt.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </FormField>
      ) : null}
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
