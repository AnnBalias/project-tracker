import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppTheme } from '../theme/palette';
import { useAppTheme, useThemeControls } from '../store/ThemeContext';
import { useAppData } from '../store/AppDataContext';
import { Card } from '../components/Card';
import { CategoryEditorModal } from '../components/CategoryEditorModal';
import { ChallengeEditorModal } from '../components/ChallengeEditorModal';
import { CompleteProjectModal } from '../components/CompleteProjectModal';
import { FAB } from '../components/FAB';
import { ProjectEditorModal } from '../components/ProjectEditorModal';
import { TaskTypeEditorModal } from '../components/TaskTypeEditorModal';
import { AppModal } from '../components/AppModal';
import { Button } from '../components/Button';
import { SegmentControl } from '../components/SegmentControl';
import { useProjects } from '../hooks/useProjects';
import type { ProfileStackParamList } from '../navigation/types';
import type { Challenge, ExpenseCategory, ModalMode, Project, TaskType } from '../types';
import { createId } from '../utils/id';
import { formatDisplayDate } from '../utils/dateTime';
import { formatTenure } from '../utils/tenure';
import { levelFromTotalXp } from '../utils/levels';

type Editor =
  | { kind: 'project'; mode: ModalMode; id?: string }
  | { kind: 'category'; mode: ModalMode; id?: string }
  | { kind: 'taskType'; mode: ModalMode; id?: string }
  | { kind: 'challenge'; mode: ModalMode; id?: string }
  | null;

function makeStyles(t: AppTheme) {
  return StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.colors.background },
    screen: { flex: 1, padding: t.spacing.md },
    heading: {
      fontSize: 22,
      fontWeight: '700',
      color: t.colors.text,
      marginBottom: t.spacing.md,
    },
    section: {
      fontSize: 15,
      fontWeight: '700',
      color: t.colors.muted,
      marginBottom: t.spacing.sm,
    },
    mt: { marginTop: t.spacing.lg },
    card: { marginBottom: t.spacing.sm },
    row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
    flex: { flex: 1 },
    swatch: { width: 12, height: 40, borderRadius: 6 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: t.colors.text },
    meta: { marginTop: 4, fontSize: 13, color: t.colors.muted },
    empty: { color: t.colors.muted, marginBottom: t.spacing.sm },
    levelBox: { marginBottom: t.spacing.md },
    levelTitle: { fontSize: 18, fontWeight: '800', color: t.colors.text },
    track: {
      height: 10,
      borderRadius: 5,
      backgroundColor: t.colors.border,
      marginTop: t.spacing.sm,
      overflow: 'hidden',
    },
    fill: { height: '100%', borderRadius: 5, backgroundColor: t.colors.accent },
    levelSub: { marginTop: 6, fontSize: 13, color: t.colors.muted },
    settingsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: t.spacing.sm,
      gap: t.spacing.sm,
    },
    settingsLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: t.colors.muted,
      flex: 1,
    },
    settingsLink: { fontSize: 14, fontWeight: '600', color: t.colors.accent },
    settingsChevron: { fontSize: 20, color: t.colors.muted, lineHeight: 22 },
    settingsRowEnd: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    modalHint: { fontSize: 15, lineHeight: 22, color: t.colors.muted },
    fabMenuStack: { gap: t.spacing.sm, width: '100%', alignSelf: 'stretch' },
    clearActions: { width: '100%', gap: t.spacing.sm, alignSelf: 'stretch' },
  });
}

