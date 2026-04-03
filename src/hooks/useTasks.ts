import { useMemo } from 'react';
import { useAppData } from '../store/AppDataContext';
import type { Task } from '../types';
import { createId } from '../utils/id';

export function useTasks() {
  const { tasks, upsertTask, removeTask } = useAppData();

  const addTask = (input: Omit<Task, 'id'>) => upsertTask({ ...input, id: createId() });

  const updateTask = (id: string, patch: Partial<Omit<Task, 'id'>>) => {
    const prev = tasks.find((t) => t.id === id);
    if (!prev) return;
    return upsertTask({ ...prev, ...patch });
  };

  const getById = useMemo(
    () => (id: string) => tasks.find((t) => t.id === id),
    [tasks],
  );

  return { tasks, addTask, updateTask, upsertTask, removeTask, getById };
}
