export const valgaronColors = {
  page: '#111312',
  surface: '#1b1d1b',
  surfaceStrong: '#262a25',
  field: '#141614',
  heading: '#f4efe6',
  text: '#d6d0c6',
  muted: '#a9b0a7',
  border: '#3a403a',
  accent: '#d08a4e',
  accentSoft: 'rgba(208, 138, 78, 0.2)',
  primaryContrast: '#111312',
  danger: '#ff8b8b',
  focus: '#79c6bd',
} as const;

export const valgaronSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const valgaronRadius = {
  sm: 4,
  md: 6,
  lg: 8,
} as const;

export const valgaronTypography = {
  fontFamily:
    'Inter, Roboto, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
  },
} as const;

export type ValgaronColorName = keyof typeof valgaronColors;
