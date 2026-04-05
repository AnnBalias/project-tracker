import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppModal } from './AppModal';
import { showThemedAlert } from './themedAlert';
import { Button } from './Button';
import { FormField } from './FormField';
import { TextInputField } from './TextInputField';
import { useAppTheme } from '../store/ThemeContext';
import { formatDisplayDate, parseDisplayDateToStartOfDayIso } from '../utils/dateTime';

type Props = {
  visible: boolean;
  projectName: string;
  onClose: () => void;
  /** ISO початку дня — дата завершення */
  onConfirm: (endDateIso: string) => void;
};

export function CompleteProjectModal({
  visible,
  projectName,
  onClose,
  onConfirm,
}: Props) {
  const t = useAppTheme();
  const [display, setDisplay] = useState(() => formatDisplayDate(new Date()));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        name: {
          fontSize: 16,
          fontWeight: '700',
          color: t.colors.text,
          marginBottom: t.spacing.md,
        },
        note: {
          fontSize: 13,
          color: t.colors.muted,
          lineHeight: 18,
        },
      }),
    [t],
  );

  useEffect(() => {
    if (visible) setDisplay(formatDisplayDate(new Date()));
  }, [visible]);

  const submit = () => {
    const iso = parseDisplayDateToStartOfDayIso(display);
    if (!iso) {
      showThemedAlert('Дата', 'Формат дд/мм/рррр (наприклад 03/04/2026).');
      return;
    }
    onConfirm(iso);
    onClose();
  };

  return (
    <AppModal
      visible={visible}
      title="Завершити проєкт"
      onClose={onClose}
      footer={
        <>
          <Button title="Скасувати" variant="secondary" style={{ flex: 1 }} onPress={onClose} />
          <Button title="В архів" style={{ flex: 1 }} onPress={submit} />
        </>
      }
    >
      <Text style={styles.name}>{projectName}</Text>
      <FormField
        label="Дата завершення"
        hint="Формат дд/мм/рррр"
      >
        <TextInputField
          value={display}
          onChangeText={setDisplay}
          placeholder="03/04/2026"
          keyboardType="numbers-and-punctuation"
        />
      </FormField>
      <Text style={styles.note}>
        Проєкт буде перенесено в «Архів». Події та задачі збережуться.
      </Text>
    </AppModal>
  );
}
