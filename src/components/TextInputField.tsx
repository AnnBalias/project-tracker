import React from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { theme } from '../theme/theme';

type Props = TextInputProps & {
  disabled?: boolean;
};

export function TextInputField({
  style,
  disabled,
  multiline,
  ...rest
}: Props) {
  return (
    <TextInput
      editable={!disabled}
      placeholderTextColor={theme.colors.muted}
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

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm + 4,
    paddingVertical: theme.spacing.sm + 2,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  disabled: { opacity: 0.55 },
});
