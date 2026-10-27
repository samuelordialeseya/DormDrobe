import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  ClothingItem,
  Location,
  Status,
  Category,
  SavedOutfit,
  WearLogEntry,
  ClosetSubTab,
  UnpackStatusAction,
  DIRTY_STATUSES,
  LOCATION_LABELS,
  LocationNames,
  DEFAULT_LOCATION_NAMES,
} from '../types/wardrobe';
import { MOCK_CLOTHING } from '../utils/mockData';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { AppStorage } from '../utils/storage';
import SonnerToast, { ToastConfig } from '../components/SonnerToast';

// ─── Storage keys ────────────────────────────────────────────────────
const STORAGE_KEY = '@dormdrobe/clothing';
const LOCATION_KEY = '@dormdrobe/current_location';
const LOCATION_NAMES_KEY = '@dormdrobe/location_names';
const OUTFITS_KEY = '@dormdrobe/saved_outfits';
const WEAR_LOGS_KEY = '@dormdrobe/wear_history';


// ─── Supabase Snake <-> Camel mapping helpers ────────────────────────
function toDbItem(it: ClothingItem) {
  return {
    id: it.id,
    name: it.name,
    category: it.category,
    color: it.color,
    brand: it.brand,
    location: it.location,
    status: it.status,
    image_url: it.imageUrl,
    is_uniform_white_tee: it.isUniformWhiteTee,
    last_worn_at: it.lastWornAt,
    notes: it.notes,
    created_at: it.createdAt,
  };
}

function fromDbItem(db: any): ClothingItem {
  return {
    id: db.id,
    name: db.name,
    category: db.category,
    color: db.color,
    brand: db.brand ?? null,
    location: db.location,
    status: db.status,
    imageUrl: db.image_url ?? null,
    isUniformWhiteTee: !!db.is_uniform_white_tee,
    lastWornAt: db.last_worn_at ?? null,
    notes: db.notes ?? '',
    createdAt: db.created_at ?? new Date().toISOString(),
  };
}

// ─── Legacy status normalization ─────────────────────────────────────
// The UI now uses a 3-step lifecycle (Clean → Worn → In Laundry). Any stored
// `drying` rows are folded into `in_laundry` so nothing gets orphaned.
function normalizeLegacyStatuses(list: ClothingItem[]): { items: ClothingItem[]; changed: boolean } {
  let changed = false;
  const next = list.map((it) => {
    if (it.status === 'drying') {
      changed = true;
      return { ...it, status: 'in_laundry' as Status };
    }
    return it;
  });
  return { items: next, changed };
}

// ─── Context shape ───────────────────────────────────────────────────
interface WardrobeState {
  /** All clothing items (the single source of truth) */
  items: ClothingItem[];
  /** Synced user active location ("I'm currently at Dorm" vs "at Home") */
  currentLocation: Location;
  /** Which of the 3 Closet zones is showing (Home deep-links into these) */
  closetTab: ClosetSubTab;
  /** True while the Closet is in the "Pack Bag" checklist session */
  isPackingSession: boolean;
  /** Currently selected location filter (null = All) */
  locationFilter: Location | null;
  /** Currently selected status filter (null = All) */
  statusFilter: Status | null;
  /** Current search query */
  searchQuery: string;
  /** Whether to filter to only school uniform pieces */
  uniformFilter: boolean;
  /** Whether the initial load is still happening */
  loading: boolean;
  /** Saved lookbook outfits */
  savedOutfits: SavedOutfit[];
  /** Historical wear logs */
  wearHistory: WearLogEntry[];
  /** User-customizable nicknames for Dorm, Home, and Bag */
  locationNames: LocationNames;

