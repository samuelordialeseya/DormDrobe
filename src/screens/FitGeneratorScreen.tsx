import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
  Modal,
  Switch,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWardrobe } from '../context/WardrobeContext';
import OutfitSwiperRow from '../components/OutfitSwiperRow';
import PressableScale from '../components/PressableScale';
import FadeSlideIn from '../components/FadeSlideIn';
import { Location } from '../types/wardrobe';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';
import {
  X,
  MoreVertical,
  SlidersHorizontal,
  Dice,
  LayoutRowsIcon,
  Check,
  GraduationCap,
  House,
  Sparkle,
  CoatHanger,
} from '../components/AppIcons';

type TabType = 'dress_me' | 'canvas' | 'moodboards';
type LayoutRowsType = 2 | 3 | 4;

export default function FitGeneratorScreen() {
  const { items, updateItem } = useWardrobe();

  // Top sub-tabs
  const [activeTab, setActiveTab] = useState<TabType>('dress_me');

  // Layout rows: 2, 3, or 4 pieces
  const [layoutRows, setLayoutRows] = useState<LayoutRowsType>(3);

  // Active filters
  const [selectedLoc, setSelectedLoc] = useState<Location>('batangas_dorm');
  const [cleanOnly, setCleanOnly] = useState(false);
  const [uniformOnly, setUniformOnly] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Row selection indices
  const [topIdx, setTopIdx] = useState(0);
  const [bottomIdx, setBottomIdx] = useState(0);
  const [shoesIdx, setShoesIdx] = useState(0);
  const [accIdx, setAccIdx] = useState(0);

  // Row lock states (pin on garment)
  const [lockTop, setLockTop] = useState(false);
  const [lockBottom, setLockBottom] = useState(false);
  const [lockShoes, setLockShoes] = useState(false);
  const [lockAcc, setLockAcc] = useState(false);

  // FlatList refs for programmatic scrolling on shuffle
  const topListRef = useRef<FlatList>(null);
  const bottomListRef = useRef<FlatList>(null);
  const shoesListRef = useRef<FlatList>(null);
  const accListRef = useRef<FlatList>(null);

  // Success toast animation
  const [showToast, setShowToast] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;

  // Filter items for each row
  const availableItems = useMemo(() => {
    return items.filter((item) => {
      if (item.location !== selectedLoc) return false;
      if (cleanOnly && item.status !== 'clean') return false;
      return true;
    });
  }, [items, selectedLoc, cleanOnly]);

  const tops = useMemo(() => {
    const list = availableItems.filter((i) => {
      if (uniformOnly && !i.isUniformWhiteTee) return false;
      return i.category === 'tops' || i.category === 'outerwear';
    });
    return list.length > 0 ? list : items.filter((i) => i.category === 'tops');
  }, [availableItems, items, uniformOnly]);

  const bottoms = useMemo(() => {
    const list = availableItems.filter((i) => i.category === 'bottoms');
    return list.length > 0 ? list : items.filter((i) => i.category === 'bottoms');
  }, [availableItems, items]);

  const shoes = useMemo(() => {
    const list = availableItems.filter((i) => i.category === 'footwear');
    return list.length > 0 ? list : items.filter((i) => i.category === 'footwear');
  }, [availableItems, items]);

  const accessories = useMemo(() => {
    const list = availableItems.filter((i) => i.category === 'accessories');
    return list.length > 0 ? list : items.filter((i) => i.category === 'accessories');
  }, [availableItems, items]);

  // Shuffle all unpinned rows
  const handleShuffle = () => {
    if (!lockTop && tops.length > 1) {
      let next = Math.floor(Math.random() * tops.length);
      if (next === topIdx && tops.length > 1) next = (next + 1) % tops.length;
      setTopIdx(next);
    }

    if (!lockBottom && bottoms.length > 1) {
      let next = Math.floor(Math.random() * bottoms.length);
      if (next === bottomIdx && bottoms.length > 1) next = (next + 1) % bottoms.length;
      setBottomIdx(next);
    }

    if (!lockShoes && shoes.length > 1 && layoutRows >= 3) {
      let next = Math.floor(Math.random() * shoes.length);
      if (next === shoesIdx && shoes.length > 1) next = (next + 1) % shoes.length;
      setShoesIdx(next);
    }

    if (!lockAcc && accessories.length > 1 && layoutRows === 4) {
      let next = Math.floor(Math.random() * accessories.length);
      if (next === accIdx && accessories.length > 1) next = (next + 1) % accessories.length;
      setAccIdx(next);
    }
  };

  // Reset indices and unpin
  const handleReset = () => {
    setTopIdx(0);
    setBottomIdx(0);
    setShoesIdx(0);
    setAccIdx(0);
    setLockTop(false);
    setLockBottom(false);
    setLockShoes(false);
    setLockAcc(false);
  };

  // Save outfit / wear fit
  const handleSave = () => {
    const wornItems = [
      tops[topIdx],
      bottoms[bottomIdx],
      layoutRows >= 3 ? shoes[shoesIdx] : null,
      layoutRows === 4 ? accessories[accIdx] : null,
    ].filter(Boolean);

    if (wornItems.length === 0) {
      Alert.alert('Empty Outfit', 'No items selected to save.');
      return;
    }

    wornItems.forEach((it) => {
      if (it?.id) {
        updateItem(it.id, {
          status: 'worn',
          lastWornAt: new Date().toISOString(),
        });
      }
    });

    // Trigger visual toast
    setShowToast(true);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.delay(1800),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setShowToast(false));
  };

  // Calculate row heights dynamically based on layoutRows
  const rowHeights = useMemo(() => {
    if (layoutRows === 2) {
      return { top: 220, bottom: 230, shoes: 0, acc: 0 };
    }
    if (layoutRows === 3) {
      return { top: 165, bottom: 185, shoes: 115, acc: 0 };
    }
    return { top: 135, bottom: 145, shoes: 100, acc: 100 };
  }, [layoutRows]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Top Header: X, "Styling", vertical menu */}
        <View style={styles.topHeader}>
          <PressableScale onPress={handleReset} style={styles.iconBtn}>
            <X size={20} color="#1C1C1E" weight="regular" />
          </PressableScale>

          <Text style={styles.screenTitle}>Styling</Text>

          <PressableScale
            onPress={() => setFilterModalVisible(true)}
            style={styles.iconBtn}
          >
            <MoreVertical size={20} color="#1C1C1E" weight="regular" />
          </PressableScale>
        </View>

        {/* Sub-Tabs: Dress me, Canvas, Moodboards */}
        <View style={styles.subTabsContainer}>
          <PressableScale
            onPress={() => setActiveTab('dress_me')}
            style={[styles.subTab, activeTab === 'dress_me' && styles.subTabActive]}
          >
            <Text
              style={[
                styles.subTabText,
                activeTab === 'dress_me' && styles.subTabTextActive,
              ]}
            >
              Dress me
            </Text>
            {activeTab === 'dress_me' && <View style={styles.activeTabIndicator} />}
          </PressableScale>

          <PressableScale
            onPress={() => setActiveTab('canvas')}
            style={[styles.subTab, activeTab === 'canvas' && styles.subTabActive]}
          >
            <Text
              style={[
                styles.subTabText,
                activeTab === 'canvas' && styles.subTabTextActive,
              ]}
            >
              Canvas
            </Text>
            {activeTab === 'canvas' && <View style={styles.activeTabIndicator} />}
          </PressableScale>

          <PressableScale
            onPress={() => setActiveTab('moodboards')}
            style={[styles.subTab, activeTab === 'moodboards' && styles.subTabActive]}
          >
            <Text
              style={[
                styles.subTabText,
                activeTab === 'moodboards' && styles.subTabTextActive,
              ]}
            >
              Moodboards
            </Text>
            {activeTab === 'moodboards' && <View style={styles.activeTabIndicator} />}
          </PressableScale>
        </View>

        {/* Action Controls Bar: Left Filter Button, Right Lime Save Button */}
        <View style={styles.actionControlsBar}>
          <PressableScale
            onPress={() => setFilterModalVisible(true)}
            scaleTo={0.92}
            style={styles.filterSquareBtn}
          >
            <SlidersHorizontal size={18} color="#FFFFFF" weight="regular" />
          </PressableScale>

          <PressableScale
            onPress={handleSave}
            scaleTo={0.94}
            style={styles.limeSaveBtn}
          >
            <Text style={styles.limeSaveText}>Save</Text>
          </PressableScale>
        </View>

        {/* Cardless Outfit Canvas */}
        <ScrollView
          style={styles.canvasScroll}
          contentContainerStyle={styles.canvasContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Row 1: Tops */}
          <FadeSlideIn delay={30} fromY={6}>
            <OutfitSwiperRow
              items={tops}
              selectedIndex={topIdx}
              onSelectIndex={setTopIdx}
              isLocked={lockTop}
              onToggleLock={() => setLockTop(!lockTop)}
              rowHeight={rowHeights.top}
              scrollRef={topListRef}
              category="tops"
            />
          </FadeSlideIn>

          {/* Row 2: Bottoms */}
          <FadeSlideIn delay={60} fromY={6}>
            <OutfitSwiperRow
              items={bottoms}
              selectedIndex={bottomIdx}
              onSelectIndex={setBottomIdx}
              isLocked={lockBottom}
              onToggleLock={() => setLockBottom(!lockBottom)}
              rowHeight={rowHeights.bottom}
              scrollRef={bottomListRef}
              category="bottoms"
            />
          </FadeSlideIn>

          {/* Row 3: Footwear (if 3 or 4 rows) */}
          {layoutRows >= 3 && (
            <FadeSlideIn delay={90} fromY={6}>
              <OutfitSwiperRow
                items={shoes}
                selectedIndex={shoesIdx}
                onSelectIndex={setShoesIdx}
                isLocked={lockShoes}
                onToggleLock={() => setLockShoes(!lockShoes)}
                rowHeight={rowHeights.shoes}
                scrollRef={shoesListRef}
                category="footwear"
              />
            </FadeSlideIn>
          )}

          {/* Row 4: Bags & Accessories (if 4 rows) */}
          {layoutRows === 4 && (
            <FadeSlideIn delay={120} fromY={6}>
              <OutfitSwiperRow
                items={accessories}
                selectedIndex={accIdx}
                onSelectIndex={setAccIdx}
                isLocked={lockAcc}
                onToggleLock={() => setLockAcc(!lockAcc)}
                rowHeight={rowHeights.acc}
                scrollRef={accListRef}
                category="accessories"
              />
            </FadeSlideIn>
          )}

          {/* Spacer so bottom items aren't obscured by floating dock */}
          <View style={{ height: 84 }} />
        </ScrollView>

        {/* Floating Bottom Control Dock: Layout Switchers & Dice Shuffle */}
        <View pointerEvents="box-none" style={styles.dockWrapper}>
          <View style={styles.floatingDock}>
            {/* 2-row toggle */}
            <PressableScale
              onPress={() => setLayoutRows(2)}
              scaleTo={0.92}
              style={[
                styles.layoutBtn,
                layoutRows === 2 && styles.layoutBtnActive,
              ]}
            >
              <LayoutRowsIcon rows={2} active={layoutRows === 2} size={18} />
            </PressableScale>

            {/* 3-row toggle */}
            <PressableScale
              onPress={() => setLayoutRows(3)}
              scaleTo={0.92}
              style={[
                styles.layoutBtn,
                layoutRows === 3 && styles.layoutBtnActive,
              ]}
            >
              <LayoutRowsIcon rows={3} active={layoutRows === 3} size={18} />
            </PressableScale>

            {/* 4-row toggle */}
            <PressableScale
              onPress={() => setLayoutRows(4)}
              scaleTo={0.92}
              style={[
                styles.layoutBtn,
                layoutRows === 4 && styles.layoutBtnActive,
              ]}
            >
              <LayoutRowsIcon rows={4} active={layoutRows === 4} size={18} />
            </PressableScale>

            <View style={styles.dockDivider} />

            {/* Shuffle Dice Button */}
            <PressableScale
              onPress={handleShuffle}
              scaleTo={0.9}
              style={styles.diceButton}
            >
              <Dice size={20} color="#FFFFFF" weight="bold" />
            </PressableScale>
          </View>
        </View>

        {/* Toast confirmation on Save */}
        {showToast && (
          <Animated.View
            style={[
              styles.toastNotification,
              {
                opacity: toastAnim,
                transform: [
                  {
                    translateY: toastAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Check size={16} color="#000000" weight="bold" />
            <Text style={styles.toastText}>Outfit Saved to Lookbook</Text>
          </Animated.View>
        )}

        {/* Filter / Settings Modal */}
        <Modal
          visible={filterModalVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Wardrobe Filters</Text>
                <PressableScale onPress={() => setFilterModalVisible(false)}>
                  <X size={18} color="#1C1C1E" weight="bold" />
                </PressableScale>
              </View>

              {/* Location selection */}
              <Text style={styles.filterSectionLabel}>CLOSET LOCATION</Text>
              <View style={styles.modalLocRow}>
                <PressableScale
                  onPress={() => setSelectedLoc('batangas_dorm')}
                  style={[
                    styles.modalLocBtn,
                    selectedLoc === 'batangas_dorm' && styles.modalLocBtnActive,
                  ]}
                >
                  <GraduationCap
                    size={16}
                    color={selectedLoc === 'batangas_dorm' ? '#FFFFFF' : '#1C1C1E'}
                  />
                  <Text
                    style={[
                      styles.modalLocText,
                      selectedLoc === 'batangas_dorm' && styles.modalLocTextActive,
                    ]}
                  >
                    Dorm (Batangas)
                  </Text>
                </PressableScale>

                <PressableScale
                  onPress={() => setSelectedLoc('calamba_home')}
                  style={[
                    styles.modalLocBtn,
                    selectedLoc === 'calamba_home' && styles.modalLocBtnActive,
                  ]}
                >
                  <House
                    size={16}
                    color={selectedLoc === 'calamba_home' ? '#FFFFFF' : '#1C1C1E'}
                  />
                  <Text
                    style={[
                      styles.modalLocText,
                      selectedLoc === 'calamba_home' && styles.modalLocTextActive,
                    ]}
                  >
                    Home (Calamba)
                  </Text>
                </PressableScale>
              </View>

              {/* Toggles */}
              <View style={styles.filterToggleRow}>
                <View>
                  <Text style={styles.toggleLabel}>Clean Items Only</Text>
                  <Text style={styles.toggleSub}>Hide clothes in laundry or worn</Text>
                </View>
                <Switch
                  value={cleanOnly}
                  onValueChange={setCleanOnly}
                  trackColor={{ false: '#E5E5EA', true: '#7C3AED' }}
                />
              </View>

              <View style={styles.filterToggleRow}>
                <View>
                  <Text style={styles.toggleLabel}>Uniform White Tees</Text>
                  <Text style={styles.toggleSub}>Match school dress code</Text>
                </View>
                <Switch
                  value={uniformOnly}
                  onValueChange={setUniformOnly}
                  trackColor={{ false: '#E5E5EA', true: '#7C3AED' }}
                />
              </View>

              {/* Done button */}
              <PressableScale
                onPress={() => setFilterModalVisible(false)}
                style={styles.modalDoneBtn}
              >
                <Text style={styles.modalDoneText}>Done</Text>
              </PressableScale>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  iconBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  subTab: {
    paddingVertical: 10,
    marginRight: 24,
    position: 'relative',
  },
  subTabActive: {},
  subTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  subTabTextActive: {
    color: '#1C1C1E',
    fontWeight: '700',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#1C1C1E',
    borderRadius: 1,
  },
  actionControlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 12,
    paddingBottom: 4,
  },
  filterSquareBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  limeSaveBtn: {
    backgroundColor: '#D4FF00', // Vibrant neon lime matching reference app
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  limeSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  canvasScroll: {
    flex: 1,
  },
  canvasContent: {
    paddingTop: 8,
    paddingBottom: 140,
    alignItems: 'center',
  },
  dockWrapper: {
    position: 'absolute',
    bottom: 82,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  floatingDock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.07)',
  },
  layoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  layoutBtnActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  dockDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 8,
  },
  diceButton: {
    width: 40,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastNotification: {
    position: 'absolute',
    top: 55,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D4FF00',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radii.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 999,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  filterSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  modalLocRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  modalLocBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
  },
  modalLocBtnActive: {
    backgroundColor: '#1C1C1E',
  },
  modalLocText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  modalLocTextActive: {
    color: '#FFFFFF',
  },
  filterToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  toggleSub: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  modalDoneBtn: {
    marginTop: 18,
    backgroundColor: '#1C1C1E',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalDoneText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
