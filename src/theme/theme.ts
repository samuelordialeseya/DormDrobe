// ─── DormDrobe Design System ─────────────────────────────────────────
// Apple-inspired Liquid Glass aesthetic

export const Colors = {
  // Background layers
  bgDeep: '#08090F',
  bgBase: '#0D0E1A',
  bgLayer: '#12132080',

  // Glass surfaces
  glassLight: 'rgba(255,255,255,0.07)',
  glassMid: 'rgba(255,255,255,0.10)',
  glassBright: 'rgba(255,255,255,0.14)',
  glassWhite: 'rgba(255,255,255,0.18)',

  // Glass borders
  borderGlass: 'rgba(255,255,255,0.12)',
  borderGlassBright: 'rgba(255,255,255,0.22)',

  // Brand purple palette
  purple100: '#EDE9FE',
  purple200: '#DDD6FE',
  purple300: '#C4B5FD',
  purple400: '#A78BFA',
  purple500: '#8B5CF6',
  purple600: '#7C3AED',
  purple700: '#6D28D9',

  // Accent blue
  blue400: '#60A5FA',
  blue500: '#3B82F6',

  // Status
  statusClean: '#34D399',
  statusWorn: '#FBBF24',
  statusLaundry: '#FB923C',
  statusDrying: '#60A5FA',
  statusMisplaced: '#F87171',

  // Neutral
  white: '#FFFFFF',
  textPrimary: 'rgba(255,255,255,0.92)',
  textSecondary: 'rgba(255,255,255,0.55)',
  textTertiary: 'rgba(255,255,255,0.32)',
  textInactive: 'rgba(255,255,255,0.22)',

  // Glow
  purpleGlow: 'rgba(139,92,246,0.35)',
  blueGlow: 'rgba(96,165,250,0.25)',
};

export const Radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  pill: 999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

export const Typography = {
  largeTitle: { fontSize: 34, fontWeight: '700' as const, letterSpacing: -0.5 },
  title1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.4 },
  title2: { fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.3 },
  title3: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.2 },
  headline: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.1 },
  body: { fontSize: 15, fontWeight: '400' as const },
  callout: { fontSize: 14, fontWeight: '400' as const },
  subheadline: { fontSize: 13, fontWeight: '400' as const },
  footnote: { fontSize: 12, fontWeight: '400' as const },
  caption1: { fontSize: 11, fontWeight: '400' as const },
  caption2: { fontSize: 10, fontWeight: '400' as const },
};