  // ── Actions ──────────────────────────────────────────────────────
  setCurrentLocation: (loc: Location) => void;
  setClosetTab: (tab: ClosetSubTab) => void;
  setIsPackingSession: (active: boolean) => void;
  setLocationFilter: (loc: Location | null) => void;
  setStatusFilter: (st: Status | null) => void;
  setSearchQuery: (q: string) => void;
  setUniformFilter: (val: boolean) => void;
  updateLocationNames: (names: Partial<LocationNames>) => void;
  getLocationLabel: (loc: Location) => string;
  addItem: (item: ClothingItem) => void;
  /** Add multiple items in one batch (e.g. quantity x3) */
  addItems: (newItems: ClothingItem[]) => void;
  /** Duplicate an existing item with an incremented name */
  duplicateItem: (id: string) => void;
  updateItem: (id: string, patch: Partial<ClothingItem>) => void;
  deleteItem: (id: string) => void;
  /** Batch: move selected items to a target location */
  batchMoveItems: (ids: string[], to: Location) => void;
  /**
   * Batch: set the status of specific items. When `toastMessage` is given, shows a
   * toast whose Undo restores each item's *own* previous status (and only those items).
   */
  batchSetStatusByIds: (ids: string[], newStatus: Status, toastMessage?: string) => void;
  /** 1-tap card action: Clean → Worn → In Laundry → Clean, with an Undo toast */
  advanceItemStatus: (id: string) => void;
  /**
   * Unpack Bag: moves all items in 'in_transit_bag' to target location.
   * `statusAction` decides what happens to dirty (worn / in-laundry) pieces.
   */
  unpackTransitBag: (toLocation: Location, statusAction?: UnpackStatusAction) => void;
  /** Lookbook: save an outfit combination */
  addSavedOutfit: (outfit: SavedOutfit) => void;
  /** Lookbook: remove an outfit */
  deleteSavedOutfit: (id: string) => void;
  /** Outfit History: log that an outfit was worn today */
  logOutfitWorn: (itemIds: string[], outfitName?: string, outfitId?: string) => void;
  /** Outfit History: delete a specific wear log entry */
  deleteWearLog: (id: string) => void;
  /** Reset all items, lookbook, and logs back to default seed data */
  resetToSeedData: () => Promise<void>;
  /** Clear all items, lookbook, and logs to test or start completely empty */
  clearAllData: () => Promise<void>;
  /** Sonner Toast: display a non-blocking toast with optional Undo action */
  showToast: (config: Omit<ToastConfig, 'id'>) => void;
  /** Export all wardrobe data, lookbooks, and logs as a formatted JSON string */
  exportBackup: () => Promise<string>;
  /** Restore all wardrobe data from a JSON backup string */
  restoreBackup: (jsonString: string) => Promise<{ success: boolean; count: number; error?: string }>;
  /** Computed: filtered items based on current filters & search */
  filteredItems: ClothingItem[];
  /** Computed: count of items matching a query */
  countItems: (filter: {
    location?: Location;
    status?: Status;
    category?: Category;
  }) => number;
}

const WardrobeContext = createContext<WardrobeState | null>(null);

