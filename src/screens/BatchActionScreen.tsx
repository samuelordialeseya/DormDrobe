import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWardrobe } from '../context/WardrobeContext';
import ClothingCard from '../components/ClothingCard';
import BackgroundOrbs from '../components/BackgroundOrbs';
import { Location, LOCATION_LABELS } from '../types/wardrobe';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';

type Mode = 'laundry' | 'pack';

const LOCATIONS: Location[] = ['calamba_home', 'batangas_dorm', 'in_transit_bag'];
const LOC_SHORT: Record<Location, string> = {
  calamba_home: 'Calamba',
  batangas_dorm: 'Batangas',
  in_transit_bag: 'In Bag',
};
const LOC_ICONS: Record<Location, string> = {
  calamba_home: '🏠',
  batangas_dorm: '🏫',
  in_transit_bag: '🎒',
};

export default function BatchActionScreen() {
  const { items, batchSetStatus, batchMoveItems } = useWardrobe();
  const [mode, setMode] = useState<Mode>('laundry');
  const [selectedLocation, setSelectedLocation] = useState<Location>('batangas_dorm');
  const [packTarget, setPackTarget] = useState<Location>('in_transit_bag');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const wornAtLocation = useMemo(
    () => items.filter((it) => it.location === selectedLocation && it.status === 'worn'),
    [items, selectedLocation],
  );
  const laundryAtLocation = useMemo(
    () => items.filter((it) => it.location === selectedLocation && it.status === 'in_laundry'),
    [items, selectedLocation],
  );
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
    if (wornAtLocation.length === 0) {
      Alert.alert('Nothing to mark', `No worn items at ${LOCATION_LABELS[selectedLocation]}.`);
      return;
    }
    Alert.alert(
      'Laundry Day 🧺',
      `Mark ${wornAtLocation.length} worn items as "In Laundry"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark All', onPress: () => batchSetStatus({ location: selectedLocation, status: 'worn' }, 'in_laundry') },
      ],
    );
  };

  const handleMarkLaundryAsClean = () => {
    if (laundryAtLocation.length === 0) {
      Alert.alert('Nothing to mark', `No laundry items at ${LOCATION_LABELS[selectedLocation]}.`);
      return;
    }
    Alert.alert(
      'Laundry Done! 🎉',
      `Mark ${laundryAtLocation.length} items as "Clean"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'All Clean!', onPress: () => batchSetStatus({ location: selectedLocation, status: 'in_laundry' }, 'clean') },
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

  return (
    <View style={styles.container}>
      <BackgroundOrbs variant="purple" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>DormDrobe</Text>
          <Text style={styles.title}>Quick Actions</Text>
          <Text style={styles.subtitle}>Laundry day & packing assistant</Text>
        </View>

        {/* Mode toggle */}
        <View style={styles.modeRow}>
          {(['laundry', 'pack'] as Mode[]).map((m) => {
            const active = m === mode;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.modeBtn, active && styles.modeBtnActive]}
                onPress={() => setMode(m)}
                activeOpacity={0.7}
              >
                {active && <View style={styles.modeBtnGlow} />}
                <Text style={styles.modeBtnIcon}>{m === 'laundry' ? '🧺' : '🎒'}</Text>
                <Text style={[styles.modeBtnText, active && styles.modeBtnTextActive]}>
                  {m === 'laundry' ? 'Laundry Day' : 'Pack / Move'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Location */}
        <Text style={styles.sectionLabel}>AT LOCATION</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.locRow}>
          {LOCATIONS.map((loc) => {
            const active = loc === selectedLocation;
            return (
              <TouchableOpacity
                key={loc}
                style={[styles.locChip, active && styles.locChipActive]}
                onPress={() => { setSelectedLocation(loc); setSelectedIds(new Set()); }}
                activeOpacity={0.7}
              >
                {active && <View style={styles.chipGlow} />}
                <Text style={styles.locIcon}>{LOC_ICONS[loc]}</Text>
                <Text style={[styles.locText, active && styles.locTextActive]}>{LOC_SHORT[loc]}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Content */}
        {mode === 'laundry' ? (
          <View style={styles.actionArea}>
            <TouchableOpacity style={styles.actionCard} onPress={handleMarkAllWornAsLaundry} activeOpacity={0.75}>
              <View style={styles.actionCardGlow} />
              <View style={[styles.actionIconBg, { backgroundColor: 'rgba(251,191,36,0.15)', borderColor: 'rgba(251,191,36,0.3)' }]}>
                <Text style={styles.actionEmoji}>🧺</Text>
              </View>
              <View style={styles.actionCardBody}>
                <Text style={styles.actionTitle}>Mark Worn → In Laundry</Text>
                <Text style={styles.actionDesc}>
                  {wornAtLocation.length} worn items at {LOC_SHORT[selectedLocation]}
                </Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleMarkLaundryAsClean} activeOpacity={0.75}>
              <View style={styles.actionCardGlow} />
              <View style={[styles.actionIconBg, { backgroundColor: 'rgba(52,211,153,0.15)', borderColor: 'rgba(52,211,153,0.3)' }]}>
                <Text style={styles.actionEmoji}>✨</Text>
              </View>
              <View style={styles.actionCardBody}>
                <Text style={styles.actionTitle}>Mark Laundry → Clean</Text>
                <Text style={styles.actionDesc}>
                  {laundryAtLocation.length} in-laundry items at {LOC_SHORT[selectedLocation]}
                </Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.packArea}>
            <Text style={[styles.sectionLabel, { paddingHorizontal: Spacing.xl }]}>MOVE TO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.locRow}>
              {LOCATIONS.filter((l) => l !== selectedLocation).map((loc) => {
                const active = loc === packTarget;
                return (
                  <TouchableOpacity
                    key={loc}
                    style={[styles.locChip, active && styles.locChipActive]}
                    onPress={() => setPackTarget(loc)}
                    activeOpacity={0.7}
                  >
                    {active && <View style={styles.chipGlow} />}
                    <Text style={styles.locIcon}>{LOC_ICONS[loc]}</Text>
                    <Text style={[styles.locText, active && styles.locTextActive]}>{LOC_SHORT[loc]}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

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
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No clean items at {LOC_SHORT[selectedLocation]}
                </Text>
              }
            />

            {selectedIds.size > 0 && (
              <TouchableOpacity style={styles.packBtn} onPress={handlePack} activeOpacity={0.85}>
                <View style={styles.packBtnGlow} />
                <Text style={styles.packBtnText}>
                  🎒  Pack {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  appName: {
    color: Colors.purple300,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    color: Colors.textPrimary,
    ...Typography.title1,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  modeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: Radii.xl,
    backgroundColor: Colors.glassLight,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    position: 'relative',
    overflow: 'hidden',
  },
  modeBtnActive: {
    backgroundColor: 'rgba(139,92,246,0.18)',
    borderColor: 'rgba(139,92,246,0.50)',
  },
  modeBtnGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(196,181,253,0.5)',
  },
  modeBtnIcon: {
    fontSize: 16,
  },
  modeBtnText: {
    color: Colors.textTertiary,
    fontSize: 14,
    fontWeight: '600',
  },
  modeBtnTextActive: {
    color: Colors.purple300,
  },
  sectionLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    paddingHorizontal: Spacing.xl,
    marginBottom: 8,
    marginTop: 4,
  },
  locRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  locChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radii.pill,
    backgroundColor: Colors.glassLight,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    position: 'relative',
    overflow: 'hidden',
  },
  locChipActive: {
    backgroundColor: 'rgba(139,92,246,0.18)',
    borderColor: 'rgba(139,92,246,0.50)',
  },
  chipGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(196,181,253,0.5)',
  },
  locIcon: { fontSize: 13 },
  locText: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: '500',
  },
  locTextActive: {
    color: Colors.purple300,
    fontWeight: '600',
  },
  actionArea: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glassMid,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    position: 'relative',
    overflow: 'hidden',
  },
  actionCardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  actionIconBg: {
    width: 52,
    height: 52,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionCardBody: {
    flex: 1,
  },
  actionTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  actionDesc: {
    color: Colors.textTertiary,
    fontSize: 12,
  },
  actionArrow: {
    color: Colors.textTertiary,
    fontSize: 22,
    fontWeight: '300',
  },
  packArea: {
    flex: 1,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  emptyText: {
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  packBtn: {
    position: 'absolute',
    bottom: 30,
    left: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: Colors.purple600,
    borderRadius: Radii.xl,
    paddingVertical: 18,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: Colors.purple500,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 14,
  },
  packBtnGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  packBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
