import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../store/ThemeContext';

export type SegmentItem<T extends string> = { key: T; label: string };

type Props<T extends string> = {
  items: SegmentItem<T>[];
  value: T;
  onChange: (key: T) => void;
};

export function SegmentControl<T extends string>({
  items,
  value,
  onChange,
}: Props<T>) {
  const t = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          backgroundColor: t.colors.border,
          borderRadius: t.radius.sm,
          padding: 2,
          gap: 2,
        },
        segment: {
          flex: 1,
          paddingVertical: t.spacing.sm,
          alignItems: 'center',
          borderRadius: t.radius.sm - 2,
        },
        segmentActive: {
          backgroundColor: t.colors.card,
        },
        label: {
          fontSize: 13,
          fontWeight: '600',
          color: t.colors.muted,
        },
        labelActive: {
          color: t.colors.text,
        },
      }),
    [t],
  );

  return (
    <View style={styles.row}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
