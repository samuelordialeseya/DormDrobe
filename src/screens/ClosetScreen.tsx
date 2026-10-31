import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useWardrobe } from '../context/WardrobeContext';
import ClothingCard from '../components/ClothingCard';
import FadeSlideIn from '../components/FadeSlideIn';
import PressableScale from '../components/PressableScale';
import LiquidGlassLocationSwitch from '../components/LiquidGlassLocationSwitch';
import GarmentDetailSheet from '../components/GarmentDetailSheet';
import { useUnpackFlow } from '../components/UnpackPromptModal';
import {
  Category,
  ClosetSubTab,
  ClothingItem,
  CATEGORY_LABELS,
  isDirtyStatus,
} from '../types/wardrobe';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';
import {
  Plus,
  Search,
  X,
  Shirt,
  CategoryIcon,
  Luggage,
  Waves,
  Check,
} from '../components/AppIcons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Tap the active chip again to clear it, so there is no separate "All Types" chip.
const CATEGORY_OPTIONS: Category[] = [
  'tops',
  'bottoms',
  'outerwear',
  'footwear',
  'underwear',
  'accessories',
];

const ZONES: { key: ClosetSubTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'clean', label: 'Clean' },
  { key: 'laundry', label: 'Laundry' },
  { key: 'bag', label: 'In Bag' },
];

/** Quiet 36px circular icon button (44px touch target via hitSlop). One may be `primary`. */
function IconButton({
  label,
  onPress,
  icon,
  primary = false,
  active = false,
}: {
  label: string;
  onPress: () => void;
  icon: (color: string) => React.ReactNode;
  primary?: boolean;
  active?: boolean;
}) {
  const filled = primary || active;
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      style={[styles.iconBtn, filled && styles.iconBtnFilled]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon(filled ? '#FFFFFF' : Colors.textPrimary)}
    </TouchableOpacity>
  );
}

type PackFilter = 'clean' | 'dirty' | 'all';

const PACK_FILTERS: { key: PackFilter; label: string }[] = [
  { key: 'clean', label: 'Clean Clothes' },
  { key: 'dirty', label: 'Worn / Laundry' },
  { key: 'all', label: 'All' },
];

