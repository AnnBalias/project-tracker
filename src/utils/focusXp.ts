/** XP за один неперервний активний відрізок (хв без паузи всередині сегмента) */
export function xpFromSegmentActiveMs(activeMs: number): number {
  const minutes = activeMs / 60000;
  const full = Math.floor(minutes);
  let xp = 0;
  for (let i = 0; i < full; i++) {
    xp += i < 60 ? 1 : 1.5;
  }
  const frac = minutes - full;
  if (frac >= 0.5) {
    xp += full < 60 ? 1 : 1.5;
  }
  return Math.round(xp * 100) / 100;
}

export function totalXpFromSegments(segments: { activeMs: number }[]): number {
  return (
    Math.round(
      segments.reduce((s, seg) => s + xpFromSegmentActiveMs(seg.activeMs), 0) * 100,
    ) / 100
  );
}
