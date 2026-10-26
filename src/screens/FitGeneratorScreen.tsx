import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  Animated,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useWardrobe } from '../context/WardrobeContext';
import OutfitSwiperRow from '../components/OutfitSwiperRow';
import OutfitTierSeparator from '../components/OutfitTierSeparator';
import PressableScale from '../components/PressableScale';
import FadeSlideIn from '../components/FadeSlideIn';
import LiquidGlassLocationSwitch from '../components/LiquidGlassLocationSwitch';
import { SavedOutfit, isDirtyStatus } from '../types/wardrobe';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';
import {
  X,
  RotateCcw,
  Dice,
  Check,
  Bookmark,
  Trash2,
  Clock,
  CategoryIcon,
  Sparkles,
  Shirt,
  SlidersHorizontal,
} from '../components/AppIcons';

type TabType = 'dress_me' | 'lookbook' | 'wear_log';
type LayoutRowsType = 2 | 3 | 4;

const TAG_PRESETS = ['Campus', 'Uniform', 'Casual', 'Friday', 'Rainy Day', 'Library'];

function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return 'Never worn';
  const then = new Date(isoString).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Worn today';
  if (diffDays === 1) return 'Worn yesterday';
  if (diffDays < 7) return `Worn ${diffDays}d ago`;
  if (diffDays < 30) return `Worn ${Math.floor(diffDays / 7)}w ago`;
  return `Worn ${new Date(isoString).toLocaleDateString()}`;
}

