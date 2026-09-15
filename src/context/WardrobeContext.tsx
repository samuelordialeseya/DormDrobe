import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ClothingItem,
  Location,
  Status,
  Category,
} from '../types/wardrobe';
import { MOCK_CLOTHING } from '../utils/mockData';

// ─── Storage key ─────────────────────────────────────────────────────
const STORAGE_KEY = '@dormdrobe/clothing';

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
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('[DormDrobe] Failed to persist items', e);
    }
  }, []);

  // ── Load from storage (or seed with mock data) ─────────────────────
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setItems(JSON.parse(stored));
        } else {
          // First launch → seed with mock data
          setItems(MOCK_CLOTHING);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_CLOTHING));
        }
      } catch {
        setItems(MOCK_CLOTHING);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── CRUD ──────────────────────────────────────────────────────────
  const addItem = useCallback(
    (item: ClothingItem) => {
      setItems((prev) => {
        const next = [item, ...prev];
        persist(next);
        return next;
      });
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
