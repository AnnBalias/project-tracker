import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { format, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CalendarStackParamList } from '../navigation/types';
import { theme } from '../theme/theme';
import { Card } from '../components/Card';
import { FAB } from '../components/FAB';
import { EventEditorModal } from '../components/EventEditorModal';
import { TaskEditorModal } from '../components/TaskEditorModal';
import { useEvents } from '../hooks/useEvents';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import type { CalendarEvent, ModalMode, Task } from '../types';
import { eventOccursOnDay, taskOnDay } from '../utils/calendarHelpers';
import { calendarKeyToDisplay, parseDateKey } from '../utils/dateTime';

type Props = NativeStackScreenProps<CalendarStackParamList, 'CalendarDay'>;

type Editor =
  | { kind: 'event'; mode: ModalMode; id?: string }
  | { kind: 'task'; mode: ModalMode; id?: string }
  | null;

export function CalendarDayScreen({ navigation, route }: Props) {
  const { dateKey } = route.params;
  const day = parseDateKey(dateKey);
  const insets = useSafeAreaInsets();
  const { projects, activeProjects } = useProjects();
  const { events, addEvent, upsertEvent, removeEvent } = useEvents();
  const { tasks, addTask, upsertTask, removeTask } = useTasks();

  const [editor, setEditor] = useState<Editor>(null);

  const projectOptions = useMemo(
    () => activeProjects.map((p) => ({ id: p.id, name: p.name })),
    [activeProjects],
  );

  const dayEvents = useMemo(
    () => events.filter((e) => eventOccursOnDay(e, day)),
    [events, day],
  );

  const dayTasks = useMemo(
    () => tasks.filter((t) => taskOnDay(t, day)),
    [tasks, day],
  );

  const selectedEvent = editor?.kind === 'event' && editor.id
    ? events.find((e) => e.id === editor.id)
    : null;

  const selectedTask =
    editor?.kind === 'task' && editor.id
      ? tasks.find((t) => t.id === editor.id)
      : null;

  const openFab = () => {
    Alert.alert('Додати', undefined, [
      { text: 'Подія', onPress: () => setEditor({ kind: 'event', mode: 'create' }) },
      { text: 'Задача', onPress: () => setEditor({ kind: 'task', mode: 'create' }) },
      { text: 'Скасувати', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 88,
        }}
      >
        <View style={styles.top}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
            <Text style={styles.backTxt}>‹ Назад</Text>
          </Pressable>
          <Text style={styles.title}>
            {format(day, 'EEEE, d MMMM', { locale: uk })}
          </Text>
          <Text style={styles.dateDmY}>{calendarKeyToDisplay(dateKey)}</Text>
        </View>

        <Text style={styles.section}>Події</Text>
        {dayEvents.length === 0 ? (
          <Text style={styles.empty}>Немає подій на цей день</Text>
        ) : null}
        {dayEvents.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setEditor({ kind: 'event', mode: 'view', id: item.id })}
          >
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>
                {format(parseISO(item.startTime), 'HH:mm')} —{' '}
                {format(parseISO(item.endTime), 'HH:mm')}
              </Text>
              <Text style={styles.cardMeta} numberOfLines={1}>
                {projects.find((p) => p.id === item.projectId)?.name ?? 'Проєкт'}
              </Text>
            </Card>
          </Pressable>
        ))}

        <Text style={styles.section}>Задачі</Text>
        {dayTasks.length === 0 ? (
          <Text style={styles.empty}>Немає задач на цей день</Text>
        ) : null}
        {dayTasks.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setEditor({ kind: 'task', mode: 'view', id: item.id })}
          >
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>
                {format(parseISO(item.startTime), 'HH:mm')} —{' '}
                {format(parseISO(item.endTime), 'HH:mm')} · {item.status}
              </Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>

      <FAB onPress={openFab} />

      <EventEditorModal
        visible={editor?.kind === 'event'}
        mode={editor?.kind === 'event' ? editor.mode : 'create'}
        dateKey={dateKey}
        initial={selectedEvent}
        projectIds={projectOptions}
        onClose={() => setEditor(null)}
        onRequestEdit={() =>
          editor?.kind === 'event' && editor.id
            ? setEditor({ kind: 'event', mode: 'edit', id: editor.id })
            : undefined
        }
        onSave={(evt) => {
          if (editor?.kind !== 'event') return;
          if (editor.mode === 'create') {
            const { id: _i, ...rest } = evt;
            void addEvent(rest);
          } else if (evt.id) {
            void upsertEvent(evt);
          }
        }}
        onDelete={(id) => void removeEvent(id)}
      />

      <TaskEditorModal
        visible={editor?.kind === 'task'}
        mode={editor?.kind === 'task' ? editor.mode : 'create'}
        dateKey={dateKey}
        initial={selectedTask ?? null}
        projectIds={projectOptions}
        onClose={() => setEditor(null)}
        onRequestEdit={() =>
          editor?.kind === 'task' && editor.id
            ? setEditor({ kind: 'task', mode: 'edit', id: editor.id })
            : undefined
        }
        onSave={(t: Task) => {
          if (editor?.kind !== 'task') return;
          if (editor.mode === 'create') {
            const { id: _i, ...rest } = t;
            void addTask(rest);
          } else if (t.id) {
            void upsertTask(t);
          }
        }}
        onDelete={(id) => void removeTask(id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.background },
  screen: { flex: 1, padding: theme.spacing.md },
  top: { marginBottom: theme.spacing.md },
  back: { marginBottom: theme.spacing.sm },
  backTxt: { fontSize: 16, color: theme.colors.accent, fontWeight: '600' },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  dateDmY: {
    marginTop: 4,
    fontSize: 14,
    color: theme.colors.muted,
    fontWeight: '600',
  },
  section: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.muted,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  card: { marginBottom: theme.spacing.sm },
  cardTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  cardMeta: { marginTop: 4, fontSize: 13, color: theme.colors.muted },
  empty: { fontSize: 14, color: theme.colors.muted, marginBottom: theme.spacing.sm },
});
