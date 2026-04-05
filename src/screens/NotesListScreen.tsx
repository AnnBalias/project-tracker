import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NotesStackParamList } from '../navigation/types';
import { useAppTheme } from '../store/ThemeContext';
import { useAppData } from '../store/AppDataContext';
import { useProjects } from '../hooks/useProjects';
import { FAB } from '../components/FAB';
import { NoteEditorModal } from '../components/NoteEditorModal';
import type { ModalMode, Note } from '../types';
import { createId } from '../utils/id';

type Props = NativeStackScreenProps<NotesStackParamList, 'NotesList'>;

export function NotesListScreen({ navigation }: Props) {
  const t = useAppTheme();
  const { notes, upsertNote, removeNote } = useAppData();
  const { activeProjects, projects } = useProjects();
  const projectOptions = useMemo(
    () => activeProjects.map((p) => ({ id: p.id, name: p.name })),
    [activeProjects],
  );

  const [modal, setModal] = useState<{ mode: ModalMode; id?: string } | null>(null);
  const selected = modal?.id ? notes.find((n) => n.id === modal.id) : null;

  const sorted = useMemo(
    () => [...notes].sort((a, b) => a.title.localeCompare(b.title)),
    [notes],
  );

  const projectLabel = (pid: string | null) =>
    pid == null
      ? 'Без проєкту'
      : (projects.find((p) => p.id === pid)?.name ?? 'Проєкт');

  return (
    <View style={[styles.wrap, { backgroundColor: t.colors.background }]}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: t.spacing.md, paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={{ color: t.colors.muted }}>Ще немає нотаток. Натисніть +.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })}
            style={[styles.row, { backgroundColor: t.colors.card, borderColor: t.colors.border }]}
          >
            <Text style={[styles.title, { color: t.colors.text }]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={[styles.meta, { color: t.colors.muted }]} numberOfLines={1}>
              {projectLabel(item.projectId)}
            </Text>
          </Pressable>
        )}
      />
      <FAB onPress={() => setModal({ mode: 'create' })} />
      <NoteEditorModal
        visible={modal !== null}
        mode={modal?.mode ?? 'create'}
        initial={modal?.mode !== 'create' ? selected ?? null : null}
        projectIds={projectOptions}
        onClose={() => setModal(null)}
        onRequestEdit={() =>
          modal?.id ? setModal({ mode: 'edit', id: modal.id }) : undefined
        }
        onSave={(n: Note) => {
          if (modal?.mode === 'create') {
            void upsertNote({ ...n, id: createId() });
          } else if (n.id) {
            void upsertNote(n);
          }
        }}
        onDelete={(id) => void removeNote(id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  row: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  title: { fontSize: 16, fontWeight: '700' },
  meta: { marginTop: 4, fontSize: 13 },
});
