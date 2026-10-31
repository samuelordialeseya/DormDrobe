import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useWardrobe } from '../context/WardrobeContext';
import OutfitSwiperRow from '../components/OutfitSwiperRow';
import OutfitTierSeparator from '../components/OutfitTierSeparator';
import WearWizardFlow from '../components/WearWizardFlow';
import { useRewearPrompt } from '../components/RewearPromptModal';
import PressableScale from '../components/PressableScale';
import FadeSlideIn from '../components/FadeSlideIn';
import LiquidGlassLocationSwitch from '../components/LiquidGlassLocationSwitch';
import {
  SavedOutfit,
  ClothingItem,
  isDirtyStatus,
  isSockItem,
  isUndergarmentItem,
  isIntimatesItem,
} from '../types/wardrobe';
import IntimatesMockupBadge from '../components/IntimatesMockupBadge';
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
  ChevronRight,
} from '../components/AppIcons';

type TabType = 'dress_me' | 'lookbook' | 'wear_log';
type DressMeMode = 'choose' | 'guided' | 'fit_gen';
type LayoutRowsType = 2 | 3 | 4 | 5 | 6;

const TAG_PRESETS = ['Campus', 'Uniform', 'Casual', 'Friday', 'Rainy Day', 'Library'];

function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return 'Never worn';
  const then = new Date(isoString).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Worn today';
  if (diffDays === 1) return 'Worn yesterday';
  if (diffDays < 7) return `Worn ${diffDays}d ago`;
  if (diffDays < 30) return `Worn ${Math.floor(diffDays / 7)}w ago`;
  return `Worn ${new Date(isoString).toLocaleDateString()}`;
}

