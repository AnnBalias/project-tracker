import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CalendarStackParamList } from '../navigation/types';
import { useAppTheme } from '../store/ThemeContext';
import { useAppData } from '../store/AppDataContext';
import { Card } from '../components/Card';
import { FAB } from '../components/FAB';
import { EventEditorModal } from '../components/EventEditorModal';
import { TaskEditorModal } from '../components/TaskEditorModal';
import { EveningCheckInModal } from '../components/EveningCheckInModal';
import { DayOffEditorModal } from '../components/DayOffEditorModal';
import { useEvents } from '../hooks/useEvents';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import type { CalendarEvent, Challenge, DayOff, ModalMode, Task } from '../types';
import { eventOccursOnDay, taskOnDay } from '../utils/calendarHelpers';
import { calendarKeyToDisplay, parseDateKey } from '../utils/dateTime';
import { challengeAppliesOnDay } from '../utils/streaks';
import { createId } from '../utils/id';
import { cancelEventReminder, syncEventReminder } from '../services/reminders';
import { showThemedAlert } from '../components/themedAlert';

type Props = NativeStackScreenProps<CalendarStackParamList, 'CalendarDay'>;

type Editor =
  | { kind: 'event'; mode: ModalMode; id?: string }
  | { kind: 'task'; mode: ModalMode; id?: string }
  | null;

