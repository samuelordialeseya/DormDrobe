import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
} from 'react-native';
import { ClothingItem, CATEGORY_ICONS } from '../types/wardrobe';
import StatusBadge from './StatusBadge';
import PressableScale from './PressableScale';
import { Colors, Radii, Spacing } from '../theme/theme';

const CARD_WIDTH = 220;
const CARD_GAP = 10;
const ITEM_TOTAL_WIDTH = CARD_WIDTH + CARD_GAP;

interface Props {
  title: string;
  icon: string;
  items: ClothingItem[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  isLocked: boolean;
  onToggleLock: () => void;
  scrollRef?: React.RefObject<FlatList<any> | null>;
}

export default function OutfitRowSlider({
  title,
  icon,
  items,
  selectedIndex,
  onSelectIndex,
  isLocked,
  onToggleLock,
  scrollRef,
}: Props) {
  const internalRef = useRef<FlatList>(null);
  const listRef = scrollRef || internalRef;

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / ITEM_TOTAL_WIDTH);
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    if (clamped !== selectedIndex) {
      onSelectIndex(clamped);
    }
  };

  const handleCardPress = (idx: number) => {
    onSelectIndex(idx);
    listRef.current?.scrollToOffset({
      offset: idx * ITEM_TOTAL_WIDTH,
      animated: true,
    });
  };

  return (
    <View style={styles.container}>
      {/* Row Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.title}>{title}</Text>
          {items.length > 0 && (
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>
                {selectedIndex + 1}/{items.length}
              </Text>
            </View>
          )}
        </View>

        {/* Lock toggle button */}
        <PressableScale onPress={onToggleLock} scaleTo={0.92}>
          <View
            style={[
              styles.lockBtn,
              isLocked ? styles.lockBtnActive : styles.lockBtnInactive,
            ]}
          >
            <Text style={styles.lockIcon}>{isLocked ? '🔒' : '🔓'}</Text>
            <Text
              style={[
                styles.lockText,
                isLocked && styles.lockTextActive,
              ]}
            >
              {isLocked ? 'Locked' : 'Lock'}
            </Text>
          </View>
        </PressableScale>
      </View>

      {/* Horizontal Slider */}
      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No clean {title.toLowerCase()} found here
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef as any}
          data={items}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_TOTAL_WIDTH}
          decelerationRate="fast"
          contentContainerStyle={styles.listContent}
          onMomentumScrollEnd={onMomentumScrollEnd}
          renderItem={({ item, index }) => {
            const isSelected = index === selectedIndex;
            const categoryEmoji = CATEGORY_ICONS[item.category] || '👕';

            return (
              <PressableScale
                onPress={() => handleCardPress(index)}
                scaleTo={0.96}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected,
                  isLocked && isSelected && styles.cardLocked,
                ]}
              >
                {/* Garment Image / Emoji Preview */}
                <View style={styles.thumbBox}>
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.thumbImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.thumbEmoji}>{categoryEmoji}</Text>
                  )}
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: item.color.toLowerCase() === 'white' ? '#FFFFFF' : item.color.toLowerCase() },
                    ]}
                  />
                </View>

                {/* Garment Details */}
                <View style={styles.details}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.brand && (
                    <Text style={styles.itemBrand} numberOfLines={1}>
                      {item.brand}
                    </Text>
                  )}
                  <View style={styles.statusRow}>
                    <StatusBadge status={item.status} size="sm" />
                    {item.isUniformWhiteTee && (
                      <View style={styles.uniformBadge}>
                        <Text style={styles.uniformText}>UNIFORM</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Selected Indicator Pill */}
                {isSelected && <View style={styles.activeIndicator} />}
              </PressableScale>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 14,
  },
  title: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  counterBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 1,
    marginLeft: 2,
  },
  counterText: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '600',
  },
  lockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  lockBtnInactive: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: Colors.borderGlass,
  },
  lockBtnActive: {
    backgroundColor: 'rgba(255,179,64,0.15)',
    borderColor: 'rgba(255,179,64,0.40)',
  },
  lockIcon: {
    fontSize: 10,
  },
  lockText: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '600',
  },
  lockTextActive: {
    color: '#FFB340',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    height: 96,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glassMid,
    borderRadius: Radii.lg,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    position: 'relative',
    overflow: 'hidden',
  },
  cardSelected: {
    backgroundColor: Colors.glassBright,
    borderColor: 'rgba(255,255,255,0.30)',
  },
  cardLocked: {
    borderColor: 'rgba(255,179,64,0.45)',
  },
  thumbBox: {
    width: 64,
    height: 78,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  thumbImage: {
    width: 54,
    height: 66,
  },
  thumbEmoji: {
    fontSize: 28,
  },
  colorDot: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  details: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
    height: '100%',
  },
  itemName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  itemBrand: {
    color: Colors.textTertiary,
    fontSize: 11,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  uniformBadge: {
    backgroundColor: 'rgba(10,132,255,0.15)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: 'rgba(10,132,255,0.35)',
  },
  uniformText: {
    color: '#0A84FF',
    fontSize: 7.5,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2.5,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radii.lg,
    borderBottomLeftRadius: Radii.lg,
  },
  emptyCard: {
    marginHorizontal: Spacing.lg,
    height: 72,
    borderRadius: Radii.lg,
    backgroundColor: Colors.glassLight,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontStyle: 'italic',
  },
});
