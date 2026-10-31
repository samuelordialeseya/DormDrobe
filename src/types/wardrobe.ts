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
  /** Times worn since last wash (0 when clean, >= 1 when worn). Resets when marked Clean. */
  wearCount?: number;
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
  in_transit_bag: 'Transit Bag',
};

export const LOCATION_LABELS: Record<Location, string> = {
  calamba_home: 'Calamba Home',
  batangas_dorm: 'Batangas Dorm',
  in_transit_bag: 'Transit Bag',
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
  in_laundry: '#0284C7',
  drying: '#2563EB',
  misplaced: '#DC2626',
};

/**
 * The simplified 3-step lifecycle shown in the UI: Clean → Worn → In Laundry → Clean.
 * `drying` stays in the `Status` union only so legacy stored rows never break;
 * it is normalized to `in_laundry` on load.
 */
export const ACTIVE_STATUSES: Status[] = ['clean', 'worn', 'in_laundry'];

/** Statuses that mean "needs washing" (Worn, In Laundry, plus legacy Drying). */
export const DIRTY_STATUSES: Status[] = ['worn', 'in_laundry', 'drying'];

/** True when a piece is worn / in laundry. Everything else sits in the "Clean & Ready" zone. */
export const isDirtyStatus = (status: Status): boolean => DIRTY_STATUSES.includes(status);

/**
 * Times a piece has been worn since its last wash.
 * Worn pieces always count as at least 1; every other status counts as 0.
 */
export function getWornCount(item: { status: Status; wearCount?: number }): number {
  if (item.status !== 'worn') return 0;
  return Math.max(1, item.wearCount ?? 1);
}

/** Status label with the wear count baked in for worn pieces, e.g. "Worn · 2x". */
export function formatStatusLabel(status: Status, wearCount?: number): string {
  if (status === 'worn') return `Worn · ${Math.max(1, wearCount ?? 1)}x`;
  return STATUS_LABELS[status];
}

/** "1 time" / "2 times" */
export function formatTimes(count: number): string {
  return `${count} ${count === 1 ? 'time' : 'times'}`;
}

/**
 * Determines whether a piece is considered socks (socks, ankle socks, crew socks, stockings, etc.)
 */
export function isSockItem(item?: { name?: string; category?: string; notes?: string } | null): boolean {
  if (!item || !item.name) return false;
  const text = `${item.name} ${item.notes || ''}`.toLowerCase();
  const hasSockTerm = /\b(socks?|medyas|stockings?|hosiery)\b/i.test(text);
  if (hasSockTerm) return true;
  return (
    (item.category === 'underwear' || item.category === 'accessories' || item.category === 'footwear') &&
    text.includes('sock')
  );
}

/**
 * Determines whether a piece is considered an undergarment (boxers, briefs, trunks, panties, undershirts, etc.)
 */
export function isUndergarmentItem(item?: { name?: string; category?: string; notes?: string } | null): boolean {
  if (!item) return false;
  if (item.category !== 'underwear') return false;
  return !isSockItem(item);
}

/** True when a piece is either socks or an undergarment (intimates / basics). */
export function isIntimatesItem(item?: { name?: string; category?: string; notes?: string } | null): boolean {
  if (!item) return false;
  return isSockItem(item) || isUndergarmentItem(item);
}

/** The primary zones of the Closet screen: All clothes, Clean & ready, Laundry / worn, and Transit bag. */
export type ClosetSubTab = 'all' | 'clean' | 'laundry' | 'bag';

/** What to do with dirty (worn / in-laundry) pieces when the Transit Bag is unpacked. */
export type UnpackStatusAction = 'clean' | 'in_laundry' | 'keep';

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
 * Step-by-step "Get Dressed" Wizard slot types & metadata.
 */
export type WizardSlot =
  | 'tops'
  | 'bottoms'
  | 'underwear'
  | 'outerwear'
  | 'footwear'
  | 'socks'
  | 'accessories';

export interface WizardSlotMeta {
  slot: WizardSlot;
  label: string;
  singularLabel: string;
  questionPrompt: string;
  shortDesc: string;
  iconCategory: Category | 'socks';
  isEssentialDefault: boolean;
}

export const WIZARD_SLOTS: WizardSlotMeta[] = [
  {
    slot: 'tops',
    label: 'Tops',
    singularLabel: 'top',
    questionPrompt: 'Which top do you want to wear?',
    shortDesc: 'Shirts, tees & polos',
    iconCategory: 'tops',
    isEssentialDefault: true,
  },
  {
    slot: 'bottoms',
    label: 'Bottoms',
    singularLabel: 'bottom',
    questionPrompt: 'Which bottoms do you want to wear?',
    shortDesc: 'Pants, jeans & shorts',
    iconCategory: 'bottoms',
    isEssentialDefault: true,
  },
  {
    slot: 'underwear',
    label: 'Underwear',
    singularLabel: 'underwear',
    questionPrompt: 'Which underwear are you putting on?',
    shortDesc: 'Daily undergarments & basics',
    iconCategory: 'underwear',
    isEssentialDefault: true,
  },
  {
    slot: 'outerwear',
    label: 'Outerwear',
    singularLabel: 'outerwear piece',
    questionPrompt: 'Which outerwear do you want to layer?',
    shortDesc: 'Jackets, hoodies & cardigans',
    iconCategory: 'outerwear',
    isEssentialDefault: false,
  },
  {
    slot: 'footwear',
    label: 'Footwear',
    singularLabel: 'pair of shoes',
    questionPrompt: 'Which footwear are you wearing?',
    shortDesc: 'Sneakers, shoes & slides',
    iconCategory: 'footwear',
    isEssentialDefault: false,
  },
  {
    slot: 'socks',
    label: 'Socks',
    singularLabel: 'pair of socks',
    questionPrompt: 'Which socks do you want to wear?',
    shortDesc: 'Crew, ankle & dress socks',
    iconCategory: 'socks',
    isEssentialDefault: false,
  },
  {
    slot: 'accessories',
    label: 'Accessories',
    singularLabel: 'accessory',
    questionPrompt: 'Which accessory are you bringing?',
    shortDesc: 'Caps, bags, belts & watches',
    iconCategory: 'accessories',
    isEssentialDefault: false,
  },
];

export const DEFAULT_ESSENTIAL_SLOTS: WizardSlot[] = ['tops', 'bottoms', 'underwear'];

/**
 * Matches a ClothingItem to one of the 7 distinct WizardSlots.
 */
export function doesItemMatchWizardSlot(item: ClothingItem, slot: WizardSlot): boolean {
  switch (slot) {
    case 'tops':
      return item.category === 'tops';
    case 'bottoms':
      return item.category === 'bottoms';
    case 'underwear':
      return isUndergarmentItem(item);
    case 'outerwear':
      return item.category === 'outerwear';
    case 'footwear':
      return item.category === 'footwear' && !isSockItem(item);
    case 'socks':
      return isSockItem(item);
    case 'accessories':
      return item.category === 'accessories' && !isSockItem(item);
    default:
      return false;
  }
}

/**
 * A curated outfit saved to the user's permanent Lookbook.
 */
export interface SavedOutfit {
  id: string;
  name: string;
  topId: string;
  bottomId: string;
  outerwearId?: string | null;
  shoesId?: string | null;
  accessoriesId?: string | null;
  socksId?: string | null;
  underwearId?: string | null;
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

