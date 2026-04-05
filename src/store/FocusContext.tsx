import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import {
  clearFocusTimer,
  loadFocusTimer,
  saveFocusTimer,
  type PersistedFocusTimer,
} from '../services/focusTimerStorage';
import { totalXpFromSegments } from '../utils/focusXp';

type FocusContextValue = {
  taskId: string | null;
  projectId: string;
  isRunning: boolean;
  isPaused: boolean;
  /** Активні секунди з урахуванням поточного сегмента */
  elapsedSeconds: number;
  sessionXpPreview: number;
  setTaskAndProject: (taskId: string | null, projectId: string) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => PersistedFocusTimer | null;
};

const FocusContext = createContext<FocusContextValue | null>(null);

function nowMs() {
  return Date.now();
}

function activeMsFromState(p: PersistedFocusTimer): number {
  let sum = p.segments.reduce((a, s) => a + s.activeMs, 0);
  if (p.currentSegmentStartedAt != null && !p.isPaused) {
    sum += nowMs() - p.currentSegmentStartedAt;
  }
  return sum;
}

export function FocusProvider({ children }: { children: ReactNode }) {
  const [persisted, setPersisted] = useState<PersistedFocusTimer | null>(null);
  const [tick, setTick] = useState(0);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    (async () => {
      const loaded = await loadFocusTimer();
      if (loaded) setPersisted(loaded);
    })();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        setTick((x) => x + 1);
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!persisted || persisted.isPaused || persisted.currentSegmentStartedAt == null) {
      return;
    }
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [persisted]);

  const flushPersist = useCallback((next: PersistedFocusTimer) => {
    setPersisted(next);
    void saveFocusTimer(next);
  }, []);

  const setTaskAndProject = useCallback((taskId: string | null, projectId: string) => {
    setPersisted((prev) => {
      const t = nowMs();
      if (!prev) {
        const next: PersistedFocusTimer = {
          taskId,
          projectId,
          segments: [],
          currentSegmentStartedAt: null,
          isPaused: true,
          sessionStartedAt: t,
        };
        void saveFocusTimer(next);
        return next;
      }
      const next = { ...prev, taskId, projectId };
      void saveFocusTimer(next);
      return next;
    });
  }, []);

  const start = useCallback(() => {
    if (!persisted?.projectId) return;
    const t = nowMs();
    const next = {
      ...persisted,
      isPaused: false,
      currentSegmentStartedAt: t,
      sessionStartedAt: persisted.sessionStartedAt || t,
    };
    flushPersist(next);
  }, [persisted, flushPersist]);

  const pause = useCallback(() => {
    if (!persisted || persisted.isPaused || persisted.currentSegmentStartedAt == null) return;
    const end = nowMs();
    const activeMs = end - persisted.currentSegmentStartedAt;
    const next: PersistedFocusTimer = {
      ...persisted,
      isPaused: true,
      currentSegmentStartedAt: null,
      segments: [...persisted.segments, { activeMs }],
    };
    flushPersist(next);
  }, [persisted, flushPersist]);

  const resume = useCallback(() => {
    if (!persisted || !persisted.isPaused) return;
    const next: PersistedFocusTimer = {
      ...persisted,
      isPaused: false,
      currentSegmentStartedAt: nowMs(),
    };
    flushPersist(next);
  }, [persisted, flushPersist]);

  const stop = useCallback((): PersistedFocusTimer | null => {
    if (!persisted) return null;
    let p = { ...persisted };
    if (p.currentSegmentStartedAt != null && !p.isPaused) {
      const end = nowMs();
      p = {
        ...p,
        segments: [...p.segments, { activeMs: end - p.currentSegmentStartedAt }],
        currentSegmentStartedAt: null,
        isPaused: true,
      };
    }
    void clearFocusTimer();
    setPersisted(null);
    return p;
  }, [persisted]);

  const value = useMemo(() => {
    if (!persisted) {
      return {
        taskId: null,
        projectId: '',
        isRunning: false,
        isPaused: true,
        elapsedSeconds: 0,
        sessionXpPreview: 0,
        setTaskAndProject,
        start,
        pause,
        resume,
        stop,
      } satisfies FocusContextValue;
    }
    const activeMs = activeMsFromState(persisted);
    void tick;
    const secs = Math.floor(activeMs / 1000);
    const xp = totalXpFromSegments(
      persisted.currentSegmentStartedAt != null && !persisted.isPaused
        ? [
            ...persisted.segments,
            {
              activeMs: nowMs() - persisted.currentSegmentStartedAt,
            },
          ]
        : persisted.segments,
    );
    return {
      taskId: persisted.taskId,
      projectId: persisted.projectId,
      isRunning: !persisted.isPaused && persisted.currentSegmentStartedAt != null,
      isPaused: persisted.isPaused,
      elapsedSeconds: secs,
      sessionXpPreview: xp,
      setTaskAndProject,
      start,
      pause,
      resume,
      stop,
    } satisfies FocusContextValue;
  }, [persisted, tick, start, pause, resume, stop, setTaskAndProject]);

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export function useFocusTimer(): FocusContextValue {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error('useFocusTimer needs FocusProvider');
  return ctx;
}
