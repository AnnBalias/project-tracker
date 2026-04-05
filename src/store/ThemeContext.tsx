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
import type { AppTheme } from '../theme/palette';
import { makeTheme } from '../theme/palette';

const THEME_KEY = '@project_tracker_theme_dark';

const ThemeContext = createContext<{
  theme: AppTheme;
  setDark: (v: boolean) => void;
  toggleTheme: () => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDarkState] = useState(false);

  useEffect(() => {
    (async () => {
      const v = await AsyncStorage.getItem(THEME_KEY);
      if (v === '1') setDarkState(true);
    })();
  }, []);

  const setDark = useCallback((v: boolean) => {
    setDarkState(v);
    void AsyncStorage.setItem(THEME_KEY, v ? '1' : '0');
  }, []);

  const toggleTheme = useCallback(() => {
    setDarkState((prev) => {
      const next = !prev;
      void AsyncStorage.setItem(THEME_KEY, next ? '1' : '0');
      return next;
    });
  }, []);

  const theme = useMemo(() => makeTheme(dark), [dark]);

  const value = useMemo(
    () => ({ theme, setDark, toggleTheme }),
    [theme, setDark, toggleTheme],
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
  return { setDark: ctx.setDark, toggleTheme: ctx.toggleTheme, dark: ctx.theme.dark };
}
