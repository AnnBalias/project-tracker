import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import {
  addMonths,
  format,
  parseISO,
  startOfMonth,
} from 'date-fns';
import { uk } from 'date-fns/locale';
import { theme } from '../theme/theme';
import { SegmentControl } from '../components/SegmentControl';
import { useFinance } from '../hooks/useFinance';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';

type TopTab = 'tasks' | 'finance';

function monthKey(iso: string): string {
  try {
    return format(parseISO(iso), 'yyyy-MM');
  } catch {
    return '';
  }
}

export function AnalyticsScreen() {
  const { tasks } = useTasks();
  const { transactions } = useFinance();
  const { projects, expenseCategories } = useProjects();
  const [top, setTop] = useState<TopTab>('tasks');
  const [finKind, setFinKind] = useState<'income' | 'expense'>('income');
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const monthLabel = format(month, 'LLLL yyyy', { locale: uk });
  const selKey = format(month, 'yyyy-MM');

  const filteredTx = useMemo(
    () =>
      transactions.filter(
        (t) => t.type === finKind && monthKey(t.date) === selKey,
      ),
    [transactions, finKind, selKey],
  );

  const taskChartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) {
      map.set(t.projectId, (map.get(t.projectId) ?? 0) + 1);
    }
    return [...map.entries()]
      .filter(([, n]) => n > 0)
      .map(([projectId, population]) => {
        const p = projects.find((x) => x.id === projectId);
        return {
          name: p?.name ?? projectId,
          population,
          color: p?.color ?? theme.colors.muted,
          legendFontColor: theme.colors.text,
          legendFontSize: 12,
        };
      });
  }, [tasks, projects]);

  const financeChartData = useMemo(() => {
    if (finKind === 'income') {
      const map = new Map<string, { amount: number; color: string }>();
      for (const t of filteredTx) {
        const key = t.projectId
          ? (projects.find((p) => p.id === t.projectId)?.name ?? 'Проєкт')
          : 'Інше';
        const color = t.projectId
          ? projects.find((p) => p.id === t.projectId)?.color ?? theme.colors.accent
          : theme.colors.muted;
        const prev = map.get(key);
        map.set(key, {
          amount: (prev?.amount ?? 0) + t.amount,
          color: prev?.color ?? color,
        });
      }
      return [...map.entries()].map(([name, { amount, color }]) => ({
        name: `${name} (${amount.toFixed(2)})`,
        population: Math.max(amount, 0.01),
        color,
        legendFontColor: theme.colors.text,
        legendFontSize: 12,
      }));
    }
    const map = new Map<string, { amount: number; color: string }>();
    for (const t of filteredTx) {
      const c = expenseCategories.find((x) => x.id === t.categoryId);
      const key = c?.name ?? 'Без категорії';
      const color = c?.color ?? theme.colors.danger;
      const prev = map.get(key);
      map.set(key, {
        amount: (prev?.amount ?? 0) + t.amount,
        color: prev?.color ?? color,
      });
    }
    return [...map.entries()].map(([name, { amount, color }]) => ({
      name: `${name} (${amount.toFixed(2)})`,
      population: Math.max(amount, 0.01),
      color,
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    }));
  }, [filteredTx, finKind, projects, expenseCategories]);

  const w = Dimensions.get('window').width - theme.spacing.md * 2;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.heading}>Аналітика</Text>

      <SegmentControl<TopTab>
        items={[
          { key: 'tasks', label: 'Задачі' },
          { key: 'finance', label: 'Фінанси' },
        ]}
        value={top}
        onChange={setTop}
      />

      {top === 'tasks' ? (
        <>
          <Text style={styles.sub}>Задачі за проєктами</Text>
          {taskChartData.length === 0 ? (
            <Text style={styles.empty}>Немає даних для діаграми</Text>
          ) : (
            <PieChart
              data={taskChartData}
              width={w}
              height={220}
              chartConfig={{
                color: () => theme.colors.text,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0"
              absolute
            />
          )}
        </>
      ) : (
        <>
          <View style={styles.monthRow}>
            <Pressable onPress={() => setMonth((m) => addMonths(m, -1))} style={styles.nav}>
              <Text style={styles.navTxt}>‹</Text>
            </Pressable>
            <Text style={styles.monthTitle}>{monthLabel}</Text>
            <Pressable onPress={() => setMonth((m) => addMonths(m, 1))} style={styles.nav}>
              <Text style={styles.navTxt}>›</Text>
            </Pressable>
          </View>

          <SegmentControl<'income' | 'expense'>
            items={[
              { key: 'income', label: 'Доходи' },
              { key: 'expense', label: 'Витрати' },
            ]}
            value={finKind}
            onChange={setFinKind}
          />

          <Text style={styles.sub}>
            {finKind === 'income' ? 'За проєктами' : 'За категоріями'}
          </Text>

          {financeChartData.length === 0 ? (
            <Text style={styles.empty}>Немає операцій за цей місяць</Text>
          ) : (
            <PieChart
              data={financeChartData}
              width={w}
              height={240}
              chartConfig={{
                color: () => theme.colors.text,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0"
              absolute
            />
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl * 2 },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  sub: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.muted,
  },
  empty: { color: theme.colors.muted, marginTop: theme.spacing.md },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  nav: { padding: theme.spacing.sm, minWidth: 40, alignItems: 'center' },
  navTxt: { fontSize: 24, color: theme.colors.accent },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
});
