import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { AppModal } from './AppModal';
import { Button } from './Button';
import { FormField } from './FormField';
import { TextInputField } from './TextInputField';
import { theme } from '../theme/theme';
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
  const [display, setDisplay] = useState(() => formatDisplayDate(new Date()));

  useEffect(() => {
    if (visible) setDisplay(formatDisplayDate(new Date()));
  }, [visible]);

  const submit = () => {
    const iso = parseDisplayDateToStartOfDayIso(display);
    if (!iso) {
      Alert.alert('Дата', 'Формат дд/мм/рррр (наприклад 03/04/2026).');
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

const styles = StyleSheet.create({
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  note: {
    fontSize: 13,
    color: theme.colors.muted,
    lineHeight: 18,
  },
});
