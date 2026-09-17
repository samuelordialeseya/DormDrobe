// ─── DormDrobe Design System ─────────────────────────────────────────
// Apple Frost Liquid Glass — Light Mode (Clean, restrained, tactile).

export const Colors = {
  // Apple iOS grouped system background
  bgDeep: '#E5E5EA',
  bgBase: '#F2F2F7',      // Primary app canvas
  bgLayer: '#FFFFFF',     // Solid elevated layer

  // Apple frosted liquid glass surfaces
  glassLight: 'rgba(255, 255, 255, 0.72)',
  glassMid: 'rgba(255, 255, 255, 0.88)',
  glassBright: '#FFFFFF',
  glassWhite: '#FFFFFF',

  // Crisp micro-borders
  borderGlass: 'rgba(0, 0, 0, 0.06)',
  borderGlassBright: 'rgba(0, 0, 0, 0.12)',

  // Brand accent — chic editorial black with indigo touches
  accent: '#1C1C1E',
  accentLight: '#007AFF',

  // Status colors (functional Apple Light Mode tints)
  statusClean: '#34C759',     // Apple system green
  statusWorn: '#FF9500',      // Apple system orange / amber
  statusLaundry: '#FF6B35',
  statusDrying: '#007AFF',    // Apple system blue
  statusMisplaced: '#FF3B30', // Apple system red

  // Typography (Apple Light Mode hierarchy)
  white: '#FFFFFF',
  textPrimary: '#1C1C1E',     // Deep near-black
  textSecondary: '#636366',   // Neutral mid-gray
  textTertiary: '#8E8E93',    // Light neutral gray
  textInactive: '#C7C7CC',    // Subtle placeholder gray
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