export default function ClosetScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const {
    items,
    currentLocation,
    setCurrentLocation,
    closetTab,
    setClosetTab,
    isPackingSession,
    setIsPackingSession,
    searchQuery,
    setSearchQuery,
    loading,
    getLocationLabel,
    batchMoveItems,
    batchSetStatusByIds,
    showToast,
  } = useWardrobe();
  const { requestUnpack, unpackModal } = useUnpackFlow();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [uniformOnly, setUniformOnly] = useState(false);
  const [showAllPlaces, setShowAllPlaces] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<any>(null);

  const selectedItem = useMemo(
    () => items.find((it) => it.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  // Pack Bag checklist session
  const [packFilter, setPackFilter] = useState<PackFilter>('clean');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const place = getLocationLabel(currentLocation);

  // Handle incoming route params (e.g. from Home's openZone or category breakdown)
  useEffect(() => {
    if (route.params?.zone) {
      setClosetTab(route.params.zone);
    }
    if (route.params?.category !== undefined) {
      setSelectedCategory(route.params.category);
      setUniformOnly(false);
    }
    if (route.params?.zone || route.params?.category !== undefined) {
      navigation.setParams({ zone: undefined, category: undefined });
    }
  }, [route.params?.zone, route.params?.category]);

  // Always land on "this closet" when coming back to the tab (e.g. from a Home shortcut)
  useFocusEffect(
    useCallback(() => {
      setShowAllPlaces(false);
    }, []),
  );

  // A checklist from another location is meaningless — start fresh when the location changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentLocation]);

  // ── Smooth Sliding Tab Indicator Physics (Zero Latency) ─────────
  const { width: windowWidth } = useWindowDimensions();
  const screenWidth = Math.min(windowWidth, 390);
  const [rowWidth, setRowWidth] = useState(screenWidth);

  // Available inner width for the 4 tabs inside zoneRow (paddingHorizontal: 16 on each side)
  const innerWidth = Math.max(120, rowWidth - Spacing.lg * 2);
  const tabWidth = innerWidth / ZONES.length;
  const indicatorWidth = Math.round(Math.max(28, tabWidth - 26));

  const getIndicatorX = useCallback(
    (idx: number) => {
      const safeIdx = Math.max(0, Math.min(idx, ZONES.length - 1));
      return Spacing.lg + safeIdx * tabWidth + (tabWidth - indicatorWidth) / 2;
    },
    [tabWidth, indicatorWidth],
  );

  const activeZoneIndex = Math.max(0, ZONES.findIndex((z) => z.key === closetTab));
  const indicatorAnim = useRef(new Animated.Value(getIndicatorX(activeZoneIndex))).current;
  const stretchAnim = useRef(new Animated.Value(0)).current;
  const prevZoneRef = useRef(closetTab);

  useEffect(() => {
    const targetIdx = Math.max(0, ZONES.findIndex((z) => z.key === closetTab));
    const targetX = getIndicatorX(targetIdx);
    const changed = prevZoneRef.current !== closetTab;
    prevZoneRef.current = closetTab;

    Animated.spring(indicatorAnim, {
      toValue: targetX,
      tension: 340,
      friction: 28,
      useNativeDriver: true,
    }).start();

    if (changed) {
      stretchAnim.setValue(0);
      Animated.sequence([
        Animated.timing(stretchAnim, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.spring(stretchAnim, {
          toValue: 0,
          tension: 300,
          friction: 22,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [closetTab, getIndicatorX]);

  // ── Zones ────────────────────────────────────────────────────────
  const zoneItems = useMemo(() => {
    const here = items.filter(
      (it) =>
        it.location !== 'in_transit_bag' &&
        (showAllPlaces || it.location === currentLocation),
    );
    const bag = items.filter((it) => it.location === 'in_transit_bag');
    const all = showAllPlaces
      ? items
      : items.filter(
          (it) => it.location === currentLocation || it.location === 'in_transit_bag',
        );

    return {
      all,
      clean: here.filter((it) => !isDirtyStatus(it.status)),
      laundry: here.filter((it) => isDirtyStatus(it.status)),
      bag,
    };
  }, [items, currentLocation, showAllPlaces]);

  const query = searchQuery.trim().toLowerCase();
  const hasActiveFilters = !!selectedCategory || uniformOnly || query.length > 0;

  const matchesFilters = useCallback(
    (it: ClothingItem) => {
      if (selectedCategory && it.category !== selectedCategory) return false;
      if (uniformOnly && !it.isUniformWhiteTee) return false;
      if (query) {
        const hit =
          it.name.toLowerCase().includes(query) ||
          (it.brand?.toLowerCase().includes(query) ?? false) ||
          it.color.toLowerCase().includes(query) ||
          it.notes.toLowerCase().includes(query);
        if (!hit) return false;
      }
      return true;
    },
    [selectedCategory, uniformOnly, query],
  );

  const displayed = useMemo(() => {
    const list = zoneItems[closetTab].filter(matchesFilters);
    if (closetTab === 'laundry') {
      // Worn first, then what's already in the laundry
      return [...list].sort(
        (a, b) => Number(a.status !== 'worn') - Number(b.status !== 'worn'),
      );
    }
    if (closetTab === 'all') {
      // Clean first, then worn, then laundry, then other
      return [...list].sort((a, b) => {
        const order: Record<string, number> = {
          clean: 0,
          worn: 1,
          in_laundry: 2,
          drying: 3,
          misplaced: 4,
        };
        return (order[a.status] ?? 5) - (order[b.status] ?? 5);
      });
    }
    return list;
  }, [zoneItems, closetTab, matchesFilters]);

  const wornDisplayed = displayed.filter((it) => it.status === 'worn');
  const bagDirtyCount = zoneItems.bag.filter((it) => isDirtyStatus(it.status)).length;

  // ── Pack Bag session ─────────────────────────────────────────────
  const packSource = useMemo(
    () => items.filter((it) => it.location === currentLocation),
    [items, currentLocation],
  );
  const packable = useMemo(
    () =>
      packSource.filter((it) =>
        packFilter === 'clean'
          ? !isDirtyStatus(it.status)
          : packFilter === 'dirty'
          ? isDirtyStatus(it.status)
          : true,
      ),
    [packSource, packFilter],
  );
  const selectedCount = packSource.filter((it) => selectedIds.has(it.id)).length;

  const startPackingSession = (filter: PackFilter = 'clean') => {
    setPackFilter(filter);
    setSelectedIds(new Set());
    setIsPackingSession(true);
  };

  const endPackingSession = () => {
    setIsPackingSession(false);
    setSelectedIds(new Set());
    setPackFilter('clean');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      packable.forEach((it) => next.add(it.id));
      return next;
    });
  };

  // 3-Day Weekend formula: 3 tops + 2 bottoms + 3 underwear + 1 footwear (clean ones here)
  const handleWeekendPreset = () => {
    const cleanHere = packSource.filter((it) => !isDirtyStatus(it.status));
    const pick = (cat: Category, n: number) =>
      cleanHere.filter((it) => it.category === cat).slice(0, n);
    const picked = [
      ...pick('tops', 3),
      ...pick('bottoms', 2),
      ...pick('underwear', 3),
      ...pick('footwear', 1),
    ];
    setSelectedIds(new Set(picked.map((it) => it.id)));
    showToast({
      message: `Selected 3-Day Weekend Formula (${picked.length} items)`,
      type: 'info',
    });
  };

  const handleConfirmPack = () => {
    // Only pieces actually at this location can be packed
    const ids = packSource.filter((it) => selectedIds.has(it.id)).map((it) => it.id);
    if (ids.length === 0) {
      showToast({ message: 'Tap clothes to add them to your bag', type: 'warning' });
      return;
    }
    const sourceLoc = currentLocation;
    batchMoveItems(ids, 'in_transit_bag');
    showToast({
      message: `Packed ${ids.length} item${ids.length > 1 ? 's' : ''} in your Transit Bag`,
      type: 'success',
      action: {
        label: 'Undo',
        onPress: () => batchMoveItems(ids, sourceLoc),
      },
    });
    endPackingSession();
    setClosetTab('bag');
  };

  // ── Laundry batch actions (apply to what's currently listed) ─────
  const handleWornToLaundry = () => {
    if (wornDisplayed.length === 0) {
      showToast({ message: 'No worn clothes to move right now', type: 'info' });
      return;
    }
    const n = wornDisplayed.length;
    batchSetStatusByIds(
      wornDisplayed.map((it) => it.id),
      'in_laundry',
      `Moved ${n} worn item${n > 1 ? 's' : ''} to Laundry`,
    );
  };

  const handleWashAll = () => {
    if (displayed.length === 0) {
      showToast({ message: 'Nothing to wash right now', type: 'info' });
      return;
    }
    const n = displayed.length;
    batchSetStatusByIds(
      displayed.map((it) => it.id),
      'clean',
      `Marked ${n} item${n > 1 ? 's' : ''} Clean & Ready`,
    );
  };

  const switchZone = (zone: ClosetSubTab) => {
    if (zone === closetTab) return;
    setClosetTab(zone);
  };

  const resetFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchQuery('');
    setIsSearchOpen(false);
    setSelectedCategory(null);
    setUniformOnly(false);
  };

  const toggleSearch = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (isSearchOpen || searchQuery.length > 0) {
      setSearchQuery('');
      setIsSearchOpen(false);
    } else {
      setIsSearchOpen(true);
      setTimeout(() => searchInputRef.current?.focus(), 60);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.textSecondary} style={{ marginTop: 120 }} />
      </View>
    );
  }

  // ── Pack Bag checklist session ───────────────────────────────────
  if (isPackingSession) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <FadeSlideIn delay={0} fromY={-10}>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Pack Bag</Text>
                <Text style={styles.subtitle}>Tap what you're bringing from {place}</Text>
              </View>
              <PressableScale onPress={endPackingSession} scaleTo={0.92}>
                <View style={styles.cancelBtn}>
                  <X size={13} color={Colors.textSecondary} strokeWidth={2.4} />
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </View>
              </PressableScale>
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={30} fromY={8}>
            <View style={styles.packFilterRow}>
              {PACK_FILTERS.map((f) => {
                const active = f.key === packFilter;
                return (
                  <TouchableOpacity
                    key={f.key}
                    activeOpacity={0.7}
                    onPress={() => setPackFilter(f.key)}
                    style={[styles.pill, active && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.quickSelectRow}>
              <TouchableOpacity onPress={handleSelectAll} activeOpacity={0.7}>
                <Text style={styles.quickSelectText}>Select all ({packable.length})</Text>
              </TouchableOpacity>
              {selectedCount > 0 && (
                <TouchableOpacity onPress={() => setSelectedIds(new Set())} activeOpacity={0.7}>
                  <Text style={[styles.quickSelectText, { color: Colors.textTertiary }]}>
                    Clear
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleWeekendPreset}
                activeOpacity={0.7}
                style={styles.presetPill}
              >
                <Text style={styles.presetPillText}>3-Day Weekend</Text>
              </TouchableOpacity>
            </View>
          </FadeSlideIn>

          <FlatList
            data={packable}
            extraData={selectedIds}
            keyExtractor={(it) => it.id}
            renderItem={({ item, index }) => (
              <ClothingCard
                item={item}
                selectable
                selected={selectedIds.has(item.id)}
                onToggleSelect={() => toggleSelect(item.id)}
                delay={0}
                hideLocation
              />
            )}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 190 }]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.sessionEmpty}>
                No {packFilter === 'dirty' ? 'worn or laundry' : packFilter === 'clean' ? 'clean' : ''}{' '}
                clothes at {place}
              </Text>
            }
          />

          <View
            pointerEvents="box-none"
            style={[styles.floatingWrap, { bottom: insets.bottom + 86 }]}
          >
            <PressableScale onPress={handleConfirmPack} scaleTo={0.97}>
              <View style={[styles.floatingBtn, selectedCount === 0 && styles.floatingBtnIdle]}>
                <Luggage size={18} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.floatingBtnText}>
                  {selectedCount === 0
                    ? 'Select clothes to pack'
                    : `Put ${selectedCount} item${selectedCount > 1 ? 's' : ''} in Transit Bag`}
                </Text>
              </View>
            </PressableScale>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Normal closet ────────────────────────────────────────────────
  const hideLocationBadge = closetTab === 'bag' || (!showAllPlaces && closetTab !== 'all');
  const showSearchBar = isSearchOpen || searchQuery.length > 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          stickyHeaderIndices={[1]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 90, 130) }}
        >
          {/* Child [0]: Collapsible top area (title row + location row + zone actions) */}
          <View style={styles.topScrollableHeader}>
            {/* Row 1: Title + count, global actions as quiet icon buttons */}
            <View style={styles.header}>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title}>My Closet</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {showAllPlaces
                    ? `${items.length} pieces across all places`
                    : `${zoneItems.all.length} pieces at ${place}`}
                </Text>
              </View>
              <View style={styles.headerActions}>
                <IconButton
                  label={showSearchBar ? 'Close search' : 'Search closet'}
                  active={showSearchBar}
                  onPress={toggleSearch}
                  icon={(color) => <Search size={16} color={color} strokeWidth={2.2} />}
                />
                <IconButton
                  label="Pack bag"
                  onPress={() => startPackingSession('clean')}
                  icon={(color) => <Luggage size={16} color={color} strokeWidth={2.2} />}
                />
                <IconButton
                  label="Add clothing"
                  primary
                  onPress={() => navigation.navigate('Add', { editItem: undefined })}
                  icon={(color) => <Plus size={16} color={color} strokeWidth={2.4} />}
                />
              </View>
            </View>

            {/* Row 2: Where am I + quiet "show all places" toggle */}
            <View style={styles.locationRow}>
              <LiquidGlassLocationSwitch
                currentLocation={currentLocation}
                onChange={setCurrentLocation}
              />
              {closetTab !== 'bag' && (
                <TouchableOpacity
                  activeOpacity={0.6}
                  hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setShowAllPlaces((v) => !v);
                  }}
                  style={styles.allPlacesLinkWrap}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: showAllPlaces }}
                >
                  <Text
                    style={[styles.allPlacesLink, showAllPlaces && styles.allPlacesLinkActive]}
                    numberOfLines={1}
                  >
                    {showAllPlaces ? 'Showing all places' : 'Show all places'}
                  </Text>
                  {showAllPlaces && <X size={12} color={Colors.textPrimary} strokeWidth={2.4} />}
                </TouchableOpacity>
              )}
            </View>


          </View>

          {/* Child [1]: Sticky filter bar (zone tabs + category chips + optional search) */}
          <View style={styles.stickyBar}>
            {/* Zone tabs: flat text tab bar with smooth sliding underline */}
            <View
              style={styles.zoneRow}
              accessibilityRole="tablist"
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0 && Math.abs(w - rowWidth) > 1) {
                  setRowWidth(w);
                }
              }}
            >
              {ZONES.map((z) => {
                const active = z.key === closetTab;
                const count = zoneItems[z.key].length;
                return (
                  <TouchableOpacity
                    key={z.key}
                    activeOpacity={0.7}
                    delayPressIn={0}
                    onPress={() => switchZone(z.key)}
                    style={styles.zoneTab}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      style={[styles.zoneLabel, active && styles.zoneLabelActive]}
                      numberOfLines={1}
                    >
                      {z.label}
                      {count > 0 ? (
                        <Text style={[styles.zoneCount, active && styles.zoneCountActive]}>
                          {`  ${count}`}
                        </Text>
                      ) : null}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <Animated.View
                style={[
                  styles.slidingUnderline,
                  {
                    width: indicatorWidth,
                    transform: [{ translateX: indicatorAnim }],
                  },
                ]}
                pointerEvents="none"
              />
            </View>

            {/* Category chips (tap the active chip again to clear it) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
              style={styles.categoryScroll}
              keyboardShouldPersistTaps="handled"
            >
              {hasActiveFilters && (
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={resetFilters}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  style={styles.clearFiltersBtn}
                  accessibilityLabel="Clear all filters"
                >
                  <X size={12} color={Colors.textSecondary} strokeWidth={2.4} />
                  <Text style={styles.clearFiltersText}>Clear</Text>
                </TouchableOpacity>
              )}

              {CATEGORY_OPTIONS.map((cat) => {
                const active = cat === selectedCategory;
                return (
                  <TouchableOpacity
                    key={cat}
                    activeOpacity={0.75}
                    onPress={() => setSelectedCategory((prev) => (prev === cat ? null : cat))}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                    accessibilityState={{ selected: active }}
                  >
                    <CategoryIcon
                      category={cat}
                      size={13}
                      color={active ? '#FFFFFF' : Colors.textSecondary}
                      weight={active ? 'bold' : 'regular'}
                    />
                    <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setUniformOnly((v) => !v)}
                style={[styles.categoryChip, uniformOnly && styles.uniformChipActive]}
                accessibilityState={{ selected: uniformOnly }}
              >
                <Shirt
                  size={13}
                  color={uniformOnly ? Colors.locBatangas : Colors.textSecondary}
                  weight={uniformOnly ? 'bold' : 'regular'}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    uniformOnly && { color: Colors.locBatangas },
                  ]}
                >
                  Uniform
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Search input: only while open or a query is active */}
            {showSearchBar && (
              <View style={styles.searchRow}>
                <View style={styles.searchWrap}>
                  <Search
                    size={15}
                    color={Colors.textTertiary}
                    strokeWidth={2}
                    style={{ marginRight: 7 }}
                  />
                  <TextInput
                    ref={searchInputRef}
                    style={styles.searchInput}
                    placeholder="Search by name, brand, color…"
                    placeholderTextColor={Colors.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      if (searchQuery.length > 0) {
                        setSearchQuery('');
                      } else {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setIsSearchOpen(false);
                      }
                    }}
                    style={styles.clearBtn}
                    accessibilityLabel={searchQuery.length > 0 ? 'Clear search text' : 'Close search'}
                  >
                    <X size={14} color={Colors.textTertiary} strokeWidth={2.2} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Child [2]: Clothes List or Empty State */}
          <View style={styles.list}>
            {/* Zone-specific quick actions (above the list, scrolls naturally with content) */}
            {closetTab === 'laundry' && zoneItems.laundry.length > 0 && (
              <View style={styles.actionBar}>
                <View style={styles.actionBarRow}>
                  <PressableScale
                    onPress={handleWornToLaundry}
                    scaleTo={0.95}
                    style={styles.actionBtnWrap}
                  >
                    <View style={[styles.actionBtn, wornDisplayed.length === 0 && styles.actionBtnIdle]}>
                      <Waves size={13} color={Colors.statusLaundry} strokeWidth={2.2} />
                      <Text style={[styles.actionBtnText, { color: Colors.statusLaundry }]} numberOfLines={1}>
                        Worn → Laundry ({wornDisplayed.length})
                      </Text>
                    </View>
                  </PressableScale>
                  <PressableScale
                    onPress={handleWashAll}
                    scaleTo={0.95}
                    style={styles.actionBtnWrap}
                  >
                    <View
                      style={[
                        styles.actionBtn,
                        styles.actionBtnClean,
                        displayed.length === 0 && styles.actionBtnIdle,
                      ]}
                    >
                      <Check size={13} color="#FFFFFF" strokeWidth={2.6} />
                      <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]} numberOfLines={1}>
                        Wash all → Clean ({displayed.length})
                      </Text>
                    </View>
                  </PressableScale>
                </View>
              </View>
            )}

            {closetTab === 'bag' && zoneItems.bag.length > 0 && (
              <View style={styles.actionBar}>
                <PressableScale onPress={requestUnpack} scaleTo={0.97}>
                  <View style={styles.unpackBtn}>
                    <Luggage size={16} color="#FFFFFF" strokeWidth={2.2} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.unpackBtnText}>Unpack to {place}</Text>
                      <Text style={styles.unpackBtnSub}>
                        {zoneItems.bag.length - bagDirtyCount} clean · {bagDirtyCount} dirty
                      </Text>
                    </View>
                  </View>
                </PressableScale>
              </View>
            )}
            {displayed.length > 0 ? (
              displayed.map((item, index) => (
                <ClothingCard
                  key={item.id}
                  item={item}
                  delay={Math.min(index * 25, 160)}
                  onPress={() => setSelectedItemId(item.id)}
                  showQuickAction={closetTab !== 'bag'}
                  hideLocation={hideLocationBadge}
                />
              ))
            ) : (
              <FadeSlideIn delay={120}>
                <View style={styles.empty}>
                  <View style={styles.emptyIconBox}>
                    {items.length === 0 ? (
                      <Shirt size={44} color={Colors.accent} strokeWidth={1.6} />
                    ) : closetTab === 'bag' ? (
                      <Luggage size={44} color={Colors.textTertiary} strokeWidth={1.4} />
                    ) : closetTab === 'laundry' ? (
                      <Waves size={44} color={Colors.textTertiary} strokeWidth={1.4} />
                    ) : (
                      <Shirt size={44} color={Colors.textTertiary} strokeWidth={1.4} />
                    )}
                  </View>

                  {items.length === 0 ? (
                    <>
                      <Text style={styles.emptyTitle}>Your closet is empty</Text>
                      <Text style={styles.emptyText}>
                        Start cataloging your clothes to build outfits and pack smart between locations.
                      </Text>
                      <PressableScale
                        onPress={() => navigation.navigate('Add', { editItem: undefined })}
                        scaleTo={0.94}
                        style={[styles.emptyBtn, { backgroundColor: Colors.accent }]}
                      >
                        <Text style={[styles.emptyBtnText, { color: '#FFFFFF' }]}>
                          + Add Your First Clothes
                        </Text>
                      </PressableScale>
                    </>
                  ) : hasActiveFilters ? (
                    <>
                      <Text style={styles.emptyTitle}>No matches</Text>
                      <Text style={styles.emptyText}>Nothing here fits your search or filters</Text>
                      <PressableScale onPress={resetFilters} scaleTo={0.94} style={styles.emptyBtn}>
                        <Text style={styles.emptyBtnText}>Reset filters</Text>
                      </PressableScale>
                    </>
                  ) : closetTab === 'bag' ? (
                    <>
                      <Text style={styles.emptyTitle}>Your bag is empty</Text>
                      <Text style={styles.emptyText}>Pack what you're bringing for the trip</Text>
                      <PressableScale
                        onPress={() => startPackingSession('clean')}
                        scaleTo={0.94}
                        style={styles.emptyBtn}
                      >
                        <Text style={styles.emptyBtnText}>Pack Bag</Text>
                      </PressableScale>
                    </>
                  ) : closetTab === 'laundry' ? (
                    <>
                      <Text style={styles.emptyTitle}>Laundry basket is empty</Text>
                      <Text style={styles.emptyText}>
                        Nothing worn or waiting to be washed {showAllPlaces ? '' : `at ${place}`}
                      </Text>
                    </>
                  ) : closetTab === 'clean' ? (
                    <>
                      <Text style={styles.emptyTitle}>No clean clothes here</Text>
                      <Text style={styles.emptyText}>
                        {showAllPlaces
                          ? 'Nothing is clean right now'
                          : `Nothing clean at ${place} right now`}
                      </Text>
                      {zoneItems.laundry.length > 0 && (
                        <PressableScale
                          onPress={() => switchZone('laundry')}
                          scaleTo={0.94}
                          style={styles.emptyBtn}
                        >
                          <Text style={styles.emptyBtnText}>
                            See laundry ({zoneItems.laundry.length})
                          </Text>
                        </PressableScale>
                      )}
                    </>
                  ) : (
                    <>
                      <Text style={styles.emptyTitle}>No clothes found</Text>
                      <Text style={styles.emptyText}>
                        {showAllPlaces ? 'No clothes in your wardrobe' : `No clothes at ${place}`}
                      </Text>
                    </>
                  )}
                </View>
              </FadeSlideIn>
            )}
          </View>
        </ScrollView>

        {/* Interactive Garment Detail Bottom Sheet */}
        <GarmentDetailSheet
          item={selectedItem}
          visible={!!selectedItem}
          onClose={() => setSelectedItemId(null)}
          onEdit={(it) => {
            setSelectedItemId(null);
            navigation.navigate('Add', { editItem: it });
          }}
        />

        {unpackModal}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  safe: {
    flex: 1,
  },
  topScrollableHeader: {
    paddingBottom: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Spacing.sm,
  },
  headerTitleWrap: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlassBright,
  },
  iconBtnFilled: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  title: {
    color: Colors.textPrimary,
    ...Typography.title1,
  },
  subtitle: {
    color: Colors.textTertiary,
    fontSize: 13,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.borderGlassBright,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 2,
    paddingBottom: 8,
    gap: 12,
  },
  allPlacesLinkWrap: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  allPlacesLink: {
    color: Colors.textTertiary,
    fontSize: 12.5,
    fontWeight: '500',
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  allPlacesLinkActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  stickyBar: {
    backgroundColor: Colors.bgBase,
    paddingTop: 2,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    zIndex: 10,
  },
  zoneRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGlass,
    position: 'relative',
  },
  zoneTab: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneLabel: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  zoneLabelActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  zoneCount: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  zoneCountActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  slidingUnderline: {
    position: 'absolute',
    bottom: -1,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 32,
    paddingHorizontal: 6,
  },
  clearFiltersText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  categoryScroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginTop: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 2,
  },
  uniformChipActive: {
    backgroundColor: Colors.locBatangasBg,
    borderColor: Colors.locBatangas,
    shadowColor: Colors.locBatangas,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
    flexShrink: 0,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchRow: {
    paddingHorizontal: Spacing.lg,
    marginTop: 6,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    height: 38,
    borderWidth: 1,
    borderColor: Colors.borderGlassBright,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    letterSpacing: -0.1,
  },
  clearBtn: {
    padding: 4,
  },
  actionBar: {
    paddingTop: 2,
    paddingBottom: 10,
    gap: 6,
  },
  actionBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionBtnWrap: {
    flex: 1,
    minWidth: 0,
  },
  actionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 34,
    borderRadius: Radii.md,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(234, 88, 12, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.3)',
  },
  actionBtnClean: {
    backgroundColor: Colors.statusClean,
    borderColor: Colors.statusClean,
  },
  actionBtnIdle: {
    opacity: 0.45,
  },
  actionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  unpackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.locInTransit,
    borderRadius: Radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  unpackBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  unpackBtnSub: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 8,
  },
  empty: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyIconBox: {
    marginBottom: 14,
    opacity: 0.4,
  },
  emptyTitle: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyText: {
    color: Colors.textTertiary,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyBtn: {
    marginTop: 18,
    backgroundColor: Colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radii.pill,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },

  // Pack Bag session
  packFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  pill: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  pillActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  pillText: {
    color: Colors.textSecondary,
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  quickSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  quickSelectText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  presetPill: {
    marginLeft: 'auto',
    backgroundColor: Colors.locBatangasBg,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(29, 78, 216, 0.22)',
  },
  presetPillText: {
    color: Colors.locBatangas,
    fontSize: 11.5,
    fontWeight: '700',
  },
  sessionEmpty: {
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 13,
  },
  floatingWrap: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
  },
  floatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: Colors.accent,
    borderRadius: Radii.xl,
    paddingVertical: 15,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  floatingBtnIdle: {
    backgroundColor: Colors.textTertiary,
  },
  floatingBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});