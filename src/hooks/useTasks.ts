import { useMemo } from 'react';
import { useAppData } from '../store/AppDataContext';
import type { Task } from '../types';
import { createId } from '../utils/id';

export function useTasks() {
  const { tasks, upsertTask, removeTask } = useAppData();

  const addTask = (input: Omit<Task, 'id'>) => {
    const nums = tasks
      .filter((t) => t.projectId === input.projectId)
      .map((t) => t.number);
    const number =
      input.number > 0 ? input.number : (nums.length ? Math.max(...nums) : 0) + 1;
    return upsertTask({ ...input, id: createId(), number });
  };

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
