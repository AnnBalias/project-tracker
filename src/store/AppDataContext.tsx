import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { formatISO } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { levelFromTotalXp } from '../utils/levels';
import type {
  AchievementsState,
  CalendarEvent,
  Challenge,
  ChallengeCompletion,
  ChallengesState,
  DailyCheckIn,
  DayOff,
  ExpenseCategory,
  FocusSession,
  Note,
  Profile,
  Project,
  Task,
  Transaction,
} from '../types';
import { readJsonFile, writeJsonFile } from '../services/jsonFileStorage';
import { createId } from '../utils/id';
import { clearAllPersistedAppData } from '../services/clearAppData';
import {
  MIN_FOCUS_MINUTES_FOR_PRODUCTIVE,
  migrateChallengesState,
  migrateProfile,
  migrateTask,
  migrateNote,
} from '../utils/migrations';
import {
  collectNewAchievementIds,
  countDoneTasks,
  totalFocusHours,
  totalIncomeAmount,
} from '../utils/achievementEngine';
import { totalXpFromSegments } from '../utils/focusXp';
import type { PersistedFocusTimer } from '../services/focusTimerStorage';
import {
  computeCurrentGlobalStreak,
  dayOffKeySet,
  recomputeChallengeStreakFromCompletions,
} from '../utils/streaks';
import { formatDateKey } from '../utils/dateTime';

const emptyProfile: Profile = {
  projects: [],
  expenseCategories: [],
  taskTypes: [],
};

const emptyChallenges: ChallengesState = {
  challenges: [],
  completions: [],
  streaks: {},
};

const emptyAchievements: AchievementsState = {
  unlocked: [],
  globalStreak: { current: 0, best: 0 },
};

type AchievementEvent = {
  type: 'achievement';
  id: string;
} | { type: 'level'; level: number };

