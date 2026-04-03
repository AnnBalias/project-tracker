import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ModalMode, Transaction, TransactionType } from '../types';
import { theme } from '../theme/theme';
import {
  formatDisplayDate,
  parseDisplayDateToStartOfDayIso,
} from '../utils/dateTime';
import { AppModal } from './AppModal';
import { Button } from './Button';
import { FormField } from './FormField';
import { TextInputField } from './TextInputField';

type IncomeTarget = string | 'other';

type Props = {
  visible: boolean;
  mode: ModalMode;
  type: TransactionType;
  onClose: () => void;
  initial?: Transaction | null;
  projects: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  onSave: (t: Transaction) => void;
  onDelete?: (id: string) => void;
  onRequestEdit?: () => void;
};

export function TransactionEditorModal({
  visible,
  mode,
  type: fixedType,
  onClose,
  initial,
  projects,
  categories,
  onSave,
  onDelete,
  onRequestEdit,
}: Props) {
  const [draft, setDraft] = useState<Transaction>({
    id: '',
    type: fixedType,
    amount: 0,
    projectId: null,
    categoryId: null,
    details: '',
    date: new Date().toISOString(),
  });
  const [incomeTarget, setIncomeTarget] = useState<IncomeTarget>('other');
  const [amountStr, setAmountStr] = useState('0');
  const [dateDisplay, setDateDisplay] = useState(() => formatDisplayDate(new Date()));

  useEffect(() => {
    if (!visible) return;
    if (mode === 'create' || !initial) {
      setDraft({
        id: '',
        type: fixedType,
        amount: 0,
        projectId: projects[0]?.id ?? null,
        categoryId: categories[0]?.id ?? null,
        details: '',
        date: new Date().toISOString(),
      });
      setIncomeTarget(projects[0] ? projects[0].id : 'other');
      setAmountStr('');
      setDateDisplay(formatDisplayDate(new Date()));
      return;
    }
    setDraft(initial);
    setAmountStr(String(initial.amount));
    setDateDisplay(formatDisplayDate(initial.date));
    if (initial.type === 'income') {
      setIncomeTarget(initial.projectId ?? 'other');
    }
  }, [visible, mode, initial, fixedType, projects, categories]);

  const readOnly = mode === 'view';

  const persist = () => {
    const n = parseFloat(amountStr.replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) {
      Alert.alert('Сума', 'Вкажіть коректну суму.');
      return;
    }
    const dateParsed = parseDisplayDateToStartOfDayIso(dateDisplay);
    if (!dateParsed) {
      Alert.alert('Дата', 'Формат дд/мм/рррр (наприклад 03/04/2026).');
      return;
    }
    const date = dateParsed;

    if (fixedType === 'income') {
      const isOther = incomeTarget === 'other';
      const details = draft.details.trim();
      if (isOther && !details) {
        Alert.alert('Деталі', 'Для «Інше» заповніть деталі.');
        return;
      }
      onSave({
        ...draft,
        type: 'income',
        amount: n,
        date,
        projectId: isOther ? null : (incomeTarget as string),
        categoryId: null,
        details: draft.details.trim(),
      });
    } else {
      if (!draft.categoryId) {
        Alert.alert('Категорія', 'Оберіть категорію у профілі або додайте її.');
        return;
      }
      onSave({
        ...draft,
        type: 'expense',
        amount: n,
        date,
        projectId: null,
      });
    }
    onClose();
  };

  const title =
    fixedType === 'income'
      ? mode === 'create'
        ? 'Дохід'
        : mode === 'view'
          ? 'Дохід'
          : 'Редагування доходу'
      : mode === 'create'
        ? 'Витрата'
        : mode === 'view'
          ? 'Витрата'
          : 'Редагування витрати';

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
            Alert.alert('Видалити запис?', '', [
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
      <FormField label="Сума">
        <TextInputField
          value={amountStr}
          editable={!readOnly}
          keyboardType="decimal-pad"
          onChangeText={setAmountStr}
          placeholder="0"
        />
      </FormField>
      <FormField label="Дата" hint="Формат дд/мм/рррр">
        <TextInputField
          value={dateDisplay}
          editable={!readOnly}
          onChangeText={setDateDisplay}
          placeholder="03/04/2026"
          keyboardType="numbers-and-punctuation"
        />
      </FormField>

      {fixedType === 'income' ? (
        <>
          <FormField label="Проєкт або «Інше»">
            <View style={styles.chips}>
              {projects.map((p) => {
                const active = incomeTarget === p.id;
                return (
                  <Pressable
                    key={p.id}
                    disabled={readOnly}
                    onPress={() => {
                      setIncomeTarget(p.id);
                      setDraft((x) => ({ ...x, projectId: p.id }));
                    }}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                      {p.name}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                disabled={readOnly}
                onPress={() => {
                  setIncomeTarget('other');
                  setDraft((x) => ({ ...x, projectId: null }));
                }}
                style={[styles.chip, incomeTarget === 'other' && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    incomeTarget === 'other' && styles.chipLabelActive,
                  ]}
                >
                  Інше
                </Text>
              </Pressable>
            </View>
          </FormField>
          {incomeTarget === 'other' || readOnly ? (
            <FormField label="Деталі" hint={incomeTarget === 'other' ? "Обов'язково для «Інше»" : undefined}>
              <TextInputField
                value={draft.details}
                editable={!readOnly}
                onChangeText={(t) => setDraft((x) => ({ ...x, details: t }))}
                placeholder="Що саме"
              />
            </FormField>
          ) : (
            <FormField label="Коментар (необов'язково)">
              <TextInputField
                value={draft.details}
                editable={!readOnly}
                onChangeText={(t) => setDraft((x) => ({ ...x, details: t }))}
              />
            </FormField>
          )}
        </>
      ) : (
        <>
          <FormField label="Категорія">
            <View style={styles.chips}>
              {categories.map((c) => {
                const active = draft.categoryId === c.id;
                return (
                  <Pressable
                    key={c.id}
                    disabled={readOnly}
                    onPress={() => setDraft((x) => ({ ...x, categoryId: c.id }))}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                      {c.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </FormField>
          <FormField label="Деталі">
            <TextInputField
              value={draft.details}
              editable={!readOnly}
              onChangeText={(t) => setDraft((x) => ({ ...x, details: t }))}
            />
          </FormField>
        </>
      )}
    </AppModal>
  );
}

const styles = StyleSheet.create({
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
  chipLabel: { color: theme.colors.text, fontWeight: '600', fontSize: 13 },
  chipLabelActive: { color: theme.colors.accent },
});
