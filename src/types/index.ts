export type TaskStatus = 'planned' | 'in_progress' | 'done' | 'canceled' | 'moved';

export type TransactionType = 'income' | 'expense';

export type WeekdayShort = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface Project {
  id: string;
  name: string;
  color: string;
  position: string;
  startDate: string;
  /** Дата завершення (ISO); якщо задана разом із archived — проєкт у архіві */
  endDate?: string;
  /** Проєкти в архіві показуються окремим списком у профілі */
  archived?: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
}

export interface Profile {
  projects: Project[];
  expenseCategories: ExpenseCategory[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  projectId: string;
  repeat?: WeekdayShort[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  projectId: string;
  status: TaskStatus;
  movedToDate?: string;
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

export type ModalMode = 'create' | 'view' | 'edit';
