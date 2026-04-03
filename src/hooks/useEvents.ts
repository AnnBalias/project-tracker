import { useMemo } from 'react';
import { useAppData } from '../store/AppDataContext';
import type { CalendarEvent } from '../types';
import { createId } from '../utils/id';

export function useEvents() {
  const { events, upsertEvent, removeEvent } = useAppData();

  const addEvent = (input: Omit<CalendarEvent, 'id'>) =>
    upsertEvent({ ...input, id: createId() });

  const updateEvent = (id: string, patch: Partial<Omit<CalendarEvent, 'id'>>) => {
    const prev = events.find((e) => e.id === id);
    if (!prev) return;
    return upsertEvent({ ...prev, ...patch });
  };

  const getById = useMemo(
    () => (id: string) => events.find((e) => e.id === id),
    [events],
  );

  return { events, addEvent, updateEvent, upsertEvent, removeEvent, getById };
}
