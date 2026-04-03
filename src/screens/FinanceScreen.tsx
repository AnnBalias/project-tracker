import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';
import { formatDisplayDate } from '../utils/dateTime';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { TransactionEditorModal } from '../components/TransactionEditorModal';
import { useFinance } from '../hooks/useFinance';
import { useProjects } from '../hooks/useProjects';
import type { ModalMode, Transaction } from '../types';

export function FinanceScreen() {
  const { activeProjects, expenseCategories } = useProjects();
  const { transactions, addTransaction, upsertTransaction, removeTransaction } =
    useFinance();

  const [modal, setModal] = useState<{
    mode: ModalMode;
    type: 'income' | 'expense';
    tx?: Transaction;
  } | null>(null);

  const sorted = useMemo(
    () =>
      [...transactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [transactions],
  );

  const projectOpts = activeProjects.map((p) => ({ id: p.id, name: p.name }));
  const catOpts = expenseCategories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Фінанси</Text>

      <View style={styles.actions}>
        <Button
          title="+ Дохід"
          onPress={() => setModal({ mode: 'create', type: 'income' })}
          style={styles.actionBtn}
        />
        <Button
          title="+ Витрата"
          variant="secondary"
          onPress={() => setModal({ mode: 'create', type: 'expense' })}
          style={styles.actionBtn}
        />
      </View>

      <Text style={styles.sub}>Останні операції</Text>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Ще немає записів</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              setModal({ mode: 'view', type: item.type, tx: item })
            }
          >
            <Card style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.cardTitle}>
                  {item.type === 'income' ? 'Дохід' : 'Витрата'}
                </Text>
                <Text
                  style={[
                    styles.amount,
                    item.type === 'income' ? styles.income : styles.expense,
                  ]}
                >
                  {item.type === 'income' ? '+' : '−'}
                  {item.amount.toFixed(2)}
                </Text>
              </View>
              <Text style={styles.meta}>
                {formatDisplayDate(item.date)} ·{' '}
                {format(parseISO(item.date), 'EEEE', { locale: uk })}
              </Text>
              {item.details ? (
                <Text style={styles.meta} numberOfLines={2}>
                  {item.details}
                </Text>
              ) : null}
            </Card>
          </Pressable>
        )}
      />

      <TransactionEditorModal
        visible={!!modal}
        mode={modal?.mode ?? 'create'}
        type={modal?.type ?? 'income'}
        initial={modal?.tx ?? null}
        projects={projectOpts}
        categories={catOpts}
        onClose={() => setModal(null)}
        onRequestEdit={() =>
          modal?.tx
            ? setModal({ mode: 'edit', type: modal.tx.type, tx: modal.tx })
            : undefined
        }
        onSave={(t) => {
          if (!modal) return;
          if (modal.mode === 'create') {
            const { id: _i, ...rest } = t;
            void addTransaction(rest);
          } else if (t.id) void upsertTransaction(t);
        }}
        onDelete={(id) => void removeTransaction(id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  actions: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  actionBtn: { flex: 1 },
  sub: { fontSize: 15, fontWeight: '700', color: theme.colors.muted, marginBottom: theme.spacing.sm },
  list: { paddingBottom: theme.spacing.xl },
  card: { marginBottom: theme.spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  amount: { fontSize: 16, fontWeight: '700' },
  income: { color: theme.colors.accent },
  expense: { color: theme.colors.danger },
  meta: { marginTop: 4, fontSize: 13, color: theme.colors.muted },
  empty: { color: theme.colors.muted, textAlign: 'center', marginTop: theme.spacing.lg },
});
