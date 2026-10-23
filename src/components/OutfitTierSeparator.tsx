import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';
import { CategoryIcon, PushPin } from './AppIcons';
import { Category, ClothingItem, STATUS_COLORS } from '../types/wardrobe';

interface OutfitTierSeparatorProps {
  category: Category;
  label: string;
  activeItem?: ClothingItem | null;
  isLocked?: boolean;
  itemCount?: number;
  currentIndex?: number;
}

export default function OutfitTierSeparator({
  category,
  label,
  activeItem,
  isLocked = false,
  itemCount,
  currentIndex,
}: OutfitTierSeparatorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.hairline} />

      <View style={[styles.pill, isLocked && styles.pillLocked]}>
        <CategoryIcon
          category={category}
          size={12}
          color={isLocked ? '#7C3AED' : Colors.textSecondary}
          weight={isLocked ? 'bold' : 'regular'}
        />

        <Text style={[styles.labelText, isLocked && styles.labelTextLocked]}>
          {label}
        </Text>

        {activeItem && (
          <>
            <View style={styles.dot} />
            <Text style={styles.itemName} numberOfLines={1}>
              {activeItem.name}
            </Text>
            {activeItem.status !== 'clean' && (
              <View
                style={[
                  styles.statusMiniDot,
                  { backgroundColor: STATUS_COLORS[activeItem.status] },
                ]}
              />
            )}
          </>
        )}

        {isLocked && (
          <View style={styles.lockedBadge}>
            <PushPin size={9} color="#7C3AED" weight="bold" />
            <Text style={styles.lockedText}>PINNED</Text>
          </View>
        )}

        {itemCount !== undefined && currentIndex !== undefined && itemCount > 0 && (
          <Text style={styles.counterText}>
            {currentIndex}/{itemCount}
          </Text>
        )}
      </View>

      <View style={styles.hairline} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginVertical: 4,
    zIndex: 10,
  },
  hairline: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(20, 20, 19, 0.08)',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(20, 20, 19, 0.07)',
    marginHorizontal: 8,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    maxWidth: '85%',
  },
  pillLocked: {
    backgroundColor: '#FAF5FF',
    borderColor: 'rgba(124, 58, 237, 0.28)',
  },
  labelText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.7,
  },
  labelTextLocked: {
    color: '#7C3AED',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(20, 20, 19, 0.22)',
  },
  itemName: {
    fontSize: 10.5,
    fontWeight: '500',
    color: Colors.textPrimary,
    maxWidth: 120,
    letterSpacing: -0.1,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  lockedText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: 0.4,
  },
  counterText: {
    fontSize: 9.5,
    fontWeight: '500',
    color: Colors.textTertiary,
    marginLeft: 1,
  },
  statusMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 2,
  },
});
