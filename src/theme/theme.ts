export const theme = {
  colors: {
    background: '#F3F4F6',
    text: '#1F2937',
    accent: '#2563EB',
    task: '#F59E0B',
    event: '#2563EB',
    card: '#FFFFFF',
    border: '#E5E7EB',
    muted: '#6B7280',
    danger: '#DC2626',
    dimmedDay: '#D1D5DB',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 8, md: 12, lg: 16 },
} as const;

export type Theme = typeof theme;
