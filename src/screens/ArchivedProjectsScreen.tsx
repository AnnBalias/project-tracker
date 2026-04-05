import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../store/ThemeContext';
import { useProjects } from '../hooks/useProjects';
import { Card } from '../components/Card';
import { CompleteProjectModal } from '../components/CompleteProjectModal';
import { ProjectEditorModal } from '../components/ProjectEditorModal';
import type { ModalMode, Project } from '../types';
import { formatDisplayDate } from '../utils/dateTime';
import { formatTenure } from '../utils/tenure';

export function ArchivedProjectsScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const { projects, upsertProject, removeProject } = useProjects();

  const archivedProjects = useMemo(() => projects.filter((p) => p.archived), [projects]);

  const [editor, setEditor] = useState<{ mode: ModalMode; id?: string } | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const selected =
    editor?.id != null ? projects.find((p) => p.id === editor.id) ?? null : null;

  const completingProject = completingId
    ? projects.find((p) => p.id === completingId)
    : null;

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
        card: { marginBottom: t.spacing.sm },
        row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
        swatch: { width: 12, height: 40, borderRadius: 6 },
        flex: { flex: 1 },
        cardTitle: { fontSize: 16, fontWeight: '700', color: t.colors.text },
        meta: { marginTop: 4, fontSize: 13, color: t.colors.muted },
        empty: { color: t.colors.muted, marginBottom: t.spacing.sm },
      }),
    [t],
  );

  const saveProject = (p: Project) => {
    if (!p.id) return;
    void upsertProject(p);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <Text style={styles.section}>Архів проєктів</Text>
        {archivedProjects.length === 0 ? (
          <Text style={styles.empty}>Завершені проєкти з’являться тут</Text>
        ) : null}
        {archivedProjects.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setEditor({ mode: 'view', id: p.id })}
          >
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.swatch, { backgroundColor: p.color }]} />
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{p.name}</Text>
                  <Text style={styles.meta}>
                    {p.endDate
                      ? `Завершено: ${formatDisplayDate(p.endDate)}`
                      : 'Архів'}
                  </Text>
                  <Text style={styles.meta}>
                    Тривалість: {formatTenure(p.startDate, p.endDate)}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>

      <ProjectEditorModal
        visible={!!editor}
        mode={editor?.mode ?? 'create'}
        initial={selected}
        onClose={() => setEditor(null)}
        onRequestEdit={() =>
          editor?.id ? setEditor({ mode: 'edit', id: editor.id }) : undefined
        }
        onRequestComplete={() => {
          if (editor?.id) {
            setCompletingId(editor.id);
            setEditor(null);
          }
        }}
        onRestoreFromArchive={() => {
          if (selected) {
            void upsertProject({
              ...selected,
              archived: false,
              endDate: undefined,
            });
            setEditor(null);
          }
        }}
        onSave={saveProject}
        onDelete={(id) => void removeProject(id)}
      />

      <CompleteProjectModal
        visible={!!completingId && !!completingProject}
        projectName={completingProject?.name ?? ''}
        onClose={() => setCompletingId(null)}
        onConfirm={(endDateIso) => {
          if (!completingProject) return;
          void upsertProject({
            ...completingProject,
            endDate: endDateIso,
            archived: true,
          });
          setCompletingId(null);
        }}
      />
    </View>
  );
}
