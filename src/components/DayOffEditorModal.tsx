import React, { useEffect, useState } from 'react';
import type { DayOff, ModalMode } from '../types';
import { calendarKeyToDisplay } from '../utils/dateTime';
import { AppModal } from './AppModal';
import { showThemedAlert } from './themedAlert';
import { Button } from './Button';
import { FormField } from './FormField';
import { TextInputField } from './TextInputField';

type Props = {
  visible: boolean;
  mode: ModalMode;
  dateKey: string;
  initial?: DayOff | null;
  onClose: () => void;
  onSave: (d: DayOff) => void;
  onDelete?: (id: string) => void;
  onRequestEdit?: () => void;
};

export function DayOffEditorModal({
  visible,
  mode,
  dateKey,
  initial,
  onClose,
  onSave,
  onDelete,
  onRequestEdit,
}: Props) {
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (mode === 'create' || !initial) {
      setComment('');
      return;
    }
    setComment(initial.comment);
  }, [visible, mode, initial]);

  const readOnly = mode === 'view';

  const persist = () => {
    onSave({
      id: initial?.id ?? '',
      date: dateKey,
      comment: comment.trim(),
    });
    onClose();
  };

  const title =
    mode === 'create'
      ? 'День відпочинку'
      : mode === 'view'
        ? 'День відпочинку'
        : 'Редагування дня відпочинку';

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
            showThemedAlert('Прибрати день відпочинку?', '', [
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
      <FormField label="Дата">
        <TextInputField value={calendarKeyToDisplay(dateKey)} editable={false} />
      </FormField>
      <FormField label="Коментар (необов’язково)">
        <TextInputField
          value={comment}
          editable={!readOnly}
          onChangeText={setComment}
          placeholder="Відпустка, свято…"
          multiline
        />
      </FormField>
    </AppModal>
  );
}
