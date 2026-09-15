// ─── DormDrobe Design System ─────────────────────────────────────────
// Apple-inspired Liquid Glass — neutral, restrained, color-on-purpose.

export const Colors = {
  // True deep black backgrounds (Apple-style)
  bgDeep: '#000000',
  bgBase: '#0A0A0A',
  bgLayer: '#111111',

  // Glass surfaces — neutral white transparency only
  glassLight: 'rgba(255,255,255,0.055)',
  glassMid: 'rgba(255,255,255,0.085)',
  glassBright: 'rgba(255,255,255,0.12)',
  glassWhite: 'rgba(255,255,255,0.16)',

  // Glass borders — crisp, neutral
  borderGlass: 'rgba(255,255,255,0.10)',
  borderGlassBright: 'rgba(255,255,255,0.18)',

  // Brand accent — used ONLY on primary buttons & active indicators
  accent: '#7C3AED',        // single source of truth
  accentLight: '#A78BFA',   // active text / labels

  // Status colors (functional, not decorative)
  statusClean: '#30D158',    // Apple system green
  statusWorn: '#FF9F0A',     // Apple system orange
  statusLaundry: '#FF6B35',
  statusDrying: '#0A84FF',   // Apple system blue
  statusMisplaced: '#FF453A', // Apple system red

  // Text
  white: '#FFFFFF',
  textPrimary: 'rgba(255,255,255,0.90)',
  textSecondary: 'rgba(255,255,255,0.50)',
  textTertiary: 'rgba(255,255,255,0.28)',
  textInactive: 'rgba(255,255,255,0.18)',
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
