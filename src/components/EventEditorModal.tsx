import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CalendarEvent, ModalMode, WeekdayShort } from '../types';
import { useAppTheme } from '../store/ThemeContext';
import { WEEKDAY_OPTIONS } from '../constants/weekdays';
import { combineDateAndTime, parseDateKey, toTimeString } from '../utils/dateTime';
import { AppModal } from './AppModal';
import { showThemedAlert } from './themedAlert';
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
  const t = useAppTheme();
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
          borderColor: t.colors.accent,
          backgroundColor: t.dark ? 'rgba(96, 165, 250, 0.15)' : '#EFF6FF',
        },
        chipLabel: { color: t.colors.text, fontWeight: '600', fontSize: 14 },
        chipLabelActive: { color: t.colors.accent },
        daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs },
        dayChip: {
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderRadius: t.radius.sm,
          borderWidth: 1,
          borderColor: t.colors.border,
          backgroundColor: t.colors.surface,
        },
        dayChipOn: {
          borderColor: t.colors.accent,
          backgroundColor: t.dark ? 'rgba(96, 165, 250, 0.15)' : '#EFF6FF',
        },
        dayLabel: { fontSize: 13, color: t.colors.muted, fontWeight: '600' },
        dayLabelOn: { color: t.colors.accent },
      }),
    [t],
  );

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
      showThemedAlert('Час', 'Кінець має бути після початку.');
      return;
    }
    if (!draft.title.trim()) {
      showThemedAlert('Назва', 'Вкажіть назву.');
      return;
    }
    if (!draft.projectId) {
      showThemedAlert('Проєкт', 'Оберіть проєкт у профілі.');
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
            showThemedAlert('Видалити подію?', '', [
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
