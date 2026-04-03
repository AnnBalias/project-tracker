import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../theme/theme';

type Props = {
  onPress: () => void;
  label?: string;
};

export function FAB({ onPress, label = '+' }: Props) {
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

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  pressed: { opacity: 0.9 },
  plus: { color: '#FFF', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
