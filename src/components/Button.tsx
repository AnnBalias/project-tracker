import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useAppTheme } from '../store/ThemeContext';

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
  const t = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          borderRadius: t.radius.sm,
          paddingVertical: t.spacing.sm,
          paddingHorizontal: t.spacing.md,
        },
        variant === 'primary' && { backgroundColor: t.colors.accent },
        variant === 'secondary' && {
          backgroundColor: t.colors.card,
          borderWidth: 1,
          borderColor: t.colors.border,
        },
        variant === 'danger' && { backgroundColor: t.colors.danger },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === 'primary' && { color: t.colors.onAccent },
          variant === 'secondary' && { color: t.colors.text },
          variant === 'danger' && { color: t.colors.onDanger },
          variant === 'ghost' && { color: t.colors.accent },
          disabled && { color: t.colors.muted },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.45 },
  label: { fontSize: 15, fontWeight: '600', letterSpacing: 0.2 },
});
