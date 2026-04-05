/** XP потрібно з поточного рівня L (1-based) до L+1 */
export function xpPerLevelBand(L: number): number {
  const band = Math.floor((L - 1) / 10);
  if (band <= 0) return 1000;
  if (band === 1) return 1500;
  if (band === 2) return 2000;
  return Math.min(10000, 2000 + (band - 2) * 500);
}

/** Загальний XP з рівня 1 до досягнення рівня `targetLevel` (targetLevel >= 1) */
export function cumulativeXpToReachLevel(targetLevel: number): number {
  if (targetLevel <= 1) return 0;
  let sum = 0;
  for (let L = 1; L < targetLevel; L++) {
    sum += xpPerLevelBand(L);
  }
  return sum;
}

export function levelFromTotalXp(totalXp: number): {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
} {
  let level = 1;
  let remaining = totalXp;
  for (;;) {
    const need = xpPerLevelBand(level);
    if (remaining < need) {
      return {
        level,
        xpIntoLevel: remaining,
        xpForNext: need,
      };
    }
    remaining -= need;
    level += 1;
    if (level > 9999) {
      return { level, xpIntoLevel: 0, xpForNext: xpPerLevelBand(level) };
    }
  }
}

export function projectXpFromSessions(
  sessions: { projectId: string; xpEarned: number }[],
  projectId: string,
): number {
  return sessions
    .filter((s) => s.projectId === projectId)
    .reduce((a, s) => a + s.xpEarned, 0);
}
