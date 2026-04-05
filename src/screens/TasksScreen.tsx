import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useAppTheme } from '../store/ThemeContext';
import { Card } from '../components/Card';
import { FAB } from '../components/FAB';
import { SegmentControl } from '../components/SegmentControl';
import { TaskEditorModal } from '../components/TaskEditorModal';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import type { ModalMode, Task, TaskStatus } from '../types';
import { getTaskCalendarDay } from '../utils/calendarHelpers';
import { formatDateKey } from '../utils/dateTime';
import type { TasksStackParamList } from '../navigation/types';

type FilterKind = 'all' | 'project' | 'status';

const STATUS_OPTS: { key: TaskStatus; label: string }[] = [
  { key: 'planned', label: 'Заплановано' },
  { key: 'in_progress', label: 'В роботі' },
  { key: 'done', label: 'Готово' },
  { key: 'canceled', label: 'Скасовано' },
  { key: 'moved', label: 'Перенесено' },
];

export function TasksScreen() {
  const t = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<TasksStackParamList, 'TasksMain'>>();
  const { projects, activeProjects, activeTaskTypes } = useProjects();
  const { tasks, addTask, upsertTask, removeTask } = useTasks();
  const [filterKind, setFilterKind] = useState<FilterKind>('all');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [status, setStatus] = useState<TaskStatus>('planned');
  const [modal, setModal] = useState<{ mode: ModalMode; task?: Task } | null>(null);

  const projectOptions = useMemo(
    () => activeProjects.map((p) => ({ id: p.id, name: p.name })),
    [activeProjects],
  );

  useEffect(() => {
    if (filterKind === 'project' && activeProjects.length && !projectId) {
      setProjectId(activeProjects[0].id);
    }
  }, [filterKind, activeProjects, projectId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('Focus')}
          style={{ marginRight: 12, padding: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Фокус"
        >
          <Ionicons name="timer-outline" size={22} color={t.colors.accent} />
        </Pressable>
      ),
    });
  }, [navigation, t.colors.accent]);

  const filtered = useMemo(() => {
    let list = tasks;
    if (filterKind === 'project' && projectId) {
      list = list.filter((t) => t.projectId === projectId);
    }
    if (filterKind === 'status') {
      list = list.filter((t) => t.status === status);
    }
    return [...list].sort(
      (a, b) =>
        getTaskCalendarDay(a).getTime() - getTaskCalendarDay(b).getTime(),
    );
  }, [tasks, filterKind, projectId, status]);

  const dateKeyForTask = (t: Task) => formatDateKey(getTaskCalendarDay(t));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: t.colors.background,
          padding: t.spacing.md,
        },
        hint: { marginTop: t.spacing.sm, color: t.colors.muted, fontSize: 14 },
        heading: {
          fontSize: 22,
          fontWeight: '700',
          color: t.colors.text,
          marginBottom: t.spacing.md,
        },
        secondRow: { marginTop: t.spacing.sm },
        list: { paddingTop: t.spacing.md, paddingBottom: t.spacing.xl },
        card: { marginBottom: t.spacing.sm },
        cardTitle: { fontSize: 16, fontWeight: '700', color: t.colors.text },
        meta: { marginTop: 4, fontSize: 13, color: t.colors.muted },
        empty: { color: t.colors.muted, marginTop: t.spacing.lg, textAlign: 'center' },
      }),
    [t],
  );

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Задачі</Text>
      <SegmentControl<FilterKind>
        items={[
          { key: 'all', label: 'Усі' },
          { key: 'project', label: 'Проєкт' },
          { key: 'status', label: 'Статус' },
        ]}
        value={filterKind}
        onChange={(k) => setFilterKind(k)}
      />

      {filterKind === 'project' ? (
        <View style={styles.secondRow}>
          {activeProjects.length === 0 ? (
            <Text style={styles.hint}>
              Додайте активний проєкт у вкладці «Профіль».
            </Text>
          ) : (
            <SegmentControl<string>
              items={activeProjects.map((p) => ({ key: p.id, label: p.name }))}
              value={projectId ?? activeProjects[0].id}
              onChange={(id) => setProjectId(id)}
            />
          )}
        </View>
      ) : null}

      {filterKind === 'status' ? (
        <View style={styles.secondRow}>
          <SegmentControl<TaskStatus>
            items={STATUS_OPTS.map((s) => ({ key: s.key, label: s.label }))}
            value={status}
            onChange={(s) => setStatus(s)}
          />
        </View>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 96 }]}
        ListEmptyComponent={
          <Text style={styles.empty}>Немає задач за фільтром</Text>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => setModal({ mode: 'view', task: item })}>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.meta}>
                {format(getTaskCalendarDay(item), 'd MMM yyyy', { locale: uk })} ·{' '}
                {item.status}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {projects.find((p) => p.id === item.projectId)?.name ?? 'Проєкт'}
              </Text>
            </Card>
          </Pressable>
        )}
      />

      <TaskEditorModal
        visible={!!modal}
        mode={modal?.mode ?? 'view'}
        dateKey={modal?.task ? dateKeyForTask(modal.task) : formatDateKey(new Date())}
        initial={modal?.task ?? null}
        projectIds={projectOptions}
        taskTypes={activeTaskTypes}
        onClose={() => setModal(null)}
        onRequestEdit={() =>
          modal?.task
            ? setModal({ mode: 'edit', task: modal.task })
            : undefined
        }
        onSave={(t) => {
          if (!modal) return;
          if (modal.mode === 'create') {
            const { id: _i, ...rest } = t;
            void addTask(rest);
          } else if (t.id) void upsertTask(t);
        }}
        onDelete={(id) => void removeTask(id)}
      />

      <FAB onPress={() => setModal({ mode: 'create' })} />
    </View>
  );
}
