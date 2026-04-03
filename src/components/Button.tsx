import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { theme } from '../theme/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  disabled,
  variant = 'primary',
  style,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        variant === 'ghost' && styles.ghost,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === 'primary' && styles.labelOnPrimary,
          variant === 'secondary' && styles.labelSecondary,
          variant === 'danger' && styles.labelOnPrimary,
          variant === 'ghost' && styles.labelGhost,
          disabled && styles.labelDisabled,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: theme.colors.accent },
  secondary: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  danger: { backgroundColor: theme.colors.danger },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
  label: { fontSize: 16, fontWeight: '600' },
  labelOnPrimary: { color: '#FFFFFF' },
  labelSecondary: { color: theme.colors.text },
  labelGhost: { color: theme.colors.accent },
  labelDisabled: { color: theme.colors.muted },
});
