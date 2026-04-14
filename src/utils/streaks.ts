import { addDays, parseISO, startOfDay, subDays } from 'date-fns';
import type {
  Challenge,
  ChallengeCompletion,
  ChallengeStreakMeta,
  DayOff,
  FocusSession,
  Task,
} from '../types';
import { formatDateKey, parseDateKey } from './dateTime';
import { getWeekdayKey } from './calendarHelpers';
import { isProductiveDay } from './migrations';

export function dayOffKeySet(dayOffs: DayOff[]): Set<string> {
  const s = new Set<string>();
  for (const d of dayOffs) {
    s.add(d.date.slice(0, 10));
  }
  return s;
}

export function computeCurrentGlobalStreak(
  todayKey: string,
  dayOffKeys: Set<string>,
  sessions: FocusSession[],
  tasks: Task[],
  minFocusMin: number,
): number {
  let count = 0;
  let d = parseDateKey(todayKey);
  for (let i = 0; i < 4000; i++) {
    const key = formatDateKey(d);
    if (dayOffKeys.has(key)) {
      d = subDays(d, 1);
      continue;
    }
    if (isProductiveDay(key, sessions, tasks, minFocusMin)) {
      count++;
      d = subDays(d, 1);
      continue;
    }
    break;
  }
  return count;
}

export function challengeAppliesOnDay(c: Challenge, day: Date): boolean {
  const d0 = startOfDay(day);
  const start = startOfDay(parseISO(c.startDate));
  const end = startOfDay(parseISO(c.endDate));
  if (d0.getTime() < start.getTime() || d0.getTime() > end.getTime()) return false;
  if (!c.weekdays?.length) return true;
  return c.weekdays.includes(getWeekdayKey(day));
}

/** Перевірка: між двома днями (виключно кінці) є плановий день челенджу без виконання і не day off */
export function hasMissedScheduledChallengeDays(
  c: Challenge,
  fromExclusive: string,
  toExclusive: string,
  dayOffKeys: Set<string>,
  completions: ChallengeCompletion[],
): boolean {
  let d = addDays(parseDateKey(fromExclusive), 1);
  const end = parseDateKey(toExclusive);
  while (d.getTime() < end.getTime()) {
    const key = formatDateKey(d);
    if (dayOffKeys.has(key)) {
      d = addDays(d, 1);
      continue;
    }
    if (!challengeAppliesOnDay(c, d)) {
      d = addDays(d, 1);
      continue;
    }
    const done = completions.some((x) => x.challengeId === c.id && x.dateKey === key);
    if (!done) return true;
    d = addDays(d, 1);
  }
  return false;
}

export function recomputeChallengeStreakFromCompletions(
  c: Challenge,
  completions: ChallengeCompletion[],
  dayOffKeys: Set<string>,
): Pick<ChallengeStreakMeta, 'current' | 'lastDateKey'> {
  const dates = completions
    .filter((x) => x.challengeId === c.id)
    .map((x) => x.dateKey)
    .sort();
  if (!dates.length) {
    return { current: 0 };
  }
  const lastKey = dates[dates.length - 1];
  let d = parseDateKey(lastKey);
  let run = 0;
  for (;;) {
    const key = formatDateKey(d);
    if (dayOffKeys.has(key)) {
      d = subDays(d, 1);
      continue;
    }
    if (!challengeAppliesOnDay(c, d)) {
      break;
    }
    const done = dates.includes(key);
    if (!done) break;
    run += 1;
    d = subDays(d, 1);
  }
  return { current: run, lastDateKey: lastKey };
}
