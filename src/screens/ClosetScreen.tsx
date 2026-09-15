import React from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWardrobe } from '../context/WardrobeContext';
import LocationFilter from '../components/LocationFilter';
import ClothingCard from '../components/ClothingCard';
import { Status, STATUS_LABELS, STATUS_COLORS } from '../types/wardrobe';

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
  } = useWardrobe();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  // Summary line
  const cleanUnderwearAtDorm = countItems({
    location: 'batangas_dorm',
    status: 'clean',
    category: 'underwear',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Closet</Text>
        <Text style={styles.subtitle}>
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, brand, color…"
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Location filter */}
      <LocationFilter selected={locationFilter} onSelect={setLocationFilter} />

      {/* Status chips */}
      <View style={styles.statusRow}>
        {STATUS_OPTIONS.map((st) => {
          const active = st === statusFilter;
          const color = st ? STATUS_COLORS[st] : '#8B5CF6';
          return (
            <TouchableOpacity
              key={String(st)}
              onPress={() => setStatusFilter(st)}
              style={[
                styles.statusChip,
                active && { backgroundColor: color + '22', borderColor: color },
              ]}
            >
              <Text
                style={[
                  styles.statusChipText,
                  active && { color },
                ]}
              >
                {st ? STATUS_LABELS[st] : 'All'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Quick stat */}
      {!locationFilter && !statusFilter && (
        <View style={styles.statBar}>
          <Text style={styles.statText}>
            🩲 <Text style={styles.statHighlight}>{cleanUnderwearAtDorm}</Text> clean underwear at
            Batangas
          </Text>
        </View>
      )}

      {/* List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ClothingCard item={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👕</Text>
            <Text style={styles.emptyText}>No items match your filters</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13131A',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E2E',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 14,
  },
  clearBtn: {
    color: '#6B7280',
    fontSize: 16,
    paddingLeft: 8,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#2A2A3E',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  statusChipText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
  },
  statBar: {
    marginHorizontal: 16,
    backgroundColor: '#1A1A2E',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  statText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  statHighlight: {
    color: '#34D399',
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
  },
});
