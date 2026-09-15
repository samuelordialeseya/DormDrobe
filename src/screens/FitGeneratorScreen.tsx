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

type FitMode = 'uniform' | 'casual';

interface Outfit {
  top: ClothingItem;
  bottom: ClothingItem;
  shoes: ClothingItem | null;
}

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
          ? `Not enough clean uniform items at ${LOCATION_LABELS[currentLocation]}. Need at least 1 white tee and 1 bottom.`
          : `Not enough clean tops & bottoms at ${LOCATION_LABELS[currentLocation]}.`,
      );
      return;
    }

    setOutfit({
      top,
      bottom,
      shoes: pickRandom(shoes),
    });
  }, [cleanAtLoc, mode, currentLocation]);

  const LOCATIONS: Location[] = ['calamba_home', 'batangas_dorm', 'in_transit_bag'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Fit Generator</Text>
        <Text style={styles.subtitle}>Let DormDrobe pick today's outfit</Text>

        {/* Mode toggle */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'uniform' && styles.modeBtnActive]}
            onPress={() => { setMode('uniform'); setOutfit(null); }}
          >
            <Text style={styles.modeEmoji}>🏫</Text>
            <Text style={[styles.modeBtnText, mode === 'uniform' && styles.modeBtnTextActive]}>
              School Uniform
            </Text>
            <Text style={styles.modeDesc}>White tee + bottoms</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'casual' && styles.modeBtnActive]}
            onPress={() => { setMode('casual'); setOutfit(null); }}
          >
            <Text style={styles.modeEmoji}>🧢</Text>
            <Text style={[styles.modeBtnText, mode === 'casual' && styles.modeBtnTextActive]}>
              Casual
            </Text>
            <Text style={styles.modeDesc}>Any top + bottom</Text>
          </TouchableOpacity>
        </View>

        {/* Location selector */}
        <Text style={styles.sectionLabel}>CLOTHES AT:</Text>
        <View style={styles.locRow}>
          {LOCATIONS.map((loc) => (
            <TouchableOpacity
              key={loc}
              style={[styles.locChip, currentLocation === loc && styles.locChipActive]}
              onPress={() => { setCurrentLocation(loc); setOutfit(null); }}
            >
              <Text style={[styles.locChipText, currentLocation === loc && styles.locChipTextActive]}>
                {LOCATION_LABELS[loc]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Generate button */}
        <TouchableOpacity style={styles.generateBtn} onPress={generateOutfit}>
          <Text style={styles.generateBtnText}>🎲  Generate Outfit</Text>
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
            <Text style={styles.resultTitle}>Today's Fit 🔥</Text>

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

            <TouchableOpacity style={styles.reshuffleBtn} onPress={generateOutfit}>
              <Text style={styles.reshuffleBtnText}>🔄  Reshuffle</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13131A',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 16,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  modeBtnActive: {
    backgroundColor: '#8B5CF620',
    borderColor: '#8B5CF6',
  },
  modeEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  modeBtnText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  modeBtnTextActive: {
    color: '#C4B5FD',
  },
  modeDesc: {
    color: '#4B5563',
    fontSize: 11,
    marginTop: 2,
  },
  sectionLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  locRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
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
  generateBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#F8717122',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F87171',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
  },
  outfitResult: {
    marginTop: 4,
  },
  resultTitle: {
    color: '#F9FAFB',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  slotLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
    marginTop: 8,
  },
  reshuffleBtn: {
    backgroundColor: '#1E1E2E',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  reshuffleBtnText: {
    color: '#C4B5FD',
    fontSize: 14,
    fontWeight: '600',
  },
});
