import React, { useMemo, useState } from 'react';
import { useAppTheme } from '../store/ThemeContext';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';
import { formatDisplayDate } from '../utils/dateTime';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { TransactionEditorModal } from '../components/TransactionEditorModal';
import { useFinance } from '../hooks/useFinance';
import { useProjects } from '../hooks/useProjects';
import type { ModalMode, Transaction } from '../types';

export function FinanceScreen() {
  const t = useAppTheme();
  const { activeProjects, activeExpenseCategories } = useProjects();
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
  const catOpts = activeExpenseCategories.map((c) => ({ id: c.id, name: c.name }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: t.colors.background,
          padding: t.spacing.md,
        },
        heading: {
          fontSize: 22,
          fontWeight: '700',
          color: t.colors.text,
          marginBottom: t.spacing.md,
        },
        actions: { flexDirection: 'row', gap: t.spacing.sm, marginBottom: t.spacing.md },
        actionBtn: { flex: 1 },
        sub: {
          fontSize: 15,
          fontWeight: '700',
          color: t.colors.muted,
          marginBottom: t.spacing.sm,
        },
        list: { paddingBottom: t.spacing.xl },
        card: { marginBottom: t.spacing.sm },
        row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        cardTitle: { fontSize: 16, fontWeight: '700', color: t.colors.text },
        amount: { fontSize: 16, fontWeight: '700' },
        income: { color: t.colors.accent },
        expense: { color: t.colors.danger },
        meta: { marginTop: 4, fontSize: 13, color: t.colors.muted },
        empty: { color: t.colors.muted, textAlign: 'center', marginTop: t.spacing.lg },
      }),
    [t],
  );

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
