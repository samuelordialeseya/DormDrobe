import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Location, LOCATION_LABELS } from '../types/wardrobe';
import { Colors, Radii, Spacing } from '../theme/theme';
import PressableScale from './PressableScale';
import { LocationIcon, Layers } from './AppIcons';

const LOCATIONS: (Location | null)[] = [null, 'calamba_home', 'batangas_dorm', 'in_transit_bag'];

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
        const label = loc ? (loc === 'batangas_dorm' ? 'Dorm' : loc === 'calamba_home' ? 'Home' : 'In Bag') : 'All';
        const iconColor = active ? '#FFFFFF' : Colors.textTertiary;

        return (
          <PressableScale
            key={String(loc)}
            onPress={() => onSelect(loc)}
            scaleTo={0.93}
          >
            <View style={[styles.chip, active && styles.chipActive]}>
              {loc ? (
                <LocationIcon location={loc} size={14} color={iconColor} strokeWidth={2} />
              ) : (
                <Layers size={14} color={iconColor} strokeWidth={2} />
              )}
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
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
    gap: 6,
  },
  chipActive: {
    backgroundColor: '#1C1C1E',
    borderColor: '#1C1C1E',
  },
  chipText: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
