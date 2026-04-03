import { useMemo } from 'react';
import { useAppData } from '../store/AppDataContext';
import type { ExpenseCategory, Project } from '../types';
import { createId } from '../utils/id';

export function useProjects() {
  const {
    profile,
    upsertProject,
    removeProject,
    upsertExpenseCategory,
    removeExpenseCategory,
  } = useAppData();

  const { projects, expenseCategories } = profile;

  const activeProjects = useMemo(
    () => projects.filter((p) => !p.archived),
    [projects],
  );

  const addProject = (input: Omit<Project, 'id'>) =>
    upsertProject({
      ...input,
      id: createId(),
      archived: input.archived ?? false,
    });

  const updateProject = (id: string, patch: Partial<Omit<Project, 'id'>>) => {
    const prev = projects.find((p) => p.id === id);
    if (!prev) return;
    return upsertProject({ ...prev, ...patch });
  };

  const addExpenseCategory = (input: Omit<ExpenseCategory, 'id'>) =>
    upsertExpenseCategory({ ...input, id: createId() });

  const updateExpenseCategory = (
    id: string,
    patch: Partial<Omit<ExpenseCategory, 'id'>>,
  ) => {
    const prev = expenseCategories.find((c) => c.id === id);
    if (!prev) return;
    return upsertExpenseCategory({ ...prev, ...patch });
  };

  const getProjectById = useMemo(
    () => (id: string) => projects.find((p) => p.id === id),
    [projects],
  );

  return {
    projects,
    activeProjects,
    expenseCategories,
    addProject,
    updateProject,
    upsertProject,
    removeProject,
    addExpenseCategory,
    updateExpenseCategory,
    upsertExpenseCategory,
    removeExpenseCategory,
    getProjectById,
  };
}
