import React, { useEffect, useMemo } from 'react';
import {
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
import { Card } from '../components/Card';
import {
  focusSecondsOnDateKey,
} from '../utils/migrations';
import { formatDateKey } from '../utils/dateTime';
import { subDays } from 'date-fns';
import type { TasksScreenProps } from '../navigation/types';

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function FocusScreen({ route }: TasksScreenProps<'Focus'>) {
  const t = useAppTheme();
  const { width } = useWindowDimensions();
  const { activeProjects } = useProjects();
  const { tasks } = useTasks();
  const { focusSessions, appendFocusSessionFromTimer } = useAppData();
  const timer = useFocusTimer();

  const projectId = route.params.projectId;
  const taskId = route.params.taskId;

  const taskLabel = (id: string | null) => {
    if (!id) return 'Без задачі';
    const tk = tasks.find((x) => x.id === id);
    return tk?.title ?? 'Задача';
  };

  useEffect(() => {
    if (!projectId) return;
    if (timer.projectId !== projectId || timer.taskId !== taskId) {
      timer.setTaskAndProject(taskId, projectId);
    }
  }, [projectId, taskId, timer]);

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
    if (timer.elapsedSeconds <= 0) return;
    const finalized = timer.stop();
    if (finalized) void appendFocusSessionFromTimer(finalized);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.background }}
      contentContainerStyle={{ padding: t.spacing.md, paddingBottom: 40 }}
    >
      <Card style={{ marginBottom: t.spacing.md, alignItems: 'center' }}>
        <Text style={[styles.timer, { color: t.colors.text }]}>{formatElapsed(timer.elapsedSeconds)}</Text>
        <Text style={[styles.xp, { color: t.colors.accent }]}>+{timer.sessionXpPreview.toFixed(1)} XP (попередньо)</Text>
        <Text style={[styles.bind, { color: t.colors.muted }]}>
          {activeProjects.find((p) => p.id === timer.projectId)?.name ?? 'Проєкт'} · {taskLabel(timer.taskId)}
        </Text>
        <View style={styles.row}>
          {!timer.isRunning && timer.elapsedSeconds === 0 ? (
            <Button
              title="Старт"
              style={styles.btn}
              onPress={() => {
                if (!projectId) return;
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
  timer: { fontSize: 44, fontVariant: ['tabular-nums'], fontWeight: '800' },
  xp: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  bind: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' },
  btn: { minWidth: 120 },
});
