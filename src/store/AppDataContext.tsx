import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  CalendarEvent,
  ExpenseCategory,
  Profile,
  Project,
  Task,
  Transaction,
} from '../types';
import { readJsonFile, writeJsonFile } from '../services/jsonFileStorage';
import { createId } from '../utils/id';

const emptyProfile: Profile = { projects: [], expenseCategories: [] };

function normalizeProfile(profile: Profile): Profile {
  return {
    ...profile,
    projects: profile.projects.map((p) => ({
      ...p,
      archived: p.archived ?? false,
    })),
  };
}

type AppDataContextValue = {
  profile: Profile;
  events: CalendarEvent[];
  tasks: Task[];
  transactions: Transaction[];
  loading: boolean;
  refresh: () => Promise<void>;
  replaceProfile: (next: Profile) => Promise<void>;
  upsertProject: (project: Project) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  upsertExpenseCategory: (category: ExpenseCategory) => Promise<void>;
  removeExpenseCategory: (id: string) => Promise<void>;
  upsertEvent: (event: CalendarEvent) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
  upsertTask: (task: Task) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  upsertTransaction: (tx: Transaction) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

async function loadAll(): Promise<{
  profile: Profile;
  events: CalendarEvent[];
  tasks: Task[];
  transactions: Transaction[];
}> {
  const [rawProfile, events, tasks, transactions] = await Promise.all([
    readJsonFile<Profile>('profile', emptyProfile),
    readJsonFile<CalendarEvent[]>('events', []),
    readJsonFile<Task[]>('tasks', []),
    readJsonFile<Transaction[]>('transactions', []),
  ]);
  return {
    profile: normalizeProfile(rawProfile),
    events,
    tasks,
    transactions,
  };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await loadAll();
    setProfile(data.profile);
    setEvents(data.events);
    setTasks(data.tasks);
    setTransactions(data.transactions);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const replaceProfile = useCallback(async (next: Profile) => {
    setProfile(next);
    await writeJsonFile('profile', next);
  }, []);

  const upsertProject = useCallback(async (project: Project) => {
    setProfile((prev) => {
      const idx = prev.projects.findIndex((p) => p.id === project.id);
      const projects =
        idx === -1
          ? [...prev.projects, project]
          : prev.projects.map((p) => (p.id === project.id ? project : p));
      const next = { ...prev, projects };
      void writeJsonFile('profile', next);
      return next;
    });
  }, []);

  const removeProject = useCallback(async (id: string) => {
    setProfile((prev) => {
      const next = {
        ...prev,
        projects: prev.projects.filter((p) => p.id !== id),
      };
      void writeJsonFile('profile', next);
      return next;
    });
    setEvents((prev) => {
      const next = prev.filter((e) => e.projectId !== id);
      void writeJsonFile('events', next);
      return next;
    });
    setTasks((prev) => {
      const next = prev.filter((t) => t.projectId !== id);
      void writeJsonFile('tasks', next);
      return next;
    });
    setTransactions((prev) => {
      const next = prev.map((t) =>
        t.projectId === id ? { ...t, projectId: null } : t,
      );
      void writeJsonFile('transactions', next);
      return next;
    });
  }, []);

  const upsertExpenseCategory = useCallback(async (category: ExpenseCategory) => {
    setProfile((prev) => {
      const idx = prev.expenseCategories.findIndex((c) => c.id === category.id);
      const expenseCategories =
        idx === -1
          ? [...prev.expenseCategories, category]
          : prev.expenseCategories.map((c) =>
              c.id === category.id ? category : c,
            );
      const next = { ...prev, expenseCategories };
      void writeJsonFile('profile', next);
      return next;
    });
  }, []);

  const removeExpenseCategory = useCallback(async (id: string) => {
    setProfile((prev) => {
      const next = {
        ...prev,
        expenseCategories: prev.expenseCategories.filter((c) => c.id !== id),
      };
      void writeJsonFile('profile', next);
      return next;
    });
    setTransactions((prev) => {
      const next = prev.map((t) =>
        t.categoryId === id ? { ...t, categoryId: null } : t,
      );
      void writeJsonFile('transactions', next);
      return next;
    });
  }, []);

  const upsertEvent = useCallback(async (event: CalendarEvent) => {
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === event.id);
      const next =
        idx === -1 ? [...prev, event] : prev.map((e) => (e.id === event.id ? event : e));
      void writeJsonFile('events', next);
      return next;
    });
  }, []);

  const removeEvent = useCallback(async (id: string) => {
    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== id);
      void writeJsonFile('events', next);
      return next;
    });
  }, []);

  const upsertTask = useCallback(async (task: Task) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === task.id);
      const next =
        idx === -1 ? [...prev, task] : prev.map((t) => (t.id === task.id ? task : t));
      void writeJsonFile('tasks', next);
      return next;
    });
  }, []);

  const removeTask = useCallback(async (id: string) => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      void writeJsonFile('tasks', next);
      return next;
    });
  }, []);

  const upsertTransaction = useCallback(async (tx: Transaction) => {
    setTransactions((prev) => {
      const idx = prev.findIndex((t) => t.id === tx.id);
      const next =
        idx === -1 ? [...prev, tx] : prev.map((t) => (t.id === tx.id ? tx : t));
      void writeJsonFile('transactions', next);
      return next;
    });
  }, []);

  const removeTransaction = useCallback(async (id: string) => {
    setTransactions((prev) => {
      const next = prev.filter((t) => t.id !== id);
      void writeJsonFile('transactions', next);
      return next;
    });
  }, []);

  const value = useMemo(
    () =>
      ({
        profile,
        events,
        tasks,
        transactions,
        loading,
        refresh,
        replaceProfile,
        upsertProject,
        removeProject,
        upsertExpenseCategory,
        removeExpenseCategory,
        upsertEvent,
        removeEvent,
        upsertTask,
        removeTask,
        upsertTransaction,
        removeTransaction,
      }) satisfies AppDataContextValue,
    [
      profile,
      events,
      tasks,
      transactions,
      loading,
      refresh,
      replaceProfile,
      upsertProject,
      removeProject,
      upsertExpenseCategory,
      removeExpenseCategory,
      upsertEvent,
      removeEvent,
      upsertTask,
      removeTask,
      upsertTransaction,
      removeTransaction,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
