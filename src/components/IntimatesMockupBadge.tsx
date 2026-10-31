import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { ClothingItem, isSockItem, isUndergarmentItem } from '../types/wardrobe';
import { SockIcon, UnderwearBriefsIcon } from './AppIcons';
import { Colors, Radii } from '../theme/theme';

export interface IntimatesMockupBadgeProps {
  item?: ClothingItem | { name?: string; brand?: string; color?: string; category?: string; notes?: string } | null;
  variant?: 'card' | 'thumb' | 'hero';
  width?: number | string;
  height?: number | string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const COLOR_MAP: Record<string, string> = {
  white: '#FFFFFF',
  black: '#141413',
  gray: '#6B7280',
  grey: '#6B7280',
  navy: '#1E3A5F',
  blue: '#2563EB',
  red: '#DC2626',
  green: '#16A34A',
  brown: '#92400E',
  beige: '#D4C5B9',
  olive: '#556B2F',
  cream: '#FFFDD0',
  charcoal: '#333333',
  'dark gray': '#4B5563',
};

function resolveGarmentColor(c?: string): string {
  if (!c) return '#68655E';
  const clean = c.toLowerCase().trim();
  return COLOR_MAP[clean] ?? clean;
}

/**
 * Renders a stylized boutique apparel mockup badge for socks and undergarments.
 * Avoids realistic photographic imagery while prominently displaying the piece's
 * name, brand, and color for instantaneous identification.
 */
export default function IntimatesMockupBadge({
  item,
  variant = 'card',
  width,
  height,
  size,
  style,
}: IntimatesMockupBadgeProps) {
  const isSock = isSockItem(item);
  const typeLabel = isSock ? 'SOCKS' : 'BASICS';
  const name = item?.name?.trim() || (isSock ? 'Essential Socks' : 'Essential Underwear');
  const brand = item?.brand?.trim() || 'DORMDROBE';
  const colorName = item?.color?.trim() || 'Neutral';
  const dotColor = resolveGarmentColor(item?.color);
  const isWhiteDot = dotColor.toLowerCase() === '#ffffff' || dotColor.toLowerCase() === 'white';

  // ─── THUMB VARIANT (Lookbook collage, Wear Log, Closet grid thumbs) ─────
  if (variant === 'thumb') {
    const thumbDimension = size ?? (typeof width === 'number' ? width : 48);
    const isVerySmall = thumbDimension < 46;

    return (
      <View
        style={[
          styles.thumbContainer,
          {
            width: thumbDimension,
            height: thumbDimension,
            borderRadius: thumbDimension >= 64 ? Radii.md : Radii.sm,
          },
          style,
        ]}
      >
        <View style={styles.thumbEmblemCircle}>
          {isSock ? (
            <SockIcon size={thumbDimension * 0.44} color={Colors.textPrimary} weight="regular" />
          ) : (
            <UnderwearBriefsIcon size={thumbDimension * 0.44} color={Colors.textPrimary} weight="regular" />
          )}
        </View>

        {/* Micro color badge indicator */}
        <View
          style={[
            styles.thumbColorDot,
            { backgroundColor: dotColor },
            isWhiteDot && styles.whiteDotBorder,
          ]}
        />

        {/* Name / Category label below icon when space allows */}
        {!isVerySmall && (
          <Text style={styles.thumbLabel} numberOfLines={1} ellipsizeMode="tail">
            {name.split(' ')[0]}
          </Text>
        )}
      </View>
    );
  }

  // ─── HERO VARIANT (GarmentDetailSheet preview) ──────────────────────────
  if (variant === 'hero') {
    return (
      <View style={[styles.heroContainer, { width, height }, style]}>
        <View style={styles.heroEmblem}>
          {isSock ? (
            <SockIcon size={56} color={Colors.textPrimary} weight="light" />
          ) : (
            <UnderwearBriefsIcon size={56} color={Colors.textPrimary} weight="light" />
          )}
        </View>
        <View style={styles.heroBadgeTag}>
          <Text style={styles.heroBadgeTagText}>ESSENTIALS MOCKUP • {typeLabel}</Text>
        </View>
        <Text style={styles.heroName} numberOfLines={2} ellipsizeMode="tail">
          {name}
        </Text>
        <View style={styles.heroMetaRow}>
          <Text style={styles.heroBrand}>{brand.toUpperCase()}</Text>
          <View style={styles.heroDotDivider} />
          <View
            style={[
              styles.heroColorDot,
              { backgroundColor: dotColor },
              isWhiteDot && styles.whiteDotBorder,
            ]}
          />
          <Text style={styles.heroColorText}>{colorName}</Text>
        </View>
      </View>
    );
  }

  // ─── CARD VARIANT (Default, for OutfitSwiperRow 5P / 6P stage) ──────────
  return (
    <View
      style={[
        styles.cardContainer,
        width !== undefined ? { width } : null,
        height !== undefined ? { height } : null,
        style,
      ]}
    >
      {/* Left: Studio Mockup Emblem Seal */}
      <View style={styles.emblemColumn}>
        <View style={styles.cardEmblemCircle}>
          {isSock ? (
            <SockIcon size={26} color={Colors.textPrimary} weight="regular" />
          ) : (
            <UnderwearBriefsIcon size={26} color={Colors.textPrimary} weight="regular" />
          )}
        </View>
        <Text style={styles.emblemBadgeText}>{typeLabel}</Text>
      </View>

      {/* Right: Clean typographic label for effortless identification */}
      <View style={styles.infoColumn}>
        <View style={styles.metaHeaderRow}>
          <Text style={styles.brandText} numberOfLines={1}>
            {brand.toUpperCase()}
          </Text>
          <View style={styles.bulletSeparator} />
          <View
            style={[
              styles.colorDot,
              { backgroundColor: dotColor },
              isWhiteDot && styles.whiteDotBorder,
            ]}
          />
          <Text style={styles.colorText} numberOfLines={1}>
            {colorName}
          </Text>
        </View>

        <Text style={styles.cardItemName} numberOfLines={2} ellipsizeMode="tail">
          {name}
        </Text>

        <Text style={styles.subTag} numberOfLines={1}>
          {item?.notes?.trim() ? item.notes : 'DormDrobe Capsule Archive'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ─── CARD STYLES ──────────────────────────────────────────────────────
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(20, 20, 19, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  emblemColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    paddingRight: 11,
    borderRightWidth: 1,
    borderRightColor: 'rgba(20, 20, 19, 0.06)',
  },
  cardEmblemCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F4EE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20, 20, 19, 0.05)',
  },
  emblemBadgeText: {
    marginTop: 3,
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.textTertiary,
  },
  infoColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  metaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    paddingRight: 26,
  },
  brandText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: Colors.textSecondary,
    maxWidth: 90,
  },
  bulletSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textInactive,
    marginHorizontal: 5,
  },
  colorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 4,
  },
  whiteDotBorder: {
    borderWidth: 1,
    borderColor: 'rgba(20, 20, 19, 0.2)',
  },
  colorText: {
    fontSize: 9.5,
    fontWeight: '500',
    color: Colors.textTertiary,
    flexShrink: 1,
  },
  cardItemName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 16,
    letterSpacing: -0.2,
  },
  subTag: {
    marginTop: 2,
    fontSize: 9,
    color: Colors.textInactive,
    fontStyle: 'italic',
  },

  // ─── THUMB STYLES ─────────────────────────────────────────────────────
  thumbContainer: {
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: 'rgba(20, 20, 19, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  thumbEmblemCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbColorDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  thumbLabel: {
    position: 'absolute',
    bottom: 2,
    fontSize: 7.5,
    fontWeight: '700',
    color: Colors.textTertiary,
    paddingHorizontal: 2,
  },

  // ─── HERO STYLES ──────────────────────────────────────────────────────
  heroContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FAF9F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: Radii.md,
  },
  heroEmblem: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(20, 20, 19, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  heroBadgeTag: {
    backgroundColor: 'rgba(20, 20, 19, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    marginBottom: 6,
  },
  heroBadgeTagText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.textSecondary,
  },
  heroName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 12,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroBrand: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: Colors.textSecondary,
  },
  heroDotDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textInactive,
    marginHorizontal: 6,
  },
  heroColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  heroColorText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
});
