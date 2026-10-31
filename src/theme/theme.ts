// ─── DormDrobe Design System ─────────────────────────────────────────
// Brand Identity: "Architectural Capsule Utility" (Warm Atelier Minimalist)
// Tactile linen canvas, warm obsidian ink, and functional botanical semantic accents.

export const Colors = {
  // Canvas & background hierarchy
  bgDeep: '#EBE9E1',          // Recessed desktop / frame canvas
  bgBase: '#F6F5F0',          // Primary warm linen app canvas
  bgLayer: '#FFFFFF',         // Crisp elevated surface
  bgSubtle: '#EFECE5',        // Recessed search, segmented toggles & tracks

  // Frosted liquid glass surfaces
  glassLight: 'rgba(255, 255, 255, 0.76)',
  glassMid: 'rgba(255, 255, 255, 0.90)',
  glassBright: '#FFFFFF',
  glassWhite: '#FFFFFF',

  // Tactile micro-borders
  borderGlass: 'rgba(20, 20, 19, 0.07)',
  borderGlassBright: 'rgba(20, 20, 19, 0.13)',
  borderSubtle: 'rgba(20, 20, 19, 0.04)',

  // Brand accents & anchors
  accent: '#141413',          // Obsidian Noir (primary interactive ink)
  accentLight: '#2563EB',     // International Cobalt
  accentSoft: '#2E2D2B',
  accentTerracotta: '#C25E3E',
  accentSage: '#446B54',

  // Location Brand Anchors
  locBatangas: '#1D4ED8',     // Coastal Indigo (Batangas Dorm)
  locBatangasBg: '#EFF6FF',
  locCalamba: '#B45309',      // Warm Terracotta Ochre (Calamba Home)
  locCalambaBg: '#FFFBEB',
  locInTransit: '#4D6B53',    // Commuter Sage (In-Transit Bag)
  locInTransitBg: '#F0FDF4',

  // Semantic Status Tints (Botanical & Mineral Cleanliness Spectrum)
  statusClean: '#16A34A',     // Laurel Forest Green (Clean & Ready)
  statusWorn: '#D97706',      // Golden Ochre (Worn / Wearable)
  statusLaundry: '#0284C7',   // Fresh Cerulean Wash Blue (In Laundry - crisp & distinct from worn)
  statusDrying: '#2563EB',    // Cobalt Air (Drying)
  statusMisplaced: '#DC2626', // Brick Crimson (Misplaced)

  // Typography hierarchy
  white: '#FFFFFF',
  textPrimary: '#141413',     // Deep warm obsidian
  textSecondary: '#4A4843',   // Mineral graphite (high contrast, WCAG AAA)
  textTertiary: '#68655E',    // Soft stone neutral (calibrated >4.5:1 WCAG AA on linen)
  textInactive: '#9A978F',    // Quiet placeholder / secondary cue
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
  largeTitle: { fontSize: 34, fontWeight: '700' as const, letterSpacing: -0.6 },
  title1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  title2: { fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.4 },
  title3: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.3 },
  headline: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '400' as const, letterSpacing: -0.1 },
  callout: { fontSize: 14, fontWeight: '400' as const, letterSpacing: -0.1 },
  subheadline: { fontSize: 13, fontWeight: '400' as const, letterSpacing: 0 },
  footnote: { fontSize: 12, fontWeight: '400' as const, letterSpacing: 0 },
  caption1: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.2 },
  caption2: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.4 },
};
