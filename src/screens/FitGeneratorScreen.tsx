import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWardrobe } from '../context/WardrobeContext';
import OutfitRowSlider from '../components/OutfitRowSlider';
import FadeSlideIn from '../components/FadeSlideIn';
import PressableScale from '../components/PressableScale';
import { Location, LOCATION_LABELS } from '../types/wardrobe';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';

export default function FitGeneratorScreen() {
  const { items, updateItem } = useWardrobe();

  // Active filters
  const [selectedLoc, setSelectedLoc] = useState<Location>('batangas_dorm');
  const [cleanOnly, setCleanOnly] = useState(true);
  const [uniformOnly, setUniformOnly] = useState(false);

  // Row selection indices
  const [topIdx, setTopIdx] = useState(0);
  const [bottomIdx, setBottomIdx] = useState(0);
  const [shoesIdx, setShoesIdx] = useState(0);
  const [accIdx, setAccIdx] = useState(0);

  // Row lock states
  const [lockTop, setLockTop] = useState(false);
  const [lockBottom, setLockBottom] = useState(false);
  const [lockShoes, setLockShoes] = useState(false);
  const [lockAcc, setLockAcc] = useState(false);

  // FlatList refs for programmatic scrolling on shuffle
  const topListRef = useRef<FlatList>(null);
  const bottomListRef = useRef<FlatList>(null);
  const shoesListRef = useRef<FlatList>(null);
  const accListRef = useRef<FlatList>(null);

  // Filter items for each row
  const availableItems = useMemo(() => {
    return items.filter((item) => {
      if (item.location !== selectedLoc) return false;
      if (cleanOnly && item.status !== 'clean') return false;
      return true;
    });
  }, [items, selectedLoc, cleanOnly]);

  const tops = useMemo(() => {
    return availableItems.filter((i) => {
      if (uniformOnly && !i.isUniformWhiteTee) return false;
      return i.category === 'tops' || i.category === 'outerwear';
    });
  }, [availableItems, uniformOnly]);

  const bottoms = useMemo(() => {
    return availableItems.filter((i) => i.category === 'bottoms');
  }, [availableItems]);

  const shoes = useMemo(() => {
    return availableItems.filter((i) => i.category === 'footwear');
  }, [availableItems]);

  const accessories = useMemo(() => {
    return availableItems.filter((i) => i.category === 'accessories');
  }, [availableItems]);

  // Shuffle all unlocked rows
  const handleShuffle = () => {
    const CARD_FULL_WIDTH = 230;

    if (!lockTop && tops.length > 1) {
      const next = Math.floor(Math.random() * tops.length);
      setTopIdx(next);
      topListRef.current?.scrollToOffset({
        offset: next * CARD_FULL_WIDTH,
        animated: true,
      });
    }

    if (!lockBottom && bottoms.length > 1) {
      const next = Math.floor(Math.random() * bottoms.length);
      setBottomIdx(next);
      bottomListRef.current?.scrollToOffset({
        offset: next * CARD_FULL_WIDTH,
        animated: true,
      });
    }

    if (!lockShoes && shoes.length > 1) {
      const next = Math.floor(Math.random() * shoes.length);
      setShoesIdx(next);
      shoesListRef.current?.scrollToOffset({
        offset: next * CARD_FULL_WIDTH,
        animated: true,
      });
    }

    if (!lockAcc && accessories.length > 1) {
      const next = Math.floor(Math.random() * accessories.length);
      setAccIdx(next);
      accListRef.current?.scrollToOffset({
        offset: next * CARD_FULL_WIDTH,
        animated: true,
      });
    }
  };

  // Mark current fit as worn
  const handleWearFit = () => {
    const activeTop = tops[topIdx];
    const activeBottom = bottoms[bottomIdx];
    const activeShoes = shoes[shoesIdx];
    const activeAcc = accessories[accIdx];

    const wornItems = [activeTop, activeBottom, activeShoes, activeAcc].filter(Boolean);

    if (wornItems.length === 0) {
      Alert.alert('No Items', 'No items selected to wear.');
      return;
    }

    wornItems.forEach((it) => {
      updateItem(it.id, {
        status: 'worn',
        lastWornAt: new Date().toISOString(),
      });
    });

    Alert.alert(
      'Outfit Worn! ✨',
      `Marked ${wornItems.length} items as worn. They are now tracked in your laundry cycle.`
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Top Header & Controls */}
        <FadeSlideIn delay={0} fromY={-6}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Fit Canvas</Text>
              <Text style={styles.subtitle}>Swipe rows to mix & match</Text>
            </View>

            {/* Location selector */}
            <View style={styles.locTabs}>
              <PressableScale
                onPress={() => setSelectedLoc('batangas_dorm')}
                scaleTo={0.94}
                style={[
                  styles.locTab,
                  selectedLoc === 'batangas_dorm' && styles.locTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.locTabText,
                    selectedLoc === 'batangas_dorm' && styles.locTabTextActive,
                  ]}
                >
                  🏫 Dorm
                </Text>
              </PressableScale>

              <PressableScale
                onPress={() => setSelectedLoc('calamba_home')}
                scaleTo={0.94}
                style={[
                  styles.locTab,
                  selectedLoc === 'calamba_home' && styles.locTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.locTabText,
                    selectedLoc === 'calamba_home' && styles.locTabTextActive,
                  ]}
                >
                  🏠 Home
                </Text>
              </PressableScale>
            </View>
          </View>

          {/* Quick Filters Strip */}
          <View style={styles.filterStrip}>
            <PressableScale
              onPress={() => setCleanOnly(!cleanOnly)}
              scaleTo={0.94}
              style={[styles.filterChip, cleanOnly && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, cleanOnly && styles.filterTextActive]}>
                🧼 Clean Only
              </Text>
            </PressableScale>

            <PressableScale
              onPress={() => setUniformOnly(!uniformOnly)}
              scaleTo={0.94}
              style={[styles.filterChip, uniformOnly && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, uniformOnly && styles.filterTextActive]}>
                👕 Uniform Tees
              </Text>
            </PressableScale>
          </View>
        </FadeSlideIn>

        {/* 4-Row Horizontal Slider Builder */}
        <ScrollView
          style={styles.rowsScroll}
          contentContainerStyle={styles.rowsContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Row 1: Tops */}
          <FadeSlideIn delay={40} fromY={8}>
            <OutfitRowSlider
              title="TOPS & OUTERWEAR"
              icon="🧥"
              items={tops}
              selectedIndex={topIdx}
              onSelectIndex={setTopIdx}
              isLocked={lockTop}
              onToggleLock={() => setLockTop(!lockTop)}
              scrollRef={topListRef}
            />
          </FadeSlideIn>

          {/* Row 2: Bottoms */}
          <FadeSlideIn delay={80} fromY={8}>
            <OutfitRowSlider
              title="BOTTOMS & PANTS"
              icon="👖"
              items={bottoms}
              selectedIndex={bottomIdx}
              onSelectIndex={setBottomIdx}
              isLocked={lockBottom}
              onToggleLock={() => setLockBottom(!lockBottom)}
              scrollRef={bottomListRef}
            />
          </FadeSlideIn>

          {/* Row 3: Shoes */}
          <FadeSlideIn delay={120} fromY={8}>
            <OutfitRowSlider
              title="FOOTWEAR"
              icon="👟"
              items={shoes}
              selectedIndex={shoesIdx}
              onSelectIndex={setShoesIdx}
              isLocked={lockShoes}
              onToggleLock={() => setLockShoes(!lockShoes)}
              scrollRef={shoesListRef}
            />
          </FadeSlideIn>

          {/* Row 4: Accessories */}
          <FadeSlideIn delay={160} fromY={8}>
            <OutfitRowSlider
              title="BAGS & ACCESSORIES"
              icon="🎒"
              items={accessories}
              selectedIndex={accIdx}
              onSelectIndex={setAccIdx}
              isLocked={lockAcc}
              onToggleLock={() => setLockAcc(!lockAcc)}
              scrollRef={accListRef}
            />
          </FadeSlideIn>

          {/* Bottom Action Buttons */}
          <FadeSlideIn delay={200} fromY={10}>
            <View style={styles.bottomBar}>
              <PressableScale
                onPress={handleShuffle}
                scaleTo={0.96}
                style={styles.shuffleBtn}
              >
                <Text style={styles.shuffleText}>🎲  Shuffle Unlocked</Text>
              </PressableScale>

              <PressableScale
                onPress={handleWearFit}
                scaleTo={0.96}
                style={styles.wearBtn}
              >
                <Text style={styles.wearText}>Wear Today ✨</Text>
              </PressableScale>
            </View>
          </FadeSlideIn>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  title: {
    color: Colors.textPrimary,
    ...Typography.title1,
    fontSize: 22,
  },
  subtitle: {
    color: Colors.textTertiary,
    fontSize: 12,
  },
  locTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radii.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  locTab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  locTabActive: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  locTabText: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
  },
  locTabTextActive: {
    color: Colors.textPrimary,
  },
  filterStrip: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    marginBottom: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    backgroundColor: Colors.glassLight,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  filterChipActive: {
    backgroundColor: Colors.glassBright,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  filterText: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
  },
  filterTextActive: {
    color: Colors.textPrimary,
  },
  rowsScroll: {
    flex: 1,
  },
  rowsContent: {
    paddingBottom: 130,
    paddingTop: 4,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  shuffleBtn: {
    flex: 1,
    backgroundColor: Colors.glassBright,
    borderRadius: Radii.pill,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGlassBright,
  },
  shuffleText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  wearBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: Radii.pill,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  wearText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
