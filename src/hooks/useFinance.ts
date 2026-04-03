import { useMemo } from 'react';
import { useAppData } from '../store/AppDataContext';
import type { Transaction } from '../types';
import { createId } from '../utils/id';

export function useFinance() {
  const { transactions, upsertTransaction, removeTransaction } = useAppData();

  const addTransaction = (input: Omit<Transaction, 'id'>) =>
    upsertTransaction({ ...input, id: createId() });

  const updateTransaction = (
    id: string,
    patch: Partial<Omit<Transaction, 'id'>>,
  ) => {
    const prev = transactions.find((t) => t.id === id);
    if (!prev) return;
    return upsertTransaction({ ...prev, ...patch });
  };

  const getById = useMemo(
    () => (id: string) => transactions.find((t) => t.id === id),
    [transactions],
  );

  return {
    transactions,
    addTransaction,
    updateTransaction,
    upsertTransaction,
    removeTransaction,
    getById,
  };
}