type AppDataContextValue = {
  profile: Profile;
  events: CalendarEvent[];
  tasks: Task[];
  transactions: Transaction[];
  challengesState: ChallengesState;
  dayOffs: DayOff[];
  notes: Note[];
  moodLogs: DailyCheckIn[];
  achievementsState: AchievementsState;
  focusSessions: FocusSession[];
  focusGoalMinutes: number;
  setFocusGoalMinutes: (min: number) => Promise<void>;
  loading: boolean;
  refresh: () => Promise<void>;
  rewardQueue: AchievementEvent[];
  consumeReward: () => void;
  replaceProfile: (next: Profile) => Promise<void>;
  upsertProject: (project: Project) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  upsertExpenseCategory: (category: ExpenseCategory) => Promise<void>;
  removeExpenseCategory: (id: string) => Promise<void>;
  upsertTaskType: (t: import('../types').TaskType) => Promise<void>;
  removeTaskType: (id: string) => Promise<void>;
  upsertEvent: (event: CalendarEvent) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
  upsertTask: (task: Task) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  upsertTransaction: (tx: Transaction) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  setChallengesState: (next: ChallengesState) => Promise<void>;
  upsertChallenge: (c: Challenge) => Promise<void>;
  removeChallenge: (id: string) => Promise<void>;
  toggleChallengeCompletion: (challengeId: string, dateKey: string) => Promise<void>;
  upsertDayOff: (d: DayOff) => Promise<void>;
  removeDayOff: (id: string) => Promise<void>;
  upsertNote: (n: Note) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  upsertMoodLog: (m: DailyCheckIn) => Promise<void>;
  removeMoodLog: (dateKey: string) => Promise<void>;
  appendFocusSessionFromTimer: (
    finalized: PersistedFocusTimer,
  ) => Promise<FocusSession | null>;
  removeFocusSession: (id: string) => Promise<void>;
  unlockAchievementsRaw: (ids: string[]) => Promise<void>;
  recomputeGlobalStreak: () => void;
  clearAllUserData: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

const FOCUS_GOAL_KEY = '@project_tracker_focus_goal_minutes';

async function loadAll() {
  const [
    rawProfile,
    events,
    rawTasks,
    transactions,
    rawChallenges,
    dayOffs,
    rawNotes,
    moodLogs,
    rawAchievements,
    focusSessions,
  ] = await Promise.all([
    readJsonFile<Profile>('profile', emptyProfile),
    readJsonFile<CalendarEvent[]>('events', []),
    readJsonFile<unknown[]>('tasks', []),
    readJsonFile<Transaction[]>('transactions', []),
    readJsonFile<unknown>('challenges', {}),
    readJsonFile<DayOff[]>('dayOffs', []),
    readJsonFile<unknown[]>('notes', []),
    readJsonFile<DailyCheckIn[]>('moodLogs', []),
    readJsonFile<AchievementsState>('achievements', emptyAchievements),
    readJsonFile<FocusSession[]>('focusSessions', []),
  ]);

  const profile = migrateProfile(rawProfile);
  const tasks = rawTasks.map((t) =>
    migrateTask(t as Partial<Task> & { id: string }),
  );
  const challengesState = migrateChallengesState(rawChallenges);
  const notes = rawNotes.map((n) =>
    migrateNote(n as Partial<Note> & { id: string }),
  );

  const achievements: AchievementsState = Array.isArray(rawAchievements)
    ? { unlocked: rawAchievements as string[], globalStreak: { current: 0, best: 0 } }
    : {
        unlocked: (rawAchievements as AchievementsState)?.unlocked ?? [],
        globalStreak:
          (rawAchievements as AchievementsState)?.globalStreak ?? {
            current: 0,
            best: 0,
          },
      };

  return {
    profile,
    events,
    tasks,
    transactions,
    challengesState,
    dayOffs,
    notes,
    moodLogs,
    achievementsState: achievements,
    focusSessions,
  };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [challengesState, setChallengesStateInner] = useState<ChallengesState>(emptyChallenges);
  const [dayOffs, setDayOffs] = useState<DayOff[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [moodLogs, setMoodLogs] = useState<DailyCheckIn[]>([]);
  const [achievementsState, setAchievementsState] = useState<AchievementsState>(emptyAchievements);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [focusGoalMinutes, setFocusGoalMinutesState] = useState<number>(
    MIN_FOCUS_MINUTES_FOR_PRODUCTIVE,
  );
  const [loading, setLoading] = useState(true);
  const [rewardQueue, setRewardQueue] = useState<AchievementEvent[]>([]);

  const pushRewards = useCallback((ev: AchievementEvent[]) => {
    if (!ev.length) return;
    setRewardQueue((q) => [...q, ...ev]);
  }, []);

  const consumeReward = useCallback(() => {
    setRewardQueue((q) => q.slice(1));
  }, []);

  const refresh = useCallback(async () => {
    const data = await loadAll();
    setProfile(data.profile);
    setEvents(data.events);
    setTasks(data.tasks);
    setTransactions(data.transactions);
    setChallengesStateInner(data.challengesState);
    setDayOffs(data.dayOffs);
    setNotes(data.notes);
    setMoodLogs(data.moodLogs);
    const todayKey = formatDateKey(new Date());
    const gs = computeCurrentGlobalStreak(
      todayKey,
      dayOffKeySet(data.dayOffs),
      data.focusSessions,
      data.tasks,
      focusGoalMinutes,
    );
    const mergedAch: AchievementsState = {
      ...data.achievementsState,
      globalStreak: {
        current: gs,
        best: Math.max(data.achievementsState.globalStreak?.best ?? 0, gs),
        lastProductiveDateKey: data.achievementsState.globalStreak?.lastProductiveDateKey,
      },
    };
    setAchievementsState(mergedAch);
    setFocusSessions(data.focusSessions);
    await writeJsonFile('achievements', mergedAch);
  }, [focusGoalMinutes]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const raw = await AsyncStorage.getItem(FOCUS_GOAL_KEY);
        const n = raw ? parseInt(raw, 10) : NaN;
        if (!Number.isNaN(n) && n > 0 && n <= 24 * 60) setFocusGoalMinutesState(n);
      } catch {
        // ignore
      }
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  useEffect(() => {
    if (loading) return;
    const todayKey = formatDateKey(new Date());
    const totalXp = focusSessions.reduce((a, s) => a + s.xpEarned, 0);
    const gs = computeCurrentGlobalStreak(
      todayKey,
      dayOffKeySet(dayOffs),
      focusSessions,
      tasks,
      focusGoalMinutes,
    );
    setAchievementsState((ach) => {
      const newIds = collectNewAchievementIds(new Set(ach.unlocked), {
        totalXp,
        focusHoursTotal: totalFocusHours(focusSessions),
        globalStreak: gs,
        tasksDone: countDoneTasks(tasks),
        incomeTotal: totalIncomeAmount(transactions),
        hadIncome: transactions.some((x) => x.type === 'income'),
      });
      const nextGs = {
        current: gs,
        best: Math.max(ach.globalStreak?.best ?? 0, gs),
        lastProductiveDateKey: ach.globalStreak?.lastProductiveDateKey,
      };
      if (!newIds.length) {
        if (
          nextGs.current === ach.globalStreak?.current &&
          nextGs.best === ach.globalStreak?.best
        ) {
          return ach;
        }
        const next = { ...ach, globalStreak: nextGs };
        void writeJsonFile('achievements', next);
        return next;
      }
      const next = {
        unlocked: [...new Set([...ach.unlocked, ...newIds])],
        globalStreak: nextGs,
      };
      void writeJsonFile('achievements', next);
      pushRewards(newIds.map((id) => ({ type: 'achievement' as const, id })));
      return next;
    });
  }, [loading, tasks, transactions, focusSessions, dayOffs, pushRewards]);

  const setFocusGoalMinutes = useCallback(async (min: number) => {
    const next = Math.max(1, Math.min(24 * 60, Math.round(min)));
    setFocusGoalMinutesState(next);
    await AsyncStorage.setItem(FOCUS_GOAL_KEY, String(next));
  }, []);

  const replaceProfile = useCallback(async (next: Profile) => {
    const m = migrateProfile(next);
    setProfile(m);
    await writeJsonFile('profile', m);
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
    setNotes((prev) => {
      const next = prev.map((n) =>
        n.projectId === id ? { ...n, projectId: null } : n,
      );
      void writeJsonFile('notes', next);
      return next;
    });
    setChallengesStateInner((prev) => {
      const next = {
        ...prev,
        challenges: prev.challenges.map((c) =>
          c.projectId === id ? { ...c, projectId: null } : c,
        ),
      };
      void writeJsonFile('challenges', next);
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

  const upsertTaskType = useCallback(async (t: import('../types').TaskType) => {
    setProfile((prev) => {
      const idx = prev.taskTypes.findIndex((x) => x.id === t.id);
      const taskTypes =
        idx === -1
          ? [...prev.taskTypes, t]
          : prev.taskTypes.map((x) => (x.id === t.id ? t : x));
      const next = { ...prev, taskTypes };
      void writeJsonFile('profile', next);
      return next;
    });
  }, []);

  const removeTaskType = useCallback(async (id: string) => {
    setProfile((prev) => {
      const next = {
        ...prev,
        taskTypes: prev.taskTypes.filter((x) => x.id !== id),
      };
      void writeJsonFile('profile', next);
      return next;
    });
    setTasks((prev) => {
      const next = prev.map((task) =>
        task.typeId === id ? { ...task, typeId: null } : task,
      );
      void writeJsonFile('tasks', next);
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

  const setChallengesState = useCallback(async (next: ChallengesState) => {
    setChallengesStateInner(next);
    await writeJsonFile('challenges', next);
  }, []);

  const upsertChallenge = useCallback(async (c: Challenge) => {
    setChallengesStateInner((prev) => {
      const idx = prev.challenges.findIndex((x) => x.id === c.id);
      const challenges =
        idx === -1
          ? [...prev.challenges, c]
          : prev.challenges.map((x) => (x.id === c.id ? c : x));
      const next = { ...prev, challenges };
      void writeJsonFile('challenges', next);
      return next;
    });
  }, []);

  const removeChallenge = useCallback(async (id: string) => {
    setChallengesStateInner((prev) => {
      const next = {
        challenges: prev.challenges.filter((c) => c.id !== id),
        completions: prev.completions.filter((x) => x.challengeId !== id),
        streaks: Object.fromEntries(
          Object.entries(prev.streaks).filter(([k]) => k !== id),
        ),
      };
      void writeJsonFile('challenges', next);
      return next;
    });
  }, []);

  const toggleChallengeCompletion = useCallback(
    async (challengeId: string, dateKey: string) => {
      setChallengesStateInner((prev) => {
        const c = prev.challenges.find((x) => x.id === challengeId);
        if (!c) return prev;
        const dayKeys = dayOffKeySet(dayOffs);
        const exists = prev.completions.some(
          (x) => x.challengeId === challengeId && x.dateKey === dateKey,
        );
        const completions = exists
          ? prev.completions.filter(
              (x) => !(x.challengeId === challengeId && x.dateKey === dateKey),
            )
          : [...prev.completions, { challengeId, dateKey }];
        const rec = recomputeChallengeStreakFromCompletions(c, completions, dayKeys);
        const prevMeta = prev.streaks[challengeId] ?? { current: 0, best: 0 };
        const streaks = {
          ...prev.streaks,
          [challengeId]: {
            current: rec.current,
            best: Math.max(prevMeta.best, rec.current),
            lastDateKey: rec.lastDateKey,
          },
        };
        const next = { ...prev, completions, streaks };
        void writeJsonFile('challenges', next);
        return next;
      });
    },
    [dayOffs],
  );

  const upsertDayOff = useCallback(async (d: DayOff) => {
    setDayOffs((prev) => {
      const idx = prev.findIndex((x) => x.id === d.id);
      const next =
        idx === -1 ? [...prev, d] : prev.map((x) => (x.id === d.id ? d : x));
      void writeJsonFile('dayOffs', next);
      return next;
    });
  }, []);

  const removeDayOff = useCallback(async (id: string) => {
    setDayOffs((prev) => {
      const next = prev.filter((x) => x.id !== id);
      void writeJsonFile('dayOffs', next);
      return next;
    });
  }, []);

  const upsertNote = useCallback(async (n: Note) => {
    setNotes((prev) => {
      const idx = prev.findIndex((x) => x.id === n.id);
      const next = idx === -1 ? [...prev, n] : prev.map((x) => (x.id === n.id ? n : x));
      void writeJsonFile('notes', next);
      return next;
    });
  }, []);

  const removeNote = useCallback(async (id: string) => {
    setNotes((prev) => {
      const next = prev.filter((x) => x.id !== id);
      void writeJsonFile('notes', next);
      return next;
    });
  }, []);

  const upsertMoodLog = useCallback(async (m: DailyCheckIn) => {
    setMoodLogs((prev) => {
      const next = prev.filter((x) => x.dateKey !== m.dateKey);
      next.push(m);
      void writeJsonFile('moodLogs', next);
      return next;
    });
  }, []);

  const removeMoodLog = useCallback(async (dateKey: string) => {
    setMoodLogs((prev) => {
      const next = prev.filter((x) => x.dateKey !== dateKey);
      void writeJsonFile('moodLogs', next);
      return next;
    });
  }, []);

  const appendFocusSessionFromTimer = useCallback(
    async (finalized: PersistedFocusTimer) => {
      const segs = [...finalized.segments];
      const xp = totalXpFromSegments(segs);
      const durationSeconds = Math.round(
        segs.reduce((a, s) => a + s.activeMs, 0) / 1000,
      );
      if (durationSeconds <= 0) return null;
      const session: FocusSession = {
        id: createId(),
        taskId: finalized.taskId,
        projectId: finalized.projectId,
        startedAt: formatISO(finalized.sessionStartedAt),
        endedAt: formatISO(Date.now()),
        durationSeconds,
        xpEarned: xp,
      };

      const prevXp = focusSessions.reduce((a, s) => a + s.xpEarned, 0);
      const postXp = prevXp + session.xpEarned;
      const prevLevel = levelFromTotalXp(prevXp).level;
      const postLevel = levelFromTotalXp(postXp).level;

      const newSessions = [...focusSessions, session];
      setFocusSessions(newSessions);
      await writeJsonFile('focusSessions', newSessions);

      setAchievementsState((ach) => {
        const todayKey = formatDateKey(new Date());
        const gs = computeCurrentGlobalStreak(
          todayKey,
          dayOffKeySet(dayOffs),
          newSessions,
          tasks,
          focusGoalMinutes,
        );
        const unlocked = new Set(ach.unlocked);
        const newIds = collectNewAchievementIds(unlocked, {
          totalXp: postXp,
          focusHoursTotal: totalFocusHours(newSessions),
          globalStreak: gs,
          tasksDone: countDoneTasks(tasks),
          incomeTotal: totalIncomeAmount(transactions),
          hadIncome: transactions.some((t) => t.type === 'income'),
        });
        const nextAch: AchievementsState = {
          unlocked: [...new Set([...ach.unlocked, ...newIds])],
          globalStreak: {
            current: gs,
            best: Math.max(ach.globalStreak?.best ?? 0, gs),
            lastProductiveDateKey: todayKey,
          },
        };
        void writeJsonFile('achievements', nextAch);
        const rewards: AchievementEvent[] = newIds.map((id) => ({
          type: 'achievement' as const,
          id,
        }));
        if (postLevel > prevLevel) rewards.push({ type: 'level', level: postLevel });
        pushRewards(rewards);
        return nextAch;
      });
      return session;
    },
    [dayOffs, focusGoalMinutes, focusSessions, pushRewards, tasks, transactions],
  );

  const removeFocusSession = useCallback(async (id: string) => {
    setFocusSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      void writeJsonFile('focusSessions', next);
      return next;
    });
  }, []);

  const unlockAchievementsRaw = useCallback(async (ids: string[]) => {
    setAchievementsState((prev) => {
      const next = {
        ...prev,
        unlocked: [...new Set([...prev.unlocked, ...ids])],
      };
      void writeJsonFile('achievements', next);
      return next;
    });
  }, []);

  const recomputeGlobalStreak = useCallback(() => {
    setAchievementsState((ach) => {
      const todayKey = formatDateKey(new Date());
      const gs = computeCurrentGlobalStreak(
        todayKey,
        dayOffKeySet(dayOffs),
        focusSessions,
        tasks,
        focusGoalMinutes,
      );
      const next = {
        ...ach,
        globalStreak: {
          current: gs,
          best: Math.max(ach.globalStreak?.best ?? 0, gs),
          lastProductiveDateKey: ach.globalStreak?.lastProductiveDateKey,
        },
      };
      void writeJsonFile('achievements', next);
      return next;
    });
  }, [dayOffs, focusGoalMinutes, focusSessions, tasks]);

  const clearAllUserData = useCallback(async () => {
    await clearAllPersistedAppData();
    setProfile(emptyProfile);
    setEvents([]);
    setTasks([]);
    setTransactions([]);
    setChallengesStateInner(emptyChallenges);
    setDayOffs([]);
    setNotes([]);
    setMoodLogs([]);
    setAchievementsState(emptyAchievements);
    setFocusSessions([]);
    setRewardQueue([]);
  }, []);

  const value = useMemo(
    () =>
      ({
        profile,
        events,
        tasks,
        transactions,
        challengesState,
        dayOffs,
        notes,
        moodLogs,
        achievementsState,
        focusSessions,
        focusGoalMinutes,
        setFocusGoalMinutes,
        loading,
        refresh,
        rewardQueue,
        consumeReward,
        replaceProfile,
        upsertProject,
        removeProject,
        upsertExpenseCategory,
        removeExpenseCategory,
        upsertTaskType,
        removeTaskType,
        upsertEvent,
        removeEvent,
        upsertTask,
        removeTask,
        upsertTransaction,
        removeTransaction,
        setChallengesState,
        upsertChallenge,
        removeChallenge,
        toggleChallengeCompletion,
        upsertDayOff,
        removeDayOff,
        upsertNote,
        removeNote,
        upsertMoodLog,
        removeMoodLog,
        appendFocusSessionFromTimer,
        removeFocusSession,
        unlockAchievementsRaw,
        recomputeGlobalStreak,
        clearAllUserData,
      }) satisfies AppDataContextValue,
    [
      profile,
      events,
      tasks,
      transactions,
      challengesState,
      dayOffs,
      notes,
      moodLogs,
      achievementsState,
      focusSessions,
      focusGoalMinutes,
      setFocusGoalMinutes,
      loading,
      refresh,
      rewardQueue,
      consumeReward,
      replaceProfile,
      upsertProject,
      removeProject,
      upsertExpenseCategory,
      removeExpenseCategory,
      upsertTaskType,
      removeTaskType,
      upsertEvent,
      removeEvent,
      upsertTask,
      removeTask,
      upsertTransaction,
      removeTransaction,
      setChallengesState,
      upsertChallenge,
      removeChallenge,
      toggleChallengeCompletion,
      upsertDayOff,
      removeDayOff,
      upsertNote,
      removeNote,
      upsertMoodLog,
      removeMoodLog,
      appendFocusSessionFromTimer,
      removeFocusSession,
      unlockAchievementsRaw,
      recomputeGlobalStreak,
      clearAllUserData,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
