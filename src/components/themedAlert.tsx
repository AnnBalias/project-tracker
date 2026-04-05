import React, { useCallback, useSyncExternalStore } from 'react';
import { Text, View } from 'react-native';
import { AppModal } from './AppModal';
import { Button } from './Button';
import { useAppTheme } from '../store/ThemeContext';

export type ThemedAlertButton = {
  text: string;
  style?: 'cancel' | 'destructive' | 'default';
  onPress?: () => void;
};

type AlertState =
  | { open: false }
  | { open: true; title: string; message?: string; buttons: ThemedAlertButton[] };

let alertState: AlertState = { open: false };
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getSnapshot(): AlertState {
  return alertState;
}

function setAlertState(next: AlertState) {
  alertState = next;
  listeners.forEach((l) => l());
}

/**
 * Заміна для `Alert.alert`: тема додатку, `AppModal`, кнопки як у профілі.
 * Сигнатура як у React Native Alert: title, message?, buttons?
 */
export function showThemedAlert(
  title: string,
  message?: string,
  buttons?: ThemedAlertButton[],
) {
  const btns: ThemedAlertButton[] =
    buttons && buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default' }];
  setAlertState({
    open: true,
    title,
    message: message?.trim() ? message : undefined,
    buttons: btns,
  });
}

export function dismissThemedAlert() {
  setAlertState({ open: false });
}

function buttonVariant(
  style: ThemedAlertButton['style'] | undefined,
): 'primary' | 'secondary' | 'danger' {
  if (style === 'destructive') return 'danger';
  if (style === 'cancel') return 'secondary';
  return 'primary';
}

/** Монтувати один раз у корені (наприклад у `App.tsx` всередині `ThemeProvider`). */
export function ThemedAlertHost() {
  const s = useSyncExternalStore(subscribe, getSnapshot);
  const t = useAppTheme();

  const close = useCallback(() => {
    dismissThemedAlert();
  }, []);

  const run = useCallback((b: ThemedAlertButton) => {
    b.onPress?.();
    dismissThemedAlert();
  }, []);

  if (!s.open) {
    return null;
  }

  const { title, message, buttons } = s;
  const isActionSheet = buttons.length >= 3;

  const body = message ? (
    <Text style={{ fontSize: 15, lineHeight: 22, color: t.colors.muted }}>{message}</Text>
  ) : null;

  if (isActionSheet) {
    return (
      <AppModal visible title={title} onClose={close}>
        <View style={{ gap: t.spacing.sm, width: '100%', alignSelf: 'stretch' }}>
          {body}
          {buttons.map((b, i) => (
            <Button
              key={`${b.text}-${i}`}
              title={b.text}
              variant={buttonVariant(b.style)}
              style={{ alignSelf: 'stretch' }}
              onPress={() => run(b)}
            />
          ))}
        </View>
      </AppModal>
    );
  }

  return (
    <AppModal
      visible
      title={title}
      onClose={close}
      footer={
        <View style={{ width: '100%', gap: t.spacing.sm, alignSelf: 'stretch' }}>
          {buttons.map((b, i) => (
            <Button
              key={`${b.text}-${i}`}
              title={b.text}
              variant={buttonVariant(b.style)}
              style={{ alignSelf: 'stretch' }}
              onPress={() => run(b)}
            />
          ))}
        </View>
      }
    >
      {body}
    </AppModal>
  );
}
