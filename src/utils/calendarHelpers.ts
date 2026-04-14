import { format, isSameDay, parseISO, startOfDay } from 'date-fns';
import type { CalendarEvent, Task, WeekdayShort } from '../types';
import { parseDateKey } from './dateTime';

const weekdayToKey: Record<string, WeekdayShort> = {
  Mon: 'mon',
  Tue: 'tue',
  Wed: 'wed',
  Thu: 'thu',
  Fri: 'fri',
  Sat: 'sat',
  Sun: 'sun',
};

export function getWeekdayKey(date: Date): WeekdayShort {
  return weekdayToKey[format(date, 'EEE')] ?? 'mon';
}

export function eventOccursOnDay(event: CalendarEvent, day: Date): boolean {
  const d0 = startOfDay(day);
  const start = startOfDay(parseISO(event.startTime));
  if (!event.repeat?.length) {
    return isSameDay(start, d0);
  }
  const key = getWeekdayKey(d0);
  if (!event.repeat.includes(key)) return false;
  return d0.getTime() >= start.getTime();
}

export function getTaskCalendarDay(task: Task): Date {
  if (task.status === 'moved' && task.movedToDate) {
    return startOfDay(parseISO(task.movedToDate));
  }
  return startOfDay(parseDateKey(task.startDate.slice(0, 10)));
}

export function taskOnDay(task: Task, day: Date): boolean {
  return isSameDay(getTaskCalendarDay(task), startOfDay(day));
}
