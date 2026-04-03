import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/theme';

type Props = {
  label: string;
  children: ReactNode;
  hint?: string;
};

export function FormField({ label, children, hint }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: theme.spacing.md },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  hint: {
    marginTop: theme.spacing.xs,
    fontSize: 12,
    color: theme.colors.muted,
  },
});
