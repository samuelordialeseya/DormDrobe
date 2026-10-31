import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWardrobe } from '../context/WardrobeContext';
import {
  ClothingItem,
  SavedOutfit,
  WizardSlot,
  WIZARD_SLOTS,
  DEFAULT_ESSENTIAL_SLOTS,
  doesItemMatchWizardSlot,
  isDirtyStatus,
  isIntimatesItem,
  getWornCount,
  formatStatusLabel,
  COLOR_SWATCHES,
} from '../types/wardrobe';
import IntimatesMockupBadge from './IntimatesMockupBadge';
import PressableScale from './PressableScale';
import { useRewearPrompt } from './RewearPromptModal';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';
import {
  CategoryIcon,
  Check,
  ChevronRight,
  Dice,
  RotateCcw,
  Shirt,
  Sparkles,
  X,
  AlertTriangle,
  Bookmark,
  Plus,
  ArrowLeft,
} from './AppIcons';

type WizardPhase = 'categories' | 'pick_item' | 'recap';

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

function getSwatchHex(colorName: string): string {
  const found = COLOR_SWATCHES.find(
    (s) => s.name.toLowerCase() === colorName.trim().toLowerCase(),
  );
  return found ? found.hex : '#8E8E93';
}

export interface WearWizardFlowProps {
  initialOutfit?: SavedOutfit | null;
  onClearInitialOutfit?: () => void;
  onExit: () => void;
  onCompleteLog?: () => void;
  onAddClothes?: () => void;
}

