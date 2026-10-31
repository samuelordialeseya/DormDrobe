import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { ClothingItem, Status, isSockItem, isIntimatesItem } from '../types/wardrobe';
import StatusBadge from './StatusBadge';
import PressableScale from './PressableScale';
import IntimatesMockupBadge from './IntimatesMockupBadge';
import { Colors, Radii, Spacing } from '../theme/theme';
import { CategoryIcon, LocationIcon, Check } from './AppIcons';
import { useWardrobe } from '../context/WardrobeContext';
import { useRewearPrompt } from './RewearPromptModal';

interface Props {
  item: ClothingItem;
  onPress?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  /** Stagger delay for list entrance animation */
  delay?: number;
  /** Show the 1-tap Wear / To Laundry / Mark Clean button (ignored while selectable) */
  showQuickAction?: boolean;
  /** Hide the location badge (useful when the list is already scoped to one place) */
  hideLocation?: boolean;
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

/** What the 1-tap button says for each status (Clean → Worn → In Laundry → Clean). */
const QUICK_ACTIONS: Partial<Record<Status, { label: string; color: string; filled?: boolean }>> = {
  clean: { label: 'Wear', color: Colors.accent, filled: true },
  worn: { label: 'To Laundry', color: Colors.statusLaundry },
  in_laundry: { label: 'Mark Clean', color: Colors.statusClean },
  drying: { label: 'Mark Clean', color: Colors.statusClean },
};

function locationColors(location: ClothingItem['location']) {
  if (location === 'batangas_dorm') {
    return { fg: Colors.locBatangas, bg: Colors.locBatangasBg, border: 'rgba(29, 78, 216, 0.2)' };
  }
  if (location === 'calamba_home') {
    return { fg: Colors.locCalamba, bg: Colors.locCalambaBg, border: 'rgba(180, 83, 9, 0.2)' };
  }
  return { fg: Colors.locInTransit, bg: Colors.locInTransitBg, border: 'rgba(77, 107, 83, 0.2)' };
}

export default function ClothingCard({
  item,
  onPress,
  selectable = false,
  selected = false,
  onToggleSelect,
  delay = 0,
  showQuickAction = false,
  hideLocation = false,
}: Props) {
  const { getLocationLabel, advanceItemStatus, wearItemAgain } = useWardrobe();
  const { requestWear, rewearModal } = useRewearPrompt();
  // Entrance animation: immediate if delay is 0/undefined, crisp entrance if staggered
  const hasDelay = typeof delay === 'number' && delay > 0;
  const opacity = useRef(new Animated.Value(hasDelay ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(hasDelay ? 8 : 0)).current;

  useEffect(() => {
    if (hasDelay) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          delay,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          delay,
          tension: 280,
          friction: 24,
          useNativeDriver: true,
        }),
      ]).start();
    }
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

  const quick = showQuickAction && !selectable ? QUICK_ACTIONS[item.status] : undefined;
  const loc = locationColors(item.location);

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
          <View style={styles.thumbInner}>
            {isIntimatesItem(item) ? (
              <IntimatesMockupBadge
                item={item}
                variant="thumb"
                size={56}
                style={{ width: '100%', height: '100%', borderWidth: 0, backgroundColor: 'transparent' }}
              />
            ) : item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.thumbImg}
                resizeMode="cover"
              />
            ) : (
              <CategoryIcon
                category={isSockItem(item) ? 'socks' : item.category}
                size={24}
                color={Colors.textSecondary}
              />
            )}
          </View>
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
            <StatusBadge status={item.status} wearCount={item.wearCount} size="sm" />
            {!hideLocation && (
              <View
                style={[
                  styles.locBadge,
                  { backgroundColor: loc.bg, borderColor: loc.border },
                ]}
              >
                <LocationIcon
                  location={item.location}
                  size={11}
                  color={loc.fg}
                  strokeWidth={2}
                />
                <Text style={[styles.location, { color: loc.fg }]}>
                  {getLocationLabel(item.location)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 1-tap status action (Wear / To Laundry / Mark Clean) */}
        {quick && item.status === 'worn' ? (
          // Worn pieces: re-wear (asks first) or send to laundry
          <View style={styles.quickStack}>
            <PressableScale
              onPress={() =>
                requestWear({
                  items: [item],
                  onConfirm: () => wearItemAgain(item.id),
                })
              }
              scaleTo={0.92}
              style={styles.quickWrapStacked}
            >
              <View
                style={[
                  styles.quickBtn,
                  styles.quickBtnCompact,
                  {
                    backgroundColor: Colors.statusWorn + '12',
                    borderColor: Colors.statusWorn + '55',
                  },
                ]}
              >
                <Text style={[styles.quickBtnText, { color: Colors.statusWorn }]} numberOfLines={1}>
                  Wear again
                </Text>
              </View>
            </PressableScale>
            <PressableScale
              onPress={() => advanceItemStatus(item.id)}
              scaleTo={0.92}
              style={styles.quickWrapStacked}
            >
              <View
                style={[
                  styles.quickBtn,
                  styles.quickBtnCompact,
                  {
                    backgroundColor: quick.color + '12',
                    borderColor: quick.color + '55',
                  },
                ]}
              >
                <Text style={[styles.quickBtnText, { color: quick.color }]} numberOfLines={1}>
                  {quick.label}
                </Text>
              </View>
            </PressableScale>
          </View>
        ) : (
          quick && (
            <PressableScale
              onPress={() => advanceItemStatus(item.id)}
              scaleTo={0.92}
              style={styles.quickWrap}
            >
              <View
                style={[
                  styles.quickBtn,
                  quick.filled
                    ? { backgroundColor: quick.color, borderColor: quick.color }
                    : { backgroundColor: quick.color + '12', borderColor: quick.color + '55' },
                ]}
              >
                <Text
                  style={[styles.quickBtnText, { color: quick.filled ? '#FFFFFF' : quick.color }]}
                  numberOfLines={1}
                >
                  {quick.label}
                </Text>
              </View>
            </PressableScale>
          )
        )}
      </PressableScale>
      {item.status === 'worn' && rewearModal}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  selectedCard: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.accent,
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
    width: 56,
    height: 56,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgSubtle,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    marginRight: 12,
    marginLeft: 0,
    position: 'relative',
    overflow: 'visible',
  },
  thumbSelected: {
    borderColor: Colors.accent,
  },
  thumbInner: {
    width: 56,
    height: 56,
    borderRadius: Radii.md - 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgSubtle,
  },
  thumbImg: {
    width: 56,
    height: 56,
  },
  colorSwatch: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  checkbox: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
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
    paddingVertical: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  uniformBadge: {
    backgroundColor: Colors.locBatangasBg,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(29, 78, 216, 0.22)',
  },
  uniformText: {
    color: Colors.locBatangas,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  brand: {
    color: Colors.textSecondary,
    fontSize: 11.5,
    letterSpacing: -0.1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  locBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  location: {
    color: Colors.textTertiary,
    fontSize: 10.5,
    fontWeight: '600',
  },
  quickWrap: {
    alignSelf: 'center',
    marginLeft: 8,
  },
  quickStack: {
    alignSelf: 'center',
    marginLeft: 8,
    gap: 5,
  },
  quickWrapStacked: {
    alignSelf: 'stretch',
  },
  quickBtnCompact: {
    height: 26,
    minWidth: 82,
  },
  quickBtn: {
    minWidth: 72,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
