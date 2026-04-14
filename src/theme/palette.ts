import type { TaskPriority } from '../types';

export type ColorPalette = {
  background: string;
  surface: string;
  text: string;
  accent: string;
  onAccent: string;
  task: string;
  event: string;
  card: string;
  border: string;
  muted: string;
  danger: string;
  onDanger: string;
  dimmedDay: string;
  overlay: string;
  focusHeat: string;
  challenge: string;
  dayOff: string;
  priority: Record<TaskPriority, string>;
};

export const lightColors: ColorPalette = {
  background: '#EAF6EF',
  surface: '#F4FBF7',
  text: '#081B1B',
  /** жовтий лишаємо для акцентів у світлій темі */
  accent: '#EEE882',
  onAccent: '#081B1B',
  task: '#C18D52',
  event: '#5A8F76',
  card: '#FFFFFF',
  border: '#96CDB0',
  muted: '#203B37',
  danger: '#DC2626',
  onDanger: '#FFFFFF',
  dimmedDay: '#5A8F76',
  overlay: 'rgba(8, 27, 27, 0.28)',
  focusHeat: '#5A8F76',
  challenge: '#5A8F76',
  dayOff: '#96CDB0',
  priority: { low: '#5A8F76', medium: '#C18D52', high: '#DC2626' },
};

export const darkColors: ColorPalette = {
  background: '#081B1B',
  surface: '#203B37',
  text: '#EEE882',
  accent: '#EEE882',
  onAccent: '#081B1B',
  task: '#C18D52',
  event: '#EEE882',
  card: '#203B37',
  border: '#5A8F76',
  muted: '#96CDB0',
  danger: '#F87171',
  onDanger: '#081B1B',
  dimmedDay: '#5A8F76',
  overlay: 'rgba(8, 27, 27, 0.72)',
  focusHeat: '#96CDB0',
  challenge: '#5A8F76',
  dayOff: '#96CDB0',
  priority: { low: '#5A8F76', medium: '#C18D52', high: '#F87171' },
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
