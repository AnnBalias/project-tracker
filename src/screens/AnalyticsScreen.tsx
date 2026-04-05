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
import { addMonths, format, parseISO, startOfMonth } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useAppTheme } from '../store/ThemeContext';
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
  const t = useAppTheme();
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
        (tx) => tx.type === finKind && monthKey(tx.date) === selKey,
      ),
    [transactions, finKind, selKey],
  );

  const taskChartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const tk of tasks) {
      map.set(tk.projectId, (map.get(tk.projectId) ?? 0) + 1);
    }
    return [...map.entries()]
      .filter(([, n]) => n > 0)
      .map(([projectId, population]) => {
        const p = projects.find((x) => x.id === projectId);
        return {
          name: p?.name ?? projectId,
          population,
          color: p?.color ?? t.colors.muted,
          legendFontColor: t.colors.text,
          legendFontSize: 12,
        };
      });
  }, [tasks, projects, t.colors.muted, t.colors.text]);

  const financeChartData = useMemo(() => {
    if (finKind === 'income') {
      const map = new Map<string, { amount: number; color: string }>();
      for (const tx of filteredTx) {
        const key = tx.projectId
          ? (projects.find((p) => p.id === tx.projectId)?.name ?? 'Проєкт')
          : 'Інше';
        const color = tx.projectId
          ? projects.find((p) => p.id === tx.projectId)?.color ?? t.colors.accent
          : t.colors.muted;
        const prev = map.get(key);
        map.set(key, {
          amount: (prev?.amount ?? 0) + tx.amount,
          color: prev?.color ?? color,
        });
      }
      return [...map.entries()].map(([name, { amount, color }]) => ({
        name: `${name} (${amount.toFixed(2)})`,
        population: Math.max(amount, 0.01),
        color,
        legendFontColor: t.colors.text,
        legendFontSize: 12,
      }));
    }
    const map = new Map<string, { amount: number; color: string }>();
    for (const tx of filteredTx) {
      const c = expenseCategories.find((x) => x.id === tx.categoryId);
      const key = c?.name ?? 'Без категорії';
      const color = c?.color ?? t.colors.danger;
      const prev = map.get(key);
      map.set(key, {
        amount: (prev?.amount ?? 0) + tx.amount,
        color: prev?.color ?? color,
      });
    }
    return [...map.entries()].map(([name, { amount, color }]) => ({
      name: `${name} (${amount.toFixed(2)})`,
      population: Math.max(amount, 0.01),
      color,
      legendFontColor: t.colors.text,
      legendFontSize: 12,
    }));
  }, [filteredTx, finKind, projects, expenseCategories, t.colors]);

  const w = Dimensions.get('window').width - t.spacing.md * 2;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: t.colors.background },
        content: { padding: t.spacing.md, paddingBottom: t.spacing.xl * 2 },
        heading: {
          fontSize: 22,
          fontWeight: '700',
          color: t.colors.text,
          marginBottom: t.spacing.md,
        },
        sub: {
          marginTop: t.spacing.lg,
          marginBottom: t.spacing.sm,
          fontSize: 15,
          fontWeight: '700',
          color: t.colors.muted,
        },
        empty: { color: t.colors.muted, marginTop: t.spacing.md },
        monthRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: t.spacing.lg,
          marginBottom: t.spacing.md,
        },
        nav: { padding: t.spacing.sm, minWidth: 40, alignItems: 'center' },
        navTxt: { fontSize: 24, color: t.colors.accent },
        monthTitle: {
          fontSize: 16,
          fontWeight: '700',
          color: t.colors.text,
          textTransform: 'capitalize',
        },
      }),
    [t],
  );

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
                color: () => t.colors.text,
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
                color: () => t.colors.text,
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
