import React, { useRef, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
  LayoutChangeEvent,
} from 'react-native';
import { ClothingItem } from '../types/wardrobe';
import { CategoryIcon, PushPin } from './AppIcons';
import PressableScale from './PressableScale';

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
        <CategoryIcon category={category} size={36} color="#D1D1D6" />
      </View>
    );
  }

  const activeItem = items[selectedIndex] ?? items[0];

  return (
    <View
      onLayout={handleLayout}
      style={[styles.rowContainer, { height: rowHeight }]}
    >
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
                  opacity: isCentered ? 1 : 0.45,
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

      {/* Floating Pushpin Lock button pinned to the active centered garment */}
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
        <PressableScale
          onPress={onToggleLock}
          scaleTo={0.88}
          style={[
            styles.pinButton,
            isLocked && styles.pinButtonLocked,
          ]}
        >
          <PushPin
            size={18}
            color={isLocked ? '#7C3AED' : '#8E8E93'}
            weight={isLocked ? 'bold' : 'regular'}
          />
        </PressableScale>
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
    marginVertical: 4,
  },
  emptyContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.015)',
    borderRadius: 16,
    marginVertical: 4,
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
    alignItems: 'flex-end',
    paddingTop: 8,
    paddingRight: 10,
  },
  pinButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  pinButtonLocked: {
    backgroundColor: '#EDE9FE',
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
});
