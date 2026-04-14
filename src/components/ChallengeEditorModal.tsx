import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Challenge, ModalMode, WeekdayShort } from '../types';
import { useAppTheme } from '../store/ThemeContext';
import { WEEKDAY_OPTIONS } from '../constants/weekdays';
import { AppModal } from './AppModal';
import { showThemedAlert } from './themedAlert';
import { Button } from './Button';
import { FormField } from './FormField';
import { TextInputField } from './TextInputField';

type Props = {
  visible: boolean;
  mode: ModalMode;
  onClose: () => void;
  initial?: Challenge | null;
  projectIds: { id: string | null; name: string }[];
  onSave: (c: Challenge) => void;
  onDelete?: (id: string) => void;
  onRequestEdit?: () => void;
};

function emptyChallenge(projectId: string | null): Challenge {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: '',
    name: '',
    projectId,
    startDate: today,
    endDate: today,
    weekdays: [],
    archived: false,
  };
}

export function ChallengeEditorModal({
  visible,
  mode,
  onClose,
  initial,
  projectIds,
  onSave,
  onDelete,
  onRequestEdit,
}: Props) {
  const t = useAppTheme();
  const defaultPid = projectIds[0]?.id ?? null;
  const [draft, setDraft] = useState<Challenge>(() => emptyChallenge(defaultPid));
  const [days, setDays] = useState<Set<WeekdayShort>>(new Set());

  useEffect(() => {
    if (!visible) return;
    if (mode === 'create' || !initial) {
      const b = emptyChallenge(defaultPid ?? null);
      setDraft(b);
      setDays(new Set());
      return;
    }
    setDraft(initial);
    setDays(new Set(initial.weekdays ?? []));
  }, [visible, mode, initial, defaultPid]);

  const readOnly = mode === 'view';

  const toggleDay = (k: WeekdayShort) => {
    if (readOnly) return;
    setDays((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  };

  const persist = () => {
    if (!draft.name.trim()) {
      showThemedAlert('Назва', 'Вкажіть назву челенджу.');
      return;
    }
    const wk = days.size ? Array.from(days) : [];
    onSave({
      ...draft,
      archived: draft.archived ?? false,
      weekdays: wk,
      startDate: draft.startDate.slice(0, 10),
      endDate: draft.endDate.slice(0, 10),
    });
    onClose();
  };

  const title =
    mode === 'create'
      ? 'Новий челендж'
      : mode === 'view'
        ? 'Челендж'
        : 'Редагування челенджу';

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
            const wk = days.size ? Array.from(days) : [];
            onSave({
              ...draft,
              archived: !draft.archived,
              weekdays: wk,
              startDate: draft.startDate.slice(0, 10),
              endDate: draft.endDate.slice(0, 10),
            });
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
            showThemedAlert('Видалити челендж?', '', [
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
        />
      </FormField>
      <FormField label="Проєкт">
        <View style={styles.chips}>
          {projectIds.map((p) => {
            const on = draft.projectId === p.id;
            return (
              <Pressable
                key={p.id ?? 'none'}
                disabled={readOnly}
                onPress={() => setDraft((d) => ({ ...d, projectId: p.id }))}
                style={[
                  styles.chip,
                  { borderColor: t.colors.border, backgroundColor: t.colors.background },
                  on && {
                    borderColor: t.colors.accent,
                    backgroundColor: t.dark ? '#1e3a5f' : '#EFF6FF',
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
      <View style={styles.row}>
        <View style={styles.flex}>
          <FormField label="Початок (YYYY-MM-DD)">
            <TextInputField
              value={draft.startDate.slice(0, 10)}
              editable={!readOnly}
              onChangeText={(x) => setDraft((d) => ({ ...d, startDate: x }))}
            />
          </FormField>
        </View>
        <View style={styles.flex}>
          <FormField label="Кінець (YYYY-MM-DD)">
            <TextInputField
              value={draft.endDate.slice(0, 10)}
              editable={!readOnly}
              onChangeText={(x) => setDraft((d) => ({ ...d, endDate: x }))}
            />
          </FormField>
        </View>
      </View>
      <FormField label="Дні тижня (порожньо = усі дні в періоді)">
        <View style={styles.daysRow}>
          {WEEKDAY_OPTIONS.map((w) => {
            const on = days.has(w.key);
            return (
              <Pressable
                key={w.key}
                disabled={readOnly}
                onPress={() => toggleDay(w.key)}
                style={[
                  styles.dayChip,
                  { borderColor: t.colors.border },
                  on && { borderColor: t.colors.accent, backgroundColor: t.dark ? '#1e3a5f' : '#EFF6FF' },
                ]}
              >
                <Text style={[styles.dayLabel, { color: t.colors.muted }, on && { color: t.colors.accent }]}>
                  {w.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </FormField>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipLabel: { fontWeight: '600', fontSize: 14 },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  dayLabel: { fontSize: 13, fontWeight: '600' },
});
