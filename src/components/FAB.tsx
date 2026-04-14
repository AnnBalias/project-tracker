import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAppTheme } from '../store/ThemeContext';

type Props = {
  onPress: () => void;
  label?: string;
};

export function FAB({ onPress, label = '+' }: Props) {
  const t = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        fab: {
          position: 'absolute',
          right: t.spacing.lg,
          bottom: t.spacing.lg,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: t.colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 4,
          shadowColor: t.dark ? '#000' : '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: t.dark ? 0.35 : 0.2,
          shadowRadius: 4,
        },
        pressed: { opacity: 0.9 },
        plus: { color: t.colors.onAccent, fontSize: 28, fontWeight: '300', marginTop: -2 },
      }),
    [t],
  );

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Text style={styles.plus}>{label}</Text>
    </Pressable>
  );
}
