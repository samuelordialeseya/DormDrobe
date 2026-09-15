import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWardrobe } from '../context/WardrobeContext';
import ClothingCard from '../components/ClothingCard';
import {
  ClothingItem,
  Location,
  LOCATION_LABELS,
} from '../types/wardrobe';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';

type FitMode = 'uniform' | 'casual';

interface Outfit {
  top: ClothingItem;
  bottom: ClothingItem;
  shoes: ClothingItem | null;
}

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

export default function FitGeneratorScreen() {
  const { items } = useWardrobe();
  const [mode, setMode] = useState<FitMode>('uniform');
  const [currentLocation, setCurrentLocation] = useState<Location>('batangas_dorm');
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cleanAtLoc = useMemo(
    () => items.filter((it) => it.location === currentLocation && it.status === 'clean'),
    [items, currentLocation],
  );

  const pickRandom = <T,>(arr: T[]): T | null =>
    arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

  const generateOutfit = useCallback(() => {
    setError(null);
    let tops: ClothingItem[];
    if (mode === 'uniform') {
      tops = cleanAtLoc.filter((it) => it.isUniformWhiteTee);
    } else {
      tops = cleanAtLoc.filter((it) => it.category === 'tops');
    }
    const bottoms = cleanAtLoc.filter((it) => it.category === 'bottoms');
    const shoes = cleanAtLoc.filter((it) => it.category === 'footwear');

    const top = pickRandom(tops);
    const bottom = pickRandom(bottoms);

    if (!top || !bottom) {
      setOutfit(null);
      setError(
        mode === 'uniform'
          ? `No clean uniform pieces at ${LOC_SHORT[currentLocation]}.`
          : `Not enough clean tops & bottoms at ${LOC_SHORT[currentLocation]}.`,
      );
      return;
    }
    setOutfit({ top, bottom, shoes: pickRandom(shoes) });
  }, [cleanAtLoc, mode, currentLocation]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Fit Generator</Text>
            <Text style={styles.subtitle}>Let DormDrobe dress you today</Text>
          </View>

          {/* Mode selector */}
          <View style={styles.modeRow}>
            {(['uniform', 'casual'] as FitMode[]).map((m) => {
              const active = m === mode;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.modeCard, active && styles.modeCardActive]}
                  onPress={() => { setMode(m); setOutfit(null); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modeEmoji}>{m === 'uniform' ? '🏫' : '🧢'}</Text>
                  <Text style={[styles.modeTitle, active && styles.modeTitleActive]}>
                    {m === 'uniform' ? 'Uniform' : 'Casual'}
                  </Text>
                  <Text style={styles.modeDesc}>
                    {m === 'uniform' ? 'White tee + bottoms' : 'Any top + bottom'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Location */}
          <Text style={styles.sectionLabel}>CLOTHES AT</Text>
          <View style={styles.locRow}>
            {LOCATIONS.map((loc) => {
              const active = loc === currentLocation;
              return (
                <TouchableOpacity
                  key={loc}
                  style={[styles.locChip, active && styles.locChipActive]}
                  onPress={() => { setCurrentLocation(loc); setOutfit(null); }}
                  activeOpacity={0.6}
                >
                  <Text style={styles.locIcon}>{LOC_ICONS[loc]}</Text>
                  <Text style={[styles.locText, active && styles.locTextActive]}>
                    {LOC_SHORT[loc]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Generate button — accent only on primary CTA */}
          <TouchableOpacity style={styles.generateBtn} onPress={generateOutfit} activeOpacity={0.8}>
            <View style={styles.btnSpecular} />
            <Text style={styles.generateBtnText}>Generate Outfit</Text>
          </TouchableOpacity>

          {/* Error */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Result */}
          {outfit && (
            <View style={styles.outfitResult}>
              <Text style={styles.resultTitle}>Today's Fit</Text>

              <Text style={styles.slotLabel}>TOP</Text>
              <ClothingCard item={outfit.top} />

              <Text style={styles.slotLabel}>BOTTOM</Text>
              <ClothingCard item={outfit.bottom} />

              {outfit.shoes && (
                <>
                  <Text style={styles.slotLabel}>SHOES</Text>
                  <ClothingCard item={outfit.shoes} />
                </>
              )}

              <TouchableOpacity style={styles.reshuffleBtn} onPress={generateOutfit} activeOpacity={0.7}>
                <Text style={styles.reshuffleBtnText}>↺  Reshuffle</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 120,
  },
  header: {
    paddingTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  title: {
    color: Colors.textPrimary,
    ...Typography.title1,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textTertiary,
    fontSize: 14,
  },
  modeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  modeCard: {
    flex: 1,
    backgroundColor: Colors.glassLight,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  modeCardActive: {
    // Active = brighter glass, white border
    backgroundColor: Colors.glassBright,
    borderColor: Colors.borderGlassBright,
  },
  modeEmoji: {
    fontSize: 30,
    marginBottom: 6,
  },
  modeTitle: {
    color: Colors.textTertiary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  modeTitleActive: {
    color: Colors.textPrimary,
  },
  modeDesc: {
    color: Colors.textTertiary,
    fontSize: 11,
    textAlign: 'center',
  },
  sectionLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  locRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  locChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: Radii.lg,
    backgroundColor: Colors.glassLight,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  locChipActive: {
    backgroundColor: Colors.glassBright,
    borderColor: Colors.borderGlassBright,
  },
  locIcon: { fontSize: 13 },
  locText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  locTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  generateBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    borderRadius: Radii.xl,
    paddingVertical: 18,
    marginBottom: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
    // Neutral black shadow — no colored glow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  btnSpecular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  errorBox: {
    backgroundColor: 'rgba(255,69,58,0.10)',
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.30)',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    lineHeight: 19,
  },
  outfitResult: { marginTop: 4 },
  resultTitle: {
    color: Colors.textPrimary,
    ...Typography.title2,
    marginBottom: Spacing.lg,
  },
  slotLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: 10,
  },
  reshuffleBtn: {
    backgroundColor: Colors.glassLight,
    borderRadius: Radii.xl,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  reshuffleBtnText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
