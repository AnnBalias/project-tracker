import type { Note, Profile, Task, TaskStage } from '../types';
import { formatDateKey } from './dateTime';
import { parseISO, startOfDay } from 'date-fns';

export function migrateProfile(p: Profile): Profile {
  const base = normalizeProfileProjects(p);
  return {
    ...base,
    expenseCategories: (p.expenseCategories ?? []).map((c) => ({
      ...c,
      archived: c.archived ?? false,
    })),
    taskTypes: (p.taskTypes ?? []).map((tt) => ({
      ...tt,
      archived: tt.archived ?? false,
    })),
  };
}

export function migrateNote(n: Partial<Note> & { id: string }): Note {
  const pid = n.projectId as string | null | undefined;
  return {
    id: n.id,
    title: (n.title as string) ?? '',
    projectId:
      pid === undefined || pid === null || pid === '' ? null : String(pid),
    description: (n.description as string) ?? '',
  };
}

function normalizeProfileProjects(p: Profile): Profile {
  const projects = (p.projects ?? []).map((proj) => ({
    ...proj,
    archived: proj.archived ?? false,
  }));
  return { ...p, projects };
}

export function migrateTask(t: Partial<Task> & { id: string }): Task {
  const start =
    typeof t.startDate === 'string' && t.startDate
      ? t.startDate.slice(0, 10)
      : ((t as unknown as { startTime?: string }).startTime as string)?.slice(0, 10) ??
        formatDateKey(startOfDay(new Date()));
  const end =
    typeof t.endDate === 'string' && t.endDate
      ? t.endDate.slice(0, 10)
      : ((t as unknown as { endTime?: string }).endTime as string)?.slice(0, 10) ?? start;

  const rawStage = (t.stage as unknown as string | undefined) ?? '';
  const stage: TaskStage =
    rawStage === 'planned' ||
    rawStage === 'in_progress' ||
    rawStage === 'review' ||
    rawStage === 'testing' ||
    rawStage === 'done'
      ? rawStage
      : 'planned';
  return {
    id: t.id as string,
    title: (t.title as string) ?? '',
    description: (t.description as string) ?? '',
    projectId: (t.projectId as string) ?? '',
    status: (t.status as Task['status']) ?? 'planned',
    movedToDate: t.movedToDate as string | undefined,
    typeId: (t.typeId as string | null) ?? null,
    number: typeof t.number === 'number' ? t.number : 0,
    priority: (t.priority as Task['priority']) ?? 'medium',
    stage,
    startDate: start,
    endDate: end,
    completedDateKey: t.completedDateKey as string | undefined,
  };
}

export function migrateChallengesState(raw: unknown): {
  challenges: import('../types').Challenge[];
  completions: import('../types').ChallengeCompletion[];
  streaks: Record<string, import('../types').ChallengeStreakMeta>;
} {
  const mapCh = (list: import('../types').Challenge[]) =>
    list.map((c) => ({ ...c, archived: c.archived ?? false }));
  if (Array.isArray(raw)) {
    return { challenges: mapCh(raw as import('../types').Challenge[]), completions: [], streaks: {} };
  }
  const o = raw as Record<string, unknown> | null;
  if (!o || typeof o !== 'object') {
    return { challenges: [], completions: [], streaks: {} };
  }
  return {
    challenges: mapCh((o.challenges as import('../types').Challenge[]) ?? []),
    completions: (o.completions as import('../types').ChallengeCompletion[]) ?? [],
    streaks:
      (o.streaks as Record<string, import('../types').ChallengeStreakMeta>) ?? {},
  };
}

/** Секунди фокусу, що потрапляють у календарний день dateKey (локально) */
export function focusSecondsOnDateKey(
  sessions: import('../types').FocusSession[],
  dateKey: string,
): number {
  // Вся активна тривалість сесії зараховується до календарного дня, коли таймер було запущено.
  // Важливо: використовуємо durationSeconds (активний час), а не wall-clock між startedAt/endedAt.
  let sec = 0;
  for (const s of sessions) {
    try {
      const startedKey = formatDateKey(startOfDay(parseISO(s.startedAt)));
      if (startedKey === dateKey) sec += s.durationSeconds;
    } catch {
      // ignore invalid dates
    }
  }
  return sec;
}

/** Денна ціль фокусу за замовчуванням (в хвилинах) */
export const MIN_FOCUS_MINUTES_FOR_PRODUCTIVE = 60;

export function isProductiveDay(
  dateKey: string,
  sessions: import('../types').FocusSession[],
  tasks: Task[],
  minFocusMin: number = MIN_FOCUS_MINUTES_FOR_PRODUCTIVE,
): boolean {
  if (focusSecondsOnDateKey(sessions, dateKey) / 60 >= minFocusMin) return true;
  return tasks.some(
    (t) =>
      t.status === 'done' &&
      (t.completedDateKey === dateKey ||
        (!t.completedDateKey && taskDoneDateKeyFallback(t) === dateKey)),
  );
}

export function taskDoneDateKeyFallback(t: Task): string {
  return t.endDate.slice(0, 10);
}
