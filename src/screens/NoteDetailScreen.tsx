import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NotesStackParamList } from '../navigation/types';
import { useAppTheme } from '../store/ThemeContext';
import { useAppData } from '../store/AppDataContext';
import { useProjects } from '../hooks/useProjects';
import { Button } from '../components/Button';
import { NoteEditorModal } from '../components/NoteEditorModal';
import type { ModalMode, Note } from '../types';

type Props = NativeStackScreenProps<NotesStackParamList, 'NoteDetail'>;

export function NoteDetailScreen({ navigation, route }: Props) {
  const t = useAppTheme();
  const { noteId } = route.params;
  const { notes, upsertNote, removeNote } = useAppData();
  const { activeProjects, projects } = useProjects();
  const note = notes.find((n) => n.id === noteId);

  const projectOptions = useMemo(
    () => activeProjects.map((p) => ({ id: p.id, name: p.name })),
    [activeProjects],
  );

  const [modal, setModal] = useState<ModalMode | null>(null);

  if (!note) {
    return (
      <View style={[styles.center, { backgroundColor: t.colors.background }]}>
        <Text style={{ color: t.colors.muted }}>Нотатку не знайдено</Text>
        <Button title="Назад" onPress={() => navigation.goBack()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const projectLabel =
    note.projectId == null
      ? 'Без проєкту'
      : (projects.find((p) => p.id === note.projectId)?.name ?? 'Проєкт');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.background }}
      contentContainerStyle={{ padding: t.spacing.md, paddingBottom: 40 }}
    >
      <Text style={[styles.h1, { color: t.colors.text }]}>{note.title}</Text>
      <Text style={[styles.proj, { color: t.colors.muted }]}>{projectLabel}</Text>
      <Text style={[styles.body, { color: t.colors.text }]}>{note.description}</Text>
      <View style={styles.actions}>
        <Button title="Редагувати" onPress={() => setModal('edit')} style={{ flex: 1 }} />
        <Button
          title="Видалити"
          variant="danger"
          onPress={() => {
            void removeNote(note.id);
            navigation.goBack();
          }}
          style={{ flex: 1 }}
        />
      </View>

      <NoteEditorModal
        visible={modal === 'edit'}
        mode="edit"
        initial={note}
        projectIds={projectOptions}
        onClose={() => setModal(null)}
        onSave={(n: Note) => {
          void upsertNote(n);
          setModal(null);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  h1: { fontSize: 22, fontWeight: '800' },
  proj: { marginTop: 6, fontSize: 14 },
  body: { marginTop: 20, fontSize: 16, lineHeight: 24 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 28 },
});
