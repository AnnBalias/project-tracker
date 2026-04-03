import React, { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from 'date-fns';
import { uk } from 'date-fns/locale';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CalendarStackParamList } from '../navigation/types';
import { theme } from '../theme/theme';
import { useEvents } from '../hooks/useEvents';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { eventOccursOnDay, taskOnDay } from '../utils/calendarHelpers';
import { formatDateKey } from '../utils/dateTime';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

type Props = NativeStackScreenProps<CalendarStackParamList, 'CalendarMonth'>;

export function CalendarMonthScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const { events } = useEvents();
  const { tasks } = useTasks();
  const { projects } = useProjects();

  const today = startOfToday();

  const horizontalPad = theme.spacing.md * 2;
  const gridInnerW = screenW - horizontalPad;
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
      for (const t of tasks) {
        if (taskOnDay(t, day)) ids.add(t.projectId);
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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
    >
      <View style={styles.monthNav}>
        <Pressable onPress={goPrev} hitSlop={12} style={styles.navBtn}>
          <Text style={styles.navTxt}>‹</Text>
        </Pressable>
        <Text style={styles.monthTitle}>{monthTitleStr}</Text>
        <Pressable onPress={goNext} hitSlop={12} style={styles.navBtn}>
          <Text style={styles.navTxt}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekHeader}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={[styles.weekHeadCell, { width: colW }]}>
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
          const tk = tasks.some((t) => taskOnDay(t, day));
          const projLine = dayProjectLabel.get(key) ?? '';

          return (
            <Pressable
              key={key}
              onPress={() => navigation.navigate('CalendarDay', { dateKey: key })}
              style={[
                styles.cell,
                {
                  width: colW,
                  minHeight: cellMinHeight,
                },
                !inMonth && styles.cellOtherMonth,
                past && styles.cellPast,
              ]}
            >
              <Text
                style={[
                  styles.dayNum,
                  !inMonth && styles.dim,
                  past && styles.dimPast,
                ]}
              >
                {format(day, 'd')}
              </Text>
              <View style={styles.dots}>
                {ev ? <View style={[styles.dot, styles.dotEvent]} /> : null}
                {tk ? <View style={[styles.dot, styles.dotTask]} /> : null}
              </View>
              {projLine ? (
                <Text style={styles.projectLine} numberOfLines={2}>
                  {projLine}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.dot, styles.dotEvent]} />
          <Text style={styles.legendText}>Подія</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.dot, styles.dotTask]} />
          <Text style={styles.legendText}>Задача</Text>
        </View>
        <View style={styles.legendRow}>
          <Text style={styles.legendText}>Нижче — проєкт(и)</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  navBtn: { padding: theme.spacing.sm, minWidth: 44, alignItems: 'center' },
  navTxt: { fontSize: 28, color: theme.colors.accent, fontWeight: '300' },
  monthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  weekHeader: { flexDirection: 'row', marginBottom: theme.spacing.xs },
  weekHeadCell: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.muted,
    paddingVertical: theme.spacing.xs,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    borderWidth: 0.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  cellOtherMonth: { backgroundColor: '#ECEFF4' },
  cellPast: { opacity: 0.55 },
  dayNum: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  dim: { color: theme.colors.muted },
  dimPast: { color: theme.colors.dimmedDay },
  dots: { flexDirection: 'row', gap: 3, marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotEvent: { backgroundColor: theme.colors.event },
  dotTask: { backgroundColor: theme.colors.task },
  projectLine: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    color: theme.colors.muted,
    textAlign: 'center',
    width: '100%',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendText: { color: theme.colors.muted, fontSize: 13 },
});
