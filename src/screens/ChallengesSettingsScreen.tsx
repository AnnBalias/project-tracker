import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../store/ThemeContext';
import { useAppData } from '../store/AppDataContext';
import { useProjects } from '../hooks/useProjects';
import { Card } from '../components/Card';
import { FAB } from '../components/FAB';
import { ChallengeEditorModal } from '../components/ChallengeEditorModal';
import type { ProfileStackParamList } from '../navigation/types';
import type { Challenge, ModalMode } from '../types';
import { createId } from '../utils/id';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ChallengesSettings'>;

export function ChallengesSettingsScreen({ route }: Props) {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [archiveSectionY, setArchiveSectionY] = useState<number | null>(null);
  const { challengesState, upsertChallenge, removeChallenge } = useAppData();
  const { activeProjects } = useProjects();

  const projectOptions = useMemo(
    () => [{ id: null, name: 'Без проєкту' }, ...activeProjects.map((p) => ({ id: p.id, name: p.name }))],
    [activeProjects],
  );

  const activeChallenges = useMemo(
    () => challengesState.challenges.filter((c) => !c.archived),
    [challengesState.challenges],
  );
  const archivedChallenges = useMemo(
    () => challengesState.challenges.filter((c) => c.archived),
    [challengesState.challenges],
  );

  const [editor, setEditor] = useState<{ mode: ModalMode; id?: string } | null>(null);

  const selected =
    editor?.id != null
      ? challengesState.challenges.find((c) => c.id === editor.id) ?? null
      : null;

  useEffect(() => {
    if (!route.params?.showArchived || archiveSectionY == null) return;
    const id = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: archiveSectionY, animated: true });
    });
    return () => cancelAnimationFrame(id);
  }, [route.params?.showArchived, archiveSectionY]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: t.colors.background, padding: t.spacing.md },
        section: {
          fontSize: 15,
          fontWeight: '700',
          color: t.colors.muted,
          marginBottom: t.spacing.sm,
        },
        mt: { marginTop: t.spacing.lg },
        card: { marginBottom: t.spacing.sm },
        cardTitle: { fontSize: 16, fontWeight: '700', color: t.colors.text },
        meta: { marginTop: 4, fontSize: 13, color: t.colors.muted },
        empty: { color: t.colors.muted, marginBottom: t.spacing.sm },
      }),
    [t],
  );

  const saveChallenge = (c: Challenge) => {
    if (!c.id) {
      void upsertChallenge({ ...c, id: createId() });
      return;
    }
    void upsertChallenge(c);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.section}>Активні челенджі</Text>
        {activeChallenges.length === 0 ? (
          <Text style={styles.empty}>Створіть челендж (дні тижня, період)</Text>
        ) : null}
        {activeChallenges.map((c) => (
          <Pressable key={c.id} onPress={() => setEditor({ mode: 'view', id: c.id })}>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>{c.name}</Text>
              <Text style={styles.meta}>
                {c.startDate.slice(0, 10)} — {c.endDate.slice(0, 10)}
              </Text>
              <Text style={styles.meta}>
                Серія: {challengesState.streaks[c.id]?.current ?? 0} · Рекорд:{' '}
                {challengesState.streaks[c.id]?.best ?? 0}
              </Text>
            </Card>
          </Pressable>
        ))}

        <View onLayout={(e) => setArchiveSectionY(e.nativeEvent.layout.y)}>
          <Text style={[styles.section, styles.mt]}>Архів</Text>
          {archivedChallenges.length === 0 ? (
            <Text style={styles.empty}>Немає архівованих челенджів</Text>
          ) : (
            archivedChallenges.map((c) => (
              <Pressable key={c.id} onPress={() => setEditor({ mode: 'view', id: c.id })}>
                <Card style={styles.card}>
                  <Text style={styles.cardTitle}>{c.name}</Text>
                  <Text style={styles.meta}>
                    {c.startDate.slice(0, 10)} — {c.endDate.slice(0, 10)}
                  </Text>
                  <Text style={styles.meta}>
                    Серія: {challengesState.streaks[c.id]?.current ?? 0} · Рекорд:{' '}
                    {challengesState.streaks[c.id]?.best ?? 0}
                  </Text>
                </Card>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <FAB onPress={() => setEditor({ mode: 'create' })} />

      <ChallengeEditorModal
        visible={!!editor}
        mode={editor?.mode ?? 'create'}
        initial={selected}
        projectIds={projectOptions}
        onClose={() => setEditor(null)}
        onRequestEdit={() =>
          editor?.id ? setEditor({ mode: 'edit', id: editor.id }) : undefined
        }
        onSave={saveChallenge}
        onDelete={(id) => void removeChallenge(id)}
      />
    </View>
  );
}
