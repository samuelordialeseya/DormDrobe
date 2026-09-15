import React from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWardrobe } from '../context/WardrobeContext';
import LocationFilter from '../components/LocationFilter';
import ClothingCard from '../components/ClothingCard';
import BackgroundOrbs from '../components/BackgroundOrbs';
import { Status, STATUS_LABELS, STATUS_COLORS } from '../types/wardrobe';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';

const STATUS_OPTIONS: (Status | null)[] = [null, 'clean', 'worn', 'in_laundry', 'drying', 'misplaced'];

export default function ClosetScreen() {
  const {
    filteredItems,
    locationFilter,
    setLocationFilter,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    loading,
    countItems,
    items,
  } = useWardrobe();

  if (loading) {
    return (
      <View style={styles.container}>
        <BackgroundOrbs />
        <ActivityIndicator size="large" color={Colors.purple400} style={{ marginTop: 120 }} />
      </View>
    );
  }

  const cleanCount = items.filter((i) => i.status === 'clean').length;
  const wornCount = items.filter((i) => i.status === 'worn').length;

  return (
    <View style={styles.container}>
      <BackgroundOrbs variant="mixed" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>DormDrobe</Text>
            <Text style={styles.title}>My Closet</Text>
          </View>
          <View style={styles.headerStats}>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatNum}>{filteredItems.length}</Text>
              <Text style={styles.headerStatLabel}>items</Text>
            </View>
          </View>
        </View>

        {/* Quick stats strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsStrip}>
          <View style={[styles.statChip, { borderColor: Colors.statusClean + '55' }]}>
            <View style={[styles.statDot, { backgroundColor: Colors.statusClean }]} />
            <Text style={[styles.statChipNum, { color: Colors.statusClean }]}>{cleanCount}</Text>
            <Text style={styles.statChipLabel}>Clean</Text>
          </View>
          <View style={[styles.statChip, { borderColor: Colors.statusWorn + '55' }]}>
            <View style={[styles.statDot, { backgroundColor: Colors.statusWorn }]} />
            <Text style={[styles.statChipNum, { color: Colors.statusWorn }]}>{wornCount}</Text>
            <Text style={styles.statChipLabel}>Worn</Text>
          </View>
          <View style={[styles.statChip, { borderColor: Colors.purple300 + '55' }]}>
            <View style={[styles.statDot, { backgroundColor: Colors.purple400 }]} />
            <Text style={[styles.statChipNum, { color: Colors.purple300 }]}>{items.length}</Text>
            <Text style={styles.statChipLabel}>Total</Text>
          </View>
        </ScrollView>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>⌕</Text>
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
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Location filter */}
        <LocationFilter selected={locationFilter} onSelect={setLocationFilter} />

        {/* Status chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusRow}>
          {STATUS_OPTIONS.map((st) => {
            const active = st === statusFilter;
            const color = st ? STATUS_COLORS[st] : Colors.purple400;
            return (
              <TouchableOpacity
                key={String(st)}
                onPress={() => setStatusFilter(st)}
                style={[
                  styles.statusChip,
                  active && {
                    backgroundColor: color + '22',
                    borderColor: color + '88',
                  },
                ]}
              >
                {active && <View style={[styles.chipSpecular, { backgroundColor: color + '40' }]} />}
                <Text style={[styles.statusChipText, active && { color }]}>
                  {st ? STATUS_LABELS[st] : 'All'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* List */}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ClothingCard item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>👕</Text>
              <Text style={styles.emptyTitle}>Nothing here</Text>
              <Text style={styles.emptyText}>No items match your filters</Text>
            </View>
          }
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
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  appName: {
    color: Colors.purple300,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    color: Colors.textPrimary,
    ...Typography.title1,
  },
  headerStats: {
    alignItems: 'flex-end',
  },
  headerStat: {
    alignItems: 'center',
  },
  headerStatNum: {
    color: Colors.purple300,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -1,
  },
  headerStatLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
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
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: Colors.glassLight,
    borderWidth: 1,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statChipNum: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statChipLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glassLight,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.md,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    overflow: 'hidden',
  },
  searchIcon: {
    color: Colors.textTertiary,
    fontSize: 18,
    marginRight: 8,
    fontWeight: '300',
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
    backgroundColor: Colors.glassLight,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    position: 'relative',
    overflow: 'hidden',
  },
  chipSpecular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
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
  emptyEmoji: {
    fontSize: 52,
    marginBottom: 14,
    opacity: 0.5,
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
});
