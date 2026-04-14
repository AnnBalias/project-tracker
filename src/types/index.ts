export type TaskStatus = 'planned' | 'in_progress' | 'done' | 'canceled' | 'moved';
export type TaskStage = 'planned' | 'in_progress' | 'review' | 'testing' | 'done';

export type TransactionType = 'income' | 'expense';

export type WeekdayShort = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskType {
  id: string;
  name: string;
  color: string;
  archived?: boolean;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  position: string;
  startDate: string;
  endDate?: string;
  archived?: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  archived?: boolean;
}

export interface Profile {
  projects: Project[];
  expenseCategories: ExpenseCategory[];
  taskTypes: TaskType[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  projectId: string;
  repeat?: WeekdayShort[];
  /** Nudge on device (notification id stored after schedule) */
  reminderNotificationId?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  status: TaskStatus;
  movedToDate?: string;
  typeId: string | null;
  number: number;
  priority: TaskPriority;
  stage: TaskStage;
  startDate: string;
  endDate: string;
  /** Календарний день завершення (yyyy-MM-dd), коли статус став done */
  completedDateKey?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  projectId: string | null;
  categoryId: string | null;
  details: string;
  date: string;
}

export interface Challenge {
  id: string;
  name: string;
  /** null — без прив’язки до проєкту */
  projectId: string | null;
  startDate: string;
  endDate: string;
  weekdays: WeekdayShort[];
  archived?: boolean;
}

export interface ChallengeCompletion {
  challengeId: string;
  dateKey: string;
}

export interface ChallengeStreakMeta {
  current: number;
  best: number;
  lastDateKey?: string;
}

export interface ChallengesState {
  challenges: Challenge[];
  completions: ChallengeCompletion[];
  streaks: Record<string, ChallengeStreakMeta>;
}

export interface DayOff {
  id: string;
  date: string;
  comment: string;
}

export interface Note {
  id: string;
  title: string;
  /** null — без прив’язки до проєкту */
  projectId: string | null;
  description: string;
}

export interface DailyCheckIn {
  dateKey: string;
  mood: string;
  reflection?: string;
}

export interface FocusSession {
  id: string;
  taskId: string | null;
  projectId: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  xpEarned: number;
}

export interface GlobalStreakMeta {
  current: number;
  best: number;
  lastProductiveDateKey?: string;
}

export interface AchievementsState {
  unlocked: string[];
  globalStreak?: GlobalStreakMeta;
}

export type ModalMode = 'create' | 'view' | 'edit';