export function CalendarDayScreen({ navigation, route }: Props) {
  const { dateKey } = route.params;
  const day = parseDateKey(dateKey);
  const insets = useSafeAreaInsets();
  const t = useAppTheme();
  const {
    challengesState,
    toggleChallengeCompletion,
    dayOffs,
    upsertDayOff,
    removeDayOff,
    moodLogs,
    upsertMoodLog,
  } = useAppData();
  const { projects, activeProjects, activeTaskTypes } = useProjects();
  const { events, addEvent, upsertEvent, removeEvent } = useEvents();
  const { tasks, addTask, upsertTask, removeTask } = useTasks();

  const [editor, setEditor] = useState<Editor>(null);
  const [dayOffModal, setDayOffModal] = useState<ModalMode | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);

  const projectOptions = useMemo(
    () => activeProjects.map((p) => ({ id: p.id, name: p.name })),
    [activeProjects],
  );

  const dayEvents = useMemo(
    () => events.filter((e) => eventOccursOnDay(e, day)),
    [events, day],
  );

  const dayTasks = useMemo(
    () => tasks.filter((x) => taskOnDay(x, day)),
    [tasks, day],
  );

  const dayOffForThis = useMemo(
    () => dayOffs.find((d) => d.date.slice(0, 10) === dateKey),
    [dayOffs, dateKey],
  );

  const checkIn = useMemo(
    () => moodLogs.find((m) => m.dateKey === dateKey),
    [moodLogs, dateKey],
  );

  const dayChallenges: Challenge[] = useMemo(
    () =>
      challengesState.challenges.filter(
        (c) => !c.archived && challengeAppliesOnDay(c, day),
      ),
    [challengesState.challenges, day],
  );

  const selectedEvent = editor?.kind === 'event' && editor.id
    ? events.find((e) => e.id === editor.id)
    : null;

  const selectedTask =
    editor?.kind === 'task' && editor.id
      ? tasks.find((x) => x.id === editor.id)
      : null;

  const openFab = () => {
    showThemedAlert('Додати', undefined, [
      { text: 'Подія', onPress: () => setEditor({ kind: 'event', mode: 'create' }) },
      { text: 'Задача', onPress: () => setEditor({ kind: 'task', mode: 'create' }) },
      {
        text: 'День відпочинку',
        onPress: () => setDayOffModal(dayOffForThis ? 'view' : 'create'),
      },
      { text: 'Скасувати', style: 'cancel' },
    ]);
  };

  const persistDayOff = (d: DayOff) => {
    const payload: DayOff = d.id
      ? d
      : {
          ...d,
          id: createId(),
        };
    void upsertDayOff(payload);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: t.colors.background }]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          paddingTop: t.spacing.sm,
          paddingBottom: insets.bottom + 88,
          paddingHorizontal: t.spacing.md,
        }}
      >
        <View style={styles.top}>
          <Text style={[styles.title, { color: t.colors.text }]}>
            {format(day, 'EEEE, d MMMM', { locale: uk })}
          </Text>
          <Text style={[styles.dateDmY, { color: t.colors.muted }]}>
            {calendarKeyToDisplay(dateKey)}
          </Text>
          {checkIn ? (
            <Text style={[styles.checkInHint, { color: t.colors.muted }]}>
              Настрій: {checkIn.mood}
              {checkIn.reflection ? ` · ${checkIn.reflection}` : ''}
            </Text>
          ) : null}
          <Pressable onPress={() => setCheckInOpen(true)} style={styles.checkInBtn}>
            <Text style={{ color: t.colors.accent, fontWeight: '700' }}>
              Вечірній чек-ін / настрій
            </Text>
          </Pressable>
        </View>

        {dayOffForThis ? (
          <Card style={{ marginBottom: t.spacing.sm, borderColor: t.colors.dayOff, borderWidth: 1 }}>
            <Text style={{ color: t.colors.text, fontWeight: '700' }}>День відпочинку</Text>
            {dayOffForThis.comment ? (
              <Text style={{ color: t.colors.muted, marginTop: 4 }}>{dayOffForThis.comment}</Text>
            ) : null}
            <Pressable onPress={() => setDayOffModal('view')}>
              <Text style={{ color: t.colors.accent, marginTop: 8 }}>Відкрити</Text>
            </Pressable>
          </Card>
        ) : null}

        {dayChallenges.length > 0 ? (
          <>
            <Text style={[styles.section, { color: t.colors.muted }]}>Челенджі</Text>
            {dayChallenges.map((c) => {
              const done = challengesState.completions.some(
                (x) => x.challengeId === c.id && x.dateKey === dateKey,
              );
              const streak = challengesState.streaks[c.id];
              return (
                <Pressable
                  key={c.id}
                  onPress={() => void toggleChallengeCompletion(c.id, dateKey)}
                  style={[
                    styles.chRow,
                    { borderColor: t.colors.border, backgroundColor: t.colors.card },
                  ]}
                >
                  <Text style={{ fontSize: 20 }}>{done ? '☑' : '☐'}</Text>
                  <View style={styles.chBody}>
                    <Text style={[styles.cardTitle, { color: t.colors.text }]}>{c.name}</Text>
                    <Text style={[styles.cardMeta, { color: t.colors.muted }]}>
                      Серія: {streak?.current ?? 0} · Рекорд: {streak?.best ?? 0}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </>
        ) : null}

        <Text style={[styles.section, { color: t.colors.muted }]}>Події</Text>
        {dayEvents.length === 0 ? (
          <Text style={[styles.empty, { color: t.colors.muted }]}>Немає подій на цей день</Text>
        ) : null}
        {dayEvents.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setEditor({ kind: 'event', mode: 'view', id: item.id })}
          >
            <Card style={styles.card}>
              <Text style={[styles.cardTitle, { color: t.colors.text }]}>{item.title}</Text>
              <Text style={[styles.cardMeta, { color: t.colors.muted }]}>
                {format(parseISO(item.startTime), 'HH:mm')} —{' '}
                {format(parseISO(item.endTime), 'HH:mm')}
              </Text>
              <Text style={[styles.cardMeta, { color: t.colors.muted }]} numberOfLines={1}>
                {projects.find((p) => p.id === item.projectId)?.name ?? 'Проєкт'}
              </Text>
            </Card>
          </Pressable>
        ))}

        <Text style={[styles.section, { color: t.colors.muted }]}>Задачі</Text>
        {dayTasks.length === 0 ? (
          <Text style={[styles.empty, { color: t.colors.muted }]}>Немає задач на цей день</Text>
        ) : null}
        {dayTasks.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setEditor({ kind: 'task', mode: 'view', id: item.id })}
          >
            <Card style={styles.card}>
              <Text style={[styles.cardTitle, { color: t.colors.text }]}>{item.title}</Text>
              <Text style={[styles.cardMeta, { color: t.colors.muted }]}>
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
        onSave={async (evt) => {
          if (editor?.kind !== 'event') return;
          const synced = await syncEventReminder(evt);
          if (editor.mode === 'create') {
            const { id: _i, ...rest } = synced;
            void addEvent(rest);
          } else if (synced.id) {
            void upsertEvent(synced);
          }
        }}
        onDelete={async (id) => {
          const ev = events.find((e) => e.id === id);
          if (ev) await cancelEventReminder(ev);
          void removeEvent(id);
        }}
      />

      <TaskEditorModal
        visible={editor?.kind === 'task'}
        mode={editor?.kind === 'task' ? editor.mode : 'create'}
        dateKey={dateKey}
        initial={selectedTask ?? null}
        projectIds={projectOptions}
        taskTypes={activeTaskTypes}
        onClose={() => setEditor(null)}
        onRequestEdit={() =>
          editor?.kind === 'task' && editor.id
            ? setEditor({ kind: 'task', mode: 'edit', id: editor.id })
            : undefined
        }
        onSave={(task: Task) => {
          if (editor?.kind !== 'task') return;
          if (editor.mode === 'create') {
            const { id: _i, ...rest } = task;
            void addTask(rest);
          } else if (task.id) {
            void upsertTask(task);
          }
        }}
        onDelete={(id) => void removeTask(id)}
      />

      <DayOffEditorModal
        visible={dayOffModal !== null}
        mode={dayOffModal ?? 'create'}
        dateKey={dateKey}
        initial={dayOffForThis ?? null}
        onClose={() => setDayOffModal(null)}
        onRequestEdit={() => setDayOffModal('edit')}
        onSave={persistDayOff}
        onDelete={(id) => void removeDayOff(id)}
      />

      <EveningCheckInModal
        visible={checkInOpen}
        dateKey={dateKey}
        initial={checkIn ?? null}
        onClose={() => setCheckInOpen(false)}
        onSave={(m) => void upsertMoodLog(m)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  screen: { flex: 1 },
  top: { marginBottom: 12 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  dateDmY: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  checkInHint: { marginTop: 8, fontSize: 14 },
  checkInBtn: { marginTop: 8, paddingVertical: 6 },
  section: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  card: { marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardMeta: { marginTop: 4, fontSize: 13 },
  empty: { fontSize: 14, marginBottom: 8 },
  chRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  chBody: { flex: 1 },
});