export default function FitGeneratorScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    items,
    currentLocation,
    setCurrentLocation,
    isWearWizardSession,
    setIsWearWizardSession,
    savedOutfits,
    wearHistory,
    addSavedOutfit,
    deleteSavedOutfit,
    logOutfitWorn,
    deleteWearLog,
    showToast,
    getLocationLabel,
  } = useWardrobe();
  const { requestWear, rewearModal } = useRewearPrompt();

  // Top sub-tabs: Dress Me, Lookbook, Wear Log
  const [activeTab, setActiveTab] = useState<TabType>('dress_me');

  // Dress Me mode: 'choose' (only 2 buttons) | 'guided' (iPhone setup wizard) | 'fit_gen' (classic UI)
  const [dressMeMode, setDressMeMode] = useState<DressMeMode>('choose');

  // Loaded outfit from Lookbook for Guided Fit review
  const [loadedOutfit, setLoadedOutfit] = useState<SavedOutfit | null>(null);

  // ── Classic Fit Gen States ────────────────────────────────────────────
  const [layoutRows, setLayoutRows] = useState<LayoutRowsType>(3);
  const [cleanOnly, setCleanOnly] = useState(true);
  const [uniformOnly, setUniformOnly] = useState(false);

  // Save outfit modal state for classic Fit Gen
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [outfitNameInput, setOutfitNameInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Campus']);

  // Row selection indices (Tops, Bottoms, Shoes, Acc, Socks, Undergarments)
  const [topIdx, setTopIdx] = useState(0);
  const [bottomIdx, setBottomIdx] = useState(0);
  const [shoesIdx, setShoesIdx] = useState(0);
  const [accIdx, setAccIdx] = useState(0);
  const [sockIdx, setSockIdx] = useState(0);
  const [undIdx, setUndIdx] = useState(0);

  // Row lock states (pin on garment)
  const [lockTop, setLockTop] = useState(false);
  const [lockBottom, setLockBottom] = useState(false);
  const [lockShoes, setLockShoes] = useState(false);
  const [lockAcc, setLockAcc] = useState(false);
  const [lockSock, setLockSock] = useState(false);
  const [lockUnd, setLockUnd] = useState(false);

  // Programmatic scroll refs
  const topListRef = useRef<any>(null);
  const bottomListRef = useRef<any>(null);
  const shoesListRef = useRef<any>(null);
  const accListRef = useRef<any>(null);
  const sockListRef = useRef<any>(null);
  const undListRef = useRef<any>(null);

  // Kinetic dice rotation animation
  const diceRotateAnim = useRef(new Animated.Value(0)).current;

  // Filter items for each row in classic Fit Gen
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

  const socks = useMemo(() => {
    return items.filter((i) => {
      if (i.location !== currentLocation) return false;
      if (cleanOnly && isDirtyStatus(i.status)) return false;
      return isSockItem(i);
    });
  }, [items, currentLocation, cleanOnly]);

  const undergarments = useMemo(() => {
    return items.filter((i) => {
      if (i.location !== currentLocation) return false;
      if (cleanOnly && isDirtyStatus(i.status)) return false;
      return isUndergarmentItem(i);
    });
  }, [items, currentLocation, cleanOnly]);

  // Clamp indices
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

  useEffect(() => {
    if (socks.length > 0 && sockIdx >= socks.length) setSockIdx(Math.max(0, socks.length - 1));
  }, [socks.length, sockIdx]);

  useEffect(() => {
    if (undergarments.length > 0 && undIdx >= undergarments.length) setUndIdx(Math.max(0, undergarments.length - 1));
  }, [undergarments.length, undIdx]);

  // Handle Home quick action navigation
  useEffect(() => {
    if (route.params?.startWizard) {
      setActiveTab('dress_me');
      setDressMeMode('guided');
      setIsWearWizardSession(true);
      navigation.setParams({ startWizard: undefined });
    }
  }, [route.params?.startWizard, navigation, setIsWearWizardSession]);

  // Mode select handlers
  const handleSelectGuidedFit = () => {
    setDressMeMode('guided');
    setIsWearWizardSession(true);
  };

  const handleSelectFitGen = () => {
    setIsWearWizardSession(false);
    setDressMeMode('fit_gen');
  };

  const handleExitGuidedFit = () => {
    setIsWearWizardSession(false);
    setDressMeMode('choose');
  };

  // Shuffle for classic Fit Gen
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
    if (!lockAcc && accessories.length > 1 && layoutRows >= 4) {
      let next = Math.floor(Math.random() * accessories.length);
      if (next === accIdx && accessories.length > 1) next = (next + 1) % accessories.length;
      setAccIdx(next);
    }
    if (!lockSock && socks.length > 1 && layoutRows >= 5) {
      let next = Math.floor(Math.random() * socks.length);
      if (next === sockIdx && socks.length > 1) next = (next + 1) % socks.length;
      setSockIdx(next);
    }
    if (!lockUnd && undergarments.length > 1 && layoutRows >= 6) {
      let next = Math.floor(Math.random() * undergarments.length);
      if (next === undIdx && undergarments.length > 1) next = (next + 1) % undergarments.length;
      setUndIdx(next);
    }
  };

  const handleReset = () => {
    setTopIdx(0);
    setBottomIdx(0);
    setShoesIdx(0);
    setAccIdx(0);
    setSockIdx(0);
    setUndIdx(0);
    setLockTop(false);
    setLockBottom(false);
    setLockShoes(false);
    setLockAcc(false);
    setLockSock(false);
    setLockUnd(false);
  };

  const isAnyRowPinned = lockTop || lockBottom || lockShoes || lockAcc || lockSock || lockUnd;
  const isAnyRowOffset =
    topIdx > 0 || bottomIdx > 0 || shoesIdx > 0 || accIdx > 0 || sockIdx > 0 || undIdx > 0;
  const showResetBtn = isAnyRowPinned || isAnyRowOffset;

  const currentSelection = useMemo(() => {
    const top = tops[topIdx] ?? tops[0] ?? null;
    const bottom = bottoms[bottomIdx] ?? bottoms[0] ?? null;
    const shoe = layoutRows >= 3 ? (shoes[shoesIdx] ?? shoes[0] ?? null) : null;
    const acc = layoutRows >= 4 ? (accessories[accIdx] ?? accessories[0] ?? null) : null;
    const sock = layoutRows >= 5 ? (socks[sockIdx] ?? socks[0] ?? null) : null;
    const und = layoutRows >= 6 ? (undergarments[undIdx] ?? undergarments[0] ?? null) : null;
    return { top, bottom, shoe, acc, sock, und };
  }, [
    tops,
    topIdx,
    bottoms,
    bottomIdx,
    shoes,
    shoesIdx,
    accessories,
    accIdx,
    socks,
    sockIdx,
    undergarments,
    undIdx,
    layoutRows,
  ]);

  const handleWearToday = () => {
    const picked = [
      currentSelection.top,
      currentSelection.bottom,
      currentSelection.shoe,
      currentSelection.acc,
      currentSelection.sock,
      currentSelection.und,
    ].filter(Boolean) as ClothingItem[];
    const itemIds = picked.map((it) => it.id);

    if (itemIds.length === 0) {
      showToast({ message: 'No items selected to wear', type: 'warning' });
      return;
    }
    // All clean → logs straight away. Any already-worn piece → asks first.
    requestWear({
      items: picked,
      onConfirm: () => logOutfitWorn(itemIds, 'Fit Gen Roll'),
    });
  };

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
      socksId: currentSelection.sock?.id ?? null,
      underwearId: currentSelection.und?.id ?? null,
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

  const handleOpenInWizard = (outfit: SavedOutfit) => {
    setLoadedOutfit(outfit);
    setActiveTab('dress_me');
    setDressMeMode('guided');
    setIsWearWizardSession(true);
    showToast({ message: `Loaded "${outfit.name}" into Guided Fit`, type: 'info' });
  };

  const handleClearInitialOutfit = useCallback(() => {
    setLoadedOutfit(null);
  }, []);

  const rowHeights = useMemo(() => {
    if (layoutRows === 2) return { top: 220, bottom: 230, shoes: 0, acc: 0, socks: 0, und: 0 };
    if (layoutRows === 3) return { top: 165, bottom: 185, shoes: 115, acc: 0, socks: 0, und: 0 };
    if (layoutRows === 4) return { top: 135, bottom: 145, shoes: 100, acc: 100, socks: 0, und: 0 };
    if (layoutRows === 5) return { top: 120, bottom: 130, shoes: 95, acc: 95, socks: 95, und: 0 };
    return { top: 110, bottom: 120, shoes: 90, acc: 90, socks: 90, und: 90 };
  }, [layoutRows]);

  const diceSpin = diceRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getOutfitAvailability = (outfit: SavedOutfit) => {
    const outfitItemIds = [
      outfit.topId,
      outfit.bottomId,
      outfit.outerwearId,
      outfit.shoesId,
      outfit.accessoriesId,
      outfit.socksId,
      outfit.underwearId,
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
      return { status: 'worn', label: 'Piece Worn / Re-wearable', color: Colors.statusWorn };
    }
    return {
      status: 'ready',
      label: `Ready at ${getLocationLabel(currentLocation)}`,
      color: Colors.statusClean,
    };
  };

  const place = getLocationLabel(currentLocation);

  // If in Guided Fit mode, render full-screen pure white wizard directly
  if (activeTab === 'dress_me' && dressMeMode === 'guided') {
    return (
      <WearWizardFlow
        initialOutfit={loadedOutfit}
        onClearInitialOutfit={handleClearInitialOutfit}
        onExit={handleExitGuidedFit}
        onCompleteLog={() => setDressMeMode('choose')}
        onAddClothes={() =>
          navigation.navigate('Add', { editItem: undefined, returnTo: 'FitGen' })
        }
      />
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Top Header & Sub-Tabs */}
        <FadeSlideIn delay={0} fromY={-8}>
          <View style={styles.topHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.screenTitle}>Outfits</Text>
              <Text style={styles.screenSubtitle}>Ready to wear at {place}</Text>
            </View>
            <LiquidGlassLocationSwitch
              currentLocation={currentLocation}
              onChange={setCurrentLocation}
            />
          </View>
        </FadeSlideIn>

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
                Get Dressed
              </Text>
              {activeTab === 'dress_me' && <View style={styles.activeTabIndicator} />}
            </PressableScale>

            <PressableScale
              onPress={() => {
                setIsWearWizardSession(false);
                setActiveTab('lookbook');
              }}
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
              onPress={() => {
                setIsWearWizardSession(false);
                setActiveTab('wear_log');
              }}
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

        {/* ─── TAB 1: GET DRESSED ─────────────────────────────────────── */}
        {activeTab === 'dress_me' && (
          <View style={{ flex: 1 }}>
            {/* MODE 1: CHOOSE (ONLY TWO BUTTONS) */}
            {dressMeMode === 'choose' && (
              <View style={styles.twoButtonsCenterContainer}>
                <FadeSlideIn delay={40} fromY={12} style={styles.twoButtonsFadeWrap}>
                  <View style={styles.twoButtonsWrapper}>
                    {/* BUTTON 1: Guided Fit (Setup Wizard Style) */}
                    <PressableScale
                      onPress={handleSelectGuidedFit}
                      scaleTo={0.97}
                      style={styles.modeChooserTouch}
                    >
                      <View style={styles.modeChooserCard}>
                        <View style={styles.modeIconCirclePrimary}>
                          <Sparkles size={26} color="#FFFFFF" />
                        </View>
                        <View style={styles.modeTextContainer}>
                          <Text style={styles.modeCardTitle}>Guided Fit</Text>
                          <Text style={styles.modeCardSubtitle}>
                            Step-by-step setup wizard
                          </Text>
                        </View>
                        <ChevronRight size={18} color={Colors.textTertiary} strokeWidth={2.4} />
                      </View>
                    </PressableScale>

                    {/* BUTTON 2: Fit Gen (Classic Swiper Style) */}
                    <PressableScale
                      onPress={handleSelectFitGen}
                      scaleTo={0.97}
                      style={styles.modeChooserTouch}
                    >
                      <View style={styles.modeChooserCard}>
                        <View style={styles.modeIconCircleSecondary}>
                          <Dice size={24} color={Colors.textPrimary} weight="bold" />
                        </View>
                        <View style={styles.modeTextContainer}>
                          <Text style={styles.modeCardTitle}>Fit Gen</Text>
                          <Text style={styles.modeCardSubtitle}>
                            Roll & swipe combinations
                          </Text>
                        </View>
                        <ChevronRight size={18} color={Colors.textTertiary} strokeWidth={2.4} />
                      </View>
                    </PressableScale>
                  </View>
                </FadeSlideIn>
              </View>
            )}

            {/* MODE 2: CLASSIC FIT GEN UI */}
            {dressMeMode === 'fit_gen' && (
              <View style={{ flex: 1 }}>
                {items.length === 0 ? (
                  <View style={styles.emptyStudioState}>
                    <View style={styles.emptyStudioIconWrap}>
                      <Shirt size={44} color={Colors.accent} strokeWidth={1.8} />
                    </View>
                    <Text style={styles.emptyStudioTitle}>Closet is Empty</Text>
                    <Text style={styles.emptyStudioSub}>
                      Add clothes to your closet first to start rolling outfits.
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Scannable Studio Toolbar with Back-to-Modes button */}
                    <FadeSlideIn delay={40} fromY={6}>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.studioToolbar}
                      >
                        <TouchableOpacity
                          onPress={() => setDressMeMode('choose')}
                          activeOpacity={0.8}
                          style={styles.backToModesBtn}
                        >
                          <Text style={styles.backToModesBtnText}>← Modes</Text>
                        </TouchableOpacity>

                        {/* Layer Count Segmented Pills */}
                        <View style={styles.layerPillWrap}>
                          {([2, 3, 4, 5, 6] as LayoutRowsType[]).map((r) => {
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
                              {
                                backgroundColor: cleanOnly
                                  ? Colors.statusClean
                                  : Colors.textTertiary,
                              },
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
                      </ScrollView>
                    </FadeSlideIn>

                    {/* Multi-Row Swiper Canvas */}
                    <ScrollView
                      style={styles.canvasScroll}
                      contentContainerStyle={[
                        styles.canvasContent,
                        { paddingBottom: insets.bottom + 170 },
                      ]}
                      showsVerticalScrollIndicator={false}
                      bounces={false}
                    >
                      <OutfitTierSeparator
                        category="tops"
                        label="TOPS & OUTERWEAR"
                        activeItem={currentSelection.top}
                        isLocked={lockTop}
                        itemCount={tops.length}
                        currentIndex={tops.length > 0 ? topIdx + 1 : 0}
                      />
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

                      <OutfitTierSeparator
                        category="bottoms"
                        label="BOTTOMS"
                        activeItem={currentSelection.bottom}
                        isLocked={lockBottom}
                        itemCount={bottoms.length}
                        currentIndex={bottoms.length > 0 ? bottomIdx + 1 : 0}
                      />
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
                        </>
                      )}

                      {layoutRows >= 4 && (
                        <>
                          <OutfitTierSeparator
                            category="accessories"
                            label="ACCESSORIES"
                            activeItem={currentSelection.acc}
                            isLocked={lockAcc}
                            itemCount={accessories.length}
                            currentIndex={accessories.length > 0 ? accIdx + 1 : 0}
                          />
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
                        </>
                      )}

                      {layoutRows >= 5 && (
                        <>
                          <OutfitTierSeparator
                            category="socks"
                            label="SOCKS"
                            activeItem={currentSelection.sock}
                            isLocked={lockSock}
                            itemCount={socks.length}
                            currentIndex={socks.length > 0 ? sockIdx + 1 : 0}
                          />
                          <OutfitSwiperRow
                            items={socks}
                            selectedIndex={sockIdx}
                            onSelectIndex={setSockIdx}
                            isLocked={lockSock}
                            onToggleLock={() => setLockSock(!lockSock)}
                            rowHeight={rowHeights.socks}
                            scrollRef={sockListRef}
                            category="socks"
                            emptyLabel="No socks here"
                          />
                        </>
                      )}

                      {layoutRows >= 6 && (
                        <>
                          <OutfitTierSeparator
                            category="underwear"
                            label="UNDERGARMENTS"
                            activeItem={currentSelection.und}
                            isLocked={lockUnd}
                            itemCount={undergarments.length}
                            currentIndex={undergarments.length > 0 ? undIdx + 1 : 0}
                          />
                          <OutfitSwiperRow
                            items={undergarments}
                            selectedIndex={undIdx}
                            onSelectIndex={setUndIdx}
                            isLocked={lockUnd}
                            onToggleLock={() => setLockUnd(!lockUnd)}
                            rowHeight={rowHeights.und}
                            scrollRef={undListRef}
                            category="underwear"
                            emptyLabel="No undergarments here"
                          />
                        </>
                      )}
                    </ScrollView>

                    {/* Floating Bottom Dock */}
                    <View
                      pointerEvents="box-none"
                      style={[styles.dockWrapper, { bottom: insets.bottom + 88 }]}
                    >
                      <View style={styles.floatingDock}>
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

                        <PressableScale
                          onPress={handleOpenSaveModal}
                          scaleTo={0.94}
                          style={styles.dockSaveBtn}
                        >
                          <Bookmark size={14} color={Colors.textPrimary} />
                          <Text style={styles.dockSaveText}>Save</Text>
                        </PressableScale>

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
          </View>
        )}

        {/* ─── TAB 2: LOOKBOOK ────────────────────────────────────────── */}
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
                  Roll in Fit Gen or complete Guided Fit and save your favorites to bookmark them.
                </Text>
              </View>
            ) : (
              savedOutfits.map((outfit) => {
                const avail = getOutfitAvailability(outfit);
                const top = items.find((i) => i.id === outfit.topId);
                const outerwear = items.find((i) => i.id === outfit.outerwearId);
                const bottom = items.find((i) => i.id === outfit.bottomId);
                const shoe = items.find((i) => i.id === outfit.shoesId);
                const acc = items.find((i) => i.id === outfit.accessoriesId);
                const sock = items.find((i) => i.id === outfit.socksId);
                const und = items.find((i) => i.id === outfit.underwearId);

                return (
                  <View key={outfit.id} style={styles.lookbookCard}>
                    <View style={styles.specular} />

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

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.collageRow}
                    >
                      {[top, outerwear, bottom, shoe, acc, sock, und].filter(Boolean).map((piece, idx) => (
                        <View key={piece?.id ?? idx} style={styles.collageThumb}>
                          {piece && isIntimatesItem(piece) ? (
                            <IntimatesMockupBadge item={piece} variant="thumb" size={56} />
                          ) : piece?.imageUrl ? (
                            <Image
                              source={{ uri: piece.imageUrl }}
                              style={styles.collageImage}
                              resizeMode="contain"
                            />
                          ) : (
                            <CategoryIcon
                              category={piece ? (isSockItem(piece) ? 'socks' : piece.category) : 'tops'}
                              size={22}
                              color={Colors.textSecondary}
                            />
                          )}
                        </View>
                      ))}
                    </ScrollView>

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
                          onPress={() => handleOpenInWizard(outfit)}
                          style={styles.openInStudioBtn}
                        >
                          <Text style={styles.openInStudioText}>Review / Swap</Text>
                        </PressableScale>

                        <PressableScale
                          scaleTo={0.94}
                          onPress={() => {
                            const ids = [
                              outfit.topId,
                              outfit.outerwearId,
                              outfit.bottomId,
                              outfit.shoesId,
                              outfit.accessoriesId,
                              outfit.socksId,
                              outfit.underwearId,
                            ].filter(Boolean) as string[];
                            const pieces = ids
                              .map((id) => items.find((i) => i.id === id))
                              .filter(Boolean) as ClothingItem[];
                            // Clean outfit → logs straight away. Worn pieces → asks first.
                            requestWear({
                              items: pieces,
                              onConfirm: () => logOutfitWorn(ids, outfit.name, outfit.id),
                            });
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

        {/* ─── TAB 3: WEAR LOG ────────────────────────────────────────── */}
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
                  When you wear outfits, they will appear here chronologically.
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

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.wearLogThumbsRow}
                    >
                      {wornPieces.map((p) => (
                        <View key={p?.id} style={styles.wearLogThumb}>
                          {p && isIntimatesItem(p) ? (
                            <IntimatesMockupBadge item={p} variant="thumb" size={44} />
                          ) : p?.imageUrl ? (
                            <Image
                              source={{ uri: p.imageUrl }}
                              style={{ width: 44, height: 44 }}
                              resizeMode="contain"
                            />
                          ) : (
                            <CategoryIcon
                              category={p ? (isSockItem(p) ? 'socks' : p.category) : 'tops'}
                              size={20}
                              color={Colors.textSecondary}
                            />
                          )}
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Save to Lookbook Modal for Classic Fit Gen */}
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
      {rewearModal}
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
    paddingHorizontal: 24,
    paddingTop: 16,
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
    paddingHorizontal: 24,
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

  // ── Mode Chooser (Only Two Buttons) ──
  twoButtonsCenterContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  twoButtonsFadeWrap: {
    width: '100%',
    alignItems: 'center',
  },
  twoButtonsWrapper: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    gap: 16,
  },
  modeChooserTouch: {
    width: '100%',
  },
  modeChooserCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(20, 20, 19, 0.08)',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  modeIconCirclePrimary: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modeIconCircleSecondary: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(20, 20, 19, 0.08)',
  },
  modeTextContainer: {
    flex: 1,
    minWidth: 140,
  },
  modeCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  modeCardSubtitle: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // ── Classic Fit Gen Styles ──
  studioToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    gap: 8,
  },
  backToModesBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: Colors.bgSubtle,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  backToModesBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.textPrimary,
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

  // ── Lookbook Styles ──
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
    top: 0,
    left: 0,
    right: 0,
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
    maxWidth: '48%',
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

  // ── Wear Log Styles ──
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

  // ── Modal Styles ──
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
