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
  clean: '#34D399',
  worn: '#FBBF24',
  in_laundry: '#FB923C',
  drying: '#60A5FA',
  misplaced: '#F87171',
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
