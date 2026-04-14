import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import type { AppTheme } from '../theme/palette';
import { makeTheme } from '../theme/palette';

type ThemeMode = 'system' | 'light' | 'dark';

const THEME_MODE_KEY = '@project_tracker_theme_mode';
const LEGACY_DARK_KEY = '@project_tracker_theme_dark';

const ThemeContext = createContext<{
  theme: AppTheme;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  /** @deprecated використовуйте setMode('dark' | 'light' | 'system') */
  setDark: (v: boolean) => void;
  toggleTheme: () => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    (async () => {
      const storedMode = await AsyncStorage.getItem(THEME_MODE_KEY);
      if (storedMode === 'system' || storedMode === 'light' || storedMode === 'dark') {
        setModeState(storedMode);
        return;
      }

      const legacy = await AsyncStorage.getItem(LEGACY_DARK_KEY);
      if (legacy === '1' || legacy === '0') {
        const migrated: ThemeMode = legacy === '1' ? 'dark' : 'light';
        setModeState(migrated);
        await AsyncStorage.setItem(THEME_MODE_KEY, migrated);
        await AsyncStorage.removeItem(LEGACY_DARK_KEY);
      }
    })();
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    void AsyncStorage.setItem(THEME_MODE_KEY, m);
  }, []);

  const setDark = useCallback(
    (v: boolean) => {
      setMode(v ? 'dark' : 'light');
    },
    [setMode],
  );

  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      void AsyncStorage.setItem(THEME_MODE_KEY, next);
      return next;
    });
  }, []);

  const effectiveDark = mode === 'dark' || (mode === 'system' && (systemScheme ?? 'light') === 'dark');
  const theme = useMemo(() => makeTheme(effectiveDark), [effectiveDark]);

  const value = useMemo(
    () => ({ theme, mode, setMode, setDark, toggleTheme }),
    [theme, mode, setMode, setDark, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): AppTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) return makeTheme(false);
  return ctx.theme;
}

export function useThemeControls() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeControls needs ThemeProvider');
  return {
    setDark: ctx.setDark,
    toggleTheme: ctx.toggleTheme,
    dark: ctx.theme.dark,
    mode: ctx.mode,
    setMode: ctx.setMode,
  };
}
