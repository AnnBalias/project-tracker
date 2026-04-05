import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useFocusTimer } from '../store/FocusContext';
import { useAppTheme } from '../store/ThemeContext';
import { useAppData } from '../store/AppDataContext';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { Button } from '../components/Button';
import { showThemedAlert } from '../components/themedAlert';
import { Card } from '../components/Card';
import {
  focusSecondsOnDateKey,
  MIN_FOCUS_SECONDS_FOR_SESSION,
} from '../utils/migrations';
import { formatDateKey } from '../utils/dateTime';
import { subDays } from 'date-fns';

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function FocusScreen() {
  const t = useAppTheme();
  const { width } = useWindowDimensions();
  const { activeProjects } = useProjects();
  const { tasks } = useTasks();
  const { focusSessions, appendFocusSessionFromTimer } = useAppData();
  const timer = useFocusTimer();

  const [projectId, setProjectId] = useState(() => activeProjects[0]?.id ?? '');
  const [taskId, setTaskId] = useState<string | null>(null);

  const projectTasks = useMemo(
    () =>
      projectId ? tasks.filter((x) => x.projectId === projectId && x.status !== 'done') : [],
    [tasks, projectId],
  );

  const taskLabel = (id: string | null) => {
    if (!id) return 'Без задачі';
    const tk = tasks.find((x) => x.id === id);
    return tk?.title ?? 'Задача';
  };

  const chartWidth = Math.min(width - t.spacing.md * 2, 360);

  const { labels, data } = useMemo(() => {
    const today = new Date();
    const days = 7;
    const lbl: string[] = [];
    const vals: number[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(today, i);
      const key = formatDateKey(d);
      lbl.push(String(d.getDate()));
      const sec = focusSecondsOnDateKey(focusSessions, key);
      const min = sec / 60;
      vals.push(Math.round(min * 10) / 10);
    }
    return { labels: lbl, data: vals };
  }, [focusSessions]);

  const chartConfig = {
    backgroundGradientFrom: t.colors.card,
    backgroundGradientTo: t.colors.card,
    color: () => t.colors.focusHeat,
    labelColor: () => t.colors.muted,
    barPercentage: 0.65,
    propsForLabels: { fontSize: 11 },
  };

  const onStop = () => {
    if (timer.elapsedSeconds < MIN_FOCUS_SECONDS_FOR_SESSION) {
      showThemedAlert(
        'Фокус',
        'Щоб зберегти сесію, потрібно накопичити мінімум 1 годину. Продовжіть таймер і зупиніть пізніше.',
      );
      return;
    }
    const finalized = timer.stop();
    if (finalized) void appendFocusSessionFromTimer(finalized);
  };

  const ensureBinding = () => {
    if (projectId && (timer.projectId !== projectId || timer.taskId !== taskId)) {
      timer.setTaskAndProject(taskId, projectId);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.background }}
      contentContainerStyle={{ padding: t.spacing.md, paddingBottom: 40 }}
    >
      <Card style={{ marginBottom: t.spacing.md }}>
        <Text style={[styles.section, { color: t.colors.muted }]}>Проєкт і задача</Text>
        <View style={styles.chips}>
          {activeProjects.map((p) => {
            const on = projectId === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => {
                  setProjectId(p.id);
                  setTaskId(null);
                  timer.setTaskAndProject(null, p.id);
                }}
                style={[
                  styles.chip,
                  { borderColor: t.colors.border, backgroundColor: t.colors.background },
                  on && { borderColor: t.colors.accent, backgroundColor: t.dark ? '#1e3a5f' : '#EFF6FF' },
                ]}
              >
                <Text style={[styles.chipTxt, { color: t.colors.text }, on && { color: t.colors.accent }]}>
                  {p.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {projectTasks.length ? (
          <>
            <Text style={[styles.hint, { color: t.colors.muted }]}>Задача (необов’язково)</Text>
            <Pressable
              onPress={() => {
                ensureBinding();
                setTaskId(null);
                timer.setTaskAndProject(null, projectId);
              }}
              style={styles.taskRow}
            >
              <Text style={{ color: taskId === null ? t.colors.accent : t.colors.muted }}>— без задачі</Text>
            </Pressable>
            {projectTasks.map((tk) => (
              <Pressable
                key={tk.id}
                onPress={() => {
                  setTaskId(tk.id);
                  timer.setTaskAndProject(tk.id, projectId);
                }}
                style={styles.taskRow}
              >
                <Text
                  style={{ color: taskId === tk.id ? t.colors.accent : t.colors.text }}
                  numberOfLines={1}
                >
                  {tk.title}
                </Text>
              </Pressable>
            ))}
          </>
        ) : null}
      </Card>

      <Card style={{ marginBottom: t.spacing.md, alignItems: 'center' }}>
        <Text style={[styles.timer, { color: t.colors.text }]}>{formatElapsed(timer.elapsedSeconds)}</Text>
        <Text style={[styles.xp, { color: t.colors.accent }]}>+{timer.sessionXpPreview.toFixed(1)} XP (попередньо)</Text>
        <Text style={[styles.bind, { color: t.colors.muted }]}>
          {activeProjects.find((p) => p.id === timer.projectId)?.name ?? 'Оберіть проєкт'} ·{' '}
          {taskLabel(timer.taskId)}
        </Text>
        <View style={styles.row}>
          {!timer.isRunning && timer.elapsedSeconds === 0 ? (
            <Button
              title="Старт"
              style={styles.btn}
              onPress={() => {
                if (!projectId) return;
                ensureBinding();
                timer.start();
              }}
            />
          ) : null}
          {timer.isRunning ? (
            <Button title="Пауза" variant="secondary" style={styles.btn} onPress={() => timer.pause()} />
          ) : null}
          {!timer.isRunning && timer.elapsedSeconds > 0 ? (
            <Button title="Продовжити" style={styles.btn} onPress={() => timer.resume()} />
          ) : null}
          <Button
            title="Стоп і зберегти"
            variant="danger"
            style={styles.btn}
            onPress={onStop}
          />
        </View>
      </Card>

      <Text style={[styles.section, { color: t.colors.muted, marginBottom: t.spacing.sm }]}>
        Фокус за 7 днів (хв)
      </Text>
      <BarChart
        data={{
          labels,
          datasets: [
            {
              data: data.length ? data : [0],
              colors: data.map((min) => {
                const intensity = Math.min(1, min / 120);
                const alpha = intensity > 0.66 ? 1 : intensity > 0.33 ? 0.72 : 0.42;
                return (opacity: number) => {
                  const a = alpha * opacity;
                  return t.dark
                    ? `rgba(167, 139, 250, ${a})`
                    : `rgba(124, 58, 237, ${a})`;
                };
              }),
            },
          ],
        }}
        width={chartWidth}
        height={200}
        chartConfig={chartConfig}
        style={{ borderRadius: t.radius.md, marginBottom: t.spacing.lg }}
        fromZero
        withInnerLines={false}
        withCustomBarColorFromData
        yAxisLabel=""
        yAxisSuffix=""
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  chipTxt: { fontWeight: '600', fontSize: 14 },
  hint: { fontSize: 12, marginTop: 12, marginBottom: 4 },
  taskRow: { paddingVertical: 8 },
  timer: { fontSize: 44, fontVariant: ['tabular-nums'], fontWeight: '800' },
  xp: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  bind: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' },
  btn: { minWidth: 120 },
});