export default function WearWizardFlow({
  initialOutfit,
  onClearInitialOutfit,
  onExit,
  onCompleteLog,
  onAddClothes,
}: WearWizardFlowProps) {
  const insets = useSafeAreaInsets();
  const {
    items,
    currentLocation,
    savedOutfits,
    addSavedOutfit,
    logOutfitWorn,
    showToast,
    getLocationLabel,
  } = useWardrobe();

  const place = getLocationLabel(currentLocation);
  const { requestWear, rewearModal } = useRewearPrompt();

  // Worn pieces the user already said "yes, wear it again" to during this session,
  // so the final "Wear Today" step doesn't ask twice about the same piece.
  const [confirmedWornIds, setConfirmedWornIds] = useState<Set<string>>(() => new Set());

  // Items currently at this location
  const hereItems = useMemo(
    () => items.filter((i) => i.location === currentLocation),
    [items, currentLocation],
  );

  const computeDefaultSlots = useCallback((): WizardSlot[] => {
    const availableEssentials = DEFAULT_ESSENTIAL_SLOTS.filter((slot) =>
      hereItems.some((it) => doesItemMatchWizardSlot(it, slot)),
    );
    if (availableEssentials.length > 0) return availableEssentials;

    const anyAvailable = WIZARD_SLOTS.filter((meta) =>
      hereItems.some((it) => doesItemMatchWizardSlot(it, meta.slot)),
    ).map((m) => m.slot);

    return anyAvailable.length > 0 ? anyAvailable.slice(0, 2) : [...DEFAULT_ESSENTIAL_SLOTS];
  }, [hereItems]);

  // Wizard state
  const [phase, setPhase] = useState<WizardPhase>('categories');
  const [selectedSlots, setSelectedSlots] = useState<WizardSlot[]>(() => computeDefaultSlots());
  const [activeSlotIdx, setActiveSlotIdx] = useState<number>(0);
  const [returnToRecap, setReturnToRecap] = useState<boolean>(false);

  // Map of WizardSlot -> selected item ID
  const [selections, setSelections] = useState<Partial<Record<WizardSlot, string>>>({});

  // Filter states
  const [cleanOnly, setCleanOnly] = useState<boolean>(true);
  const [uniformOnly, setUniformOnly] = useState<boolean>(false);

  // Recap states
  const [outfitName, setOutfitName] = useState<string>('');
  const [saveToLookbook, setSaveToLookbook] = useState<boolean>(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Campus']);
  const [loadedOutfitId, setLoadedOutfitId] = useState<string | undefined>(undefined);

  // Kinetic dice animation
  const diceAnim = useRef(new Animated.Value(0)).current;
  const diceSpin = diceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Ordered slots
  const orderedSelectedSlots = useMemo(() => {
    return WIZARD_SLOTS.map((m) => m.slot).filter((s) => selectedSlots.includes(s));
  }, [selectedSlots]);

  // ── Two-Beat iOS Reveal Animation Engine ──────────────────────────────
  // Beat 1: Slow fade-in of centered question text
  // Beat 2: Smooth upward glide of text as content & bottom continue button fade in
  const stepKey = `${phase}-${activeSlotIdx}-${returnToRecap}`;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(72)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(20)).current;
  const navOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset values for initial pure white slate
    textOpacity.setValue(0);
    textTranslateY.setValue(68);
    contentOpacity.setValue(0);
    contentTranslateY.setValue(22);
    navOpacity.setValue(0);

    // Beat 1: Slow, elegant text fade-in like Apple iPhone Setup
    const beat1 = Animated.timing(textOpacity, {
      toValue: 1,
      duration: 720,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    // Beat 2: Title glides smoothly to top position while options materialize
    const beat2 = Animated.parallel([
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 520,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 480,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
      Animated.timing(navOpacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
    ]);

    const sequence = Animated.sequence([beat1, beat2]);
    sequence.start();

    return () => {
      sequence.stop();
    };
  }, [stepKey]);

  // Load `initialOutfit` from Lookbook if supplied
  useEffect(() => {
    if (!initialOutfit) return;

    const nextSlots: WizardSlot[] = [];
    const nextSelections: Partial<Record<WizardSlot, string>> = {};

    const tryAssign = (slot: WizardSlot, id?: string | null) => {
      if (!id) return;
      const exists = items.find((i) => i.id === id);
      if (exists) {
        nextSlots.push(slot);
        nextSelections[slot] = exists.id;
      }
    };

    tryAssign('tops', initialOutfit.topId);
    tryAssign('bottoms', initialOutfit.bottomId);
    tryAssign('outerwear', initialOutfit.outerwearId);
    tryAssign('footwear', initialOutfit.shoesId);
    tryAssign('underwear', initialOutfit.underwearId);
    tryAssign('socks', initialOutfit.socksId);
    tryAssign('accessories', initialOutfit.accessoriesId);

    if (nextSlots.length > 0) {
      setSelectedSlots(nextSlots);
      setSelections(nextSelections);
      setOutfitName(initialOutfit.name);
      setLoadedOutfitId(initialOutfit.id);
      setSaveToLookbook(false);
      setReturnToRecap(false);
      setPhase('recap');
    }
    onClearInitialOutfit?.();
  }, [initialOutfit, items, onClearInitialOutfit]);

  // Slot Availability Stats
  const slotStats = useMemo(() => {
    const map: Record<
      WizardSlot,
      { total: number; clean: number; worn: number; laundry: number }
    > = {
      tops: { total: 0, clean: 0, worn: 0, laundry: 0 },
      bottoms: { total: 0, clean: 0, worn: 0, laundry: 0 },
      underwear: { total: 0, clean: 0, worn: 0, laundry: 0 },
      outerwear: { total: 0, clean: 0, worn: 0, laundry: 0 },
      footwear: { total: 0, clean: 0, worn: 0, laundry: 0 },
      socks: { total: 0, clean: 0, worn: 0, laundry: 0 },
      accessories: { total: 0, clean: 0, worn: 0, laundry: 0 },
    };

    WIZARD_SLOTS.forEach(({ slot }) => {
      const matching = hereItems.filter((it) => doesItemMatchWizardSlot(it, slot));
      const clean = matching.filter((it) => it.status === 'clean').length;
      const worn = matching.filter((it) => it.status === 'worn').length;
      const laundry = matching.filter(
        (it) => it.status === 'in_laundry' || it.status === 'drying',
      ).length;
      map[slot] = { total: matching.length, clean, worn, laundry };
    });

    return map;
  }, [hereItems]);

  // Step 1 Category toggle
  const toggleSlot = (slot: WizardSlot) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot],
    );
  };

  const handleStartPicking = () => {
    if (orderedSelectedSlots.length === 0) {
      showToast({ message: 'Select at least one category to wear', type: 'warning' });
      return;
    }

    const nextSelections: Partial<Record<WizardSlot, string>> = { ...selections };
    orderedSelectedSlots.forEach((slot) => {
      const currentId = nextSelections[slot];
      const stillValid =
        currentId &&
        hereItems.some((it) => it.id === currentId && doesItemMatchWizardSlot(it, slot));
      if (!stillValid) {
        // Only ever pre-pick a clean piece. A worn piece must be chosen (and confirmed) by the user.
        const cleanCandidate = hereItems.find(
          (it) => doesItemMatchWizardSlot(it, slot) && !isDirtyStatus(it.status),
        );
        if (cleanCandidate) {
          nextSelections[slot] = cleanCandidate.id;
        }
      }
    });

    setSelections(nextSelections);
    setActiveSlotIdx(0);
    setReturnToRecap(false);
    setPhase('pick_item');
  };

  // Step 2..N Item Picker Helpers
  const currentSlot: WizardSlot =
    orderedSelectedSlots[activeSlotIdx] ?? orderedSelectedSlots[0] ?? 'tops';
  const currentSlotMeta = useMemo(
    () => WIZARD_SLOTS.find((m) => m.slot === currentSlot) ?? WIZARD_SLOTS[0],
    [currentSlot],
  );

  const slotAllWearableItems = useMemo(() => {
    return hereItems.filter(
      (it) =>
        doesItemMatchWizardSlot(it, currentSlot) &&
        (it.status === 'clean' || it.status === 'worn'),
    );
  }, [hereItems, currentSlot]);

  const slotFilteredItems = useMemo(() => {
    return slotAllWearableItems
      .filter((it) => {
        if (cleanOnly && isDirtyStatus(it.status)) return false;
        if (currentSlot === 'tops' && uniformOnly && !it.isUniformWhiteTee) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'clean' ? -1 : 1;
        return 0;
      });
  }, [slotAllWearableItems, cleanOnly, currentSlot, uniformOnly]);

  const selectedItemForCurrentSlot = useMemo(() => {
    const id = selections[currentSlot];
    if (!id) return null;
    return items.find((i) => i.id === id) ?? null;
  }, [selections, currentSlot, items]);

  const finishSelectingItem = (item: ClothingItem) => {
    setSelections((prev) => ({ ...prev, [currentSlot]: item.id }));
    if (returnToRecap) {
      setReturnToRecap(false);
      setPhase('recap');
    }
  };

  // Removes pieces from the outfit (and from the "confirmed" list) after they went to laundry
  const dropPieces = (ids: string[]) => {
    const gone = new Set(ids);
    setSelections((prev) => {
      const next = { ...prev };
      (Object.keys(next) as WizardSlot[]).forEach((slot) => {
        if (next[slot] && gone.has(next[slot] as string)) delete next[slot];
      });
      return next;
    });
    setConfirmedWornIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  };

  const handleSelectItemForSlot = (item: ClothingItem) => {
    // Clean pieces select straight away. Worn pieces ask "are you sure?" first.
    const alreadyChosen = selections[currentSlot] === item.id;
    if (item.status === 'worn' && !alreadyChosen && !confirmedWornIds.has(item.id)) {
      requestWear({
        items: [item],
        onConfirm: () => {
          setConfirmedWornIds((prev) => new Set(prev).add(item.id));
          finishSelectingItem(item);
        },
        onSentToLaundry: dropPieces,
      });
      return;
    }
    finishSelectingItem(item);
  };

  const handleSurpriseMe = () => {
    const pool = slotFilteredItems.length > 0 ? slotFilteredItems : slotAllWearableItems;
    if (pool.length === 0) {
      showToast({ message: `No ${currentSlotMeta.label.toLowerCase()} available here`, type: 'info' });
      return;
    }

    if (slotFilteredItems.length === 0 && slotAllWearableItems.length > 0) {
      setCleanOnly(false);
    }

    diceAnim.setValue(0);
    Animated.spring(diceAnim, {
      toValue: 1,
      tension: 200,
      friction: 12,
      useNativeDriver: true,
    }).start();

    const currentId = selections[currentSlot];
    let candidates = pool.filter((i) => i.id !== currentId);
    if (candidates.length === 0) candidates = pool;
    const randomPick = candidates[Math.floor(Math.random() * candidates.length)];
    if (randomPick) {
      setSelections((prev) => ({ ...prev, [currentSlot]: randomPick.id }));
    }
  };

  const handleNextStepFromPicker = () => {
    if (returnToRecap) {
      setReturnToRecap(false);
      setPhase('recap');
      return;
    }

    if (activeSlotIdx < orderedSelectedSlots.length - 1) {
      setActiveSlotIdx(activeSlotIdx + 1);
    } else {
      setPhase('recap');
    }
  };

  const handleSkipCurrentSlot = () => {
    setSelections((prev) => {
      const next = { ...prev };
      delete next[currentSlot];
      return next;
    });

    if (returnToRecap) {
      setReturnToRecap(false);
      setPhase('recap');
      return;
    }

    if (activeSlotIdx < orderedSelectedSlots.length - 1) {
      setActiveSlotIdx(activeSlotIdx + 1);
    } else {
      setPhase('recap');
    }
  };

  const handleBack = () => {
    if (phase === 'recap') {
      setActiveSlotIdx(Math.max(0, orderedSelectedSlots.length - 1));
      setPhase('pick_item');
      return;
    }
    if (phase === 'pick_item') {
      if (returnToRecap) {
        setReturnToRecap(false);
        setPhase('recap');
        return;
      }
      if (activeSlotIdx > 0) {
        setActiveSlotIdx(activeSlotIdx - 1);
      } else {
        setPhase('categories');
      }
      return;
    }
    onExit();
  };

  // Recap Helpers
  const recapEntries = useMemo(() => {
    return orderedSelectedSlots
      .map((slot) => {
        const meta = WIZARD_SLOTS.find((m) => m.slot === slot)!;
        const itemId = selections[slot];
        const item = itemId ? items.find((i) => i.id === itemId) ?? null : null;
        return { slot, meta, item };
      })
      .filter((entry): entry is { slot: WizardSlot; meta: (typeof WIZARD_SLOTS)[number]; item: ClothingItem } =>
        Boolean(entry.item),
      );
  }, [orderedSelectedSlots, selections, items]);

  const alreadyWornPieces = useMemo(
    () => recapEntries.filter((e) => e.item.status === 'worn').map((e) => e.item),
    [recapEntries],
  );

  const handleSwapPieceFromRecap = (slot: WizardSlot) => {
    const idx = orderedSelectedSlots.indexOf(slot);
    if (idx !== -1) {
      setActiveSlotIdx(idx);
      setReturnToRecap(true);
      setPhase('pick_item');
    } else {
      setSelectedSlots((prev) => [...prev, slot]);
      setReturnToRecap(true);
      setPhase('pick_item');
    }
  };

  const handleRemovePieceFromRecap = (slot: WizardSlot) => {
    setSelections((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleConfirmWearOutfit = () => {
    const itemIds = recapEntries.map((e) => e.item.id);
    if (itemIds.length === 0) {
      showToast({ message: 'Pick at least one clothing item to wear', type: 'warning' });
      return;
    }

    // Safety net: any worn piece that slipped in without a confirmation
    // (Surprise Me, an outfit loaded from the Lookbook, ...) is checked here.
    const unconfirmedWorn = recapEntries
      .map((e) => e.item)
      .filter((it) => it.status === 'worn' && !confirmedWornIds.has(it.id));

    if (unconfirmedWorn.length > 0) {
      requestWear({
        items: unconfirmedWorn,
        onConfirm: () => {
          setConfirmedWornIds((prev) => {
            const next = new Set(prev);
            unconfirmedWorn.forEach((it) => next.add(it.id));
            return next;
          });
          logOutfit(itemIds);
        },
        // Those pieces went to laundry: drop them so the user can review the rest / swap in clean ones
        onSentToLaundry: dropPieces,
      });
      return;
    }

    logOutfit(itemIds);
  };

  const logOutfit = (itemIds: string[]) => {
    const trimmedName = outfitName.trim();
    let finalOutfitId = loadedOutfitId;
    let finalOutfitName = trimmedName || undefined;

    if (saveToLookbook) {
      const topId = selections.tops ?? selections.outerwear ?? itemIds[0];
      const bottomId = selections.bottoms ?? itemIds[1] ?? itemIds[0];
      const newOutfitId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const lookbookName = trimmedName || `Outfit #${savedOutfits.length + 1}`;

      const newOutfit: SavedOutfit = {
        id: newOutfitId,
        name: lookbookName,
        topId,
        bottomId,
        outerwearId: selections.outerwear ?? null,
        shoesId: selections.footwear ?? null,
        accessoriesId: selections.accessories ?? null,
        socksId: selections.socks ?? null,
        underwearId: selections.underwear ?? null,
        tags: selectedTags.length > 0 ? selectedTags : ['Campus'],
        createdAt: new Date().toISOString(),
        lastWornAt: new Date().toISOString(),
      };

      addSavedOutfit(newOutfit);
      finalOutfitId = newOutfitId;
      finalOutfitName = lookbookName;
    }

    logOutfitWorn(itemIds, finalOutfitName || 'Daily Fit', finalOutfitId);
    onCompleteLog?.();
    onExit();
  };

  // Dynamic Prompt Titles for each phase
  const stepTitle =
    phase === 'categories'
      ? 'What will you wear today?'
      : phase === 'pick_item'
      ? `Which ${currentSlotMeta.singularLabel} will you wear?`
      : 'Here is your outfit today.';

  const stepSubtitle =
    phase === 'categories'
      ? `Select the layers you want to put on at ${place}.`
      : phase === 'pick_item'
      ? `Pick a ${currentSlotMeta.singularLabel} from your closet.`
      : `Review your pieces before logging at ${place}.`;

  const topSafePad = Math.max(insets.top, 20);
  const bottomSafePad = Math.max(insets.bottom, 20);

  return (
    <View style={styles.whiteScreenContainer}>
      {/* ─── PURE IPHONE SETUP QUIET TOP CONTROLS ─── */}
      <Animated.View
        style={[
          styles.quietTopBar,
          {
            paddingTop: topSafePad + 4,
            opacity: navOpacity,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.65}
          style={styles.quietTopIconBtn}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <ArrowLeft size={22} color="#141413" strokeWidth={2.4} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onExit}
          activeOpacity={0.65}
          style={styles.quietTopIconBtn}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <X size={18} color="rgba(20, 20, 19, 0.45)" strokeWidth={2.4} />
        </TouchableOpacity>
      </Animated.View>

      {/* ─── TWO-BEAT TITLE REVEAL (Fades in centered, then glides smoothly up) ─── */}
      <Animated.View
        style={[
          styles.animatedTitleHeader,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ]}
      >
        <Text style={styles.appleLargeTitle}>{stepTitle}</Text>
        <Text style={styles.appleSubTitle}>{stepSubtitle}</Text>
      </Animated.View>

      {/* ─── CHOICES & INTERACTIVE BODY (Fades in on Beat 2) ─── */}
      <Animated.View
        style={[
          styles.animatedContentBody,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
          },
        ]}
      >
        {/* STEP 1: CATEGORIES SELECTION */}
        {phase === 'categories' && (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.scrollInner,
              { paddingBottom: bottomSafePad + 88 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.categoryGrid}>
              {WIZARD_SLOTS.map((meta) => {
                const isSelected = selectedSlots.includes(meta.slot);
                const orderIdx = orderedSelectedSlots.indexOf(meta.slot);
                const stats = slotStats[meta.slot];
                const hasClean = stats.clean > 0;
                const isEmptyHere = stats.total === 0;

                return (
                  <PressableScale
                    key={meta.slot}
                    onPress={() => toggleSlot(meta.slot)}
                    scaleTo={0.96}
                    style={styles.catGridCol}
                  >
                    <View
                      style={[
                        styles.catMinimalCard,
                        isSelected && styles.catMinimalCardSelected,
                        isEmptyHere && !isSelected && styles.catMinimalCardMuted,
                      ]}
                    >
                      <View style={styles.catCardTop}>
                        <View
                          style={[
                            styles.catMinimalIconBox,
                            isSelected && styles.catMinimalIconBoxSelected,
                          ]}
                        >
                          <CategoryIcon
                            category={meta.iconCategory}
                            size={20}
                            color={isSelected ? '#FFFFFF' : '#141413'}
                            weight={isSelected ? 'bold' : 'regular'}
                          />
                        </View>

                        <View
                          style={[
                            styles.catOrderPill,
                            isSelected && styles.catOrderPillSelected,
                          ]}
                        >
                          {isSelected ? (
                            <Text style={styles.catOrderPillText}>{orderIdx + 1}</Text>
                          ) : null}
                        </View>
                      </View>

                      <Text style={styles.catTitle} numberOfLines={1}>
                        {meta.label}
                      </Text>
                      <Text style={styles.catDesc} numberOfLines={1}>
                        {meta.shortDesc}
                      </Text>

                      <View style={styles.catStockIndicator}>
                        <View
                          style={[
                            styles.stockDot,
                            {
                              backgroundColor: hasClean
                                ? '#16A34A'
                                : stats.worn > 0
                                ? '#D97706'
                                : '#D1D5DB',
                            },
                          ]}
                        />
                        <Text style={styles.stockLabel} numberOfLines={1}>
                          {isEmptyHere
                            ? '0 pieces'
                            : hasClean
                            ? `${stats.clean} clean`
                            : `${stats.worn} worn`}
                        </Text>
                      </View>
                    </View>
                  </PressableScale>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* STEPS 2..N: ITEM PICKER */}
        {phase === 'pick_item' && (
          <ScrollView
            key={currentSlot}
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.scrollInner,
              { paddingBottom: bottomSafePad + 96 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Minimal Toolbar */}
            <View style={styles.pickerMinimalBar}>
              <TouchableOpacity
                onPress={() => setCleanOnly(!cleanOnly)}
                activeOpacity={0.8}
                style={[styles.minimalFilterChip, cleanOnly && styles.minimalFilterChipActive]}
              >
                <View
                  style={[
                    styles.stockDot,
                    { backgroundColor: cleanOnly ? '#16A34A' : '#D97706' },
                  ]}
                />
                <Text style={styles.minimalFilterChipText}>
                  {cleanOnly ? 'Clean Only' : 'Clean & Worn'}
                </Text>
              </TouchableOpacity>

              {currentSlot === 'tops' && (
                <TouchableOpacity
                  onPress={() => setUniformOnly(!uniformOnly)}
                  activeOpacity={0.8}
                  style={[styles.minimalFilterChip, uniformOnly && styles.minimalFilterChipActive]}
                >
                  <Shirt size={12} color={uniformOnly ? '#141413' : '#6B7280'} />
                  <Text style={styles.minimalFilterChipText}>Uniform</Text>
                </TouchableOpacity>
              )}

              <PressableScale
                onPress={handleSurpriseMe}
                scaleTo={0.93}
                style={styles.appleSurpriseBtn}
              >
                <Animated.View style={{ transform: [{ rotate: diceSpin }] }}>
                  <Dice size={15} color="#141413" weight="bold" />
                </Animated.View>
                <Text style={styles.appleSurpriseBtnText}>Surprise Me</Text>
              </PressableScale>
            </View>

            {/* Garments 2-Column Grid on Pure White */}
            {slotFilteredItems.length === 0 ? (
              <View style={styles.emptySlotCard}>
                <CategoryIcon
                  category={currentSlotMeta.iconCategory}
                  size={38}
                  color="#9CA3AF"
                />
                <Text style={styles.emptySlotTitle}>
                  No {cleanOnly ? 'clean ' : ''}
                  {currentSlotMeta.label.toLowerCase()} here
                </Text>
                <Text style={styles.emptySlotSub}>
                  You can skip this piece or switch to include re-wearable clothes.
                </Text>
                {cleanOnly && (
                  <TouchableOpacity
                    onPress={() => setCleanOnly(false)}
                    style={styles.whiteOutlineBtn}
                  >
                    <Text style={styles.whiteOutlineBtnText}>Show Worn Items</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.garmentGrid}>
                {slotFilteredItems.map((item) => {
                  const isSelected = selections[currentSlot] === item.id;
                  const isWorn = item.status === 'worn';
                  const isIntimate = isIntimatesItem(item);
                  const swatchHex = getSwatchHex(item.color);

                  return (
                    <PressableScale
                      key={item.id}
                      onPress={() => handleSelectItemForSlot(item)}
                      scaleTo={0.96}
                      style={styles.garmentGridCol}
                    >
                      <View
                        style={[
                          styles.garmentMinimalCard,
                          isSelected && styles.garmentMinimalCardSelected,
                        ]}
                      >
                        <View style={styles.garmentCardHeader}>
                          <View
                            style={[
                              styles.statusTinyPill,
                              isWorn ? styles.statusTinyPillWorn : styles.statusTinyPillClean,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusTinyText,
                                { color: isWorn ? '#D97706' : '#16A34A' },
                              ]}
                            >
                              {isWorn ? formatStatusLabel('worn', item.wearCount) : 'Clean'}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.radioCheck,
                              isSelected && styles.radioCheckSelected,
                            ]}
                          >
                            {isSelected && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                          </View>
                        </View>

                        <View style={styles.garmentImageStage}>
                          {isIntimate ? (
                            <IntimatesMockupBadge item={item} variant="thumb" size={78} />
                          ) : item.imageUrl ? (
                            <Image
                              source={{ uri: item.imageUrl }}
                              style={styles.garmentImage}
                              resizeMode="contain"
                            />
                          ) : (
                            <CategoryIcon
                              category={currentSlotMeta.iconCategory}
                              size={34}
                              color="#6B7280"
                            />
                          )}
                        </View>

                        <Text style={styles.garmentName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <View style={styles.garmentMeta}>
                          <View
                            style={[
                              styles.colorDot,
                              { backgroundColor: swatchHex },
                              swatchHex.toLowerCase() === '#ffffff' && styles.whiteDotBorder,
                            ]}
                          />
                          <Text style={styles.garmentMetaText} numberOfLines={1}>
                            {item.color}
                          </Text>
                        </View>
                      </View>
                    </PressableScale>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}

        {/* STEP FINAL: RECAP */}
        {phase === 'recap' && (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.scrollInner,
              { paddingBottom: bottomSafePad + 96 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Clean vs. Already Worn notice */}
            {alreadyWornPieces.length > 0 ? (
              <View style={styles.recapNoticeWorn}>
                <AlertTriangle size={16} color="#D97706" />
                <Text style={styles.recapNoticeWornText}>
                  Includes {alreadyWornPieces.length} re-worn piece
                  {alreadyWornPieces.length > 1 ? 's' : ''} (tap to swap)
                </Text>
              </View>
            ) : (
              <View style={styles.recapNoticeClean}>
                <Check size={14} color="#16A34A" strokeWidth={2.8} />
                <Text style={styles.recapNoticeCleanText}>
                  All {recapEntries.length} pieces are clean & ready
                </Text>
              </View>
            )}

            {/* Pieces Row Cards */}
            <View style={styles.recapCardsContainer}>
              {recapEntries.map(({ slot, meta, item }) => {
                const isWorn = item.status === 'worn';
                const isIntimate = isIntimatesItem(item);

                return (
                  <PressableScale
                    key={slot}
                    onPress={() => handleSwapPieceFromRecap(slot)}
                    scaleTo={0.98}
                    style={{ width: '100%' }}
                  >
                    <View style={styles.recapRowCard}>
                      <View style={styles.recapThumb}>
                        {isIntimate ? (
                          <IntimatesMockupBadge item={item} variant="thumb" size={50} />
                        ) : item.imageUrl ? (
                          <Image
                            source={{ uri: item.imageUrl }}
                            style={{ width: '90%', height: '90%' }}
                            resizeMode="contain"
                          />
                        ) : (
                          <CategoryIcon
                            category={meta.iconCategory}
                            size={22}
                            color="#141413"
                          />
                        )}
                      </View>

                      <View style={{ flex: 1, minWidth: 100, gap: 2 }}>
                        <Text style={styles.recapSlotLabel}>{meta.label.toUpperCase()}</Text>
                        <Text style={styles.recapItemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.recapItemColor}>
                          {item.color} ·{' '}
                          {isWorn
                            ? `Worn · ${getWornCount(item)}x → ${getWornCount(item) + 1}x`
                            : 'Clean'}
                        </Text>
                      </View>

                      <View style={styles.recapSwapPill}>
                        <RotateCcw size={11} color="#141413" />
                        <Text style={styles.recapSwapText}>Swap</Text>
                      </View>
                    </View>
                  </PressableScale>
                );
              })}
            </View>

            {/* Optional Outfit Name & Save to Lookbook */}
            <View style={styles.recapOptionsBox}>
              <TextInput
                style={styles.recapInput}
                value={outfitName}
                onChangeText={setOutfitName}
                placeholder="Name your outfit (optional)"
                placeholderTextColor="#9CA3AF"
              />

              <TouchableOpacity
                onPress={() => setSaveToLookbook(!saveToLookbook)}
                activeOpacity={0.8}
                style={styles.lookbookCheckRow}
              >
                <View
                  style={[
                    styles.checkboxMinimal,
                    saveToLookbook && styles.checkboxMinimalActive,
                  ]}
                >
                  {saveToLookbook && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={styles.lookbookCheckText}>Save to Lookbook</Text>
              </TouchableOpacity>

              {saveToLookbook && (
                <View style={styles.tagWrap}>
                  {TAG_PRESETS.map((t) => {
                    const active = selectedTags.includes(t);
                    return (
                      <TouchableOpacity
                        key={t}
                        onPress={() => toggleTag(t)}
                        style={[styles.tagPill, active && styles.tagPillActive]}
                      >
                        <Text
                          style={[styles.tagPillText, active && styles.tagPillTextActive]}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </Animated.View>

      {/* ─── PURE IPHONE SETUP BOTTOM ACTION PILL ─── */}
      <Animated.View
        style={[
          styles.appleBottomBar,
          {
            paddingBottom: bottomSafePad,
            opacity: contentOpacity,
          },
        ]}
      >
        {phase === 'categories' && (
          <PressableScale
            onPress={handleStartPicking}
            scaleTo={0.96}
            style={{ width: '100%' }}
          >
            <View
              style={[
                styles.appleContinuePill,
                orderedSelectedSlots.length === 0 && styles.appleContinuePillDisabled,
              ]}
            >
              <Text style={styles.appleContinuePillText}>Continue</Text>
            </View>
          </PressableScale>
        )}

        {phase === 'pick_item' && (
          <View style={styles.pickerBottomRow}>
            <TouchableOpacity
              onPress={handleSkipCurrentSlot}
              style={styles.appleSkipBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.appleSkipBtnText}>Skip</Text>
            </TouchableOpacity>

            <PressableScale
              onPress={handleNextStepFromPicker}
              scaleTo={0.96}
              style={{ flex: 1 }}
            >
              <View style={styles.appleContinuePill}>
                <Text style={styles.appleContinuePillText}>
                  {returnToRecap
                    ? 'Back to Recap'
                    : activeSlotIdx < orderedSelectedSlots.length - 1
                    ? 'Continue'
                    : 'Review Outfit'}
                </Text>
              </View>
            </PressableScale>
          </View>
        )}

        {phase === 'recap' && (
          <PressableScale
            onPress={handleConfirmWearOutfit}
            scaleTo={0.96}
            style={{ width: '100%' }}
          >
            <View style={styles.appleContinuePill}>
              <Text style={styles.appleContinuePillText}>Wear Today</Text>
            </View>
          </PressableScale>
        )}
      </Animated.View>
      {rewearModal}
    </View>
  );
}

const styles = StyleSheet.create({
  whiteScreenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  quietTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  quietTopIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quietBackText: {
    fontSize: 22,
    color: '#141413',
    fontWeight: '300',
  },

  // Two-Beat animated title header
  animatedTitleHeader: {
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 14,
    alignItems: 'center',
  },
  appleLargeTitle: {
    fontSize: 27,
    fontWeight: '700',
    color: '#141413',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  appleSubTitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 300,
  },

  animatedContentBody: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Category selection cards (Step 1)
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    rowGap: 10,
  },
  catGridCol: {
    width: '50%',
    paddingHorizontal: 5,
  },
  catMinimalCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    minHeight: 120,
    justifyContent: 'space-between',
  },
  catMinimalCardSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#141413',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  catMinimalCardMuted: {
    opacity: 0.5,
  },
  catCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  catMinimalIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  catMinimalIconBoxSelected: {
    backgroundColor: '#141413',
    borderColor: '#141413',
  },
  catOrderPill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catOrderPillSelected: {
    backgroundColor: '#141413',
    borderColor: '#141413',
  },
  catOrderPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  catTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#141413',
  },
  catDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  catStockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockLabel: {
    fontSize: 10.5,
    color: '#6B7280',
  },

  // Step 2..N Minimal Toolbar
  pickerMinimalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  minimalFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  minimalFilterChipActive: {
    borderColor: '#141413',
    backgroundColor: '#FFFFFF',
  },
  minimalFilterChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#141413',
  },
  appleSurpriseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    backgroundColor: '#F3F4F6',
    marginLeft: 'auto',
  },
  appleSurpriseBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#141413',
  },

  // Garments Grid
  garmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    rowGap: 10,
  },
  garmentGridCol: {
    width: '50%',
    paddingHorizontal: 5,
  },
  garmentMinimalCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
  },
  garmentMinimalCardSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#141413',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  garmentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusTinyPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  statusTinyPillClean: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  statusTinyPillWorn: {
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
  },
  statusTinyText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  radioCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioCheckSelected: {
    backgroundColor: '#141413',
    borderColor: '#141413',
  },
  garmentImageStage: {
    height: 104,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  garmentImage: {
    width: '90%',
    height: '90%',
  },
  garmentName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#141413',
    lineHeight: 16,
    minHeight: 32,
  },
  garmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  colorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  whiteDotBorder: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  garmentMetaText: {
    fontSize: 10.5,
    color: '#6B7280',
  },
  emptySlotCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  emptySlotTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#141413',
  },
  emptySlotSub: {
    fontSize: 12.5,
    color: '#6B7280',
    textAlign: 'center',
  },
  whiteOutlineBtn: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  whiteOutlineBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#141413',
  },

  // Recap Screen
  recapNoticeClean: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  recapNoticeCleanText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  recapNoticeWorn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  recapNoticeWornText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  recapCardsContainer: {
    gap: 8,
    marginBottom: 14,
  },
  recapRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 10,
  },
  recapThumb: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  recapSlotLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#6B7280',
  },
  recapItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#141413',
  },
  recapItemColor: {
    fontSize: 11,
    color: '#6B7280',
  },
  recapSwapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recapSwapText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#141413',
  },
  recapOptionsBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  recapInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#141413',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  lookbookCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxMinimal: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxMinimalActive: {
    backgroundColor: '#141413',
    borderColor: '#141413',
  },
  lookbookCheckText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#141413',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    paddingTop: 2,
  },
  tagPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagPillActive: {
    backgroundColor: '#141413',
    borderColor: '#141413',
  },
  tagPillText: {
    fontSize: 10.5,
    color: '#6B7280',
    fontWeight: '500',
  },
  tagPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Apple bottom pill button
  appleBottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
  },
  appleContinuePill: {
    backgroundColor: '#141413',
    paddingVertical: 15,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  appleContinuePillDisabled: {
    opacity: 0.35,
  },
  appleContinuePillText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  pickerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appleSkipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  appleSkipBtnText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  appleContinuePillFlex: {
    flex: 1,
    backgroundColor: '#141413',
    paddingVertical: 15,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
});
