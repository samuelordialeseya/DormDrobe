import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
} from 'react-native';
import { ClothingItem } from '../types/wardrobe';
import StatusBadge from './StatusBadge';
import PressableScale from './PressableScale';
import { Colors, Radii, Spacing } from '../theme/theme';
import { CategoryIcon, Lock, Unlock } from './AppIcons';

const CARD_WIDTH = 220;
const CARD_GAP = 10;
const ITEM_TOTAL_WIDTH = CARD_WIDTH + CARD_GAP;

interface Props {
  title: string;
  icon?: React.ReactNode;
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
          {icon && <View style={styles.iconBox}>{icon}</View>}
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
            {isLocked ? (
              <Lock size={11} color="#FFB340" strokeWidth={2.5} />
            ) : (
              <Unlock size={11} color={Colors.textTertiary} strokeWidth={2} />
            )}
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
            No clean items found here
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
                {/* Garment Image / Category Vector Icon Preview */}
                <View style={styles.thumbBox}>
                  <View style={styles.thumbInner}>
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.thumbImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <CategoryIcon
                        category={item.category}
                        size={28}
                        color={Colors.textSecondary}
                        strokeWidth={1.8}
                      />
                    )}
                  </View>
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
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  counterBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
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
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  lockBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.40)',
  },
  lockText: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '600',
  },
  lockTextActive: {
    color: '#D97706',
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
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.22)',
    borderWidth: 1.5,
  },
  cardLocked: {
    borderColor: '#F59E0B',
    borderWidth: 1.5,
  },
  thumbBox: {
    width: 64,
    height: 78,
    borderRadius: Radii.md,
    backgroundColor: '#F2F2F7',
    marginRight: 10,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  thumbInner: {
    width: '100%',
    height: '100%',
    borderRadius: Radii.md - 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  colorDot: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
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
    backgroundColor: 'rgba(10,132,255,0.12)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: 'rgba(10,132,255,0.25)',
  },
  uniformText: {
    color: '#0A84FF',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#1C1C1E',
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
