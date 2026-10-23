import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Location, Status, STATUS_LABELS, STATUS_COLORS, LOCATION_LABELS } from '../types/wardrobe';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';
import { useWardrobe } from '../context/WardrobeContext';
import {
  LocationIcon,
  Layers,
  RotateCcw,
  X,
  Check,
  House,
  GraduationCap,
  SuitcaseRolling,
} from './AppIcons';
import PressableScale from './PressableScale';

const LOCATIONS: (Location | null)[] = [null, 'batangas_dorm', 'calamba_home', 'in_transit_bag'];
const STATUS_OPTIONS: (Status | null)[] = [null, 'clean', 'worn', 'in_laundry', 'drying', 'misplaced'];

interface ClosetFilterDrawerProps {
  locationFilter: Location | null;
  onSelectLocation: (loc: Location | null) => void;
  statusFilter: Status | null;
  onSelectStatus: (st: Status | null) => void;
  matchedCount: number;
  totalCount: number;
  onReset: () => void;
  onClose: () => void;
}

export default function ClosetFilterDrawer({
  locationFilter,
  onSelectLocation,
  statusFilter,
  onSelectStatus,
  matchedCount,
  totalCount,
  onReset,
  onClose,
}: ClosetFilterDrawerProps) {
  const { getLocationLabel: getCustomLocationLabel } = useWardrobe();
  const hasActiveFilters = locationFilter !== null || statusFilter !== null;

  const getLocationLabel = (loc: Location | null) => {
    if (!loc) return 'All Places';
    return loc === 'in_transit_bag' ? 'In Bag' : getCustomLocationLabel(loc);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Refine Closet</Text>
          <Text style={styles.headerSubtitle}>Filter by location & cleanliness</Text>
        </View>
        <View style={styles.headerActions}>
          {hasActiveFilters && (
            <TouchableOpacity
              onPress={onReset}
              activeOpacity={0.7}
              style={styles.resetBtn}
            >
              <RotateCcw size={12} color={Colors.textSecondary} strokeWidth={2.2} />
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            style={styles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={15} color={Colors.textSecondary} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Section: Location */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>LOCATION</Text>
          {locationFilter && (
            <Text style={styles.sectionValueBadge}>{getLocationLabel(locationFilter)}</Text>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {LOCATIONS.map((loc) => {
            const active = loc === locationFilter;
            const label = loc
              ? loc === 'batangas_dorm'
                ? 'Dorm'
                : loc === 'calamba_home'
                ? 'Home'
                : 'In Bag'
              : 'All';

            return (
              <PressableScale
                key={String(loc)}
                onPress={() => onSelectLocation(loc)}
                scaleTo={0.94}
              >
                <View style={[styles.filterChip, active && styles.filterChipActive]}>
                  {loc ? (
                    <LocationIcon
                      location={loc}
                      size={13}
                      color={active ? '#FFFFFF' : Colors.textSecondary}
                      strokeWidth={2}
                    />
                  ) : (
                    <Layers
                      size={13}
                      color={active ? '#FFFFFF' : Colors.textSecondary}
                      strokeWidth={2}
                    />
                  )}
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {label}
                  </Text>
                </View>
              </PressableScale>
            );
          })}
        </ScrollView>
      </View>

      {/* Section: Garment Status */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>GARMENT STATUS</Text>
          {statusFilter && (
            <Text
              style={[
                styles.sectionValueBadge,
                { color: STATUS_COLORS[statusFilter], backgroundColor: STATUS_COLORS[statusFilter] + '14' },
              ]}
            >
              {STATUS_LABELS[statusFilter]}
            </Text>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {STATUS_OPTIONS.map((st) => {
            const active = st === statusFilter;
            const color = st ? STATUS_COLORS[st] : Colors.textSecondary;
            return (
              <PressableScale
                key={String(st)}
                onPress={() => onSelectStatus(st)}
                scaleTo={0.94}
              >
                <View
                  style={[
                    styles.filterChip,
                    active && {
                      backgroundColor: color + '15',
                      borderColor: color + '80',
                    },
                  ]}
                >
                  {st ? (
                    <View style={[styles.statusDot, { backgroundColor: color }]} />
                  ) : (
                    <View style={[styles.statusDot, { backgroundColor: Colors.textTertiary }]} />
                  )}
                  <Text
                    style={[
                      styles.filterChipText,
                      active && { color, fontWeight: '700' },
                    ]}
                  >
                    {st ? STATUS_LABELS[st] : 'All Statuses'}
                  </Text>
                </View>
              </PressableScale>
            );
          })}
        </ScrollView>
      </View>

      {/* Footer Info & Done Button */}
      <View style={styles.footer}>
        <Text style={styles.footerCount}>
          Showing <Text style={styles.footerCountBold}>{matchedCount}</Text> of {totalCount} items
        </Text>
        <PressableScale onPress={onClose} scaleTo={0.94}>
          <View style={styles.doneBtn}>
            <Check size={13} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.doneBtnText}>Done</Text>
          </View>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderGlassBright,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    marginBottom: Spacing.sm,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    color: Colors.textTertiary,
    fontSize: 11,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    backgroundColor: Colors.bgSubtle,
  },
  resetBtnText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  sectionLabel: {
    color: Colors.textTertiary,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  sectionValueBadge: {
    color: Colors.accent,
    backgroundColor: Colors.bgSubtle,
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.sm,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: Colors.bgBase,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  filterChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: 11.5,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    marginTop: 2,
  },
  footerCount: {
    color: Colors.textTertiary,
    fontSize: 12,
  },
  footerCountBold: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
});
