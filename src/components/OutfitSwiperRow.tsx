import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
  LayoutChangeEvent,
} from 'react-native';
import { ClothingItem, STATUS_COLORS, STATUS_LABELS } from '../types/wardrobe';
import { Colors, Radii } from '../theme/theme';
import { CategoryIcon, PushPin } from './AppIcons';
import PressableScale from './PressableScale';
import { useWardrobe } from '../context/WardrobeContext';

interface OutfitSwiperRowProps {
  items: ClothingItem[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  isLocked: boolean;
  onToggleLock: () => void;
  rowHeight?: number;
  scrollRef?: any;
  category: 'tops' | 'bottoms' | 'footwear' | 'accessories' | 'outerwear';
}

export default function OutfitSwiperRow({
  items,
  selectedIndex,
  onSelectIndex,
  isLocked,
  onToggleLock,
  rowHeight = 160,
  scrollRef,
  category,
}: OutfitSwiperRowProps) {
  const { width } = useWindowDimensions();
  const { getLocationLabel } = useWardrobe();
  // Default to 390 (standard phone width) or window width if smaller
  const [containerWidth, setContainerWidth] = React.useState(Math.min(width, 390));

  // Item width allows ~22-26% peeking on left and right margins
  const ITEM_WIDTH = Math.round(containerWidth * 0.58);
  const SPACER_PADDING = Math.round((containerWidth - ITEM_WIDTH) / 2);

  const localRef = useRef<FlatList>(null);
  const listRef = scrollRef ?? localRef;

  const handleLayout = (e: LayoutChangeEvent) => {
    const measured = e.nativeEvent.layout.width;
    if (measured > 50 && Math.abs(measured - containerWidth) > 2) {
      setContainerWidth(measured);
    }
  };

  // Scroll to selected index when index changes externally (e.g. on shuffle)
  useEffect(() => {
    if (items.length > 0 && selectedIndex >= 0 && selectedIndex < items.length) {
      listRef.current?.scrollToOffset({
        offset: selectedIndex * ITEM_WIDTH,
        animated: true,
      });
    }
  }, [selectedIndex, ITEM_WIDTH]);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / ITEM_WIDTH);
    if (newIndex >= 0 && newIndex < items.length && newIndex !== selectedIndex) {
      onSelectIndex(newIndex);
    }
  };

  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height: rowHeight }]}>
        <CategoryIcon category={category} size={30} color={Colors.textTertiary} />
        <Text style={styles.emptyCategoryText}>No {category} here</Text>
      </View>
    );
  }

  const activeItem = items[selectedIndex] ?? items[0];
  const locLabel = getLocationLabel(activeItem.location);
  const compactLoc =
    activeItem.location === 'in_transit_bag'
      ? 'Bag'
      : locLabel === 'Batangas Dorm'
      ? 'Dorm'
      : locLabel === 'Calamba Home'
      ? 'Home'
      : locLabel;

  return (
    <View
      onLayout={handleLayout}
      style={[styles.rowContainer, { height: rowHeight }]}
    >
      {/* 1. Architectural styling stage pedestal behind the active center garment */}
      <View
        pointerEvents="none"
        style={[
          styles.activeStageFrame,
          {
            left: SPACER_PADDING + 4,
            width: ITEM_WIDTH - 8,
            height: rowHeight - 6,
          },
        ]}
      >
        <View
          style={[
            styles.stageInner,
            isLocked && styles.stageInnerLocked,
          ]}
        >
          <View style={styles.stageSpecular} />
        </View>
      </View>

      {/* 2. Garment carousel */}
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        bounces={true}
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={{
          paddingHorizontal: SPACER_PADDING,
          alignItems: 'center',
        }}
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH,
          offset: ITEM_WIDTH * index,
          index,
        })}
        renderItem={({ item, index }) => {
          const isCentered = index === selectedIndex;
          const imageUri = item.imageUrl;

          return (
            <PressableScale
              onPress={() => {
                if (!isCentered) {
                  onSelectIndex(index);
                  listRef.current?.scrollToOffset({
                    offset: index * ITEM_WIDTH,
                    animated: true,
                  });
                }
              }}
              scaleTo={0.97}
              style={[
                styles.itemWrapper,
                {
                  width: ITEM_WIDTH,
                  minWidth: ITEM_WIDTH,
                  maxWidth: ITEM_WIDTH,
                  flexShrink: 0,
                  height: rowHeight,
                  opacity: isCentered ? 1 : 0.42,
                  transform: [{ scale: isCentered ? 1 : 0.94 }],
                },
              ]}
            >
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={[
                    styles.garmentImage,
                    {
                      width: ITEM_WIDTH * 0.9,
                      height: rowHeight * 0.9,
                    },
                  ]}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.fallbackIconWrap}>
                  <CategoryIcon category={item.category} size={44} color="#C7C7CC" />
                </View>
              )}
            </PressableScale>
          );
        }}
      />

      {/* 3. Floating overlay: Location/Status Chip (Left) & Pin Lock (Right) */}
      <View
        pointerEvents="box-none"
        style={[
          styles.activeOverlay,
          {
            left: SPACER_PADDING,
            width: ITEM_WIDTH,
            height: rowHeight,
          },
        ]}
      >
        <View style={styles.overlayTopBar}>
          {/* Subtle Location & Status indicator */}
          <View style={styles.garmentMetaPill}>
            <View
              style={[
                styles.metaDot,
                {
                  backgroundColor:
                    activeItem.location === 'batangas_dorm'
                      ? Colors.locBatangas
                      : activeItem.location === 'calamba_home'
                      ? Colors.locCalamba
                      : Colors.locInTransit,
                },
              ]}
            />
            <Text style={styles.metaLocText}>
              {compactLoc}
            </Text>
            {activeItem.status !== 'clean' && (
              <Text
                style={[
                  styles.metaStatusText,
                  { color: STATUS_COLORS[activeItem.status] ?? Colors.textTertiary },
                ]}
              >
                • {STATUS_LABELS[activeItem.status]}
              </Text>
            )}
          </View>

          {/* Floating Pushpin Lock button */}
          <PressableScale
            onPress={onToggleLock}
            scaleTo={0.88}
            style={[
              styles.pinButton,
              isLocked && styles.pinButtonLocked,
            ]}
          >
            <PushPin
              size={15}
              color={isLocked ? '#7C3AED' : '#8E8E93'}
              weight={isLocked ? 'bold' : 'regular'}
            />
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  activeStageFrame: {
    position: 'absolute',
    top: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageInner: {
    width: '100%',
    height: '100%',
    borderRadius: Radii.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(20, 20, 19, 0.06)',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    overflow: 'hidden',
  },
  stageInnerLocked: {
    backgroundColor: 'rgba(250, 245, 255, 0.85)',
    borderColor: 'rgba(124, 58, 237, 0.25)',
  },
  stageSpecular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  emptyContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.015)',
    borderRadius: 16,
    marginVertical: 4,
    gap: 6,
  },
  emptyCategoryText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  itemWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  garmentImage: {
    // Pure transparent floating cutout
  },
  fallbackIconWrap: {
    width: '70%',
    height: '70%',
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeOverlay: {
    position: 'absolute',
    top: 0,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  overlayTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  garmentMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(20, 20, 19, 0.06)',
  },
  metaDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  metaLocText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  metaStatusText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  pinButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(20, 20, 19, 0.06)',
  },
  pinButtonLocked: {
    backgroundColor: '#EDE9FE',
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
});
