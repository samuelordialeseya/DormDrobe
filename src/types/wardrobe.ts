// ─── DormDrobe Data Model ────────────────────────────────────────────

/**
 * Physical locations where clothing can reside.
 * Maps to the user's real-life split between home, dorm, and travel.
 */
export type Location = 'calamba_home' | 'batangas_dorm' | 'in_transit_bag';

/**
 * Current cleanliness / lifecycle status of a clothing item.
 */
export type Status = 'clean' | 'worn' | 'in_laundry' | 'drying' | 'misplaced';

/**
 * Broad clothing categories used for filtering and outfit generation.
 */
export type Category =
  | 'tops'
  | 'bottoms'
  | 'underwear'
  | 'footwear'
  | 'outerwear'
  | 'accessories';

/**
 * A single garment tracked in the wardrobe.
 */
export interface ClothingItem {
  /** UUID */
  id: string;
  /** Human-readable name, e.g. "White Uniqlo Tee #2" */
  name: string;
  category: Category;
  /** Primary color for display chips */
  color: string;
  /** Brand / label, nullable for unbranded items */
  brand: string | null;
  /** Where the item currently is */
  location: Location;
  /** Cleanliness state */
  status: Status;
  /** Local file URI or remote URL; null if not yet photographed */
  imageUrl: string | null;
  /** Flagged for school-uniform outfit generation */
  isUniformWhiteTee: boolean;
  /** ISO timestamp of last wear */
  lastWornAt: string | null;
  /** Free-form notes */
  notes: string;
  /** ISO timestamp of creation */
  createdAt: string;
}

// ─── Display helpers ─────────────────────────────────────────────────

export interface LocationNames {
  batangas_dorm: string;
  calamba_home: string;
  in_transit_bag: string;
}

export const DEFAULT_LOCATION_NAMES: LocationNames = {
  batangas_dorm: 'Batangas Dorm',
  calamba_home: 'Calamba Home',
  in_transit_bag: 'In-Transit Bag',
};

export const LOCATION_LABELS: Record<Location, string> = {
  calamba_home: 'Calamba Home',
  batangas_dorm: 'Batangas Dorm',
  in_transit_bag: 'In-Transit Bag',
};

export const STATUS_LABELS: Record<Status, string> = {
  clean: 'Clean',
  worn: 'Worn',
  in_laundry: 'In Laundry',
  drying: 'Drying',
  misplaced: 'Misplaced',
};

export const STATUS_COLORS: Record<Status, string> = {
  clean: '#16A34A',
  worn: '#D97706',
  in_laundry: '#EA580C',
  drying: '#2563EB',
  misplaced: '#DC2626',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  tops: 'Tops',
  bottoms: 'Bottoms',
  underwear: 'Underwear',
  footwear: 'Footwear',
  outerwear: 'Outerwear',
  accessories: 'Accessories',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  tops: 'tops',
  bottoms: 'bottoms',
  underwear: 'underwear',
  footwear: 'footwear',
  outerwear: 'outerwear',
  accessories: 'accessories',
};

/**
 * A curated outfit saved to the user's permanent Lookbook.
 */
export interface SavedOutfit {
  id: string;
  name: string;
  topId: string;
  bottomId: string;
  shoesId?: string | null;
  accessoriesId?: string | null;
  tags: string[];
  createdAt: string;
  lastWornAt?: string | null;
}

/**
 * Historical record of an outfit worn on a specific date.
 */
export interface WearLogEntry {
  id: string;
  outfitName?: string;
  itemIds: string[];
  wornAt: string;
  location: Location;
}

/**
 * Curated color palette swatches for fast item creation & tagging.
 */
export const COLOR_SWATCHES = [
  { name: 'White', hex: '#FFFFFF', border: '#D1D5DB' },
  { name: 'Black', hex: '#1C1C1E', border: '#1C1C1E' },
  { name: 'Navy', hex: '#1B2A4A', border: '#1B2A4A' },
  { name: 'Gray', hex: '#8E8E93', border: '#8E8E93' },
  { name: 'Khaki', hex: '#C3B091', border: '#C3B091' },
  { name: 'Olive', hex: '#6B7C45', border: '#6B7C45' },
  { name: 'Beige', hex: '#E6D7C3', border: '#D4C4A8' },
  { name: 'Brown', hex: '#8B5E3C', border: '#8B5E3C' },
  { name: 'Blue', hex: '#3478F6', border: '#3478F6' },
  { name: 'Green', hex: '#30D158', border: '#30D158' },
  { name: 'Red', hex: '#FF3B30', border: '#FF3B30' },
  { name: 'Yellow', hex: '#FFD60A', border: '#FFD60A' },
] as const;

