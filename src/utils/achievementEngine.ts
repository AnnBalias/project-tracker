import { ACHIEVEMENT_THRESHOLDS } from '../constants/achievements';
import type { FocusSession, Task, Transaction } from '../types';
import { levelFromTotalXp } from './levels';

export function collectNewAchievementIds(
  unlocked: Set<string>,
  snapshot: {
    totalXp: number;
    focusHoursTotal: number;
    globalStreak: number;
    tasksDone: number;
    incomeTotal: number;
    hadIncome: boolean;
  },
): string[] {
  const out: string[] = [];

  const { level } = levelFromTotalXp(snapshot.totalXp);
  for (const n of ACHIEVEMENT_THRESHOLDS.level) {
    const id = `level_${n}`;
    if (!unlocked.has(id) && level >= n) out.push(id);
  }

  for (const h of ACHIEVEMENT_THRESHOLDS.focusHours) {
    const id = `focus_${h}`;
    if (!unlocked.has(id) && snapshot.focusHoursTotal >= h) out.push(id);
  }

  for (const n of ACHIEVEMENT_THRESHOLDS.streak) {
    const id = `streak_${n}`;
    if (!unlocked.has(id) && snapshot.globalStreak >= n) out.push(id);
  }

  for (const n of ACHIEVEMENT_THRESHOLDS.tasks) {
    const id = `tasks_${n}`;
    if (!unlocked.has(id) && snapshot.tasksDone >= n) out.push(id);
  }

  for (let i = 0; i < ACHIEVEMENT_THRESHOLDS.income.length; i++) {
    const n = ACHIEVEMENT_THRESHOLDS.income[i];
    const id = `income_${n}`;
    if (unlocked.has(id)) continue;
    if (i === 0) {
      if (snapshot.hadIncome) out.push(id);
    } else if (snapshot.incomeTotal >= n) {
      out.push(id);
    }
  }

  return out;
}

export function totalFocusHours(sessions: FocusSession[]): number {
  return sessions.reduce((a, s) => a + s.durationSeconds / 3600, 0);
}

export function countDoneTasks(tasks: Task[]): number {
  return tasks.filter((t) => t.status === 'done').length;
}

export function totalIncomeAmount(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'income')
    .reduce((a, t) => a + t.amount, 0);
}
