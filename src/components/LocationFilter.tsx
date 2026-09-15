import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Location, LOCATION_LABELS } from '../types/wardrobe';
import { Colors, Radii, Spacing } from '../theme/theme';

const LOCATIONS: (Location | null)[] = [null, 'calamba_home', 'batangas_dorm', 'in_transit_bag'];

const LOCATION_ICONS: Record<string, string> = {
  calamba_home: '🏠',
  batangas_dorm: '🏫',
  in_transit_bag: '🎒',
};

interface Props {
  selected: Location | null;
  onSelect: (loc: Location | null) => void;
}

export default function LocationFilter({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {LOCATIONS.map((loc) => {
        const active = loc === selected;
        const icon = loc ? LOCATION_ICONS[loc] : '◈';
        const label = loc ? LOCATION_LABELS[loc].replace(/^[^\s]+\s/, '') : 'All';

        return (
          <TouchableOpacity
            key={String(loc)}
            onPress={() => onSelect(loc)}
            activeOpacity={0.7}
            style={[styles.chip, active && styles.chipActive]}
          >
            {active && <View style={styles.chipGlow} />}
            <Text style={styles.chipIcon}>{icon}</Text>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    backgroundColor: Colors.glassLight,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    gap: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  chipActive: {
    backgroundColor: 'rgba(139,92,246,0.22)',
    borderColor: 'rgba(139,92,246,0.55)',
  },
  chipGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(196,181,253,0.5)',
  },
  chipIcon: {
    fontSize: 13,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  chipTextActive: {
    color: Colors.purple300,
    fontWeight: '600',
  },
});
