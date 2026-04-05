import React, { useMemo } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { useAppTheme } from '../store/ThemeContext';

type Props = TextInputProps & {
  disabled?: boolean;
};

export function TextInputField({
  style,
  disabled,
  multiline,
  ...rest
}: Props) {
  const t = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        input: {
          borderWidth: 1,
          borderColor: t.colors.border,
          borderRadius: t.radius.sm,
          paddingHorizontal: t.spacing.sm + 4,
          paddingVertical: t.spacing.sm + 2,
          fontSize: 16,
          color: t.colors.text,
          backgroundColor: t.colors.surface,
        },
        multiline: { minHeight: 88, textAlignVertical: 'top' },
        disabled: { opacity: 0.55 },
      }),
    [t],
  );

  return (
    <TextInput
      editable={!disabled}
      placeholderTextColor={t.colors.muted}
      multiline={multiline}
      style={[
        styles.input,
        multiline && styles.multiline,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}
    />
  );
}
