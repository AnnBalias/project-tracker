import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  addMonths,
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameMonth,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfToday,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import { uk } from 'date-fns/locale';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CalendarStackParamList } from '../navigation/types';
import { useAppTheme } from '../store/ThemeContext';
import { useAppData } from '../store/AppDataContext';
import type { FocusSession, Task } from '../types';
import { useEvents } from '../hooks/useEvents';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { Card } from '../components/Card';
import { SegmentControl } from '../components/SegmentControl';
import { eventOccursOnDay, taskOnDay } from '../utils/calendarHelpers';
import { formatDateKey } from '../utils/dateTime';
import { challengeAppliesOnDay } from '../utils/streaks';
import { BarChart } from 'react-native-chart-kit';
import {
  focusSecondsOnDateKey,
  isProductiveDay,
} from '../utils/migrations';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

type Props = NativeStackScreenProps<CalendarStackParamList, 'CalendarMonth'>;

export function CalendarMonthScreen({ navigation }: Props) {
  const t = useAppTheme();
  const { width: screenW } = useWindowDimensions();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const { events } = useEvents();
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { dayOffs, challengesState, focusSessions, focusGoalMinutes } = useAppData();
  const [weekOffset, setWeekOffset] = useState<0 | 1 | 2 | 3 | 4>(0);

  const today = startOfToday();

  const [innerGridW, setInnerGridW] = useState(0);
  const gridInnerW =
    innerGridW > 0 ? innerGridW : Math.max(100, screenW - t.spacing.md * 2);
  const colW = gridInnerW / 7;
  const cellMinHeight = Math.max(colW * 1.12, 92);

  const gridDays = useMemo(() => {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const projectNameById = useMemo(() => {
    const m = new Map<string, string>();
    projects.forEach((p) => m.set(p.id, p.name));
    return m;
  }, [projects]);

  const dayProjectLabel = useMemo(() => {
    const map = new Map<string, string>();
    for (const day of gridDays) {
      const key = formatDateKey(day);
      const ids = new Set<string>();
      for (const e of events) {
        if (eventOccursOnDay(e, day)) ids.add(e.projectId);
      }
      for (const task of tasks) {
        if (taskOnDay(task, day)) ids.add(task.projectId);
      }
      const names = [...ids]
        .map((id) => projectNameById.get(id))
        .filter(Boolean) as string[];
      let text = '';
      if (names.length === 1) {
        text =
          names[0].length > 16 ? `${names[0].slice(0, 15)}…` : names[0];
      } else if (names.length > 1) {
        const a = names[0].length > 12 ? `${names[0].slice(0, 11)}…` : names[0];
        text = `${a} +${names.length - 1}`;
      }
      map.set(key, text);
    }
    return map;
  }, [gridDays, events, tasks, projectNameById]);

  const goPrev = () => setCursor((d) => startOfMonth(addMonths(d, -1)));
  const goNext = () => setCursor((d) => startOfMonth(addMonths(d, 1)));
  const monthTitleStr = format(cursor, 'LLLL yyyy', { locale: uk });

  const dayOffCountInMonth = useMemo(() => {
    const ms = startOfMonth(cursor);
    const me = endOfMonth(cursor);
    const intv = { start: ms, end: me };
    let n = 0;
    for (const d of dayOffs) {
      const dk = d.date.slice(0, 10);
      const day = startOfDay(new Date(`${dk}T12:00:00`));
      if (isWithinInterval(day, intv)) n += 1;
    }
    return n;
  }, [dayOffs, cursor]);

  const weekTitle = useMemo(() => {
    const d = subWeeks(new Date(), weekOffset);
    const a = startOfWeek(d, { weekStartsOn: 1 });
    const b = addDays(a, 6);
    const fmt = (x: Date) => format(x, 'd MMM', { locale: uk });
    return `${fmt(a)} — ${fmt(b)}`;
  }, [weekOffset]);

  return (
    <View
      style={{ flex: 1, backgroundColor: t.colors.background, padding: t.spacing.md }}
      onLayout={(e) => {
        const { width } = e.nativeEvent.layout;
        setInnerGridW(Math.max(0, width - t.spacing.md * 2));
      }}
    >
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.monthNav}>
        <Pressable onPress={goPrev} hitSlop={12} style={styles.navBtn}>
          <Text style={[styles.navTxt, { color: t.colors.accent }]}>‹</Text>
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.monthTitle, { color: t.colors.text }]}>{monthTitleStr}</Text>
          <Text style={{ fontSize: 13, color: t.colors.muted, marginTop: 4 }}>
            Дні відпочинку в місяці: {dayOffCountInMonth}
          </Text>
        </View>
        <Pressable onPress={goNext} hitSlop={12} style={styles.navBtn}>
          <Text style={[styles.navTxt, { color: t.colors.accent }]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekHeader}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={[styles.weekHeadCell, { width: colW, color: t.colors.muted }]}>
            {w}
          </Text>
        ))}
      </View>

      <View style={[styles.grid, { width: gridInnerW }]}>
        {gridDays.map((day) => {
          const inMonth = isSameMonth(day, cursor);
          const past = isBefore(startOfDay(day), today);
          const key = formatDateKey(day);
          const ev = events.some((e) => eventOccursOnDay(e, day));
          const tk = tasks.some((task) => taskOnDay(task, day));
          const projLine = dayProjectLabel.get(key) ?? '';
          const isDayOff = dayOffs.some((d) => d.date.slice(0, 10) === key);
          const ch = challengesState.challenges.some(
            (c) => !c.archived && challengeAppliesOnDay(c, day),
          );
          const focusSec = focusSecondsOnDateKey(focusSessions, key);
          const hasFocus = focusSec / 60 >= focusGoalMinutes;

          return (
            <Pressable
              key={key}
              onPress={() => navigation.navigate('CalendarDay', { dateKey: key })}
              style={[
                styles.cell,
                {
                  width: colW,
                  minHeight: cellMinHeight,
                  borderColor: t.colors.border,
                  backgroundColor: isDayOff ? `${t.colors.dayOff}33` : t.colors.card,
                },
                isDayOff && { borderWidth: 1.5, borderColor: t.colors.dayOff },
                !inMonth && {
                  backgroundColor: t.dark ? t.colors.background : '#ECEFF4',
                },
                past && styles.cellPast,
              ]}
            >
              <Text
                style={[
                  styles.dayNum,
                  { color: t.colors.text },
                  !inMonth && { color: t.colors.muted },
                  past && { color: t.colors.dimmedDay },
                ]}
              >
                {format(day, 'd')}
              </Text>
              <View style={styles.dots}>
                {ev ? (
                  <View style={[styles.dot, { backgroundColor: t.colors.event }]} />
                ) : null}
                {tk ? (
                  <View style={[styles.dot, { backgroundColor: t.colors.task }]} />
                ) : null}
                {ch ? (
                  <View style={[styles.dot, { backgroundColor: t.colors.challenge }]} />
                ) : null}
                {hasFocus ? (
                  <View style={[styles.dot, { backgroundColor: t.colors.focusHeat }]} />
                ) : null}
              </View>
              {projLine ? (
                <Text style={[styles.projectLine, { color: t.colors.muted }]} numberOfLines={2}>
                  {projLine}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: t.colors.event }]} />
          <Text style={[styles.legendText, { color: t.colors.muted }]}>Подія</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: t.colors.task }]} />
          <Text style={[styles.legendText, { color: t.colors.muted }]}>Задача</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: t.colors.challenge }]} />
          <Text style={[styles.legendText, { color: t.colors.muted }]}>Челендж</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: t.colors.focusHeat }]} />
          <Text style={[styles.legendText, { color: t.colors.muted }]}>
            Фокус {focusGoalMinutes}+ хв
          </Text>
        </View>
        <View style={styles.legendRow}>
          <Text style={[styles.legendText, { color: t.colors.muted }]}>Нижче — проєкт(и)</Text>
        </View>
      </View>

      <View style={{ marginTop: t.spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: t.colors.text }}>
            Обсяг роботи за тиждень
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: t.colors.muted }}>
            {weekTitle}
          </Text>
        </View>

        <View style={{ marginTop: 10 }}>
          <SegmentControl
            items={[
              { key: '0', label: 'Цей' },
              { key: '1', label: '−1' },
              { key: '2', label: '−2' },
              { key: '3', label: '−3' },
              { key: '4', label: '−4' },
            ]}
            value={String(weekOffset) as '0' | '1' | '2' | '3' | '4'}
            onChange={(k) => setWeekOffset(parseInt(k, 10) as 0 | 1 | 2 | 3 | 4)}
          />
        </View>

        <WeeklyWorkDashboard
          weekOffset={weekOffset}
          focusGoalMinutes={focusGoalMinutes}
          focusSessions={focusSessions}
          tasks={tasks}
        />
      </View>
    </ScrollView>
    </View>
  );
}

