import React, { type ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { useAppTheme } from '../store/ThemeContext';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
};

export function Card({ children, style }: Props) {
  const t = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: t.colors.card,
          borderColor: t.colors.border,
          borderRadius: t.radius.md,
          padding: t.spacing.md,
        },
        !t.dark && Platform.OS === 'ios'
          ? {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
            }
          : null,
        !t.dark && Platform.OS === 'android' ? { elevation: 1 } : null,
        t.dark ? { borderWidth: 1 } : { borderWidth: 1 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
});
