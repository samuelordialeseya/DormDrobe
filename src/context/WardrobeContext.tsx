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

// ─── Context shape ───────────────────────────────────────────────────
interface WardrobeState {
  /** All clothing items (the single source of truth) */
  items: ClothingItem[];
  /** Synced user active location ("I'm currently at Dorm" vs "at Home") */
  currentLocation: Location;
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
  setLocationFilter: (loc: Location | null) => void;
  setStatusFilter: (st: Status | null) => void;
  setSearchQuery: (q: string) => void;
  setUniformFilter: (val: boolean) => void;
  updateLocationNames: (names: Partial<LocationNames>) => void;
  getLocationLabel: (loc: Location) => string;
  addItem: (item: ClothingItem) => void;
  updateItem: (id: string, patch: Partial<ClothingItem>) => void;
  deleteItem: (id: string) => void;
  /** Batch: move selected items to a target location */
  batchMoveItems: (ids: string[], to: Location) => void;
  /** Batch: set status of all items matching a filter */
  batchSetStatus: (
    filter: { location?: Location; status?: Status },
    newStatus: Status,
  ) => void;
  /** 1-Tap Unpack Bag: moves all items in 'in_transit_bag' to target location */
  unpackTransitBag: (toLocation: Location) => void;
  /** Lookbook: save an outfit combination */
  addSavedOutfit: (outfit: SavedOutfit) => void;
  /** Lookbook: remove an outfit */
  deleteSavedOutfit: (id: string) => void;
  /** Outfit History: log that an outfit was worn today */
  logOutfitWorn: (itemIds: string[], outfitName?: string) => void;
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
            setSavedOutfits(JSON.parse(storedOutfits));
          } catch {
            setSavedOutfits([]);
          }
        } else {
          // Initial seed outfit if none exists
          const initialOutfits: SavedOutfit[] = [
            {
              id: 'outfit-seed-1',
              name: 'Monday White Tee Uniform',
              topId: 'mock-1',
              bottomId: 'mock-4',
              shoesId: 'mock-6',
              tags: ['uniform', 'campus'],
              createdAt: new Date().toISOString(),
              lastWornAt: null,
            },
            {
              id: 'outfit-seed-2',
              name: 'Friday Commute Casual',
              topId: 'mock-2',
              bottomId: 'mock-5',
              shoesId: 'mock-6',
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

            // Auto-merge any newly added seed items from MOCK_CLOTHING
            const existingDbIds = new Set(enriched.map((i) => i.id));
            const existingDbNames = new Set(enriched.map((i) => i.name.toLowerCase()));
            const missingFromDb = MOCK_CLOTHING.filter(
              (m) => !existingDbIds.has(m.id) && !existingDbNames.has(m.name.toLowerCase())
            );
            if (missingFromDb.length > 0) {
              enriched.push(...missingFromDb);
              supabase
                .from('clothing_items')
                .insert(missingFromDb.map(toDbItem))
                .then(() => console.log('[DormDrobe] Inserted new seed items to Supabase'));
            }

            setItems(enriched);
            await persist(enriched);
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

          // Auto-merge any newly added seed items from MOCK_CLOTHING
          const existingIds = new Set(updated.map((i) => i.id));
          const existingNames = new Set(updated.map((i) => i.name.toLowerCase()));
          const missingMockItems = MOCK_CLOTHING.filter(
            (m) => !existingIds.has(m.id) && !existingNames.has(m.name.toLowerCase())
          );
          if (missingMockItems.length > 0) {
            hasBackfill = true;
            updated.push(...missingMockItems);
          }

          setItems(updated);
          if (hasBackfill) {
            await persist(updated);
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

  const batchSetStatus = useCallback(
    (
      filter: { location?: Location; status?: Status },
      newStatus: Status,
    ) => {
      setItems((prev) => {
        const next = prev.map((it) => {
          const matchLoc = filter.location ? it.location === filter.location : true;
          const matchSt = filter.status ? it.status === filter.status : true;
          return matchLoc && matchSt ? { ...it, status: newStatus } : it;
        });
        persist(next);
        return next;
      });

      if (isSupabaseConfigured) {
        let query = supabase.from('clothing_items').update({ status: newStatus });
        if (filter.location) query = query.eq('location', filter.location);
        if (filter.status) query = query.eq('status', filter.status);
        query.then(({ error }) => {
          if (error) console.warn('[DormDrobe] Supabase batch status error:', error.message);
        });
      }
    },
    [persist],
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

  // ── 1-Tap Unpack Transit Bag ───────────────────────────────────────
  const unpackTransitBag = useCallback(
    (toLocation: Location) => {
      const bagItems = items.filter((it) => it.location === 'in_transit_bag');
      if (bagItems.length === 0) return;

      const previousItems = [...items];
      const count = bagItems.length;
      const cleanCount = bagItems.filter((i) => i.status === 'clean').length;
      const needsWashCount = bagItems.filter((i) => i.status !== 'clean').length;
      const breakdown =
        cleanCount > 0 && needsWashCount > 0
          ? ` (${cleanCount} clean, ${needsWashCount} to wash)`
          : '';

      setItems((prev) => {
        const next = prev.map((it) =>
          it.location === 'in_transit_bag' ? { ...it, location: toLocation } : it,
        );
        persist(next);
        return next;
      });

      if (isSupabaseConfigured) {
        supabase
          .from('clothing_items')
          .update({ location: toLocation })
          .eq('location', 'in_transit_bag')
          .then(({ error }) => {
            if (error) console.warn('[DormDrobe] Supabase unpack error:', error.message);
          });
      }

      showToast({
        message: `Unpacked ${count} item${count > 1 ? 's' : ''} to ${getLocationLabel(toLocation)}${breakdown}`,
        type: 'success',
        action: {
          label: 'Undo',
          onPress: () => {
            setItems(previousItems);
            persist(previousItems);
            if (isSupabaseConfigured) {
              supabase
                .from('clothing_items')
                .update({ location: 'in_transit_bag' })
                .in('id', bagItems.map((b) => b.id))
                .then(() => {});
            }
          },
        },
      });
    },
    [items, persist, showToast, getLocationLabel],
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
    (itemIds: string[], outfitName?: string) => {
      const nowIso = new Date().toISOString();
      const previousItems = [...items];

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
            setWearHistory((prev) => {
              const reverted = prev.filter((l) => l.id !== logEntry.id);
              persistWearHistory(reverted);
              return reverted;
            });
          },
        },
      });
    },
    [items, currentLocation, persist, persistWearHistory, showToast],
  );

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
      locationFilter,
      statusFilter,
      uniformFilter,
      searchQuery,
      loading,
      savedOutfits,
      wearHistory,
      locationNames,
      setCurrentLocation,
      setLocationFilter,
      setStatusFilter,
      setUniformFilter,
      setSearchQuery,
      updateLocationNames,
      getLocationLabel,
      addItem,
      updateItem,
      deleteItem,
      batchMoveItems,
      batchSetStatus,
      unpackTransitBag,
      addSavedOutfit,
      deleteSavedOutfit,
      logOutfitWorn,
      showToast,
      exportBackup,
      restoreBackup,
      filteredItems,
      countItems,
    }),
    [
      items,
      currentLocation,
      locationFilter,
      statusFilter,
      uniformFilter,
      searchQuery,
      loading,
      savedOutfits,
      wearHistory,
      locationNames,
      setCurrentLocation,
      setLocationFilter,
      setStatusFilter,
      setUniformFilter,
      setSearchQuery,
      updateLocationNames,
      getLocationLabel,
      addItem,
      updateItem,
      deleteItem,
      batchMoveItems,
      batchSetStatus,
      unpackTransitBag,
      addSavedOutfit,
      deleteSavedOutfit,
      logOutfitWorn,
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
