import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../store/ThemeContext';
import { useAppData } from '../store/AppDataContext';
import { useProjects } from '../hooks/useProjects';
import { Card } from '../components/Card';
import { levelFromTotalXp, projectXpFromSessions } from '../utils/levels';

export function ProjectLevelsScreen() {
  const t = useAppTheme();
  const { focusSessions } = useAppData();
  const { activeProjects } = useProjects();
  const rows = useMemo(
    () =>
      activeProjects.map((p) => {
        const xp = projectXpFromSessions(focusSessions, p.id);
        const L = levelFromTotalXp(xp);
        const pct = L.xpForNext > 0 ? L.xpIntoLevel / L.xpForNext : 1;
        return { p, xp, L, pct };
      }),
    [activeProjects, focusSessions],
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.background }}
      contentContainerStyle={{ padding: t.spacing.md }}
    >
      {rows.length === 0 ? (
        <Text style={{ color: t.colors.muted }}>Додайте активний проєкт у профілі.</Text>
      ) : null}
      {rows.map(({ p, xp, L, pct }) => (
        <Card key={p.id} style={{ marginBottom: t.spacing.sm }}>
          <View style={styles.row}>
            <View style={[styles.swatch, { backgroundColor: p.color }]} />
            <View style={styles.flex}>
              <Text style={[styles.name, { color: t.colors.text }]}>{p.name}</Text>
              <Text style={[styles.meta, { color: t.colors.muted }]}>
                Рівень {L.level} · {Math.round(xp)} XP загалом
              </Text>
              <View style={[styles.track, { backgroundColor: t.colors.border }]}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.round(pct * 100)}%`,
                      backgroundColor: t.colors.accent,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.detail, { color: t.colors.muted }]}>
                До наступного: {L.xpIntoLevel} / {L.xpForNext} XP
              </Text>
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  swatch: { width: 12, height: 44, borderRadius: 6 },
  flex: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  meta: { marginTop: 4, fontSize: 13 },
  track: { height: 8, borderRadius: 4, marginTop: 10, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  detail: { fontSize: 12, marginTop: 6 },
});