function WeeklyWorkDashboard({
  weekOffset,
  focusGoalMinutes,
  focusSessions,
  tasks,
}: {
  weekOffset: 0 | 1 | 2 | 3 | 4;
  focusGoalMinutes: number;
  focusSessions: FocusSession[];
  tasks: Task[];
}) {
  const t = useAppTheme();
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - t.spacing.md * 2, 360);

  const { labels, focusMin, doneTasks, productiveDays, totalFocusMin, totalDone } = useMemo(() => {
    const base = subWeeks(startOfDay(new Date()), weekOffset);
    const weekStart = startOfWeek(base, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const labels: string[] = [];
    const focusMin: number[] = [];
    const doneTasks: number[] = [];
    let productiveDays = 0;
    let totalFocusSec = 0;
    let totalDone = 0;

    for (const d of days) {
      const key = formatDateKey(d);
      labels.push(String(d.getDate()));

      const sec = focusSecondsOnDateKey(focusSessions, key);
      totalFocusSec += sec;
      focusMin.push(Math.round((sec / 60) * 10) / 10);

      const done = tasks.filter((t) => t.status === 'done' && t.completedDateKey === key).length;
      doneTasks.push(done);
      totalDone += done;

      if (isProductiveDay(key, focusSessions, tasks, focusGoalMinutes)) productiveDays += 1;
    }

    return {
      labels,
      focusMin,
      doneTasks,
      productiveDays,
      totalFocusMin: Math.round((totalFocusSec / 60) * 10) / 10,
      totalDone,
    };
  }, [focusGoalMinutes, focusSessions, tasks, weekOffset]);

  const chartConfig = useMemo(
    () => ({
      backgroundGradientFrom: t.colors.card,
      backgroundGradientTo: t.colors.card,
      color: () => t.colors.accent,
      labelColor: () => t.colors.muted,
      barPercentage: 0.65,
      propsForLabels: { fontSize: 11 },
    }),
    [t],
  );

  return (
    <View style={{ marginTop: 12 }}>
      <Card style={{ marginBottom: t.spacing.md }}>
        <Text style={{ color: t.colors.muted, fontWeight: '800', fontSize: 13 }}>
          Підсумок
        </Text>
        <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 18, marginTop: 6 }}>
          {totalFocusMin} хв фокусу · {totalDone} завершених задач
        </Text>
        <Text style={{ color: t.colors.muted, marginTop: 6, lineHeight: 20 }}>
          Продуктивних днів: {productiveDays}/7 (ціль фокусу: {focusGoalMinutes} хв/день).
        </Text>
        <Text style={{ color: t.colors.muted, marginTop: 8, lineHeight: 20 }}>
          Це допомагає бачити прогрес і не знецінювати свою роботу — маленькі кроки додаються до великого результату.
        </Text>
      </Card>

      <Text style={{ color: t.colors.muted, fontWeight: '800', fontSize: 13, marginBottom: 8 }}>
        Концентрація (хв/день)
      </Text>
      <BarChart
        data={{ labels, datasets: [{ data: focusMin.length ? focusMin : [0] }] }}
        width={chartWidth}
        height={200}
        chartConfig={{ ...chartConfig, color: () => t.colors.focusHeat }}
        style={{ borderRadius: t.radius.md, marginBottom: t.spacing.md }}
        fromZero
        withInnerLines={false}
        yAxisLabel=""
        yAxisSuffix=""
      />

      <Text style={{ color: t.colors.muted, fontWeight: '800', fontSize: 13, marginBottom: 8 }}>
        Обсяг роботи (завершені задачі/день)
      </Text>
      <BarChart
        data={{
          labels,
          datasets: [{ data: doneTasks.length ? doneTasks : [0] }],
        }}
        width={chartWidth}
        height={200}
        chartConfig={{ ...chartConfig, color: () => t.colors.task }}
        style={{ borderRadius: t.radius.md, marginBottom: t.spacing.md }}
        fromZero
        withInnerLines={false}
        yAxisLabel=""
        yAxisSuffix=""
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 32 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: { padding: 8, minWidth: 44, alignItems: 'center' },
  navTxt: { fontSize: 28, fontWeight: '300' },
  monthTitle: {
    fontSize: 20,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  weekHeader: { flexDirection: 'row', marginBottom: 4 },
  weekHeadCell: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 4,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    borderWidth: 0.5,
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  cellPast: { opacity: 0.55 },
  dayNum: { fontSize: 17, fontWeight: '700' },
  dim: {},
  dimPast: {},
  dots: { flexDirection: 'row', gap: 3, marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotEvent: {},
  dotTask: {},
  projectLine: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendText: { fontSize: 13 },
});
