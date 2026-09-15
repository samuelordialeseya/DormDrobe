import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Location, LOCATION_LABELS } from '../types/wardrobe';
import { Colors, Radii, Spacing } from '../theme/theme';
import PressableScale from './PressableScale';

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
          <PressableScale
            key={String(loc)}
            onPress={() => onSelect(loc)}
            scaleTo={0.93}
          >
            <View style={[styles.chip, active && styles.chipActive]}>
              <Text style={styles.chipIcon}>{icon}</Text>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {label}
              </Text>
            </View>
          </PressableScale>
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
  },
  chipActive: {
    backgroundColor: Colors.glassBright,
    borderColor: Colors.borderGlassBright,
  },
  chipIcon: {
    fontSize: 13,
  },
  chipText: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  chipTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
});
