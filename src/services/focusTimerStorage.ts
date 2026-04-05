import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@project_tracker_focus_timer_v1';

export type PersistedFocusTimer = {
  taskId: string | null;
  projectId: string;
  segments: { activeMs: number }[];
  currentSegmentStartedAt: number | null;
  isPaused: boolean;
  sessionStartedAt: number;
};

export async function loadFocusTimer(): Promise<PersistedFocusTimer | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedFocusTimer;
  } catch {
    return null;
  }
}

export async function saveFocusTimer(data: PersistedFocusTimer): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}

export async function clearFocusTimer(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
