import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { Card } from '../components/Card';
import { CategoryEditorModal } from '../components/CategoryEditorModal';
import { CompleteProjectModal } from '../components/CompleteProjectModal';
import { FAB } from '../components/FAB';
import { ProjectEditorModal } from '../components/ProjectEditorModal';
import { useProjects } from '../hooks/useProjects';
import type { ExpenseCategory, ModalMode, Project } from '../types';
import { formatDisplayDate } from '../utils/dateTime';
import { formatTenure } from '../utils/tenure';

type Editor =
  | { kind: 'project'; mode: ModalMode; id?: string }
  | { kind: 'category'; mode: ModalMode; id?: string }
  | null;

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    projects,
    expenseCategories,
    addProject,
    upsertProject,
    removeProject,
    addExpenseCategory,
    upsertExpenseCategory,
    removeExpenseCategory,
  } = useProjects();

  const [editor, setEditor] = useState<Editor>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const activeProjects = projects.filter((p) => !p.archived);
  const archivedProjects = projects.filter((p) => p.archived);

  const selectedProject =
    editor?.kind === 'project' && editor.id
      ? projects.find((p) => p.id === editor.id)
      : null;

  const selectedCategory =
    editor?.kind === 'category' && editor.id
      ? expenseCategories.find((c) => c.id === editor.id)
      : null;

  const completingProject = completingId
    ? projects.find((p) => p.id === completingId)
    : null;

  const openFab = () => {
    Alert.alert('Додати', undefined, [
      { text: 'Проєкт', onPress: () => setEditor({ kind: 'project', mode: 'create' }) },
      {
        text: 'Категорія витрат',
        onPress: () => setEditor({ kind: 'category', mode: 'create' }),
      },
      { text: 'Скасувати', style: 'cancel' },
    ]);
  };

  const saveProject = (p: Project) => {
    if (!p.id) {
      const { id: _i, ...rest } = p;
      void addProject(rest);
      return;
    }
    void upsertProject(p);
  };

  const saveCategory = (c: ExpenseCategory) => {
    if (!c.id) {
      const { id: _i, ...rest } = c;
      void addExpenseCategory(rest);
      return;
    }
    void upsertExpenseCategory(c);
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
      >
        <Text style={styles.heading}>Профіль</Text>

        <Text style={styles.section}>Активні проєкти</Text>
        {activeProjects.length === 0 ? (
          <Text style={styles.empty}>Ще немає активних проєктів</Text>
        ) : null}
        {activeProjects.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setEditor({ kind: 'project', mode: 'view', id: p.id })}
          >
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.swatch, { backgroundColor: p.color }]} />
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{p.name}</Text>
                  <Text style={styles.meta}>{p.position}</Text>
                  <Text style={styles.meta}>
                    Час у проєкті: {formatTenure(p.startDate, p.endDate)}
                  </Text>
                  <Text style={styles.meta}>
                    Початок: {formatDisplayDate(p.startDate)}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        ))}

        <Text style={[styles.section, styles.mt]}>Архів</Text>
        {archivedProjects.length === 0 ? (
          <Text style={styles.empty}>Завершені проєкти з’являться тут</Text>
        ) : null}
        {archivedProjects.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setEditor({ kind: 'project', mode: 'view', id: p.id })}
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

        <Text style={[styles.section, styles.mt]}>Категорії витрат</Text>
        {expenseCategories.length === 0 ? (
          <Text style={styles.empty}>Додайте категорії для обліку витрат</Text>
        ) : null}
        {expenseCategories.map((c) => (
          <Pressable
            key={c.id}
            onPress={() =>
              setEditor({ kind: 'category', mode: 'view', id: c.id })
            }
          >
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.swatch, { backgroundColor: c.color }]} />
                <Text style={styles.cardTitle}>{c.name}</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>

      <FAB onPress={openFab} />

      <ProjectEditorModal
        visible={editor?.kind === 'project'}
        mode={editor?.kind === 'project' ? editor.mode : 'create'}
        initial={selectedProject ?? null}
        onClose={() => setEditor(null)}
        onRequestEdit={() =>
          editor?.kind === 'project' && editor.id
            ? setEditor({ kind: 'project', mode: 'edit', id: editor.id })
            : undefined
        }
        onRequestComplete={() => {
          if (editor?.kind === 'project' && editor.id) {
            setCompletingId(editor.id);
            setEditor(null);
          }
        }}
        onRestoreFromArchive={() => {
          if (selectedProject) {
            void upsertProject({
              ...selectedProject,
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

      <CategoryEditorModal
        visible={editor?.kind === 'category'}
        mode={editor?.kind === 'category' ? editor.mode : 'create'}
        initial={selectedCategory ?? null}
        onClose={() => setEditor(null)}
        onRequestEdit={() =>
          editor?.kind === 'category' && editor.id
            ? setEditor({ kind: 'category', mode: 'edit', id: editor.id })
            : undefined
        }
        onSave={saveCategory}
        onDelete={(id) => void removeExpenseCategory(id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.background },
  screen: { flex: 1, padding: theme.spacing.md },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  section: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  mt: { marginTop: theme.spacing.lg },
  card: { marginBottom: theme.spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  flex: { flex: 1 },
  swatch: { width: 12, height: 40, borderRadius: 6 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  meta: { marginTop: 4, fontSize: 13, color: theme.colors.muted },
  empty: { color: theme.colors.muted, marginBottom: theme.spacing.sm },
});
