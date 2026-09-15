import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Location, LOCATION_LABELS } from '../types/wardrobe';

interface Props {
  selected: Location | null;
  onSelect: (loc: Location | null) => void;
}

const OPTIONS: { key: Location | null; label: string }[] = [
  { key: null, label: '🌐 All' },
  { key: 'calamba_home', label: LOCATION_LABELS.calamba_home },
  { key: 'batangas_dorm', label: LOCATION_LABELS.batangas_dorm },
  { key: 'in_transit_bag', label: LOCATION_LABELS.in_transit_bag },
];

export default function LocationFilter({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {OPTIONS.map((opt) => {
        const active = opt.key === selected;
        return (
          <TouchableOpacity
            key={String(opt.key)}
            onPress={() => onSelect(opt.key)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2A2A3E',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  chipActive: {
    backgroundColor: '#8B5CF620',
    borderColor: '#8B5CF6',
  },
  chipText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#C4B5FD',
    fontWeight: '600',
  },
});