// ─── Provider ────────────────────────────────────────────────────────
export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [currentLocation, setCurrentLocationState] = useState<Location>('batangas_dorm');
  const [closetTab, setClosetTab] = useState<ClosetSubTab>('all');
  const [isPackingSession, setIsPackingSession] = useState(false);
  const [locationNames, setLocationNames] = useState<LocationNames>(DEFAULT_LOCATION_NAMES);
  const [locationFilter, setLocationFilter] = useState<Location | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | null>(null);
  const [uniformFilter, setUniformFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [wearHistory, setWearHistory] = useState<WearLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastConfig | null>(null);

  // ── Toast helper ───────────────────────────────────────────────────
  const showToast = useCallback((config: Omit<ToastConfig, 'id'>) => {
    setToast({
      ...config,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  // ── Persist helpers ────────────────────────────────────────────────
  const persist = useCallback(async (next: ClothingItem[]) => {
    try {
      await AppStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('[DormDrobe] Failed to persist items', e);
    }
  }, []);

  const persistOutfits = useCallback(async (next: SavedOutfit[]) => {
    try {
      await AppStorage.setItem(OUTFITS_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('[DormDrobe] Failed to persist outfits', e);
    }
  }, []);

  const persistWearHistory = useCallback(async (next: WearLogEntry[]) => {
    try {
      await AppStorage.setItem(WEAR_LOGS_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('[DormDrobe] Failed to persist wear history', e);
    }
  }, []);

  const setCurrentLocation = useCallback(async (loc: Location) => {
    setCurrentLocationState(loc);
    try {
      await AppStorage.setItem(LOCATION_KEY, loc);
    } catch (e) {
      console.warn('[DormDrobe] Failed to persist current location', e);
    }
  }, []);

  // ── Load from Supabase (or fallback to AsyncStorage / mock) ───────
  useEffect(() => {
    (async () => {
      try {
        // Load active location
        const storedLoc = await AppStorage.getItem(LOCATION_KEY);
        if (storedLoc === 'batangas_dorm' || storedLoc === 'calamba_home') {
          setCurrentLocationState(storedLoc);
        }

        // Load custom location names
        const storedNames = await AppStorage.getItem(LOCATION_NAMES_KEY);
        if (storedNames) {
          try {
            setLocationNames({ ...DEFAULT_LOCATION_NAMES, ...JSON.parse(storedNames) });
          } catch {}
        }

        // Load saved outfits
        const storedOutfits = await AppStorage.getItem(OUTFITS_KEY);
        if (storedOutfits) {
          try {
            const parsedOutfits: SavedOutfit[] = JSON.parse(storedOutfits);
            // Auto-repair any legacy mock-* references to real mock item IDs
            let hadRepairs = false;
            const repaired = parsedOutfits.map((o) => {
              let changed = false;
              let topId = o.topId;
              let bottomId = o.bottomId;
              let shoesId = o.shoesId;
              if (topId === 'mock-1') { topId = '1a'; changed = true; }
              if (topId === 'mock-2') { topId = '2a'; changed = true; }
              if (bottomId === 'mock-4') { bottomId = '3b'; changed = true; }
              if (bottomId === 'mock-5') { bottomId = '3a'; changed = true; }
              if (shoesId === 'mock-6') { shoesId = '5a'; changed = true; }
              if (changed) hadRepairs = true;
              return changed ? { ...o, topId, bottomId, shoesId } : o;
            });
            setSavedOutfits(repaired);
            if (hadRepairs) {
              persistOutfits(repaired);
            }
          } catch {
            setSavedOutfits([]);
          }
        } else {
          // Initial seed outfit if none exists
          const initialOutfits: SavedOutfit[] = [
            {
              id: 'outfit-seed-1',
              name: 'Monday White Tee Uniform',
              topId: '1a',
              bottomId: '3b',
              shoesId: '5a',
              tags: ['uniform', 'campus'],
              createdAt: new Date().toISOString(),
              lastWornAt: null,
            },
            {
              id: 'outfit-seed-2',
              name: 'Friday Commute Casual',
              topId: '2a',
              bottomId: '3a',
              shoesId: '5a',
              tags: ['commute', 'weekend'],
              createdAt: new Date().toISOString(),
              lastWornAt: null,
            },
          ];
          setSavedOutfits(initialOutfits);
          persistOutfits(initialOutfits);
        }

        // Load wear history
        const storedWearLogs = await AppStorage.getItem(WEAR_LOGS_KEY);
        if (storedWearLogs) {
          try {
            setWearHistory(JSON.parse(storedWearLogs));
          } catch {
            setWearHistory([]);
          }
        }

        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from('clothing_items')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            const parsed = data.map(fromDbItem);
            let hasBackfill = false;
            const enriched = parsed.map((item) => {
              const mockMatch = MOCK_CLOTHING.find(
                (m) => m.id === item.id || m.name.toLowerCase() === item.name.toLowerCase()
              );
              if (mockMatch?.imageUrl && (!item.imageUrl || item.imageUrl.includes('unsplash.com'))) {
                hasBackfill = true;
                return { ...item, imageUrl: mockMatch.imageUrl };
              }
              return item;
            });

            const { items: normalized, changed: hadDrying } = normalizeLegacyStatuses(enriched);
            if (hadDrying) {
              supabase
                .from('clothing_items')
                .update({ status: 'in_laundry' })
                .eq('status', 'drying')
                .then(() => {});
            }

            setItems(normalized);
            await persist(normalized);
            if (hasBackfill) {
              enriched.forEach((item) => {
                if (item.imageUrl) {
                  supabase
                    .from('clothing_items')
                    .update({ image_url: item.imageUrl })
                    .eq('id', item.id)
                    .then(() => {});
                }
              });
            }
            setLoading(false);
            return;
          }
        }

        // Local storage / first launch
        const stored = await AppStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: ClothingItem[] = JSON.parse(stored);
          // Auto-backfill sample images for seeded mock items that lacked images
          let hasBackfill = false;
          const updated = parsed.map((item) => {
            const mockMatch = MOCK_CLOTHING.find(
              (m) => m.id === item.id || m.name.toLowerCase() === item.name.toLowerCase()
            );
            if (mockMatch?.imageUrl && (!item.imageUrl || item.imageUrl.includes('unsplash.com'))) {
              hasBackfill = true;
              return { ...item, imageUrl: mockMatch.imageUrl };
            }
            return item;
          });

          const { items: normalized, changed: hadDrying } = normalizeLegacyStatuses(updated);
          setItems(normalized);
          if (hasBackfill || hadDrying) {
            await persist(normalized);
          }
        } else {
          setItems(MOCK_CLOTHING);
          await persist(MOCK_CLOTHING);

          // Seed Supabase if newly connected and empty
          if (isSupabaseConfigured) {
            supabase
              .from('clothing_items')
              .insert(MOCK_CLOTHING.map(toDbItem))
              .then(() => console.log('[DormDrobe] Seeded Supabase with initial wardrobe'));
          }
        }
      } catch (err) {
        console.warn('[DormDrobe] Load error, using mock data:', err);
        setItems(MOCK_CLOTHING);
      } finally {
        setLoading(false);
      }
    })();
  }, [persist, persistOutfits]);

  // ── CRUD ──────────────────────────────────────────────────────────
  const addItem = useCallback(
    (item: ClothingItem) => {
      setItems((prev) => {
        const next = [item, ...prev];
        persist(next);
        return next;
      });

      if (isSupabaseConfigured) {
        supabase
          .from('clothing_items')
          .insert(toDbItem(item))
          .then(({ error }) => {
            if (error) console.warn('[DormDrobe] Supabase insert error:', error.message);
          });
      }
    },
    [persist],
  );

  const addItems = useCallback(
    (newItems: ClothingItem[]) => {
      if (newItems.length === 0) return;
      setItems((prev) => {
        const next = [...newItems, ...prev];
        persist(next);
        return next;
      });

      if (isSupabaseConfigured) {
        supabase
          .from('clothing_items')
          .insert(newItems.map(toDbItem))
          .then(({ error }) => {
            if (error) console.warn('[DormDrobe] Supabase batch insert error:', error.message);
          });
      }

      showToast({
        message: `Added ${newItems.length} items to wardrobe`,
        type: 'success',
        action: {
          label: 'Undo',
          onPress: () => {
            const addedIds = new Set(newItems.map((i) => i.id));
            setItems((prev) => {
              const next = prev.filter((i) => !addedIds.has(i.id));
              persist(next);
              return next;
            });
            if (isSupabaseConfigured) {
              supabase
                .from('clothing_items')
                .delete()
                .in('id', Array.from(addedIds))
                .then(() => {});
            }
          },
        },
      });
    },
    [persist, showToast],
  );

  const duplicateItem = useCallback(
    (id: string) => {
      const target = items.find((it) => it.id === id);
      if (!target) return;

      let newName = target.name;
      const numMatch = target.name.match(/^(.*?)\s*#(\d+)$/);
      if (numMatch) {
        const base = numMatch[1];
        const nextNum = parseInt(numMatch[2], 10) + 1;
        newName = `${base} #${nextNum}`;
      } else {
        newName = `${target.name} #2`;
      }

      const duplicate: ClothingItem = {
        ...target,
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: newName,
        createdAt: new Date().toISOString(),
      };

      setItems((prev) => {
        const next = [duplicate, ...prev];
        persist(next);
        return next;
      });

      if (isSupabaseConfigured) {
        supabase
          .from('clothing_items')
          .insert(toDbItem(duplicate))
          .then(() => {});
      }

      showToast({
        message: `Duplicated as "${newName}"`,
        type: 'success',
        action: {
          label: 'Undo',
          onPress: () => {
            setItems((prev) => {
              const next = prev.filter((it) => it.id !== duplicate.id);
              persist(next);
              return next;
            });
            if (isSupabaseConfigured) {
              supabase
                .from('clothing_items')
                .delete()
                .eq('id', duplicate.id)
                .then(() => {});
            }
          },
        },
      });
    },
    [items, persist, showToast],
  );

  const updateItem = useCallback(
    (id: string, patch: Partial<ClothingItem>) => {
      setItems((prev) => {
        const next = prev.map((it) =>
          it.id === id ? { ...it, ...patch } : it,
        );
        persist(next);
        return next;
      });

      if (isSupabaseConfigured) {
        const dbPatch: any = {};
        if (patch.name !== undefined) dbPatch.name = patch.name;
        if (patch.category !== undefined) dbPatch.category = patch.category;
        if (patch.color !== undefined) dbPatch.color = patch.color;
        if (patch.brand !== undefined) dbPatch.brand = patch.brand;
        if (patch.location !== undefined) dbPatch.location = patch.location;
        if (patch.status !== undefined) dbPatch.status = patch.status;
        if (patch.imageUrl !== undefined) dbPatch.image_url = patch.imageUrl;
        if (patch.isUniformWhiteTee !== undefined) dbPatch.is_uniform_white_tee = patch.isUniformWhiteTee;
        if (patch.lastWornAt !== undefined) dbPatch.last_worn_at = patch.lastWornAt;
        if (patch.notes !== undefined) dbPatch.notes = patch.notes;

        supabase
          .from('clothing_items')
          .update(dbPatch)
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.warn('[DormDrobe] Supabase update error:', error.message);
          });
      }
    },
    [persist],
  );

  const deleteItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.filter((it) => it.id !== id);
        persist(next);
        return next;
      });

      // Safely update saved outfits referencing this item
      setSavedOutfits((prev) => {
        const next = prev.map((o) => {
          if (o.shoesId === id) return { ...o, shoesId: null };
          if (o.accessoriesId === id) return { ...o, accessoriesId: null };
          return o;
        });
        persistOutfits(next);
        return next;
      });

      if (isSupabaseConfigured) {
        supabase
          .from('clothing_items')
          .delete()
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.warn('[DormDrobe] Supabase delete error:', error.message);
          });
      }
    },
    [persist, persistOutfits],
  );

  // ── Batch ops ─────────────────────────────────────────────────────
  const batchMoveItems = useCallback(
    (ids: string[], to: Location) => {
      setItems((prev) => {
        const idSet = new Set(ids);
        const next = prev.map((it) =>
          idSet.has(it.id) ? { ...it, location: to } : it,
        );
        persist(next);
        return next;
      });

      if (isSupabaseConfigured) {
        supabase
          .from('clothing_items')
          .update({ location: to })
          .in('id', ids)
          .then(({ error }) => {
            if (error) console.warn('[DormDrobe] Supabase batch move error:', error.message);
          });
      }
    },
    [persist],
  );

  // Applies one status to a set of ids (state + storage + Supabase). No toast.
  const applyStatusToIds = useCallback(
    (ids: string[], newStatus: Status) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      setItems((prev) => {
        const next = prev.map((it) =>
          idSet.has(it.id) ? { ...it, status: newStatus } : it,
        );
        persist(next);
        return next;
      });

      if (isSupabaseConfigured) {
        supabase
          .from('clothing_items')
          .update({ status: newStatus })
          .in('id', ids)
          .then(({ error }) => {
            if (error) console.warn('[DormDrobe] Supabase batch status error:', error.message);
          });
      }
    },
    [persist],
  );

  const batchSetStatusByIds = useCallback(
    (ids: string[], newStatus: Status, toastMessage?: string) => {
      if (ids.length === 0) return;

      // Snapshot each affected item's own previous status so Undo only touches them.
      const idSet = new Set(ids);
      const snapshot = items
        .filter((it) => idSet.has(it.id))
        .map((it) => ({ id: it.id, status: it.status }));

      applyStatusToIds(ids, newStatus);

      if (toastMessage) {
        showToast({
          message: toastMessage,
          type: 'success',
          action: {
            label: 'Undo',
            onPress: () => {
              const groups = new Map<Status, string[]>();
              snapshot.forEach(({ id, status }) => {
                groups.set(status, [...(groups.get(status) ?? []), id]);
              });
              groups.forEach((groupIds, status) => applyStatusToIds(groupIds, status));
            },
          },
        });
      }
    },
    [items, applyStatusToIds, showToast],
  );

  // ── 1-tap card action: Clean → Worn → In Laundry → Clean ──────────
  const advanceItemStatus = useCallback(
    (id: string) => {
      const target = items.find((it) => it.id === id);
      if (!target) return;

      const prevStatus = target.status;
      const prevLastWornAt = target.lastWornAt;
      const nextStatus: Status =
        prevStatus === 'clean' ? 'worn' : prevStatus === 'worn' ? 'in_laundry' : 'clean';

      updateItem(
        id,
        nextStatus === 'worn'
          ? { status: nextStatus, lastWornAt: new Date().toISOString() }
          : { status: nextStatus },
      );

      const message =
        nextStatus === 'worn'
          ? `Wearing ${target.name} today`
          : nextStatus === 'in_laundry'
          ? `${target.name} moved to Laundry`
          : `${target.name} is clean & ready`;

      showToast({
        message,
        type: 'success',
        action: {
          label: 'Undo',
          onPress: () => updateItem(id, { status: prevStatus, lastWornAt: prevLastWornAt }),
        },
      });
    },
    [items, updateItem, showToast],
  );

  const updateLocationNames = useCallback(async (patch: Partial<LocationNames>) => {
    setLocationNames((prev) => {
      const next = { ...prev, ...patch };
      AppStorage.setItem(LOCATION_NAMES_KEY, JSON.stringify(next)).catch((e) => {
        console.warn('[DormDrobe] Failed to persist location names', e);
      });
      return next;
    });
  }, []);

  const getLocationLabel = useCallback(
    (loc: Location): string => {
      return locationNames[loc] || LOCATION_LABELS[loc] || loc;
    },
    [locationNames],
  );

  // ── Unpack Transit Bag (with optional status update for dirty pieces) ──
  // Writes a location + status per item (state, storage and Supabase).
  const writeLocationAndStatus = useCallback(
    (entries: { id: string; location: Location; status: Status }[]) => {
      if (entries.length === 0) return;
      const byId = new Map(entries.map((e) => [e.id, e]));

      setItems((prev) => {
        const next = prev.map((it) => {
          const e = byId.get(it.id);
          return e ? { ...it, location: e.location, status: e.status } : it;
        });
        persist(next);
        return next;
      });

      if (isSupabaseConfigured) {
        const byLocation = new Map<Location, string[]>();
        const byStatus = new Map<Status, string[]>();
        entries.forEach((e) => {
          byLocation.set(e.location, [...(byLocation.get(e.location) ?? []), e.id]);
          byStatus.set(e.status, [...(byStatus.get(e.status) ?? []), e.id]);
        });
        byLocation.forEach((ids, location) => {
          supabase
            .from('clothing_items')
            .update({ location })
            .in('id', ids)
            .then(({ error }) => {
              if (error) console.warn('[DormDrobe] Supabase unpack error:', error.message);
            });
        });
        byStatus.forEach((ids, status) => {
          supabase
            .from('clothing_items')
            .update({ status })
            .in('id', ids)
            .then(({ error }) => {
              if (error) console.warn('[DormDrobe] Supabase unpack status error:', error.message);
            });
        });
      }
    },
    [persist],
  );

  const unpackTransitBag = useCallback(
    (toLocation: Location, statusAction: UnpackStatusAction = 'keep') => {
      const bagItems = items.filter((it) => it.location === 'in_transit_bag');
      if (bagItems.length === 0) return;

      const count = bagItems.length;
      const dirtyCount = bagItems.filter((i) => DIRTY_STATUSES.includes(i.status)).length;
      const cleanCount = bagItems.filter((i) => i.status === 'clean').length;

      const nextStatusOf = (it: ClothingItem): Status => {
        if (statusAction === 'clean') return 'clean';
        if (statusAction === 'in_laundry' && DIRTY_STATUSES.includes(it.status)) return 'in_laundry';
        return it.status;
      };

      const before = bagItems.map((it) => ({
        id: it.id,
        location: 'in_transit_bag' as Location,
        status: it.status,
      }));
      const after = bagItems.map((it) => ({
        id: it.id,
        location: toLocation,
        status: nextStatusOf(it),
      }));

      writeLocationAndStatus(after);

      let note = '';
      if (dirtyCount > 0) {
        if (statusAction === 'clean') note = ` · ${dirtyCount} marked clean`;
        else if (statusAction === 'in_laundry') note = ` · ${dirtyCount} sent to laundry`;
        else if (cleanCount > 0) note = ` (${cleanCount} clean, ${dirtyCount} to wash)`;
      }

      showToast({
        message: `Unpacked ${count} item${count > 1 ? 's' : ''} to ${getLocationLabel(toLocation)}${note}`,
        type: 'success',
        action: {
          label: 'Undo',
          // Restores only the unpacked items (location + their own previous status).
          onPress: () => writeLocationAndStatus(before),
        },
      });
    },
    [items, writeLocationAndStatus, showToast, getLocationLabel],
  );

  // ── Lookbook & Wear History ─────────────────────────────────────────
  const addSavedOutfit = useCallback(
    (outfit: SavedOutfit) => {
      setSavedOutfits((prev) => {
        const next = [outfit, ...prev.filter((o) => o.id !== outfit.id)];
        persistOutfits(next);
        return next;
      });
      showToast({
        message: `Saved "${outfit.name}" to Lookbook`,
        type: 'success',
      });
    },
    [persistOutfits, showToast],
  );

  const deleteSavedOutfit = useCallback(
    (id: string) => {
      const prevOutfits = [...savedOutfits];
      const target = savedOutfits.find((o) => o.id === id);
      setSavedOutfits((prev) => {
        const next = prev.filter((o) => o.id !== id);
        persistOutfits(next);
        return next;
      });
      showToast({
        message: `Removed "${target?.name ?? 'outfit'}" from Lookbook`,
        type: 'info',
        action: {
          label: 'Undo',
          onPress: () => {
            setSavedOutfits(prevOutfits);
            persistOutfits(prevOutfits);
          },
        },
      });
    },
    [savedOutfits, persistOutfits, showToast],
  );

  const logOutfitWorn = useCallback(
    (itemIds: string[], outfitName?: string, outfitId?: string) => {
      const nowIso = new Date().toISOString();
      const previousItems = [...items];
      const previousOutfits = [...savedOutfits];

      // Update garment lastWornAt and mark as worn
      setItems((prev) => {
        const idSet = new Set(itemIds);
        const next = prev.map((it) =>
          idSet.has(it.id)
            ? { ...it, status: 'worn' as Status, lastWornAt: nowIso }
            : it,
        );
        persist(next);
        return next;
      });

      // Update outfit lastWornAt if an outfitId was passed
      if (outfitId) {
        setSavedOutfits((prev) => {
          const next = prev.map((o) => (o.id === outfitId ? { ...o, lastWornAt: nowIso } : o));
          persistOutfits(next);
          return next;
        });
      }

      if (isSupabaseConfigured) {
        supabase
          .from('clothing_items')
          .update({ status: 'worn', last_worn_at: nowIso })
          .in('id', itemIds)
          .then(() => {});
      }

      // Add wear log entry
      const logEntry: WearLogEntry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        outfitName,
        itemIds,
        wornAt: nowIso,
        location: currentLocation,
      };

      setWearHistory((prev) => {
        const next = [logEntry, ...prev];
        persistWearHistory(next);
        return next;
      });

      showToast({
        message: outfitName ? `Logged "${outfitName}" as worn` : 'Logged outfit as worn today',
        type: 'success',
        action: {
          label: 'Undo',
          onPress: () => {
            setItems(previousItems);
            persist(previousItems);
            if (outfitId) {
              setSavedOutfits(previousOutfits);
              persistOutfits(previousOutfits);
            }
            setWearHistory((prev) => {
              const reverted = prev.filter((l) => l.id !== logEntry.id);
              persistWearHistory(reverted);
              return reverted;
            });
          },
        },
      });
    },
    [items, savedOutfits, currentLocation, persist, persistOutfits, persistWearHistory, showToast],
  );

  const deleteWearLog = useCallback(
    (id: string) => {
      const prevLogs = [...wearHistory];
      const target = wearHistory.find((l) => l.id === id);
      setWearHistory((prev) => {
        const next = prev.filter((l) => l.id !== id);
        persistWearHistory(next);
        return next;
      });
      showToast({
        message: `Removed ${target?.outfitName || 'wear entry'} from log`,
        type: 'info',
        action: {
          label: 'Undo',
          onPress: () => {
            setWearHistory(prevLogs);
            persistWearHistory(prevLogs);
          },
        },
      });
    },
    [wearHistory, persistWearHistory, showToast],
  );

  const resetToSeedData = useCallback(async () => {
    const seedOutfits: SavedOutfit[] = [
      {
        id: 'outfit-seed-1',
        name: 'Monday White Tee Uniform',
        topId: '1a',
        bottomId: '3b',
        shoesId: '5a',
        tags: ['uniform', 'campus'],
        createdAt: new Date().toISOString(),
        lastWornAt: null,
      },
      {
        id: 'outfit-seed-2',
        name: 'Friday Commute Casual',
        topId: '2a',
        bottomId: '3a',
        shoesId: '5a',
        tags: ['commute', 'weekend'],
        createdAt: new Date().toISOString(),
        lastWornAt: null,
      },
    ];

    setItems(MOCK_CLOTHING);
    setSavedOutfits(seedOutfits);
    setWearHistory([]);
    await persist(MOCK_CLOTHING);
    await persistOutfits(seedOutfits);
    await persistWearHistory([]);

    showToast({
      message: 'Reset wardrobe to default starter seed items',
      type: 'success',
    });
  }, [persist, persistOutfits, persistWearHistory, showToast]);

  const clearAllData = useCallback(async () => {
    setItems([]);
    setSavedOutfits([]);
    setWearHistory([]);
    await persist([]);
    await persistOutfits([]);
    await persistWearHistory([]);

    showToast({
      message: 'Cleared all items — started with empty wardrobe',
      type: 'info',
    });
  }, [persist, persistOutfits, persistWearHistory, showToast]);

  // ── Computed ──────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    let result = items;
    if (locationFilter) {
      result = result.filter((it) => it.location === locationFilter);
    }
    if (statusFilter) {
      result = result.filter((it) => it.status === statusFilter);
    }
    if (uniformFilter) {
      result = result.filter((it) => it.isUniformWhiteTee);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          (it.brand?.toLowerCase().includes(q) ?? false) ||
          it.color.toLowerCase().includes(q) ||
          it.notes.toLowerCase().includes(q),
      );
    }
    return result;
  }, [items, locationFilter, statusFilter, uniformFilter, searchQuery]);

  const countItems = useCallback(
    (filter: { location?: Location; status?: Status; category?: Category }) => {
      return items.filter((it) => {
        if (filter.location && it.location !== filter.location) return false;
        if (filter.status && it.status !== filter.status) return false;
        if (filter.category && it.category !== filter.category) return false;
        return true;
      }).length;
    },
    [items],
  );

  // ── Backup & Restore (Local-First Tarsi Architecture) ───────────────
  const exportBackup = useCallback(async (): Promise<string> => {
    const backupData = {
      app: 'DormDrobe',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      currentLocation,
      locationNames,
      items,
      savedOutfits,
      wearHistory,
    };
    return JSON.stringify(backupData, null, 2);
  }, [currentLocation, locationNames, items, savedOutfits, wearHistory]);

  const restoreBackup = useCallback(
    async (jsonString: string): Promise<{ success: boolean; count: number; error?: string }> => {
      try {
        const data = JSON.parse(jsonString);
        if (!data || !Array.isArray(data.items)) {
          return {
            success: false,
            count: 0,
            error: 'Invalid backup file: missing items list.',
          };
        }

        // Restore items
        setItems(data.items);
        await persist(data.items);

        // Restore outfits if present
        if (Array.isArray(data.savedOutfits)) {
          setSavedOutfits(data.savedOutfits);
          await persistOutfits(data.savedOutfits);
        }

        // Restore wear history if present
        if (Array.isArray(data.wearHistory)) {
          setWearHistory(data.wearHistory);
          await persistWearHistory(data.wearHistory);
        }

        // Restore active location if present
        if (data.currentLocation) {
          setCurrentLocationState(data.currentLocation);
          await AppStorage.setItem(LOCATION_KEY, data.currentLocation);
        }

        // Restore custom location names if present
        if (data.locationNames) {
          setLocationNames(data.locationNames);
          await AppStorage.setItem(LOCATION_NAMES_KEY, JSON.stringify(data.locationNames));
        }

        return { success: true, count: data.items.length };
      } catch (err: any) {
        return {
          success: false,
          count: 0,
          error: err?.message || 'Could not parse JSON backup file.',
        };
      }
    },
    [persist, persistOutfits, persistWearHistory],
  );

  const value: WardrobeState = useMemo(
    () => ({
      items,
      currentLocation,
      closetTab,
      isPackingSession,
      locationFilter,
      statusFilter,
      uniformFilter,
      searchQuery,
      loading,
      savedOutfits,
      wearHistory,
      locationNames,
      setCurrentLocation,
      setClosetTab,
      setIsPackingSession,
      setLocationFilter,
      setStatusFilter,
      setUniformFilter,
      setSearchQuery,
      updateLocationNames,
      getLocationLabel,
      addItem,
      addItems,
      duplicateItem,
      updateItem,
      deleteItem,
      batchMoveItems,
      batchSetStatusByIds,
      advanceItemStatus,
      unpackTransitBag,
      addSavedOutfit,
      deleteSavedOutfit,
      logOutfitWorn,
      deleteWearLog,
      resetToSeedData,
      clearAllData,
      showToast,
      exportBackup,
      restoreBackup,
      filteredItems,
      countItems,
    }),
    [
      items,
      currentLocation,
      closetTab,
      isPackingSession,
      locationFilter,
      statusFilter,
      uniformFilter,
      searchQuery,
      loading,
      savedOutfits,
      wearHistory,
      locationNames,
      setCurrentLocation,
      setClosetTab,
      setIsPackingSession,
      setLocationFilter,
      setStatusFilter,
      setUniformFilter,
      setSearchQuery,
      updateLocationNames,
      getLocationLabel,
      addItem,
      addItems,
      duplicateItem,
      updateItem,
      deleteItem,
      batchMoveItems,
      batchSetStatusByIds,
      advanceItemStatus,
      unpackTransitBag,
      addSavedOutfit,
      deleteSavedOutfit,
      logOutfitWorn,
      deleteWearLog,
      resetToSeedData,
      clearAllData,
      showToast,
      exportBackup,
      restoreBackup,
      filteredItems,
      countItems,
    ],
  );

  return (
    <WardrobeContext.Provider value={value}>
      {children}
      <SonnerToast toast={toast} onDismiss={dismissToast} />
    </WardrobeContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────
export function useWardrobe(): WardrobeState {
  const ctx = useContext(WardrobeContext);
  if (!ctx) {
    throw new Error('useWardrobe must be used inside <WardrobeProvider>');
  }
  return ctx;
}
