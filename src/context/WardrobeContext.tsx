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
} from '../types/wardrobe';
import { MOCK_CLOTHING } from '../utils/mockData';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { AppStorage } from '../utils/storage';

// ─── Storage key ─────────────────────────────────────────────────────
const STORAGE_KEY = '@dormdrobe/clothing';

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
  /** Currently selected location filter (null = All) */
  locationFilter: Location | null;
  /** Currently selected status filter (null = All) */
  statusFilter: Status | null;
  /** Current search query */
  searchQuery: string;
  /** Whether the initial load is still happening */
  loading: boolean;

  // ── Actions ──────────────────────────────────────────────────────
  setLocationFilter: (loc: Location | null) => void;
  setStatusFilter: (st: Status | null) => void;
  setSearchQuery: (q: string) => void;
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
  const [locationFilter, setLocationFilter] = useState<Location | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // ── Persist helpers ────────────────────────────────────────────────
  const persist = useCallback(async (next: ClothingItem[]) => {
    try {
      await AppStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('[DormDrobe] Failed to persist items', e);
    }
  }, []);

  // ── Load from Supabase (or fallback to AsyncStorage / mock) ───────
  useEffect(() => {
    (async () => {
      try {
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
  }, [persist]);

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
    [persist],
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

  // ── Computed ──────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    let result = items;
    if (locationFilter) {
      result = result.filter((it) => it.location === locationFilter);
    }
    if (statusFilter) {
      result = result.filter((it) => it.status === statusFilter);
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
  }, [items, locationFilter, statusFilter, searchQuery]);

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

  const value: WardrobeState = useMemo(
    () => ({
      items,
      locationFilter,
      statusFilter,
      searchQuery,
      loading,
      setLocationFilter,
      setStatusFilter,
      setSearchQuery,
      addItem,
      updateItem,
      deleteItem,
      batchMoveItems,
      batchSetStatus,
      filteredItems,
      countItems,
    }),
    [
      items,
      locationFilter,
      statusFilter,
      searchQuery,
      loading,
      addItem,
      updateItem,
      deleteItem,
      batchMoveItems,
      batchSetStatus,
      filteredItems,
      countItems,
    ],
  );

  return (
    <WardrobeContext.Provider value={value}>
      {children}
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
