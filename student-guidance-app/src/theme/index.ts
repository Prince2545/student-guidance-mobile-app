export const colors = {
  background: '#05050A',
  surface: '#111320',
  surfaceElevated: '#181A2A',
  primaryGradientStart: '#7C3AED',
  primaryGradientEnd: '#4F46E5',
  accent: '#22D3EE',
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textMuted: '#6B7280',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F97373',
  borderSubtle: 'rgba(148, 163, 184, 0.24)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
};

export const typography = {
  heading1: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  heading2: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  meta: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
};

export const theme = {
  colors,
  spacing,
  radii,
  shadows,
  typography,
};

export type Theme = typeof theme;

