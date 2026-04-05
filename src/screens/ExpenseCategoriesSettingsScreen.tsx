import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../store/ThemeContext';
import { useProjects } from '../hooks/useProjects';
import { Card } from '../components/Card';
import { FAB } from '../components/FAB';
import { CategoryEditorModal } from '../components/CategoryEditorModal';
import type { ProfileStackParamList } from '../navigation/types';
import type { ExpenseCategory, ModalMode } from '../types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ExpenseCategoriesSettings'>;

export function ExpenseCategoriesSettingsScreen({ route }: Props) {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [archiveSectionY, setArchiveSectionY] = useState<number | null>(null);
  const {
    expenseCategories,
    addExpenseCategory,
    upsertExpenseCategory,
    removeExpenseCategory,
  } = useProjects();

  const activeCategories = useMemo(
    () => expenseCategories.filter((c) => !c.archived),
    [expenseCategories],
  );
  const archivedCategories = useMemo(
    () => expenseCategories.filter((c) => c.archived),
    [expenseCategories],
  );

  const [editor, setEditor] = useState<{ mode: ModalMode; id?: string } | null>(null);

  const selected =
    editor?.id != null
      ? expenseCategories.find((c) => c.id === editor.id) ?? null
      : null;

  useEffect(() => {
    if (!route.params?.showArchived || archiveSectionY == null) return;
    const id = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: archiveSectionY, animated: true });
    });
    return () => cancelAnimationFrame(id);
  }, [route.params?.showArchived, archiveSectionY]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: t.colors.background, padding: t.spacing.md },
        section: {
          fontSize: 15,
          fontWeight: '700',
          color: t.colors.muted,
          marginBottom: t.spacing.sm,
        },
        mt: { marginTop: t.spacing.lg },
        card: { marginBottom: t.spacing.sm },
        row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
        swatch: { width: 12, height: 40, borderRadius: 6 },
        cardTitle: { fontSize: 16, fontWeight: '700', color: t.colors.text },
        empty: { color: t.colors.muted, marginBottom: t.spacing.sm },
      }),
    [t],
  );

  const saveCategory = (c: ExpenseCategory) => {
    if (!c.id) {
      const { id: _i, ...rest } = c;
      void addExpenseCategory(rest);
      return;
    }
    void upsertExpenseCategory(c);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.section}>Активні категорії</Text>
        {activeCategories.length === 0 ? (
          <Text style={styles.empty}>Додайте категорії для обліку витрат</Text>
        ) : null}
        {activeCategories.map((c) => (
          <Pressable key={c.id} onPress={() => setEditor({ mode: 'view', id: c.id })}>
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.swatch, { backgroundColor: c.color }]} />
                <Text style={styles.cardTitle}>{c.name}</Text>
              </View>
            </Card>
          </Pressable>
        ))}

        <View onLayout={(e) => setArchiveSectionY(e.nativeEvent.layout.y)}>
          <Text style={[styles.section, styles.mt]}>Архів</Text>
          {archivedCategories.length === 0 ? (
            <Text style={styles.empty}>Немає архівованих категорій</Text>
          ) : (
            archivedCategories.map((c) => (
              <Pressable key={c.id} onPress={() => setEditor({ mode: 'view', id: c.id })}>
                <Card style={styles.card}>
                  <View style={styles.row}>
                    <View style={[styles.swatch, { backgroundColor: c.color }]} />
                    <Text style={styles.cardTitle}>{c.name}</Text>
                  </View>
                </Card>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <FAB onPress={() => setEditor({ mode: 'create' })} />

      <CategoryEditorModal
        visible={!!editor}
        mode={editor?.mode ?? 'create'}
        initial={selected}
        onClose={() => setEditor(null)}
        onRequestEdit={() =>
          editor?.id ? setEditor({ mode: 'edit', id: editor.id }) : undefined
        }
        onSave={saveCategory}
        onDelete={(id) => void removeExpenseCategory(id)}
      />
    </View>
  );
}
