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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWardrobe } from '../context/WardrobeContext';
import LocationFilter from '../components/LocationFilter';
import ClothingCard from '../components/ClothingCard';
import FadeSlideIn from '../components/FadeSlideIn';
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
    items,
  } = useWardrobe();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.textSecondary} style={{ marginTop: 120 }} />
      </View>
    );
  }

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
              <Text style={styles.subtitle}>{filteredItems.length} items</Text>
            </View>
            <View style={styles.headerStatBadge}>
              <Text style={styles.headerStatNum}>{filteredItems.length}</Text>
            </View>
          </View>
        </FadeSlideIn>

        {/* Stats strip */}
        <FadeSlideIn delay={60} fromY={10}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsStrip}>
            <View style={[styles.statChip, { borderColor: Colors.statusClean + '60' }]}>
              <View style={[styles.statDot, { backgroundColor: Colors.statusClean }]} />
              <Text style={[styles.statNum, { color: Colors.statusClean }]}>{cleanCount}</Text>
              <Text style={styles.statLabel}>Clean</Text>
            </View>
            <View style={[styles.statChip, { borderColor: Colors.statusWorn + '60' }]}>
              <View style={[styles.statDot, { backgroundColor: Colors.statusWorn }]} />
              <Text style={[styles.statNum, { color: Colors.statusWorn }]}>{wornCount}</Text>
              <Text style={styles.statLabel}>Worn</Text>
            </View>
            <View style={styles.statChip}>
              <View style={[styles.statDot, { backgroundColor: Colors.textTertiary }]} />
              <Text style={[styles.statNum, { color: Colors.textSecondary }]}>{items.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </ScrollView>
        </FadeSlideIn>

        {/* Search */}
        <FadeSlideIn delay={100} fromY={10}>
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
        </FadeSlideIn>

        {/* Filters */}
        <FadeSlideIn delay={140} fromY={10}>
          <LocationFilter selected={locationFilter} onSelect={setLocationFilter} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusRow}>
            {STATUS_OPTIONS.map((st) => {
              const active = st === statusFilter;
              const color = st ? STATUS_COLORS[st] : Colors.textSecondary;
              return (
                <TouchableOpacity
                  key={String(st)}
                  onPress={() => setStatusFilter(st)}
                  style={[
                    styles.statusChip,
                    active && {
                      backgroundColor: color + '18',
                      borderColor: color + '70',
                    },
                  ]}
                >
                  <Text style={[styles.statusChipText, active && { color }]}>
                    {st ? STATUS_LABELS[st] : 'All'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </FadeSlideIn>

        {/* List — stagger each card */}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ClothingCard
              item={item}
              delay={Math.min(index * 40, 300)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <FadeSlideIn delay={200}>
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>👕</Text>
                <Text style={styles.emptyTitle}>Nothing here</Text>
                <Text style={styles.emptyText}>No items match your filters</Text>
              </View>
            </FadeSlideIn>
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
  headerStatBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.glassMid,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerStatNum: {
    color: Colors.textPrimary,
    fontSize: 15,
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
    backgroundColor: Colors.glassLight,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
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
    opacity: 0.3,
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