export default function FitGeneratorScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const {
    items,
    currentLocation,
    setCurrentLocation,
    savedOutfits,
    wearHistory,
    addSavedOutfit,
    deleteSavedOutfit,
    logOutfitWorn,
    deleteWearLog,
    showToast,
    getLocationLabel,
  } = useWardrobe();

  // Top sub-tabs: Dress Me, Lookbook, Wear Log
  const [activeTab, setActiveTab] = useState<TabType>('dress_me');

  // Layout rows: 2, 3, or 4 pieces
  const [layoutRows, setLayoutRows] = useState<LayoutRowsType>(3);

  // Active filters — live on screen (Intent & Impeccable: No hidden modal)
  const [cleanOnly, setCleanOnly] = useState(true);
  const [uniformOnly, setUniformOnly] = useState(false);

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
  const topListRef = useRef<any>(null);
  const bottomListRef = useRef<any>(null);
  const shoesListRef = useRef<any>(null);
  const accListRef = useRef<any>(null);

  // Kinetic dice rotation animation (Emil Kowalski principle)
  const diceRotateAnim = useRef(new Animated.Value(0)).current;

  // Filter items for each row — HONEST filtering (Intent: transparent consequences, no silent deception)
  const tops = useMemo(() => {
    return items.filter((i) => {
      if (i.location !== currentLocation) return false;
      if (cleanOnly && isDirtyStatus(i.status)) return false;
      if (uniformOnly && !i.isUniformWhiteTee) return false;
      return i.category === 'tops' || i.category === 'outerwear';
    });
  }, [items, currentLocation, cleanOnly, uniformOnly]);

  const bottoms = useMemo(() => {
    return items.filter((i) => {
      if (i.location !== currentLocation) return false;
      if (cleanOnly && isDirtyStatus(i.status)) return false;
      return i.category === 'bottoms';
    });
  }, [items, currentLocation, cleanOnly]);

  const shoes = useMemo(() => {
    return items.filter((i) => {
      if (i.location !== currentLocation) return false;
      if (cleanOnly && isDirtyStatus(i.status)) return false;
      return i.category === 'footwear';
    });
  }, [items, currentLocation, cleanOnly]);

  const accessories = useMemo(() => {
    return items.filter((i) => {
      if (i.location !== currentLocation) return false;
      if (cleanOnly && isDirtyStatus(i.status)) return false;
      return i.category === 'accessories';
    });
  }, [items, currentLocation, cleanOnly]);

  // Autonomy: Auto-clamp indices whenever lists change to avoid out-of-bounds or dimmed items
  useEffect(() => {
    if (tops.length > 0 && topIdx >= tops.length) setTopIdx(Math.max(0, tops.length - 1));
  }, [tops.length, topIdx]);

  useEffect(() => {
    if (bottoms.length > 0 && bottomIdx >= bottoms.length) setBottomIdx(Math.max(0, bottoms.length - 1));
  }, [bottoms.length, bottomIdx]);

  useEffect(() => {
    if (shoes.length > 0 && shoesIdx >= shoes.length) setShoesIdx(Math.max(0, shoes.length - 1));
  }, [shoes.length, shoesIdx]);

  useEffect(() => {
    if (accessories.length > 0 && accIdx >= accessories.length) setAccIdx(Math.max(0, accessories.length - 1));
  }, [accessories.length, accIdx]);

  // Shuffle all unpinned rows + kinetic dice animation
  const handleShuffle = () => {
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

  const isAnyRowPinned = lockTop || lockBottom || lockShoes || lockAcc;
  const isAnyRowOffset = topIdx > 0 || bottomIdx > 0 || shoesIdx > 0 || accIdx > 0;
  const showResetBtn = isAnyRowPinned || isAnyRowOffset;

  // Currently selected items from active swipers
  const currentSelection = useMemo(() => {
    const top = tops[topIdx] ?? tops[0] ?? null;
    const bottom = bottoms[bottomIdx] ?? bottoms[0] ?? null;
    const shoe = layoutRows >= 3 ? (shoes[shoesIdx] ?? shoes[0] ?? null) : null;
    const acc = layoutRows === 4 ? (accessories[accIdx] ?? accessories[0] ?? null) : null;

    return { top, bottom, shoe, acc };
  }, [tops, topIdx, bottoms, bottomIdx, shoes, shoesIdx, accessories, accIdx, layoutRows]);

  // Action: Wear Today (marks clothes worn & logs to wearHistory)
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

    logOutfitWorn(itemIds, 'Fit Studio Combo');
  };

  // Action: Open Save to Lookbook Modal
  const handleOpenSaveModal = () => {
    if (!currentSelection.top && !currentSelection.bottom) {
      showToast({ message: 'Select clothes first before saving', type: 'warning' });
      return;
    }
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

  // Systems over screens: Load Lookbook outfit back into Studio
  const handleOpenInStudio = (outfit: SavedOutfit) => {
    setActiveTab('dress_me');
    if (outfit.accessoriesId) setLayoutRows(4);
    else if (outfit.shoesId) setLayoutRows(3);
    else setLayoutRows(2);

    if (outfit.topId) {
      const idx = tops.findIndex((i) => i.id === outfit.topId);
      if (idx !== -1) setTopIdx(idx);
    }
    if (outfit.bottomId) {
      const idx = bottoms.findIndex((i) => i.id === outfit.bottomId);
      if (idx !== -1) setBottomIdx(idx);
    }
    if (outfit.shoesId) {
      const idx = shoes.findIndex((i) => i.id === outfit.shoesId);
      if (idx !== -1) setShoesIdx(idx);
    }
    if (outfit.accessoriesId) {
      const idx = accessories.findIndex((i) => i.id === outfit.accessoriesId);
      if (idx !== -1) setAccIdx(idx);
    }
    showToast({ message: `Loaded "${outfit.name}" into Studio`, type: 'info' });
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

  const place = getLocationLabel(currentLocation);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Top Header — Standard Warm Atelier typography & global location sync */}
        <FadeSlideIn delay={0} fromY={-8}>
          <View style={styles.topHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.screenTitle}>Fit Studio</Text>
              <Text style={styles.screenSubtitle}>Ready to wear at {place}</Text>
            </View>
            <LiquidGlassLocationSwitch
              currentLocation={currentLocation}
              onChange={setCurrentLocation}
            />
          </View>
        </FadeSlideIn>

        {/* Sub-Tabs: Dress me, Lookbook, Wear Log */}
        <FadeSlideIn delay={30} fromY={6}>
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
                Wear Log ({wearHistory.length})
              </Text>
              {activeTab === 'wear_log' && <View style={styles.activeTabIndicator} />}
            </PressableScale>
          </View>
        </FadeSlideIn>

        {/* ─── TAB 1: DRESS ME (Interactive Canvas) ───────────────────── */}
        {activeTab === 'dress_me' && (
          <View style={{ flex: 1 }}>
            {items.length === 0 ? (
              <View style={styles.emptyStudioState}>
                <View style={styles.emptyStudioIconWrap}>
                  <Shirt size={44} color={Colors.accent} strokeWidth={1.8} />
                </View>
                <Text style={styles.emptyStudioTitle}>Closet is Empty</Text>
                <Text style={styles.emptyStudioSub}>
                  Add clothes to your closet first to start rolling and styling outfits.
                </Text>
                <PressableScale
                  onPress={() => navigation.navigate('Add', { editItem: undefined })}
                  scaleTo={0.94}
                  style={styles.emptyStudioBtn}
                >
                  <Text style={styles.emptyStudioBtnText}>+ Add Clothes</Text>
                </PressableScale>
              </View>
            ) : (
              <>
                {/* Intent & Impeccable: Inline Scannable Studio Toolbar (Zero Hidden Modal) */}
                <FadeSlideIn delay={50} fromY={6}>
                  <View style={styles.studioToolbar}>
                    {/* Layer Count Segmented Pills */}
                    <View style={styles.layerPillWrap}>
                      {([2, 3, 4] as LayoutRowsType[]).map((r) => {
                        const active = layoutRows === r;
                        return (
                          <TouchableOpacity
                            key={r}
                            onPress={() => setLayoutRows(r)}
                            style={[styles.layerPill, active && styles.layerPillActive]}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.layerPillText,
                                active && styles.layerPillTextActive,
                              ]}
                            >
                              {r}P
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Filter Toggle Chips */}
                    <TouchableOpacity
                      onPress={() => setCleanOnly(!cleanOnly)}
                      activeOpacity={0.8}
                      style={[styles.filterChip, cleanOnly && styles.filterChipActive]}
                    >
                      <View
                        style={[
                          styles.filterChipDot,
                          { backgroundColor: cleanOnly ? Colors.statusClean : Colors.textTertiary },
                        ]}
                      />
                      <Text
                        style={[
                          styles.filterChipText,
                          cleanOnly && styles.filterChipTextActive,
                        ]}
                      >
                        Clean Only
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setUniformOnly(!uniformOnly)}
                      activeOpacity={0.8}
                      style={[styles.filterChip, uniformOnly && styles.filterChipActive]}
                    >
                      <Shirt
                        size={12}
                        color={uniformOnly ? Colors.locBatangas : Colors.textSecondary}
                        strokeWidth={2}
                      />
                      <Text
                        style={[
                          styles.filterChipText,
                          uniformOnly && { color: Colors.locBatangas, fontWeight: '700' },
                        ]}
                      >
                        Uniform
                      </Text>
                    </TouchableOpacity>

                    {/* Contextual Reset Button */}
                    {showResetBtn && (
                      <TouchableOpacity
                        onPress={handleReset}
                        activeOpacity={0.8}
                        style={styles.resetChip}
                      >
                        <RotateCcw size={11} color={Colors.textSecondary} />
                        <Text style={styles.resetChipText}>Reset</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </FadeSlideIn>

                {/* Cardless Outfit Canvas */}
                <ScrollView
                  style={styles.canvasScroll}
                  contentContainerStyle={[
                    styles.canvasContent,
                    { paddingBottom: insets.bottom + 170 },
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
                    currentIndex={tops.length > 0 ? topIdx + 1 : 0}
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
                    currentIndex={bottoms.length > 0 ? bottomIdx + 1 : 0}
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
                        currentIndex={shoes.length > 0 ? shoesIdx + 1 : 0}
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
                        currentIndex={accessories.length > 0 ? accIdx + 1 : 0}
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

                {/* Impeccable: Consolidated Thumb-Zone Studio Dock */}
                <View
                  pointerEvents="box-none"
                  style={[
                    styles.dockWrapper,
                    { bottom: insets.bottom + 88 },
                  ]}
                >
                  <View style={styles.floatingDock}>
                    {/* 1. Kinetic Shuffle Dice */}
                    <PressableScale
                      onPress={handleShuffle}
                      scaleTo={0.92}
                      style={styles.dockDiceBtn}
                    >
                      <Animated.View style={{ transform: [{ rotate: diceSpin }] }}>
                        <Dice size={19} color="#FFFFFF" weight="bold" />
                      </Animated.View>
                      <Text style={styles.dockDiceText}>Roll</Text>
                    </PressableScale>

                    {/* 2. Save Fit to Lookbook */}
                    <PressableScale
                      onPress={handleOpenSaveModal}
                      scaleTo={0.94}
                      style={styles.dockSaveBtn}
                    >
                      <Bookmark size={14} color={Colors.textPrimary} />
                      <Text style={styles.dockSaveText}>Save</Text>
                    </PressableScale>

                    {/* 3. Wear Today (Primary CTA) */}
                    <PressableScale
                      onPress={handleWearToday}
                      scaleTo={0.94}
                      style={styles.dockWearBtn}
                    >
                      <Check size={14} color="#FFFFFF" strokeWidth={2.8} />
                      <Text style={styles.dockWearText}>Wear Today</Text>
                    </PressableScale>
                  </View>
                </View>
              </>
            )}
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
                  Roll outfits in "Dress Me" and tap "Save" to bookmark your favorite looks.
                </Text>
              </View>
            ) : (
              savedOutfits.map((outfit) => {
                const avail = getOutfitAvailability(outfit);
                const top = items.find((i) => i.id === outfit.topId);
                const bottom = items.find((i) => i.id === outfit.bottomId);
                const shoe = items.find((i) => i.id === outfit.shoesId);
                const acc = items.find((i) => i.id === outfit.accessoriesId);

                return (
                  <View key={outfit.id} style={styles.lookbookCard}>
                    <View style={styles.specular} />

                    {/* Card Top: Title, Last Worn, & Delete */}
                    <View style={styles.lookbookHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.lookbookTitle}>{outfit.name}</Text>
                        <Text style={styles.lookbookWornMeta}>
                          {formatRelativeTime(outfit.lastWornAt)}
                        </Text>
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
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={16} color={Colors.textTertiary} />
                      </TouchableOpacity>
                    </View>

                    {/* Pieces collage — All 4 pieces supported */}
                    <View style={styles.collageRow}>
                      {[top, bottom, shoe, acc].filter(Boolean).map((piece, idx) => (
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
                              size={22}
                              color={Colors.textSecondary}
                            />
                          )}
                        </View>
                      ))}
                    </View>

                    {/* Footer: Live Readiness Badge + Open in Studio + Wear button */}
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
                        <Text style={[styles.availText, { color: avail.color }]} numberOfLines={1}>
                          {avail.label}
                        </Text>
                      </View>

                      <View style={styles.lookbookActionGroup}>
                        <PressableScale
                          scaleTo={0.94}
                          onPress={() => handleOpenInStudio(outfit)}
                          style={styles.openInStudioBtn}
                        >
                          <Text style={styles.openInStudioText}>Open</Text>
                        </PressableScale>

                        <PressableScale
                          scaleTo={0.94}
                          onPress={() => {
                            const ids = [outfit.topId, outfit.bottomId, outfit.shoesId, outfit.accessoriesId].filter(Boolean) as string[];
                            logOutfitWorn(ids, outfit.name, outfit.id);
                          }}
                          style={styles.wearLookbookBtn}
                        >
                          <Text style={styles.wearLookbookBtnText}>Wear This</Text>
                        </PressableScale>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* ─── TAB 3: WEAR LOG (Chronological Timeline with Delete) ───── */}
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

                      <View style={styles.wearLogRight}>
                        <View style={styles.wearLogLocBadge}>
                          <Text style={styles.wearLogLocText}>
                            {getLocationLabel(log.location)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => deleteWearLog(log.id)}
                          style={styles.wearLogTrash}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={14} color={Colors.textTertiary} />
                        </TouchableOpacity>
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  screenTitle: {
    color: Colors.textPrimary,
    ...Typography.title1,
  },
  screenSubtitle: {
    color: Colors.textTertiary,
    fontSize: 12.5,
    marginTop: 2,
  },
  subTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
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
  studioToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    gap: 8,
  },
  layerPillWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 20, 19, 0.05)',
    borderRadius: Radii.pill,
    padding: 2,
  },
  layerPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  layerPillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  layerPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  layerPillTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  filterChipActive: {
    borderColor: 'rgba(20, 20, 19, 0.2)',
  },
  filterChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  resetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: Colors.bgSubtle,
    marginLeft: 'auto',
  },
  resetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  canvasScroll: {
    flex: 1,
  },
  canvasContent: {
    paddingTop: 4,
    paddingBottom: 160,
    alignItems: 'center',
  },
  dockWrapper: {
    position: 'absolute',
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
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    gap: 8,
  },
  dockDiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radii.pill,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  dockDiceText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  dockSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  dockSaveText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  dockWearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dockWearText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyStudioState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: 12,
  },
  emptyStudioIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyStudioTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyStudioSub: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 19,
  },
  emptyStudioBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: Radii.pill,
    marginTop: 8,
  },
  emptyStudioBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
  lookbookWornMeta: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  tagWrap: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 5,
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
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderGlass,
  },
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    borderWidth: 1,
    maxWidth: '50%',
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  lookbookActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  openInStudioBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  openInStudioText: {
    color: Colors.textPrimary,
    fontSize: 11.5,
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
  wearLogRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  wearLogTrash: {
    padding: 2,
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
