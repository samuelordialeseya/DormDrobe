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
import FadeSlideIn from '../components/FadeSlideIn';
import PressableScale from '../components/PressableScale';
import { Location, LOCATION_LABELS } from '../types/wardrobe';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';
import {
  LocationIcon,
  Waves,
  Luggage,
  Sparkles,
  ChevronRight,
} from '../components/AppIcons';

type Mode = 'laundry' | 'pack';

const LOCATIONS: Location[] = ['calamba_home', 'batangas_dorm', 'in_transit_bag'];
const LOC_SHORT: Record<Location, string> = {
  calamba_home: 'Calamba',
  batangas_dorm: 'Batangas',
  in_transit_bag: 'In Bag',
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
    Alert.alert('Laundry Day', `Mark ${wornAtLocation.length} worn items as "In Laundry"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark All', onPress: () => batchSetStatus({ location: selectedLocation, status: 'worn' }, 'in_laundry') },
    ]);
  };

  const handleMarkLaundryAsClean = () => {
    if (laundryAtLocation.length === 0) {
      Alert.alert('Nothing to mark', `No laundry items at ${LOCATION_LABELS[selectedLocation]}.`);
      return;
    }
    Alert.alert('Laundry Done', `Mark ${laundryAtLocation.length} items as "Clean"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'All Clean', onPress: () => batchSetStatus({ location: selectedLocation, status: 'in_laundry' }, 'clean') },
    ]);
  };

  const handlePack = () => {
    if (selectedIds.size === 0) {
      Alert.alert('Select Items', 'Tap items below to select what to pack.');
      return;
    }
    Alert.alert('Pack Items', `Move ${selectedIds.size} items to ${LOCATION_LABELS[packTarget]}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Pack',
        onPress: () => {
          batchMoveItems(Array.from(selectedIds), packTarget);
          setSelectedIds(new Set());
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <FadeSlideIn delay={0} fromY={-10}>
          <View style={styles.header}>
            <Text style={styles.title}>Quick Actions</Text>
            <Text style={styles.subtitle}>Laundry & packing assistant</Text>
          </View>
        </FadeSlideIn>

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
                      color={active ? Colors.textPrimary : Colors.textTertiary}
                      strokeWidth={2}
                    />
                  ) : (
                    <Luggage
                      size={16}
                      color={active ? Colors.textPrimary : Colors.textTertiary}
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

        {/* Location */}
        <FadeSlideIn delay={100} fromY={10}>
          <Text style={styles.sectionLabel}>AT LOCATION</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.locRow}>
            {LOCATIONS.map((loc) => {
              const active = loc === selectedLocation;
              return (
                <PressableScale
                  key={loc}
                  scaleTo={0.93}
                  onPress={() => { setSelectedLocation(loc); setSelectedIds(new Set()); }}
                  style={[styles.locChip, active && styles.locChipActive]}
                >
                  <LocationIcon
                    location={loc}
                    size={14}
                    color={active ? Colors.textPrimary : Colors.textTertiary}
                    strokeWidth={2}
                  />
                  <Text style={[styles.locText, active && styles.locTextActive]}>{LOC_SHORT[loc]}</Text>
                </PressableScale>
              );
            })}
          </ScrollView>
        </FadeSlideIn>

        {/* Content */}
        {mode === 'laundry' ? (
          <View style={styles.actionArea}>
            <FadeSlideIn delay={140} fromY={12}>
              <PressableScale scaleTo={0.97} onPress={handleMarkAllWornAsLaundry}>
                <View style={styles.actionCard}>
                  <View style={styles.specular} />
                  <View style={[styles.actionIconBg, { backgroundColor: Colors.statusWorn + '18', borderColor: Colors.statusWorn + '40' }]}>
                    <Waves size={22} color={Colors.statusWorn} strokeWidth={2} />
                  </View>
                  <View style={styles.actionCardBody}>
                    <Text style={styles.actionTitle}>Mark Worn → In Laundry</Text>
                    <Text style={styles.actionDesc}>{wornAtLocation.length} worn at {LOC_SHORT[selectedLocation]}</Text>
                  </View>
                  <ChevronRight size={18} color={Colors.textTertiary} />
                </View>
              </PressableScale>
            </FadeSlideIn>

            <FadeSlideIn delay={180} fromY={12}>
              <PressableScale scaleTo={0.97} onPress={handleMarkLaundryAsClean}>
                <View style={styles.actionCard}>
                  <View style={styles.specular} />
                  <View style={[styles.actionIconBg, { backgroundColor: Colors.statusClean + '18', borderColor: Colors.statusClean + '40' }]}>
                    <Sparkles size={22} color={Colors.statusClean} strokeWidth={2} />
                  </View>
                  <View style={styles.actionCardBody}>
                    <Text style={styles.actionTitle}>Mark Laundry → Clean</Text>
                    <Text style={styles.actionDesc}>{laundryAtLocation.length} in-laundry at {LOC_SHORT[selectedLocation]}</Text>
                  </View>
                  <ChevronRight size={18} color={Colors.textTertiary} />
                </View>
              </PressableScale>
            </FadeSlideIn>
          </View>
        ) : (
          <View style={styles.packArea}>
            <FadeSlideIn delay={120} fromY={8}>
              <Text style={[styles.sectionLabel, { paddingHorizontal: Spacing.xl }]}>MOVE TO</Text>
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
                        color={active ? Colors.textPrimary : Colors.textTertiary}
                        strokeWidth={2}
                      />
                      <Text style={[styles.locText, active && styles.locTextActive]}>{LOC_SHORT[loc]}</Text>
                    </PressableScale>
                  );
                })}
              </ScrollView>
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
                  delay={Math.min(index * 40, 280)}
                />
              )}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No clean items at {LOC_SHORT[selectedLocation]}</Text>
              }
            />

            {selectedIds.size > 0 && (
              <FadeSlideIn delay={0} fromY={20}>
                <PressableScale scaleTo={0.97} onPress={handlePack} style={styles.packBtnWrap}>
                  <View style={styles.packBtn}>
                    <View style={styles.btnSpecular} />
                    <Text style={styles.packBtnText}>
                      Pack {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''}
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
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, marginBottom: Spacing.md },
  title: { color: Colors.textPrimary, ...Typography.title1, marginBottom: 4 },
  subtitle: { color: Colors.textTertiary, fontSize: 14 },
  modeRow: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
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
  },
  modeBtnActive: { backgroundColor: Colors.glassBright, borderColor: Colors.borderGlassBright },
  modeBtnIcon: { fontSize: 16 },
  modeBtnText: { color: Colors.textTertiary, fontSize: 14, fontWeight: '600' },
  modeBtnTextActive: { color: Colors.textPrimary },
  sectionLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    paddingHorizontal: Spacing.xl,
    marginBottom: 8,
    marginTop: 4,
  },
  locRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
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
  },
  locChipActive: { backgroundColor: Colors.glassBright, borderColor: Colors.borderGlassBright },
  locIcon: { fontSize: 13 },
  locText: { color: Colors.textTertiary, fontSize: 13, fontWeight: '500' },
  locTextActive: { color: Colors.textPrimary, fontWeight: '600' },
  actionArea: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  specular: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  actionIconBg: { width: 52, height: 52, borderRadius: Radii.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  actionEmoji: { fontSize: 24 },
  actionCardBody: { flex: 1 },
  actionTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600', letterSpacing: -0.2, marginBottom: 3 },
  actionDesc: { color: Colors.textTertiary, fontSize: 12 },
  actionArrow: { color: Colors.textTertiary, fontSize: 22, fontWeight: '300' },
  packArea: { flex: 1 },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 120 },
  emptyText: { color: Colors.textTertiary, textAlign: 'center', marginTop: 40, fontSize: 14 },
  packBtnWrap: {
    position: 'absolute',
    bottom: 30,
    left: Spacing.xl,
    right: Spacing.xl,
  },
  packBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.xl,
    paddingVertical: 18,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  btnSpecular: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  packBtnText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
});
