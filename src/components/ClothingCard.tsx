import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { ClothingItem, LOCATION_LABELS } from '../types/wardrobe';
import StatusBadge from './StatusBadge';
import PressableScale from './PressableScale';
import { Colors, Radii, Spacing } from '../theme/theme';
import { CategoryIcon, LocationIcon, Check } from './AppIcons';

interface Props {
  item: ClothingItem;
  onPress?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  /** Stagger delay for list entrance animation */
  delay?: number;
}

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
  return COLOR_MAP[colorStr.toLowerCase()] ?? '#636366';
}

export default function ClothingCard({
  item,
  onPress,
  selectable = false,
  selected = false,
  onToggleSelect,
  delay = 0,
}: Props) {
  // Entrance animation
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        tension: 260,
        friction: 26,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Selection pulse animation
  const selectAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(selectAnim, {
      toValue: selected ? 1 : 0,
      useNativeDriver: true,
      tension: 280,
      friction: 22,
    }).start();
  }, [selected]);

  const checkScale = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <PressableScale
        onPress={selectable ? onToggleSelect : onPress}
        scaleTo={0.97}
        style={[styles.card, selected && styles.selectedCard]}
      >
        {/* Specular top edge */}
        <View style={styles.specular} />

        {/* Thumbnail */}
        <View style={[styles.thumb, selected && styles.thumbSelected]}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.thumbImg}
              resizeMode="contain"
            />
          ) : (
            <CategoryIcon
              category={item.category}
              size={28}
              color={Colors.textSecondary}
            />
          )}
          <View
            style={[
              styles.colorSwatch,
              { backgroundColor: resolveColor(item.color) },
            ]}
          />
          {selectable && (
            <Animated.View
              style={[
                styles.checkbox,
                selected && styles.checkboxActive,
                { transform: [{ scale: checkScale }] },
              ]}
            >
              {selected && (
                <Check size={12} color="#FFFFFF" strokeWidth={3} />
              )}
            </Animated.View>
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
            <View style={styles.locBadge}>
              <LocationIcon location={item.location} size={11} color={Colors.textTertiary} strokeWidth={2} />
              <Text style={styles.location}>{LOCATION_LABELS[item.location]}</Text>
            </View>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedCard: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.20)',
    borderWidth: 1.5,
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
    zIndex: 5,
  },
  thumb: {
    width: 68,
    height: 68,
    borderRadius: Radii.lg,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginLeft: 0,
    position: 'relative',
    overflow: 'visible',
  },
  thumbSelected: {
    borderColor: 'rgba(0, 0, 0, 0.20)',
  },
  thumbImg: {
    width: 56,
    height: 56,
  },
  colorSwatch: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  checkbox: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.18)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent,
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
    backgroundColor: 'rgba(10,132,255,0.15)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(10,132,255,0.35)',
  },
  uniformText: {
    color: '#0A84FF',
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
  locBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '500',
  },
});
