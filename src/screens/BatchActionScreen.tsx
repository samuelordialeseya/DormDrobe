import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWardrobe } from '../context/WardrobeContext';
import ClothingCard from '../components/ClothingCard';
import FadeSlideIn from '../components/FadeSlideIn';
import PressableScale from '../components/PressableScale';
import { Location, LOCATION_LABELS, Status } from '../types/wardrobe';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';
import {
  LocationIcon,
  Waves,
  Luggage,
  Sparkles,
  ChevronRight,
  Check,
} from '../components/AppIcons';

type Mode = 'laundry' | 'pack';
type PackFilter = 'clean' | 'dirty' | 'all';

const LOCATIONS: Location[] = ['batangas_dorm', 'calamba_home', 'in_transit_bag'];
const LOC_SHORT: Record<Location, string> = {
  batangas_dorm: 'Batangas Dorm',
  calamba_home: 'Calamba Home',
  in_transit_bag: 'In-Transit Bag',
};

export default function BatchActionScreen() {
  const {
    items,
    currentLocation,
    batchSetStatus,
    batchMoveItems,
    unpackTransitBag,
    showToast,
    getLocationLabel,
  } = useWardrobe();

  const [mode, setMode] = useState<Mode>('laundry');
  const [selectedLocation, setSelectedLocation] = useState<Location>(currentLocation);
  const [packTarget, setPackTarget] = useState<Location>('in_transit_bag');
  const [packFilter, setPackFilter] = useState<PackFilter>('clean');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Laundry categories
  const wornAtLocation = useMemo(
    () => items.filter((it) => it.location === selectedLocation && it.status === 'worn'),
    [items, selectedLocation],
  );
  const laundryAtLocation = useMemo(
    () => items.filter((it) => it.location === selectedLocation && it.status === 'in_laundry'),
    [items, selectedLocation],
  );
  const dryingAtLocation = useMemo(
    () => items.filter((it) => it.location === selectedLocation && it.status === 'drying'),
    [items, selectedLocation],
  );

  // Packable items based on pack filter
  const packableItems = useMemo(() => {
    return items.filter((it) => {
      if (it.location !== selectedLocation) return false;
      if (packFilter === 'clean') return it.status === 'clean';
      if (packFilter === 'dirty') return it.status === 'worn' || it.status === 'in_laundry';
      return true;
    });
  }, [items, selectedLocation, packFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(packableItems.map((i) => i.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Smart 3-day weekend packing formula
  const handleApplyWeekendPreset = () => {
    const cleanAtLoc = items.filter((i) => i.location === selectedLocation && i.status === 'clean');
    const selected = new Set<string>();

    const tops = cleanAtLoc.filter((i) => i.category === 'tops').slice(0, 3);
    const bottoms = cleanAtLoc.filter((i) => i.category === 'bottoms').slice(0, 2);
    const underwear = cleanAtLoc.filter((i) => i.category === 'underwear').slice(0, 3);
    const shoes = cleanAtLoc.filter((i) => i.category === 'footwear').slice(0, 1);

    [...tops, ...bottoms, ...underwear, ...shoes].forEach((i) => selected.add(i.id));
    setSelectedIds(selected);

    showToast({
      message: `Selected 3-Day Weekend Formula (${selected.size} items)`,
      type: 'info',
    });
  };

  // Laundry actions with instant optimistic execution + Undo toast
  const handleMarkWornToLaundry = () => {
    if (wornAtLocation.length === 0) {
      showToast({ message: 'No worn items at this location', type: 'info' });
      return;
    }
    const count = wornAtLocation.length;
    batchSetStatus({ location: selectedLocation, status: 'worn' }, 'in_laundry');
    showToast({
      message: `Moved ${count} worn item${count > 1 ? 's' : ''} to Laundry`,
      type: 'success',
      action: {
        label: 'Undo',
        onPress: () => batchSetStatus({ location: selectedLocation, status: 'in_laundry' }, 'worn'),
      },
    });
  };

  const handleMarkLaundryToDrying = () => {
    if (laundryAtLocation.length === 0) {
      showToast({ message: 'No laundry items to dry at this location', type: 'info' });
      return;
    }
    const count = laundryAtLocation.length;
    batchSetStatus({ location: selectedLocation, status: 'in_laundry' }, 'drying');
    showToast({
      message: `Moved ${count} item${count > 1 ? 's' : ''} to Drying line`,
      type: 'success',
      action: {
        label: 'Undo',
        onPress: () => batchSetStatus({ location: selectedLocation, status: 'drying' }, 'in_laundry'),
      },
    });
  };

  const handleMarkDryingToClean = () => {
    if (dryingAtLocation.length === 0) {
      if (laundryAtLocation.length > 0) {
        showToast({
          message: 'Items are still in wash! Hang them to dry first in Step 2, or use Express Laundromat below.',
          type: 'warning',
        });
      } else {
        showToast({ message: 'No drying clothes to collect at this location', type: 'info' });
      }
      return;
    }

    const count = dryingAtLocation.length;
    batchSetStatus({ location: selectedLocation, status: 'drying' }, 'clean');
    showToast({
      message: `Marked ${count} dry item${count > 1 ? 's' : ''} as Clean & Ready!`,
      type: 'success',
      action: {
        label: 'Undo',
        onPress: () => batchSetStatus({ location: selectedLocation, status: 'clean' }, 'drying'),
      },
    });
  };

  const handleLaundromatExpressClean = () => {
    const totalToClean = laundryAtLocation.length + dryingAtLocation.length;
    if (totalToClean === 0) {
      showToast({ message: 'No laundry or drying clothes to finish', type: 'info' });
      return;
    }
    batchSetStatus({ location: selectedLocation, status: 'in_laundry' }, 'clean');
    batchSetStatus({ location: selectedLocation, status: 'drying' }, 'clean');
    showToast({
      message: `Express wash & fold: Marked ${totalToClean} items Clean!`,
      type: 'success',
    });
  };

  // Pack action with instant execution + Undo toast
  const handlePack = () => {
    if (selectedIds.size === 0) {
      showToast({ message: 'Tap items to select what to pack', type: 'warning' });
      return;
    }

    const idsArray = Array.from(selectedIds);
    const count = idsArray.length;
    const sourceLoc = selectedLocation;

    batchMoveItems(idsArray, packTarget);
    setSelectedIds(new Set());

    showToast({
      message: `Packed ${count} item${count > 1 ? 's' : ''} to ${getLocationLabel(packTarget)}`,
      type: 'success',
      action: {
        label: 'Undo',
        onPress: () => batchMoveItems(idsArray, sourceLoc),
      },
    });
  };

  const bagItemsCount = items.filter((i) => i.location === 'in_transit_bag').length;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <FadeSlideIn delay={0} fromY={-10}>
          <View style={styles.header}>
            <Text style={styles.title}>Quick Actions</Text>
            <Text style={styles.subtitle}>Laundry triage & luggage transfer</Text>
          </View>
        </FadeSlideIn>

        {/* 1-Tap Unpack Bag Banner (if bag has items) */}
        {bagItemsCount > 0 && selectedLocation !== 'in_transit_bag' && (
          <FadeSlideIn delay={30} fromY={8}>
            <View style={styles.unpackStrip}>
              <Luggage size={18} color={Colors.locInTransit} />
              <Text style={styles.unpackStripText}>
                {bagItemsCount} item{bagItemsCount > 1 ? 's' : ''} in Bag
              </Text>
              <TouchableOpacity
                onPress={() => unpackTransitBag(selectedLocation)}
                style={styles.unpackStripBtn}
              >
                <Text style={styles.unpackStripBtnText}>
                  Unpack to {getLocationLabel(selectedLocation)}
                </Text>
              </TouchableOpacity>
            </View>
          </FadeSlideIn>
        )}

        {/* Mode toggle */}
        <FadeSlideIn delay={60} fromY={10}>
          <View style={styles.modeRow}>
            {(['laundry', 'pack'] as Mode[]).map((m) => {
              const active = m === mode;
              return (
                <PressableScale
                  key={m}
                  scaleTo={0.95}
                  onPress={() => setMode(m)}
                  style={[styles.modeBtn, active && styles.modeBtnActive]}
                >
                  {m === 'laundry' ? (
                    <Waves
                      size={16}
                      color={active ? '#FFFFFF' : Colors.textTertiary}
                      strokeWidth={2}
                    />
                  ) : (
                    <Luggage
                      size={16}
                      color={active ? '#FFFFFF' : Colors.textTertiary}
                      strokeWidth={2}
                    />
                  )}
                  <Text style={[styles.modeBtnText, active && styles.modeBtnTextActive]}>
                    {m === 'laundry' ? 'Laundry Day' : 'Pack / Move'}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </FadeSlideIn>

        {/* Source Location */}
        <FadeSlideIn delay={90} fromY={10}>
          <Text style={styles.sectionLabel}>CURRENT LOCATION</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.locRow}>
            {LOCATIONS.map((loc) => {
              const active = loc === selectedLocation;
              return (
                <PressableScale
                  key={loc}
                  scaleTo={0.93}
                  onPress={() => {
                    setSelectedLocation(loc);
                    setSelectedIds(new Set());
                  }}
                  style={[styles.locChip, active && styles.locChipActive]}
                >
                  <LocationIcon
                    location={loc}
                    size={14}
                    color={active ? '#FFFFFF' : Colors.textTertiary}
                    strokeWidth={2}
                  />
                  <Text style={[styles.locText, active && styles.locTextActive]}>
                    {loc === 'in_transit_bag' ? 'In Bag' : getLocationLabel(loc)}
                  </Text>
                </PressableScale>
              );
            })}
          </ScrollView>
        </FadeSlideIn>

        {/* Mode Content */}
        {mode === 'laundry' ? (
          <ScrollView contentContainerStyle={styles.actionArea} showsVerticalScrollIndicator={false}>
            {/* Step 1: Worn -> Laundry */}
            <FadeSlideIn delay={120} fromY={12}>
              <PressableScale scaleTo={0.97} onPress={handleMarkWornToLaundry}>
                <View style={styles.actionCard}>
                  <View style={styles.specular} />
                  <View style={[styles.actionIconBg, { backgroundColor: Colors.statusWorn + '18', borderColor: Colors.statusWorn + '40' }]}>
                    <Waves size={22} color={Colors.statusWorn} strokeWidth={2} />
                  </View>
                  <View style={styles.actionCardBody}>
                    <Text style={styles.actionTitle}>1. Mark Worn → In Laundry</Text>
                    <Text style={styles.actionDesc}>
                      {wornAtLocation.length} worn clothes at {getLocationLabel(selectedLocation)}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={Colors.textTertiary} />
                </View>
              </PressableScale>
            </FadeSlideIn>

            {/* Step 2: Laundry -> Drying */}
            <FadeSlideIn delay={150} fromY={12}>
              <PressableScale scaleTo={0.97} onPress={handleMarkLaundryToDrying}>
                <View style={styles.actionCard}>
                  <View style={styles.specular} />
                  <View style={[styles.actionIconBg, { backgroundColor: Colors.statusDrying + '18', borderColor: Colors.statusDrying + '40' }]}>
                    <Waves size={22} color={Colors.statusDrying} strokeWidth={2} />
                  </View>
                  <View style={styles.actionCardBody}>
                    <Text style={styles.actionTitle}>2. Mark Laundry → Drying</Text>
                    <Text style={styles.actionDesc}>
                      {laundryAtLocation.length} washing at {getLocationLabel(selectedLocation)}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={Colors.textTertiary} />
                </View>
              </PressableScale>
            </FadeSlideIn>

            {/* Step 3: Drying -> Clean */}
            <FadeSlideIn delay={180} fromY={12}>
              <PressableScale scaleTo={0.97} onPress={handleMarkDryingToClean}>
                <View style={styles.actionCard}>
                  <View style={styles.specular} />
                  <View style={[styles.actionIconBg, { backgroundColor: Colors.statusClean + '18', borderColor: Colors.statusClean + '40' }]}>
                    <Sparkles size={22} color={Colors.statusClean} strokeWidth={2} />
                  </View>
                  <View style={styles.actionCardBody}>
                    <Text style={styles.actionTitle}>3. Collect Dry Clothes → Clean</Text>
                    <Text style={styles.actionDesc}>
                      {dryingAtLocation.length} dry items ready at {getLocationLabel(selectedLocation)}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={Colors.textTertiary} />
                </View>
              </PressableScale>
            </FadeSlideIn>

            {/* Express Laundromat Wash & Fold Shortcut */}
            {(laundryAtLocation.length > 0 || dryingAtLocation.length > 0) && (
              <FadeSlideIn delay={210} fromY={12}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={handleLaundromatExpressClean}
                  style={styles.expressLaundromatBtn}
                >
                  <Sparkles size={15} color={Colors.statusClean} strokeWidth={2.2} />
                  <Text style={styles.expressLaundromatText}>
                    ⚡ Laundromat / Dryer: Mark all ({laundryAtLocation.length + dryingAtLocation.length}) Clean
                  </Text>
                </TouchableOpacity>
              </FadeSlideIn>
            )}
          </ScrollView>
        ) : (
          <View style={styles.packArea}>
            {/* Target Location */}
            <FadeSlideIn delay={110} fromY={8}>
              <Text style={styles.sectionLabel}>DESTINATION</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.locRow}>
                {LOCATIONS.filter((l) => l !== selectedLocation).map((loc) => {
                  const active = loc === packTarget;
                  return (
                    <PressableScale
                      key={loc}
                      scaleTo={0.93}
                      onPress={() => setPackTarget(loc)}
                      style={[styles.locChip, active && styles.locChipActive]}
                    >
                      <LocationIcon
                        location={loc}
                        size={14}
                        color={active ? '#FFFFFF' : Colors.textTertiary}
                        strokeWidth={2}
                      />
                      <Text style={[styles.locText, active && styles.locTextActive]}>
                        {loc === 'in_transit_bag' ? 'In Bag' : getLocationLabel(loc)}
                      </Text>
                    </PressableScale>
                  );
                })}
              </ScrollView>
            </FadeSlideIn>

            {/* Pack Filter Pills + Smart Weekend Preset */}
            <FadeSlideIn delay={130} fromY={8}>
              <View style={styles.packFilterBar}>
                <View style={styles.filterPillsRow}>
                  <TouchableOpacity
                    onPress={() => setPackFilter('clean')}
                    style={[styles.packFilterPill, packFilter === 'clean' && styles.packFilterPillActive]}
                  >
                    <Text style={[styles.packFilterText, packFilter === 'clean' && styles.packFilterTextActive]}>
                      Clean Clothes
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setPackFilter('dirty')}
                    style={[styles.packFilterPill, packFilter === 'dirty' && styles.packFilterPillActive]}
                  >
                    <Text style={[styles.packFilterText, packFilter === 'dirty' && styles.packFilterTextActive]}>
                      Dirty Laundry
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setPackFilter('all')}
                    style={[styles.packFilterPill, packFilter === 'all' && styles.packFilterPillActive]}
                  >
                    <Text style={[styles.packFilterText, packFilter === 'all' && styles.packFilterTextActive]}>
                      All
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Quick helpers */}
                <View style={styles.quickSelectRow}>
                  <TouchableOpacity onPress={handleSelectAll}>
                    <Text style={styles.quickSelectText}>Select All ({packableItems.length})</Text>
                  </TouchableOpacity>
                  {selectedIds.size > 0 && (
                    <TouchableOpacity onPress={handleDeselectAll}>
                      <Text style={[styles.quickSelectText, { color: Colors.textTertiary }]}>Clear</Text>
                    </TouchableOpacity>
                  )}
                  {packFilter === 'clean' && (
                    <TouchableOpacity onPress={handleApplyWeekendPreset} style={styles.presetPill}>
                      <Text style={styles.presetPillText}>Weekend 3-Day</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </FadeSlideIn>

            <FlatList
              data={packableItems}
              keyExtractor={(it) => it.id}
              renderItem={({ item, index }) => (
                <ClothingCard
                  item={item}
                  selectable
                  selected={selectedIds.has(item.id)}
                  onToggleSelect={() => toggleSelect(item.id)}
                  delay={Math.min(index * 30, 200)}
                />
              )}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No {packFilter === 'dirty' ? 'dirty' : 'clean'} items at {getLocationLabel(selectedLocation)}
                </Text>
              }
            />

            {selectedIds.size > 0 && (
              <FadeSlideIn delay={0} fromY={20}>
                <PressableScale scaleTo={0.97} onPress={handlePack} style={styles.packBtnWrap}>
                  <View style={styles.packBtn}>
                    <View style={styles.btnSpecular} />
                    <Text style={styles.packBtnText}>
                      Pack {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} to{' '}
                      {getLocationLabel(packTarget)}
                    </Text>
                  </View>
                </PressableScale>
              </FadeSlideIn>
            )}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgBase },
  safe: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, marginBottom: Spacing.sm },
  title: { color: Colors.textPrimary, ...Typography.title1, marginBottom: 2 },
  subtitle: { color: Colors.textTertiary, fontSize: 13 },
  unpackStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(77, 107, 83, 0.25)',
    gap: 8,
  },
  unpackStripText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  unpackStripBtn: {
    backgroundColor: Colors.locInTransit,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  unpackStripBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  modeRow: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: Radii.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  modeBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  modeBtnText: { color: Colors.textTertiary, fontSize: 13, fontWeight: '600' },
  modeBtnTextActive: { color: '#FFFFFF' },
  sectionLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    paddingHorizontal: Spacing.xl,
    marginBottom: 6,
    marginTop: 2,
  },
  locRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  locChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  locChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  locText: { color: Colors.textTertiary, fontSize: 12, fontWeight: '500' },
  locTextActive: { color: '#FFFFFF', fontWeight: '600' },
  actionArea: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: 110 },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    padding: Spacing.md,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  specular: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  actionIconBg: { width: 44, height: 44, borderRadius: Radii.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  actionCardBody: { flex: 1 },
  actionTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600', letterSpacing: -0.2, marginBottom: 2 },
  actionDesc: { color: Colors.textTertiary, fontSize: 12 },
  packArea: { flex: 1 },
  packFilterBar: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xs,
    gap: 6,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  packFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  packFilterPillActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  packFilterText: {
    color: Colors.textSecondary,
    fontSize: 11.5,
    fontWeight: '500',
  },
  packFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  quickSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 3,
  },
  quickSelectText: {
    color: Colors.textSecondary,
    fontSize: 11.5,
    fontWeight: '600',
  },
  presetPill: {
    marginLeft: 'auto',
    backgroundColor: Colors.locBatangasBg,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(29, 78, 216, 0.22)',
  },
  presetPillText: {
    color: Colors.locBatangas,
    fontSize: 11,
    fontWeight: '700',
  },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 130 },
  emptyText: { color: Colors.textTertiary, textAlign: 'center', marginTop: 40, fontSize: 13 },
  packBtnWrap: {
    position: 'absolute',
    bottom: 30,
    left: Spacing.xl,
    right: Spacing.xl,
  },
  packBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.xl,
    paddingVertical: 15,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  btnSpecular: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  packBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  expressLaundromatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radii.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.25)',
    borderStyle: 'dashed',
  },
  expressLaundromatText: {
    color: Colors.statusClean,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
