import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { CalendarEvent, ModalMode, WeekdayShort } from '../types';
import { theme } from '../theme/theme';
import { WEEKDAY_OPTIONS } from '../constants/weekdays';
import { combineDateAndTime, parseDateKey, toTimeString } from '../utils/dateTime';
import { AppModal } from './AppModal';
import { Button } from './Button';
import { FormField } from './FormField';
import { TextInputField } from './TextInputField';

type Props = {
  visible: boolean;
  mode: ModalMode;
  onClose: () => void;
  dateKey: string;
  initial?: CalendarEvent | null;
  projectIds: { id: string; name: string }[];
  onSave: (e: CalendarEvent) => void;
  onDelete?: (id: string) => void;
  onRequestEdit?: () => void;
};

function emptyFromDate(dateKey: string, projectId: string): CalendarEvent {
  const d = parseDateKey(dateKey);
  const start = combineDateAndTime(d, '09:00');
  const end = combineDateAndTime(d, '10:00');
  return {
    id: '',
    title: '',
    startTime: start,
    endTime: end,
    projectId,
    repeat: undefined,
  };
}

export function EventEditorModal({
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
  const [draft, setDraft] = useState<CalendarEvent>(() =>
    emptyFromDate(dateKey, defaultProjectId),
  );
  const [startHm, setStartHm] = useState('09:00');
  const [endHm, setEndHm] = useState('10:00');
  const [selectedDays, setSelectedDays] = useState<Set<WeekdayShort>>(new Set());

  useEffect(() => {
    if (!visible) return;
    if (mode === 'create' || !initial) {
      const base = emptyFromDate(dateKey, defaultProjectId || '');
      setDraft(base);
      setStartHm('09:00');
      setEndHm('10:00');
      setSelectedDays(new Set());
      return;
    }
    setDraft(initial);
    setStartHm(toTimeString(initial.startTime));
    setEndHm(toTimeString(initial.endTime));
    setSelectedDays(new Set(initial.repeat ?? []));
  }, [visible, mode, initial, dateKey, defaultProjectId]);

  const readOnly = mode === 'view';

  const toggleDay = (k: WeekdayShort) => {
    if (readOnly) return;
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const persist = () => {
    const d = parseDateKey(dateKey);
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
      Alert.alert('Проєкт', 'Оберіть проєкт у профілі.');
      return;
    }
    const repeat = selectedDays.size ? Array.from(selectedDays) : undefined;
    onSave({
      ...draft,
      startTime,
      endTime,
      repeat,
    });
    onClose();
  };

  const title =
    mode === 'create'
      ? 'Нова подія'
      : mode === 'view'
        ? 'Подія'
        : 'Редагування події';

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
            Alert.alert('Видалити подію?', '', [
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
          placeholder="Зустріч, дедлайн…"
        />
      </FormField>
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
      <FormField
        label="Повторення (дні тижня)"
        hint="Необов’язково. Обрані дні — щотижневе повторення від дати початку."
      >
        <View style={styles.daysRow}>
          {WEEKDAY_OPTIONS.map((w) => {
            const on = selectedDays.has(w.key);
            return (
              <Pressable
                key={w.key}
                disabled={readOnly}
                onPress={() => toggleDay(w.key)}
                style={[styles.dayChip, on && styles.dayChipOn]}
              >
                <Text style={[styles.dayLabel, on && styles.dayLabelOn]}>{w.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </FormField>
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
    borderColor: theme.colors.accent,
    backgroundColor: '#EFF6FF',
  },
  chipLabel: { color: theme.colors.text, fontWeight: '600', fontSize: 14 },
  chipLabelActive: { color: theme.colors.accent },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  dayChipOn: {
    borderColor: theme.colors.accent,
    backgroundColor: '#EFF6FF',
  },
  dayLabel: { fontSize: 13, color: theme.colors.muted, fontWeight: '600' },
  dayLabelOn: { color: theme.colors.accent },
});
