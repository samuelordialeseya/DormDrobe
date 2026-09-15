import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWardrobe } from '../context/WardrobeContext';
import ClothingCard from '../components/ClothingCard';
import {
  Location,
  LOCATION_LABELS,
} from '../types/wardrobe';

type Mode = 'laundry' | 'pack';

export default function BatchActionScreen() {
  const { items, batchSetStatus, batchMoveItems } = useWardrobe();
  const [mode, setMode] = useState<Mode>('laundry');
  const [selectedLocation, setSelectedLocation] = useState<Location>('batangas_dorm');
  const [packTarget, setPackTarget] = useState<Location>('in_transit_bag');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Laundry helpers ────────────────────────────────────────────────
  const wornAtLocation = useMemo(
    () => items.filter((it) => it.location === selectedLocation && it.status === 'worn'),
    [items, selectedLocation],
  );
  const laundryAtLocation = useMemo(
    () => items.filter((it) => it.location === selectedLocation && it.status === 'in_laundry'),
    [items, selectedLocation],
  );

  // ── Pack helpers ───────────────────────────────────────────────────
  const packableItems = useMemo(
    () => items.filter((it) => it.location === selectedLocation && it.status === 'clean'),
    [items, selectedLocation],
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMarkAllWornAsLaundry = () => {
    const count = wornAtLocation.length;
    if (count === 0) {
      Alert.alert('Nothing to mark', `No worn items at ${LOCATION_LABELS[selectedLocation]}.`);
      return;
    }
    Alert.alert(
      'Laundry Day 🧺',
      `Mark ${count} worn items at ${LOCATION_LABELS[selectedLocation]} as "In Laundry"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All',
          onPress: () =>
            batchSetStatus({ location: selectedLocation, status: 'worn' }, 'in_laundry'),
        },
      ],
    );
  };

  const handleMarkLaundryAsClean = () => {
    const count = laundryAtLocation.length;
    if (count === 0) {
      Alert.alert('Nothing to mark', `No laundry items at ${LOCATION_LABELS[selectedLocation]}.`);
      return;
    }
    Alert.alert(
      'Laundry Done! 🎉',
      `Mark ${count} items at ${LOCATION_LABELS[selectedLocation]} as "Clean"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'All Clean!',
          onPress: () =>
            batchSetStatus({ location: selectedLocation, status: 'in_laundry' }, 'clean'),
        },
      ],
    );
  };

  const handlePack = () => {
    if (selectedIds.size === 0) {
      Alert.alert('Select Items', 'Tap items below to select what to pack.');
      return;
    }
    Alert.alert(
      'Pack Items 🎒',
      `Move ${selectedIds.size} items to ${LOCATION_LABELS[packTarget]}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pack!',
          onPress: () => {
            batchMoveItems(Array.from(selectedIds), packTarget);
            setSelectedIds(new Set());
          },
        },
      ],
    );
  };

  const LOCATIONS: Location[] = ['calamba_home', 'batangas_dorm', 'in_transit_bag'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Batch Actions</Text>
      <Text style={styles.subtitle}>Laundry day & packing assistant</Text>

      {/* Mode toggle */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'laundry' && styles.modeBtnActive]}
          onPress={() => setMode('laundry')}
        >
          <Text style={[styles.modeBtnText, mode === 'laundry' && styles.modeBtnTextActive]}>
            🧺 Laundry Day
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'pack' && styles.modeBtnActive]}
          onPress={() => setMode('pack')}
        >
          <Text style={[styles.modeBtnText, mode === 'pack' && styles.modeBtnTextActive]}>
            🎒 Pack / Move
          </Text>
        </TouchableOpacity>
      </View>

      {/* Location selector */}
      <Text style={styles.sectionLabel}>AT LOCATION:</Text>
      <View style={styles.locRow}>
        {LOCATIONS.map((loc) => (
          <TouchableOpacity
            key={loc}
            style={[styles.locChip, selectedLocation === loc && styles.locChipActive]}
            onPress={() => {
              setSelectedLocation(loc);
              setSelectedIds(new Set());
            }}
          >
            <Text style={[styles.locChipText, selectedLocation === loc && styles.locChipTextActive]}>
              {LOCATION_LABELS[loc]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'laundry' ? (
        <View style={styles.actionArea}>
          {/* 1-tap laundry buttons */}
          <TouchableOpacity style={styles.actionCard} onPress={handleMarkAllWornAsLaundry}>
            <Text style={styles.actionEmoji}>👕→🧺</Text>
            <View>
              <Text style={styles.actionTitle}>Mark Worn → In Laundry</Text>
              <Text style={styles.actionDesc}>
                {wornAtLocation.length} worn items at {LOCATION_LABELS[selectedLocation]}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleMarkLaundryAsClean}>
            <Text style={styles.actionEmoji}>🧺→✨</Text>
            <View>
              <Text style={styles.actionTitle}>Mark Laundry → Clean</Text>
              <Text style={styles.actionDesc}>
                {laundryAtLocation.length} in-laundry items at {LOCATION_LABELS[selectedLocation]}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Pack target */}
          <Text style={styles.sectionLabel}>MOVE TO:</Text>
          <View style={styles.locRow}>
            {LOCATIONS.filter((l) => l !== selectedLocation).map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[styles.locChip, packTarget === loc && styles.locChipActive]}
                onPress={() => setPackTarget(loc)}
              >
                <Text style={[styles.locChipText, packTarget === loc && styles.locChipTextActive]}>
                  {LOCATION_LABELS[loc]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={packableItems}
            keyExtractor={(it) => it.id}
            renderItem={({ item }) => (
              <ClothingCard
                item={item}
                selectable
                selected={selectedIds.has(item.id)}
                onToggleSelect={() => toggleSelect(item.id)}
              />
            )}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No clean items at {LOCATION_LABELS[selectedLocation]}
              </Text>
            }
          />

          {selectedIds.size > 0 && (
            <TouchableOpacity style={styles.packBtn} onPress={handlePack}>
              <Text style={styles.packBtnText}>
                🎒 Pack {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13131A',
  },
  title: {
    color: '#F9FAFB',
    fontSize: 28,
    fontWeight: '800',
    paddingHorizontal: 20,
    marginTop: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 13,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1E1E2E',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  modeBtnActive: {
    backgroundColor: '#8B5CF620',
    borderColor: '#8B5CF6',
  },
  modeBtnText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  modeBtnTextActive: {
    color: '#C4B5FD',
  },
  sectionLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 6,
  },
  locRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  locChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#1E1E2E',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  locChipActive: {
    backgroundColor: '#8B5CF620',
    borderColor: '#8B5CF6',
  },
  locChipText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  locChipTextActive: {
    color: '#C4B5FD',
    fontWeight: '600',
  },
  actionArea: {
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  actionEmoji: {
    fontSize: 28,
  },
  actionTitle: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionDesc: {
    color: '#6B7280',
    fontSize: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
  },
  packBtn: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  packBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
