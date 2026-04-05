import type { TaskPriority } from '../types';

export type ColorPalette = {
  background: string;
  surface: string;
  text: string;
  accent: string;
  task: string;
  event: string;
  card: string;
  border: string;
  muted: string;
  danger: string;
  dimmedDay: string;
  overlay: string;
  focusHeat: string;
  challenge: string;
  dayOff: string;
  priority: Record<TaskPriority, string>;
};

export const lightColors: ColorPalette = {
  background: '#F4F4F5',
  surface: '#FAFAFA',
  text: '#18181B',
  accent: '#2563EB',
  task: '#D97706',
  event: '#2563EB',
  card: '#FFFFFF',
  border: '#E4E4E7',
  muted: '#71717A',
  danger: '#DC2626',
  dimmedDay: '#A1A1AA',
  overlay: 'rgba(24, 24, 27, 0.45)',
  focusHeat: '#7C3AED',
  challenge: '#059669',
  dayOff: '#93C5FD',
  priority: { low: '#A1A1AA', medium: '#D97706', high: '#DC2626' },
};

export const darkColors: ColorPalette = {
  background: '#09090B',
  surface: '#18181B',
  text: '#FAFAFA',
  accent: '#60A5FA',
  task: '#FBBF24',
  event: '#60A5FA',
  card: '#18181B',
  border: '#27272A',
  muted: '#A1A1AA',
  danger: '#F87171',
  dimmedDay: '#52525B',
  overlay: 'rgba(0, 0, 0, 0.6)',
  focusHeat: '#A78BFA',
  challenge: '#34D399',
  dayOff: '#1D4ED8',
  priority: { low: '#71717A', medium: '#FBBF24', high: '#F87171' },
};

export const spacing = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 10, md: 14, lg: 20 } as const;

export type AppTheme = {
  dark: boolean;
  colors: ColorPalette;
  spacing: typeof spacing;
  radius: typeof radius;
};

export function makeTheme(dark: boolean): AppTheme {
  return {
    dark,
    colors: dark ? darkColors : lightColors,
    spacing,
    radius,
  };
}
