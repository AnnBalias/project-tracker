import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../store/ThemeContext';
import { useProjects } from '../hooks/useProjects';
import { Card } from '../components/Card';
import { FAB } from '../components/FAB';
import { TaskTypeEditorModal } from '../components/TaskTypeEditorModal';
import type { ProfileStackParamList } from '../navigation/types';
import type { ModalMode, TaskType } from '../types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'TaskTypesSettings'>;

export function TaskTypesSettingsScreen({ route }: Props) {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [archiveSectionY, setArchiveSectionY] = useState<number | null>(null);
  const { taskTypes, addTaskType, upsertTaskType, removeTaskType } = useProjects();

  const activeTaskTypes = useMemo(() => taskTypes.filter((x) => !x.archived), [taskTypes]);
  const archivedTaskTypes = useMemo(() => taskTypes.filter((x) => x.archived), [taskTypes]);

  const [editor, setEditor] = useState<{ mode: ModalMode; id?: string } | null>(null);

  const selected =
    editor?.id != null ? taskTypes.find((x) => x.id === editor.id) ?? null : null;

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

  const saveTaskType = (x: TaskType) => {
    if (!x.id) {
      const { id: _i, ...rest } = x;
      void addTaskType(rest);
      return;
    }
    void upsertTaskType(x);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.section}>Активні типи</Text>
        {activeTaskTypes.length === 0 ? (
          <Text style={styles.empty}>Додайте типи для класифікації задач</Text>
        ) : null}
        {activeTaskTypes.map((x) => (
          <Pressable key={x.id} onPress={() => setEditor({ mode: 'view', id: x.id })}>
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.swatch, { backgroundColor: x.color }]} />
                <Text style={styles.cardTitle}>{x.name}</Text>
              </View>
            </Card>
          </Pressable>
        ))}

        <View
          onLayout={(e) => setArchiveSectionY(e.nativeEvent.layout.y)}
        >
          <Text style={[styles.section, styles.mt]}>Архів</Text>
          {archivedTaskTypes.length === 0 ? (
            <Text style={styles.empty}>Немає архівованих типів</Text>
          ) : (
            archivedTaskTypes.map((x) => (
              <Pressable key={x.id} onPress={() => setEditor({ mode: 'view', id: x.id })}>
                <Card style={styles.card}>
                  <View style={styles.row}>
                    <View style={[styles.swatch, { backgroundColor: x.color }]} />
                    <Text style={styles.cardTitle}>{x.name}</Text>
                  </View>
                </Card>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <FAB onPress={() => setEditor({ mode: 'create' })} />

      <TaskTypeEditorModal
        visible={!!editor}
        mode={editor?.mode ?? 'create'}
        initial={selected}
        onClose={() => setEditor(null)}
        onRequestEdit={() =>
          editor?.id ? setEditor({ mode: 'edit', id: editor.id }) : undefined
        }
        onSave={saveTaskType}
        onDelete={(id) => void removeTaskType(id)}
      />
    </View>
  );
}
