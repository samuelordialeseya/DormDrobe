import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useWardrobe } from '../context/WardrobeContext';
import ClothingCard from '../components/ClothingCard';
import FadeSlideIn from '../components/FadeSlideIn';
import PressableScale from '../components/PressableScale';
import { Status, Category, STATUS_LABELS, STATUS_COLORS, CATEGORY_LABELS, ClothingItem } from '../types/wardrobe';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';
import { Plus, Search, X, Shirt, CategoryIcon, MenuSandwich, LocationIcon, Sliders } from '../components/AppIcons';
import GarmentDetailSheet from '../components/GarmentDetailSheet';
import ClosetFilterDrawer from '../components/ClosetFilterDrawer';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CATEGORY_OPTIONS: (Category | null)[] = [null, 'tops', 'bottoms', 'outerwear', 'footwear', 'underwear', 'accessories'];

export default function ClosetScreen() {
  const navigation = useNavigation<any>();
  const {
    filteredItems,
    locationFilter,
    setLocationFilter,
    statusFilter,
    setStatusFilter,
    uniformFilter,
    setUniformFilter,
    searchQuery,
    setSearchQuery,
    loading,
    items,
    getLocationLabel,
  } = useWardrobe();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(false);

  const activeSecondaryCount =
    (locationFilter ? 1 : 0) + (statusFilter ? 1 : 0) + (uniformFilter ? 1 : 0);

  const toggleFilterExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsFilterExpanded((prev) => !prev);
  };

  const handleResetSecondaryFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLocationFilter(null);
    setStatusFilter(null);
    setUniformFilter(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.textSecondary} style={{ marginTop: 120 }} />
      </View>
    );
  }

  // Filter with category filter applied
  const displayedItems = filteredItems.filter((it) => {
    if (selectedCategory && it.category !== selectedCategory) return false;
    return true;
  });

  const cleanCount = items.filter((i) => i.status === 'clean').length;
  const wornCount = items.filter((i) => i.status === 'worn').length;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <FadeSlideIn delay={0} fromY={-10}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>My Closet</Text>
              <Text style={styles.subtitle}>{displayedItems.length} items</Text>
            </View>
            <View style={styles.headerRight}>
              <PressableScale
                onPress={() => navigation.navigate('Add')}
                scaleTo={0.92}
              >
                <View style={styles.addBtn}>
                  <Plus size={13} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={styles.addBtnText}>Add</Text>
                </View>
              </PressableScale>
              <View style={styles.headerStatBadge}>
                <Text style={styles.headerStatNum}>{displayedItems.length}</Text>
              </View>
            </View>
          </View>
        </FadeSlideIn>

        {/* Stats strip — interactive quick toggles */}
        <FadeSlideIn delay={40} fromY={10}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsStrip}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setStatusFilter(statusFilter === 'clean' ? null : 'clean');
              }}
              style={[
                styles.statChip,
                statusFilter === 'clean'
                  ? { backgroundColor: Colors.statusClean + '16', borderColor: Colors.statusClean }
                  : { borderColor: Colors.statusClean + '60' },
              ]}
            >
              <View style={[styles.statDot, { backgroundColor: Colors.statusClean }]} />
              <Text style={[styles.statNum, { color: Colors.statusClean }]}>{cleanCount}</Text>
              <Text style={styles.statLabel}>Clean</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setStatusFilter(statusFilter === 'worn' ? null : 'worn');
              }}
              style={[
                styles.statChip,
                statusFilter === 'worn'
                  ? { backgroundColor: Colors.statusWorn + '16', borderColor: Colors.statusWorn }
                  : { borderColor: Colors.statusWorn + '60' },
              ]}
            >
              <View style={[styles.statDot, { backgroundColor: Colors.statusWorn }]} />
              <Text style={[styles.statNum, { color: Colors.statusWorn }]}>{wornCount}</Text>
              <Text style={styles.statLabel}>Worn</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setStatusFilter(null);
                setLocationFilter(null);
                setSelectedCategory(null);
              }}
              style={[
                styles.statChip,
                !statusFilter && !locationFilter && !selectedCategory
                  ? { borderColor: Colors.accent }
                  : undefined,
              ]}
            >
              <View style={[styles.statDot, { backgroundColor: Colors.textTertiary }]} />
              <Text style={[styles.statNum, { color: Colors.textSecondary }]}>{items.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </TouchableOpacity>
          </ScrollView>
        </FadeSlideIn>

        {/* Search & Filter Trigger Row */}
        <FadeSlideIn delay={80} fromY={10}>
          <View style={styles.searchFilterRow}>
            <View style={styles.searchWrap}>
              <Search size={16} color={Colors.textTertiary} strokeWidth={2} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, brand, color…"
                placeholderTextColor={Colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                  <X size={15} color={Colors.textTertiary} strokeWidth={2.2} />
                </TouchableOpacity>
              )}
            </View>

            {/* Sandwich / Filter Expansion Toggle */}
            <PressableScale onPress={toggleFilterExpanded} scaleTo={0.92}>
              <View
                style={[
                  styles.filterToggleBtn,
                  isFilterExpanded && styles.filterToggleBtnOpen,
                  activeSecondaryCount > 0 && styles.filterToggleBtnHasFilters,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Filters (${activeSecondaryCount} active)`}
              >
                <MenuSandwich
                  size={18}
                  color={isFilterExpanded || activeSecondaryCount > 0 ? '#FFFFFF' : Colors.textPrimary}
                  strokeWidth={2.3}
                />
                {activeSecondaryCount > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{activeSecondaryCount}</Text>
                  </View>
                )}
              </View>
            </PressableScale>
          </View>
        </FadeSlideIn>

        {/* Primary Category Quick-Switch Strip */}
        <FadeSlideIn delay={110} fromY={10}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {CATEGORY_OPTIONS.map((cat) => {
              const active = cat === selectedCategory;
              return (
                <TouchableOpacity
                  key={String(cat)}
                  activeOpacity={0.7}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.categoryChip,
                    active && styles.categoryChipActive,
                  ]}
                >
                  {cat && (
                    <CategoryIcon
                      category={cat}
                      size={12}
                      color={active ? '#FFFFFF' : Colors.textSecondary}
                    />
                  )}
                  <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                    {cat ? CATEGORY_LABELS[cat] : 'All Types'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </FadeSlideIn>

        {/* Collapsed Active Filters Micro-Bar (Make Intent Visible) */}
        {!isFilterExpanded && activeSecondaryCount > 0 && (
          <FadeSlideIn delay={0} fromY={-4}>
            <View style={styles.activeSummaryRow}>
              <Text style={styles.activeSummaryLabel}>Active:</Text>
              {locationFilter && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setLocationFilter(null);
                  }}
                  style={styles.activeSummaryChip}
                >
                  <LocationIcon location={locationFilter} size={11} color={Colors.textPrimary} strokeWidth={2} />
                  <Text style={styles.activeSummaryChipText}>
                    {locationFilter === 'in_transit_bag'
                      ? 'In Bag'
                      : getLocationLabel(locationFilter)}
                  </Text>
                  <X size={10} color={Colors.textTertiary} strokeWidth={2.4} />
                </TouchableOpacity>
              )}
              {statusFilter && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setStatusFilter(null);
                  }}
                  style={[
                    styles.activeSummaryChip,
                    { borderColor: STATUS_COLORS[statusFilter] + '60' },
                  ]}
                >
                  <View style={[styles.statDot, { backgroundColor: STATUS_COLORS[statusFilter] }]} />
                  <Text style={[styles.activeSummaryChipText, { color: STATUS_COLORS[statusFilter] }]}>
                    {STATUS_LABELS[statusFilter]}
                  </Text>
                  <X size={10} color={Colors.textTertiary} strokeWidth={2.4} />
                </TouchableOpacity>
              )}
              {uniformFilter && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setUniformFilter(false);
                  }}
                  style={[
                    styles.activeSummaryChip,
                    { borderColor: Colors.accent },
                  ]}
                >
                  <Shirt size={11} color={Colors.textPrimary} strokeWidth={2} />
                  <Text style={styles.activeSummaryChipText}>Uniforms</Text>
                  <X size={10} color={Colors.textTertiary} strokeWidth={2.4} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleResetSecondaryFilters}
                style={styles.clearAllTextBtn}
              >
                <Text style={styles.clearAllTextBtnText}>Clear all</Text>
              </TouchableOpacity>
            </View>
          </FadeSlideIn>
        )}

        {/* Expandable Filter Drawer (Location & Status) */}
        {isFilterExpanded && (
          <FadeSlideIn delay={0} fromY={-8}>
            <ClosetFilterDrawer
              locationFilter={locationFilter}
              onSelectLocation={setLocationFilter}
              statusFilter={statusFilter}
              onSelectStatus={setStatusFilter}
              matchedCount={displayedItems.length}
              totalCount={items.length}
              onReset={handleResetSecondaryFilters}
              onClose={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setIsFilterExpanded(false);
              }}
            />
          </FadeSlideIn>
        )}

        {/* List — stagger each card */}
        <FlatList
          data={displayedItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ClothingCard
              item={item}
              delay={Math.min(index * 30, 200)}
              onPress={() => setSelectedItem(item)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <FadeSlideIn delay={150}>
              <View style={styles.empty}>
                <View style={styles.emptyIconBox}>
                  <Shirt size={44} color={Colors.textTertiary} strokeWidth={1.4} />
                </View>
                <Text style={styles.emptyTitle}>Nothing here</Text>
                <Text style={styles.emptyText}>No items match your active filters</Text>
                {(locationFilter || statusFilter || selectedCategory || searchQuery.length > 0) && (
                  <PressableScale
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setSearchQuery('');
                      setLocationFilter(null);
                      setStatusFilter(null);
                      setSelectedCategory(null);
                    }}
                    scaleTo={0.94}
                    style={styles.emptyResetBtn}
                  >
                    <Text style={styles.emptyResetBtnText}>Reset All Filters</Text>
                  </PressableScale>
                )}
              </View>
            </FadeSlideIn>
          }
        />

        {/* Interactive Garment Detail Bottom Sheet */}
        <GarmentDetailSheet
          item={selectedItem}
          visible={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          onEdit={(it) => navigation.navigate('Add', { editItem: it })}
        />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.accent,
    borderRadius: Radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.accent,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerStatBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  headerStatNum: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  statsStrip: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statNum: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statLabel: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.md,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  filterToggleBtn: {
    width: 46,
    height: 46,
    borderRadius: Radii.xl,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    position: 'relative',
  },
  filterToggleBtnOpen: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterToggleBtnHasFilters: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  activeSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingTop: 6,
    paddingBottom: 2,
    flexWrap: 'wrap',
  },
  activeSummaryLabel: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    marginRight: 2,
  },
  activeSummaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
  },
  activeSummaryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  clearAllTextBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  clearAllTextBtnText: {
    fontSize: 11,
    color: Colors.textTertiary,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  searchIcon: {
    color: Colors.textTertiary,
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    letterSpacing: -0.1,
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    color: Colors.textTertiary,
    fontSize: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: 2,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
  },
  categoryChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  categoryChipText: {
    color: Colors.textSecondary,
    fontSize: 11.5,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  statusChipText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 120,
  },
  empty: {
    alignItems: 'center',
    marginTop: 70,
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
  },
  emptyResetBtn: {
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
  emptyResetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
