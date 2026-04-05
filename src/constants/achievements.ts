export type AchievementDef = {
  id: string;
  title: string;
  description: string;
  category: 'level' | 'focus' | 'streak' | 'tasks' | 'income';
};

export const ACHIEVEMENT_THRESHOLDS = {
  level: [10, 25, 50, 100, 250, 500, 1000],
  focusHours: [24, 24 * 7, 24 * 30, 24 * 365, 24 * 365 * 2, 24 * 365 * 3],
  streak: [10, 25, 50, 100, 250, 500, 1000],
  tasks: [1, 10, 100, 1000, 10000],
  income: [1, 1000, 10000, 100000, 1000000],
} as const;

function levelIds(): AchievementDef[] {
  return ACHIEVEMENT_THRESHOLDS.level.map((n) => ({
    id: `level_${n}`,
    title: `Рівень ${n}`,
    description: `Досягни рівня ${n}`,
    category: 'level',
  }));
}

function focusIds(): AchievementDef[] {
  const labels = ['24 год', 'тиждень', 'місяць', 'рік', '2 роки', '3 роки'];
  return ACHIEVEMENT_THRESHOLDS.focusHours.map((h, i) => ({
    id: `focus_${h}`,
    title: `Фокус: ${labels[i] ?? `${h} год`}`,
    description: `Накопичено ${h} год фокусу`,
    category: 'focus',
  }));
}

function streakIds(): AchievementDef[] {
  return ACHIEVEMENT_THRESHOLDS.streak.map((n) => ({
    id: `streak_${n}`,
    title: `Серія ${n} днів`,
    description: `Глобальна серія ${n} днів`,
    category: 'streak',
  }));
}

function tasksIds(): AchievementDef[] {
  return ACHIEVEMENT_THRESHOLDS.tasks.map((n) => ({
    id: `tasks_${n}`,
    title: `${n} задач`,
    description: `Завершено ${n} задач`,
    category: 'tasks',
  }));
}

function incomeIds(): AchievementDef[] {
  return ACHIEVEMENT_THRESHOLDS.income.map((n, i) => ({
    id: `income_${n}`,
    title: i === 0 ? 'Перший дохід' : `Доходи ${n}`,
    description: i === 0 ? 'Перший запис доходу' : `Сумарний дохід від ${n}`,
    category: 'income',
  }));
}

export const ALL_ACHIEVEMENTS: AchievementDef[] = [
  ...levelIds(),
  ...focusIds(),
  ...streakIds(),
  ...tasksIds(),
  ...incomeIds(),
];

export function achievementById(id: string): AchievementDef | undefined {
  return ALL_ACHIEVEMENTS.find((a) => a.id === id);
}
