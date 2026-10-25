import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Modal,
  Switch,
  Animated,
  LayoutAnimation,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWardrobe } from '../context/WardrobeContext';
import OutfitSwiperRow from '../components/OutfitSwiperRow';
import OutfitTierSeparator from '../components/OutfitTierSeparator';
import PressableScale from '../components/PressableScale';
import FadeSlideIn from '../components/FadeSlideIn';
import LiquidGlassLocationSwitch from '../components/LiquidGlassLocationSwitch';
import { Location, SavedOutfit, LOCATION_LABELS, STATUS_LABELS } from '../types/wardrobe';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';
import {
  X,
  RotateCcw,
  MoreVertical,
  SlidersHorizontal,
  Dice,
  LayoutRowsIcon,
  Check,
  GraduationCap,
  House,
  Bookmark,
  Trash2,
  Clock,
  CategoryIcon,
} from '../components/AppIcons';

type TabType = 'dress_me' | 'lookbook' | 'wear_log';
type LayoutRowsType = 2 | 3 | 4;

const TAG_PRESETS = ['Campus', 'Uniform', 'Casual', 'Friday', 'Rainy Day', 'Library'];

export default function FitGeneratorScreen() {
  const insets = useSafeAreaInsets();
  const {
    items,
    currentLocation,
    savedOutfits,
    wearHistory,
    addSavedOutfit,
    deleteSavedOutfit,
    logOutfitWorn,
    showToast,
    getLocationLabel,
  } = useWardrobe();

  // Top sub-tabs: Dress Me, Lookbook, Wear Log
  const [activeTab, setActiveTab] = useState<TabType>('dress_me');

  // Layout rows: 2, 3, or 4 pieces
  const [layoutRows, setLayoutRows] = useState<LayoutRowsType>(3);

  // Active filters — follow the global "I'm at Dorm / Home" switch, and default to wearable pieces
  const [selectedLoc, setSelectedLoc] = useState<Location>(currentLocation);
  const [cleanOnly, setCleanOnly] = useState(true);
  const [uniformOnly, setUniformOnly] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Save outfit modal state
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [outfitNameInput, setOutfitNameInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Campus']);

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

  // Kinetic dice rotation animation (Emil Kowalski feedback principle)
  const diceRotateAnim = useRef(new Animated.Value(0)).current;

  // Keep Fit Studio on the same closet as the Home location switch
  useEffect(() => {
    setSelectedLoc(currentLocation);
    setTopIdx(0);
    setBottomIdx(0);
    setShoesIdx(0);
    setAccIdx(0);
  }, [currentLocation]);

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

  // Shuffle all unpinned rows + kinetic dice animation
  const handleShuffle = () => {
    // Spin dice 360 deg
    diceRotateAnim.setValue(0);
    Animated.spring(diceRotateAnim, {
      toValue: 1,
      tension: 200,
      friction: 12,
      useNativeDriver: true,
    }).start();

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

  // Currently selected items from active swipers
  const currentSelection = useMemo(() => {
    const top = tops[topIdx] ?? tops[0];
    const bottom = bottoms[bottomIdx] ?? bottoms[0];
    const shoe = layoutRows >= 3 ? (shoes[shoesIdx] ?? shoes[0]) : null;
    const acc = layoutRows === 4 ? (accessories[accIdx] ?? accessories[0]) : null;

    return { top, bottom, shoe, acc };
  }, [tops, topIdx, bottoms, bottomIdx, shoes, shoesIdx, accessories, accIdx, layoutRows]);

  // Action 1: Wear Today (marks clothes worn & logs to wearHistory)
  const handleWearToday = () => {
    const itemIds = [
      currentSelection.top?.id,
      currentSelection.bottom?.id,
      currentSelection.shoe?.id,
      currentSelection.acc?.id,
    ].filter(Boolean) as string[];

    if (itemIds.length === 0) {
      showToast({ message: 'No items selected to wear', type: 'warning' });
      return;
    }

    logOutfitWorn(itemIds, 'Fit Generator Combo');
  };

  // Action 2: Open Save to Lookbook Modal
  const handleOpenSaveModal = () => {
    setOutfitNameInput(`Outfit #${savedOutfits.length + 1}`);
    setSelectedTags(['Campus']);
    setSaveModalVisible(true);
  };

  const handleConfirmSaveLookbook = () => {
    if (!currentSelection.top || !currentSelection.bottom) {
      showToast({ message: 'Outfit needs at least a top and bottom', type: 'warning' });
      return;
    }

    const newOutfit: SavedOutfit = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: outfitNameInput.trim() || `Outfit #${savedOutfits.length + 1}`,
      topId: currentSelection.top.id,
      bottomId: currentSelection.bottom.id,
      shoesId: currentSelection.shoe?.id ?? null,
      accessoriesId: currentSelection.acc?.id ?? null,
      tags: selectedTags,
      createdAt: new Date().toISOString(),
      lastWornAt: null,
    };

    addSavedOutfit(newOutfit);
    setSaveModalVisible(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  // Dynamic row heights based on layout
  const rowHeights = useMemo(() => {
    if (layoutRows === 2) {
      return { top: 220, bottom: 230, shoes: 0, acc: 0 };
    }
    if (layoutRows === 3) {
      return { top: 165, bottom: 185, shoes: 115, acc: 0 };
    }
    return { top: 135, bottom: 145, shoes: 100, acc: 100 };
  }, [layoutRows]);

  const diceSpin = diceRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Calculate live availability of a saved outfit
  const getOutfitAvailability = (outfit: SavedOutfit) => {
    const outfitItemIds = [
      outfit.topId,
      outfit.bottomId,
      outfit.shoesId,
      outfit.accessoriesId,
    ].filter(Boolean);

    const outfitItems = outfitItemIds.map((id) => items.find((i) => i.id === id)).filter(Boolean);

    if (outfitItems.length === 0) {
      return { status: 'missing', label: 'Pieces Removed', color: Colors.statusMisplaced };
    }

    if (outfitItems.length < outfitItemIds.length) {
      return { status: 'missing', label: '1+ Piece Removed', color: Colors.statusMisplaced };
    }

    const inLaundry = outfitItems.some((i) => i?.status === 'in_laundry' || i?.status === 'drying');
    if (inLaundry) {
      return { status: 'laundry', label: 'Piece in Laundry', color: Colors.statusLaundry };
    }

    const atDifferentLocation = outfitItems.some((i) => i?.location !== currentLocation);
    if (atDifferentLocation) {
      const otherLoc = outfitItems.find((i) => i?.location !== currentLocation)?.location;
      return {
        status: 'away',
        label: `Piece at ${otherLoc ? getLocationLabel(otherLoc) : 'Other Location'}`,
        color: Colors.statusWorn,
      };
    }

    const isWorn = outfitItems.some((i) => i?.status === 'worn');
    if (isWorn) {
      return { status: 'worn', label: 'Piece Worn / Needs Wash', color: Colors.statusWorn };
    }

    return {
      status: 'ready',
      label: `Ready at ${getLocationLabel(currentLocation)}`,
      color: Colors.statusClean,
    };
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <PressableScale onPress={handleReset} style={styles.iconBtn}>
            <RotateCcw size={19} color={Colors.textPrimary} />
          </PressableScale>

          <Text style={styles.screenTitle}>Fit Studio</Text>

          <PressableScale
            onPress={() => setFilterModalVisible(true)}
            style={styles.iconBtn}
          >
            <MoreVertical size={20} color={Colors.textPrimary} />
          </PressableScale>
        </View>

        {/* Sub-Tabs: Dress me, Lookbook, Wear Log */}
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
              Dress Me
            </Text>
            {activeTab === 'dress_me' && <View style={styles.activeTabIndicator} />}
          </PressableScale>

          <PressableScale
            onPress={() => setActiveTab('lookbook')}
            style={[styles.subTab, activeTab === 'lookbook' && styles.subTabActive]}
          >
            <Text
              style={[
                styles.subTabText,
                activeTab === 'lookbook' && styles.subTabTextActive,
              ]}
            >
              Lookbook ({savedOutfits.length})
            </Text>
            {activeTab === 'lookbook' && <View style={styles.activeTabIndicator} />}
          </PressableScale>

          <PressableScale
            onPress={() => setActiveTab('wear_log')}
            style={[styles.subTab, activeTab === 'wear_log' && styles.subTabActive]}
          >
            <Text
              style={[
                styles.subTabText,
                activeTab === 'wear_log' && styles.subTabTextActive,
              ]}
            >
              Wear Log
            </Text>
            {activeTab === 'wear_log' && <View style={styles.activeTabIndicator} />}
          </PressableScale>
        </View>

        {/* ─── TAB 1: DRESS ME (Interactive Canvas) ───────────────────── */}
        {activeTab === 'dress_me' && (
          <View style={{ flex: 1 }}>
            {/* Dual Action Bar: Filter button, Save to Lookbook, Wear Today */}
            <View style={styles.actionControlsBar}>
              <PressableScale
                onPress={() => setFilterModalVisible(true)}
                scaleTo={0.92}
                style={styles.filterSquareBtn}
              >
                <SlidersHorizontal size={18} color="#FFFFFF" />
              </PressableScale>

              <View style={styles.actionBtnGroup}>
                <PressableScale
                  onPress={handleOpenSaveModal}
                  scaleTo={0.94}
                  style={styles.saveLookbookBtn}
                >
                  <Bookmark size={14} color={Colors.textPrimary} />
                  <Text style={styles.saveLookbookText}>Save Fit</Text>
                </PressableScale>

                <PressableScale
                  onPress={handleWearToday}
                  scaleTo={0.94}
                  style={styles.wearTodayBtn}
                >
                  <Check size={14} color="#FFFFFF" strokeWidth={2.8} />
                  <Text style={styles.wearTodayBtnText}>Wear Today</Text>
                </PressableScale>
              </View>
            </View>

            {/* Cardless Outfit Canvas */}
            <ScrollView
              style={styles.canvasScroll}
              contentContainerStyle={[
                styles.canvasContent,
                { paddingBottom: insets.bottom + 160 },
              ]}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Row 1: Tops */}
              <OutfitTierSeparator
                category="tops"
                label="TOPS & OUTERWEAR"
                activeItem={currentSelection.top}
                isLocked={lockTop}
                itemCount={tops.length}
                currentIndex={topIdx + 1}
              />
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
              <OutfitTierSeparator
                category="bottoms"
                label="BOTTOMS"
                activeItem={currentSelection.bottom}
                isLocked={lockBottom}
                itemCount={bottoms.length}
                currentIndex={bottomIdx + 1}
              />
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
                <>
                  <OutfitTierSeparator
                    category="footwear"
                    label="FOOTWEAR"
                    activeItem={currentSelection.shoe}
                    isLocked={lockShoes}
                    itemCount={shoes.length}
                    currentIndex={shoesIdx + 1}
                  />
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
                </>
              )}

              {/* Row 4: Bags & Accessories (if 4 rows) */}
              {layoutRows === 4 && (
                <>
                  <OutfitTierSeparator
                    category="accessories"
                    label="ACCESSORIES"
                    activeItem={currentSelection.acc}
                    isLocked={lockAcc}
                    itemCount={accessories.length}
                    currentIndex={accIdx + 1}
                  />
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
                </>
              )}
            </ScrollView>

            {/* Floating Bottom Control Dock: Layout Switchers & Dice Shuffle */}
            <View
              pointerEvents="box-none"
              style={[
                styles.dockWrapper,
                { bottom: insets.bottom + 98 },
              ]}
            >
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

                {/* Kinetic Shuffle Dice Button */}
                <PressableScale
                  onPress={handleShuffle}
                  scaleTo={0.9}
                  style={styles.diceButton}
                >
                  <Animated.View style={{ transform: [{ rotate: diceSpin }] }}>
                    <Dice size={20} color="#FFFFFF" weight="bold" />
                  </Animated.View>
                </PressableScale>
              </View>
            </View>
          </View>
        )}

        {/* ─── TAB 2: LOOKBOOK (Saved Outfits with Readiness) ─────────── */}
        {activeTab === 'lookbook' && (
          <ScrollView
            contentContainerStyle={[
              styles.lookbookScroll,
              { paddingBottom: insets.bottom + 90 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {savedOutfits.length === 0 ? (
              <View style={styles.emptyLookbook}>
                <Bookmark size={40} color={Colors.textTertiary} />
                <Text style={styles.emptyLookbookTitle}>Lookbook is Empty</Text>
                <Text style={styles.emptyLookbookSub}>
                  Roll outfits in "Dress Me" and tap "Save Fit" to bookmark your favorite looks.
                </Text>
              </View>
            ) : (
              savedOutfits.map((outfit) => {
                const avail = getOutfitAvailability(outfit);
                const top = items.find((i) => i.id === outfit.topId);
                const bottom = items.find((i) => i.id === outfit.bottomId);
                const shoe = items.find((i) => i.id === outfit.shoesId);

                return (
                  <View key={outfit.id} style={styles.lookbookCard}>
                    <View style={styles.specular} />

                    {/* Card Top: Title & Delete */}
                    <View style={styles.lookbookHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.lookbookTitle}>{outfit.name}</Text>
                        <View style={styles.tagWrap}>
                          {outfit.tags.map((t) => (
                            <View key={t} style={styles.lookbookTagPill}>
                              <Text style={styles.lookbookTagText}>{t}</Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => deleteSavedOutfit(outfit.id)}
                        style={styles.trashBtn}
                      >
                        <Trash2 size={16} color={Colors.textTertiary} />
                      </TouchableOpacity>
                    </View>

                    {/* Pieces collage */}
                    <View style={styles.collageRow}>
                      {[top, bottom, shoe].filter(Boolean).map((piece, idx) => (
                        <View key={piece?.id ?? idx} style={styles.collageThumb}>
                          {piece?.imageUrl ? (
                            <Image
                              source={{ uri: piece.imageUrl }}
                              style={styles.collageImage}
                              resizeMode="contain"
                            />
                          ) : (
                            <CategoryIcon
                              category={piece?.category ?? 'tops'}
                              size={24}
                              color={Colors.textSecondary}
                            />
                          )}
                        </View>
                      ))}
                    </View>

                    {/* Footer: Live Readiness Badge + Wear button */}
                    <View style={styles.lookbookFooter}>
                      <View
                        style={[
                          styles.availBadge,
                          {
                            backgroundColor: avail.color + '14',
                            borderColor: avail.color + '40',
                          },
                        ]}
                      >
                        <View style={[styles.availDot, { backgroundColor: avail.color }]} />
                        <Text style={[styles.availText, { color: avail.color }]}>
                          {avail.label}
                        </Text>
                      </View>

                      <PressableScale
                        scaleTo={0.94}
                        onPress={() => {
                          const ids = [outfit.topId, outfit.bottomId, outfit.shoesId, outfit.accessoriesId].filter(Boolean) as string[];
                          logOutfitWorn(ids, outfit.name);
                        }}
                        style={styles.wearLookbookBtn}
                      >
                        <Text style={styles.wearLookbookBtnText}>Wear This</Text>
                      </PressableScale>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* ─── TAB 3: WEAR LOG (Chronological Timeline) ──────────────── */}
        {activeTab === 'wear_log' && (
          <ScrollView
            contentContainerStyle={[
              styles.wearLogScroll,
              { paddingBottom: insets.bottom + 90 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {wearHistory.length === 0 ? (
              <View style={styles.emptyLookbook}>
                <Clock size={40} color={Colors.textTertiary} />
                <Text style={styles.emptyLookbookTitle}>No Wear Logs Yet</Text>
                <Text style={styles.emptyLookbookSub}>
                  When you tap "Wear Today", outfits will be logged here chronologically.
                </Text>
              </View>
            ) : (
              wearHistory.map((log) => {
                const dateFormatted = new Date(log.wornAt).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });
                const wornPieces = log.itemIds.map((id) => items.find((i) => i.id === id)).filter(Boolean);

                return (
                  <View key={log.id} style={styles.wearLogCard}>
                    <View style={styles.wearLogHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.wearLogTitle}>
                          {log.outfitName || 'Daily Outfit'}
                        </Text>
                        <Text style={styles.wearLogDate}>{dateFormatted}</Text>
                      </View>

                      <View style={styles.wearLogLocBadge}>
                        <Text style={styles.wearLogLocText}>
                          {getLocationLabel(log.location)}
                        </Text>
                      </View>
                    </View>

                    {/* Pieces preview */}
                    <View style={styles.wearLogThumbsRow}>
                      {wornPieces.map((p) => (
                        <View key={p?.id} style={styles.wearLogThumb}>
                          {p?.imageUrl ? (
                            <Image
                              source={{ uri: p.imageUrl }}
                              style={{ width: 44, height: 44 }}
                              resizeMode="contain"
                            />
                          ) : (
                            <CategoryIcon
                              category={p?.category ?? 'tops'}
                              size={20}
                              color={Colors.textSecondary}
                            />
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* ─── SAVE TO LOOKBOOK MODAL ─────────────────────────────────── */}
        <Modal
          visible={saveModalVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setSaveModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Save to Lookbook</Text>
                <PressableScale onPress={() => setSaveModalVisible(false)}>
                  <X size={18} color={Colors.textPrimary} />
                </PressableScale>
              </View>

              <Text style={styles.filterSectionLabel}>OUTFIT NAME</Text>
              <TextInput
                style={styles.modalInput}
                value={outfitNameInput}
                onChangeText={setOutfitNameInput}
                placeholder="e.g. Wednesday Lab Outfit, Uniqlo Monday"
                placeholderTextColor={Colors.textTertiary}
                autoFocus
              />

              <Text style={[styles.filterSectionLabel, { marginTop: 14 }]}>TAGS</Text>
              <View style={styles.tagPresetRow}>
                {TAG_PRESETS.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => toggleTag(tag)}
                      style={[styles.tagPresetBtn, active && styles.tagPresetBtnActive]}
                    >
                      <Text style={[styles.tagPresetText, active && styles.tagPresetTextActive]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <PressableScale
                onPress={handleConfirmSaveLookbook}
                style={styles.modalDoneBtn}
              >
                <Text style={styles.modalDoneText}>Save Outfit</Text>
              </PressableScale>
            </View>
          </View>
        </Modal>

        {/* ─── FILTER SETTINGS MODAL ─────────────────────────────────── */}
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
                  <X size={18} color={Colors.textPrimary} />
                </PressableScale>
              </View>

              <Text style={styles.filterSectionLabel}>CLOSET LOCATION</Text>
              <LiquidGlassLocationSwitch
                currentLocation={selectedLoc}
                onChange={(loc) => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setSelectedLoc(loc);
                }}
                style={{ width: '100%', marginBottom: 16 }}
              />

              <View style={styles.filterToggleRow}>
                <View>
                  <Text style={styles.toggleLabel}>Clean Items Only</Text>
                  <Text style={styles.toggleSub}>Hide clothes in laundry or worn</Text>
                </View>
                <Switch
                  value={cleanOnly}
                  onValueChange={setCleanOnly}
                  trackColor={{ false: Colors.bgDeep, true: Colors.accent }}
                />
              </View>

              <View style={styles.filterToggleRow}>
                <View>
                  <Text style={styles.toggleLabel}>Uniform White Tees</Text>
                  <Text style={styles.toggleSub}>Match school uniform code</Text>
                </View>
                <Switch
                  value={uniformOnly}
                  onValueChange={setUniformOnly}
                  trackColor={{ false: Colors.bgDeep, true: Colors.accent }}
                />
              </View>

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
    backgroundColor: Colors.bgBase,
  },
  safe: {
    flex: 1,
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
    fontWeight: '700',
    color: Colors.textPrimary,
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
    borderBottomColor: Colors.borderGlass,
  },
  subTab: {
    paddingVertical: 10,
    marginRight: 20,
    position: 'relative',
  },
  subTabActive: {},
  subTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textTertiary,
  },
  subTabTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.textPrimary,
    borderRadius: 1,
  },
  actionControlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 10,
    paddingBottom: 4,
  },
  filterSquareBtn: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveLookbookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  saveLookbookText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  wearTodayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 2,
  },
  wearTodayBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  canvasScroll: {
    flex: 1,
  },
  canvasContent: {
    paddingTop: 6,
    paddingBottom: 140,
    alignItems: 'center',
  },
  dockWrapper: {
    position: 'absolute',
    bottom: 98,
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
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 6,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
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
    backgroundColor: 'rgba(20, 20, 19, 0.08)',
  },
  dockDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.borderGlass,
    marginHorizontal: 8,
  },
  diceButton: {
    width: 40,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  lookbookScroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 120,
    gap: Spacing.md,
  },
  emptyLookbook: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: Spacing.xl,
    gap: 8,
  },
  emptyLookbookTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 6,
  },
  emptyLookbookSub: {
    color: Colors.textTertiary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  lookbookCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    gap: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  specular: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  lookbookHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  lookbookTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  tagWrap: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  lookbookTagPill: {
    backgroundColor: Colors.bgSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: Radii.pill,
  },
  lookbookTagText: {
    color: Colors.textSecondary,
    fontSize: 10.5,
    fontWeight: '600',
  },
  trashBtn: {
    padding: 6,
  },
  collageRow: {
    flexDirection: 'row',
    gap: 8,
  },
  collageThumb: {
    width: 68,
    height: 68,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    overflow: 'hidden',
  },
  collageImage: {
    width: '90%',
    height: '90%',
  },
  lookbookFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.borderGlass,
  },
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availText: {
    fontSize: 11,
    fontWeight: '600',
  },
  wearLookbookBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  wearLookbookBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  wearLogScroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 120,
    gap: Spacing.sm,
  },
  wearLogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    gap: 10,
  },
  wearLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wearLogTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  wearLogDate: {
    color: Colors.textTertiary,
    fontSize: 11.5,
    marginTop: 1,
  },
  wearLogLocBadge: {
    backgroundColor: Colors.bgSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  wearLogLocText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  wearLogThumbsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  wearLogThumb: {
    width: 48,
    height: 48,
    borderRadius: Radii.sm,
    backgroundColor: Colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 19, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
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
    color: Colors.textPrimary,
  },
  filterSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: Colors.bgSubtle,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  tagPresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPresetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: Colors.bgSubtle,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  tagPresetBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  tagPresetText: {
    color: Colors.textSecondary,
    fontSize: 11.5,
    fontWeight: '500',
  },
  tagPresetTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
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
    backgroundColor: Colors.bgSubtle,
  },
  modalLocBtnActive: {
    backgroundColor: Colors.accent,
  },
  modalLocText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
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
    borderTopColor: Colors.borderGlass,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  toggleSub: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  modalDoneBtn: {
    marginTop: 18,
    backgroundColor: Colors.accent,
    paddingVertical: 13,
    borderRadius: Radii.xl,
    alignItems: 'center',
  },
  modalDoneText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