export function ProfileScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>>();
  const { dark, setDark, mode, setMode } = useThemeControls();
  const {
    focusSessions,
    achievementsState,
    focusGoalMinutes,
    setFocusGoalMinutes,
    challengesState,
    upsertChallenge,
    removeChallenge,
    clearAllUserData,
  } = useAppData();
  const {
    projects,
    expenseCategories,
    taskTypes,
    addProject,
    upsertProject,
    removeProject,
    addExpenseCategory,
    upsertExpenseCategory,
    removeExpenseCategory,
    addTaskType,
    upsertTaskType,
    removeTaskType,
  } = useProjects();

  const focusGoalKey = useMemo(() => {
    const allowed = [30, 60, 90, 120] as const;
    const closest = allowed.reduce((best, x) =>
      Math.abs(x - focusGoalMinutes) < Math.abs(best - focusGoalMinutes) ? x : best,
    );
    return String(closest) as '30' | '60' | '90' | '120';
  }, [focusGoalMinutes]);

  const [editor, setEditor] = useState<Editor>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [addMenuVisible, setAddMenuVisible] = useState(false);
  const [clearConfirmVisible, setClearConfirmVisible] = useState(false);

  const activeProjects = useMemo(() => projects.filter((p) => !p.archived), [projects]);
  const archivedProjects = useMemo(() => projects.filter((p) => p.archived), [projects]);
  const archivedTaskTypes = useMemo(() => taskTypes.filter((x) => x.archived), [taskTypes]);
  const archivedCategories = useMemo(
    () => expenseCategories.filter((c) => c.archived),
    [expenseCategories],
  );
  const archivedChallenges = useMemo(
    () => challengesState.challenges.filter((c) => c.archived),
    [challengesState.challenges],
  );
  const projectOptions = useMemo(
    () => activeProjects.map((p) => ({ id: p.id, name: p.name })),
    [activeProjects],
  );

  const totalXp = focusSessions.reduce((a, s) => a + s.xpEarned, 0);
  const L = levelFromTotalXp(totalXp);
  const progress = L.xpForNext > 0 ? L.xpIntoLevel / L.xpForNext : 1;

  const selectedProject =
    editor?.kind === 'project' && editor.id
      ? projects.find((p) => p.id === editor.id)
      : null;

  const selectedCategory =
    editor?.kind === 'category' && editor.id
      ? expenseCategories.find((c) => c.id === editor.id)
      : null;

  const selectedTaskType =
    editor?.kind === 'taskType' && editor.id
      ? taskTypes.find((x) => x.id === editor.id)
      : null;

  const selectedChallenge =
    editor?.kind === 'challenge' && editor.id
      ? challengesState.challenges.find((c) => c.id === editor.id)
      : null;

  const completingProject = completingId
    ? projects.find((p) => p.id === completingId)
    : null;

  const openFab = () => setAddMenuVisible(true);

  const pickAddKind = (next: Editor) => {
    setAddMenuVisible(false);
    setEditor(next);
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

  const saveTaskType = (x: TaskType) => {
    if (!x.id) {
      const { id: _i, ...rest } = x;
      void addTaskType(rest);
      return;
    }
    void upsertTaskType(x);
  };

  const saveChallenge = (c: Challenge) => {
    if (!c.id) {
      void upsertChallenge({ ...c, id: createId() });
      return;
    }
    void upsertChallenge(c);
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
      >
        <Text style={styles.heading}>Профіль</Text>

        <View style={styles.levelBox}>
          <Text style={styles.levelTitle}>
            Рівень {L.level} · {Math.round(totalXp)} XP
          </Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Text style={styles.levelSub}>
            До рівня {L.level + 1}: {L.xpIntoLevel} / {L.xpForNext} XP · серія:{' '}
            {achievementsState.globalStreak?.current ?? 0} дн.
          </Text>
          <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
            <Button title="Рівні за проєктами" onPress={() => navigation.navigate('ProjectLevels')} />
          </View>
          <View style={{ marginTop: 12 }}>
            <SegmentControl
              items={[
                { key: 'system', label: 'Система' },
                { key: 'light', label: 'Світла' },
                { key: 'dark', label: 'Темна' },
              ]}
              value={mode}
              onChange={setMode}
            />
          </View>
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: t.colors.muted, marginBottom: 6 }}>
              Ціль фокусу на день (для стріку)
            </Text>
            <SegmentControl
              items={[
                { key: '30', label: '30 хв' },
                { key: '60', label: '60 хв' },
                { key: '90', label: '90 хв' },
                { key: '120', label: '120 хв' },
              ]}
              value={focusGoalKey}
              onChange={(k) => void setFocusGoalMinutes(parseInt(k, 10))}
            />
          </View>
        </View>

        <View style={styles.settingsRow}>
          <Text style={styles.settingsLabel}>Активні проєкти</Text>
          <Pressable onPress={() => navigation.navigate('ArchivedProjects')} hitSlop={8}>
            <Text style={styles.settingsLink}>
              Архів
              {archivedProjects.length > 0 ? ` (${archivedProjects.length})` : ''}
            </Text>
          </Pressable>
        </View>
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

        <View style={[styles.settingsRow, styles.mt]}>
          <Pressable
            style={styles.flex}
            onPress={() => navigation.navigate('TaskTypesSettings')}
          >
            <Text style={styles.settingsLabel}>Типи задач</Text>
          </Pressable>
          <View style={styles.settingsRowEnd}>
            <Pressable
              onPress={() =>
                navigation.navigate('TaskTypesSettings', { showArchived: true })
              }
              hitSlop={8}
            >
              <Text style={styles.settingsLink}>
                Архів
                {archivedTaskTypes.length > 0 ? ` (${archivedTaskTypes.length})` : ''}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('TaskTypesSettings')}
              hitSlop={10}
            >
              <Text style={styles.settingsChevron}>›</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.settingsRow, styles.mt]}>
          <Pressable
            style={styles.flex}
            onPress={() => navigation.navigate('ChallengesSettings')}
          >
            <Text style={styles.settingsLabel}>Челенджі</Text>
          </Pressable>
          <View style={styles.settingsRowEnd}>
            <Pressable
              onPress={() =>
                navigation.navigate('ChallengesSettings', { showArchived: true })
              }
              hitSlop={8}
            >
              <Text style={styles.settingsLink}>
                Архів
                {archivedChallenges.length > 0 ? ` (${archivedChallenges.length})` : ''}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('ChallengesSettings')}
              hitSlop={10}
            >
              <Text style={styles.settingsChevron}>›</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.settingsRow, styles.mt]}>
          <Pressable
            style={styles.flex}
            onPress={() => navigation.navigate('ExpenseCategoriesSettings')}
          >
            <Text style={styles.settingsLabel}>Категорії витрат</Text>
          </Pressable>
          <View style={styles.settingsRowEnd}>
            <Pressable
              onPress={() =>
                navigation.navigate('ExpenseCategoriesSettings', {
                  showArchived: true,
                })
              }
              hitSlop={8}
            >
              <Text style={styles.settingsLink}>
                Архів
                {archivedCategories.length > 0 ? ` (${archivedCategories.length})` : ''}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('ExpenseCategoriesSettings')}
              hitSlop={10}
            >
              <Text style={styles.settingsChevron}>›</Text>
            </Pressable>
          </View>
        </View>

        <Text style={[styles.section, styles.mt]}>Дані на пристрої</Text>
        <Card style={styles.card}>
          <Text style={styles.meta}>
            Повне очищення: профіль, події, задачі, нотатки, фінанси, челенджі тощо. Дію не можна
            скасувати.
          </Text>
          <View style={{ marginTop: t.spacing.sm }}>
            <Button
              title="Очистити всі дані"
              variant="danger"
              onPress={() => setClearConfirmVisible(true)}
            />
          </View>
        </Card>
      </ScrollView>

      <FAB onPress={openFab} />

      <AppModal
        visible={addMenuVisible}
        title="Додати"
        onClose={() => setAddMenuVisible(false)}
      >
        <View style={styles.fabMenuStack}>
          <Button
            title="Проєкт"
            variant="secondary"
            style={{ alignSelf: 'stretch' }}
            onPress={() => pickAddKind({ kind: 'project', mode: 'create' })}
          />
          <Button
            title="Категорія витрат"
            variant="secondary"
            style={{ alignSelf: 'stretch' }}
            onPress={() => pickAddKind({ kind: 'category', mode: 'create' })}
          />
          <Button
            title="Тип задачі"
            variant="secondary"
            style={{ alignSelf: 'stretch' }}
            onPress={() => pickAddKind({ kind: 'taskType', mode: 'create' })}
          />
          <Button
            title="Челендж"
            variant="secondary"
            style={{ alignSelf: 'stretch' }}
            onPress={() => pickAddKind({ kind: 'challenge', mode: 'create' })}
          />
        </View>
      </AppModal>

      <AppModal
        visible={clearConfirmVisible}
        title="Очистити всі дані?"
        onClose={() => setClearConfirmVisible(false)}
        footer={
          <View style={styles.clearActions}>
            <Button
              title="Скасувати"
              variant="secondary"
              style={{ alignSelf: 'stretch' }}
              onPress={() => setClearConfirmVisible(false)}
            />
            <Button
              title="Очистити"
              variant="danger"
              style={{ alignSelf: 'stretch' }}
              onPress={() => {
                void (async () => {
                  await clearAllUserData();
                  setDark(false);
                  setClearConfirmVisible(false);
                })();
              }}
            />
          </View>
        }
      >
        <Text style={styles.modalHint}>
          Усі локальні дані буде видалено. Цю дію не можна скасувати.
        </Text>
      </AppModal>

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

      <TaskTypeEditorModal
        visible={editor?.kind === 'taskType'}
        mode={editor?.kind === 'taskType' ? editor.mode : 'create'}
        initial={selectedTaskType ?? null}
        onClose={() => setEditor(null)}
        onRequestEdit={() =>
          editor?.kind === 'taskType' && editor.id
            ? setEditor({ kind: 'taskType', mode: 'edit', id: editor.id })
            : undefined
        }
        onSave={saveTaskType}
        onDelete={(id) => void removeTaskType(id)}
      />

      <ChallengeEditorModal
        visible={editor?.kind === 'challenge'}
        mode={editor?.kind === 'challenge' ? editor.mode : 'create'}
        initial={selectedChallenge ?? null}
        projectIds={projectOptions}
        onClose={() => setEditor(null)}
        onRequestEdit={() =>
          editor?.kind === 'challenge' && editor.id
            ? setEditor({ kind: 'challenge', mode: 'edit', id: editor.id })
            : undefined
        }
        onSave={saveChallenge}
        onDelete={(id) => void removeChallenge(id)}
      />
    </View>
  );
}
