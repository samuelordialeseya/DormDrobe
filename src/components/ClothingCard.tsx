import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ClothingItem, CATEGORY_ICONS, LOCATION_LABELS, STATUS_COLORS } from '../types/wardrobe';
import StatusBadge from './StatusBadge';
import { Colors, Radii, Spacing } from '../theme/theme';

interface Props {
  item: ClothingItem;
  onPress?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

// Map color names to approximate hex values
const COLOR_MAP: Record<string, string> = {
  white: '#F8F8FA',
  black: '#1C1C1E',
  navy: '#1B2A4A',
  gray: '#8E8E93',
  grey: '#8E8E93',
  khaki: '#C3B091',
  olive: '#6B7C45',
  brown: '#8B5E3C',
  blue: '#3478F6',
  red: '#FF3B30',
  green: '#30D158',
  yellow: '#FFD60A',
  orange: '#FF9F0A',
  pink: '#FF375F',
  purple: '#BF5AF2',
  beige: '#D4C4A8',
};

function resolveColor(colorStr: string): string {
  return COLOR_MAP[colorStr.toLowerCase()] ?? '#8E8E93';
}

export default function ClothingCard({
  item,
  onPress,
  selectable = false,
  selected = false,
  onToggleSelect,
}: Props) {
  const emoji = CATEGORY_ICONS[item.category];
  const accentColor = STATUS_COLORS[item.status];

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={selectable ? onToggleSelect : onPress}
      style={[styles.card, selected && styles.selectedCard]}
    >
      {/* Top specular line */}
      <View style={styles.specular} />

      {/* Left accent bar based on status color */}
      <View style={[styles.accentBar, { backgroundColor: accentColor + '80' }]} />

      {/* Thumbnail */}
      <View style={[styles.thumb, selected && styles.thumbSelected]}>
        <Text style={styles.emoji}>{emoji}</Text>

        {/* Color swatch */}
        <View
          style={[
            styles.colorSwatch,
            { backgroundColor: resolveColor(item.color) },
          ]}
        />

        {/* Selection checkbox */}
        {selectable && (
          <View style={[styles.checkbox, selected && styles.checkboxActive]}>
            {selected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          {item.isUniformWhiteTee && (
            <View style={styles.uniformBadge}>
              <Text style={styles.uniformText}>UNIFORM</Text>
            </View>
          )}
        </View>

        {item.brand && (
          <Text style={styles.brand} numberOfLines={1}>
            {item.brand}
          </Text>
        )}

        <View style={styles.footer}>
          <StatusBadge status={item.status} size="sm" />
          <Text style={styles.location}>{LOCATION_LABELS[item.location]}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.glassMid,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  selectedCard: {
    borderColor: 'rgba(139,92,246,0.55)',
    backgroundColor: 'rgba(139,92,246,0.15)',
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    zIndex: 5,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: 2,
  },
  thumb: {
    width: 68,
    height: 68,
    borderRadius: Radii.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginLeft: 6,
    position: 'relative',
    overflow: 'visible',
  },
  thumbSelected: {
    borderColor: 'rgba(139,92,246,0.5)',
  },
  emoji: {
    fontSize: 30,
  },
  colorSwatch: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  checkbox: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textTertiary,
    backgroundColor: Colors.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: Colors.purple500,
    backgroundColor: Colors.purple500,
  },
  checkmark: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  uniformBadge: {
    backgroundColor: 'rgba(96,165,250,0.18)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.4)',
  },
  uniformText: {
    color: Colors.blue400,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  brand: {
    color: Colors.textSecondary,
    fontSize: 12,
    letterSpacing: -0.1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  location: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '500',
  },
});
