import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ClothingItem, CATEGORY_ICONS, LOCATION_LABELS } from '../types/wardrobe';
import StatusBadge from './StatusBadge';

interface Props {
  item: ClothingItem;
  onPress?: () => void;
  /** If true, shows a selection checkbox overlay */
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export default function ClothingCard({
  item,
  onPress,
  selectable = false,
  selected = false,
  onToggleSelect,
}: Props) {
  const emoji = CATEGORY_ICONS[item.category];

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={selectable ? onToggleSelect : onPress}
      style={[styles.card, selected && styles.selectedCard]}
    >
      {/* Thumbnail placeholder */}
      <View style={styles.thumb}>
        {item.imageUrl ? (
          <Text style={styles.emoji}>{emoji}</Text>
        ) : (
          <Text style={styles.emoji}>{emoji}</Text>
        )}
        {selectable && (
          <View style={[styles.checkbox, selected && styles.checkboxActive]}>
            {selected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.meta}>
          {item.brand && (
            <Text style={styles.brand} numberOfLines={1}>
              {item.brand}
            </Text>
          )}
          <View style={styles.colorDot}>
            <View
              style={[
                styles.colorSwatch,
                {
                  backgroundColor:
                    item.color.toLowerCase() === 'white'
                      ? '#F3F4F6'
                      : item.color.toLowerCase() === 'black'
                      ? '#1F2937'
                      : item.color.toLowerCase() === 'navy'
                      ? '#1E3A5F'
                      : item.color.toLowerCase() === 'gray' || item.color.toLowerCase() === 'grey'
                      ? '#9CA3AF'
                      : item.color.toLowerCase() === 'khaki'
                      ? '#C3B091'
                      : item.color.toLowerCase() === 'olive'
                      ? '#808000'
                      : item.color.toLowerCase() === 'brown'
                      ? '#8B4513'
                      : item.color.toLowerCase() === 'blue'
                      ? '#3B82F6'
                      : item.color,
                },
              ]}
            />
            <Text style={styles.colorLabel}>{item.color}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <StatusBadge status={item.status} size="sm" />
          <Text style={styles.location}>
            {LOCATION_LABELS[item.location]}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  selectedCard: {
    borderColor: '#8B5CF6',
    backgroundColor: '#1E1E3A',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#2A2A3E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  emoji: {
    fontSize: 28,
  },
  checkbox: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#4B5563',
    backgroundColor: '#1E1E2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: '#8B5CF6',
    backgroundColor: '#8B5CF6',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  brand: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  colorDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  colorSwatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  colorLabel: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  location: {
    color: '#6B7280',
    fontSize: 11,
  },
});
