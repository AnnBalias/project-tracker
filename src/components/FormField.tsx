import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../store/ThemeContext';

type Props = {
  label: string;
  children: ReactNode;
  hint?: string;
};

export function FormField({ label, children, hint }: Props) {
  const t = useAppTheme();
  return (
    <View style={[styles.wrap, { marginBottom: t.spacing.md }]}>
      <Text
        style={[
          styles.label,
          { color: t.colors.muted, marginBottom: t.spacing.xs },
        ]}
      >
        {label}
      </Text>
      {children}
      {hint ? (
        <Text style={[styles.hint, { marginTop: t.spacing.xs, color: t.colors.muted }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  hint: {
    fontSize: 12,
  },
});
