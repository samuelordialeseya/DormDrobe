import React, { useRef, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useWardrobe } from '../context/WardrobeContext';
import {
  ClosetSubTab,
  Location,
  Category,
  CATEGORY_LABELS,
  isDirtyStatus,
} from '../types/wardrobe';
import FadeSlideIn from '../components/FadeSlideIn';
import PressableScale from '../components/PressableScale';
import LiquidGlassLocationSwitch from '../components/LiquidGlassLocationSwitch';
import { useUnpackFlow } from '../components/UnpackPromptModal';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';
import {
  LocationIcon,
  Sparkles,
  Luggage,
  Plus,
  Waves,
  Shirt,
  ChevronRight,
  CategoryIcon,
  AlertTriangle,
  Check,
  CaretDown,
} from '../components/AppIcons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const {
    items,
    currentLocation,
    setCurrentLocation,
    setClosetTab,
    setIsPackingSession,
    setIsWearWizardSession,
    getLocationLabel,
  } = useWardrobe();
  const { requestUnpack, unpackModal } = useUnpackFlow();

  // Displayed location trails currentLocation by a brief exit fade so numbers & cards
  // cross-dissolve smoothly instead of snapping on frame 0
  const [displayedLocation, setDisplayedLocation] = useState<Location>(currentLocation);

  // ── Stats for the closet I'm at right now ────────────────────────
  const hereItems = items.filter((i) => i.location === displayedLocation);
  const readyCount = hereItems.filter((i) => !isDirtyStatus(i.status)).length;
  const laundryCount = hereItems.filter((i) => isDirtyStatus(i.status)).length;
  const bagItems = items.filter((i) => i.location === 'in_transit_bag');
  const bagDirtyCount = bagItems.filter((i) => isDirtyStatus(i.status)).length;

  const place = getLocationLabel(displayedLocation);
  const isDorm = displayedLocation === 'batangas_dorm';
  const placeColor = isDorm ? Colors.locBatangas : Colors.locCalamba;

  // Date & Greeting
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateString = now
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    .toUpperCase();

  // ── Navigation shortcuts into the Closet zones & categories ─────
  const openZone = (zone: ClosetSubTab) => {
    setIsPackingSession(false);
    setClosetTab(zone);
    navigation.navigate('Closet', { zone });
  };

  const openCategory = (category: Category) => {
    setIsPackingSession(false);
    setClosetTab('all');
    navigation.navigate('Closet', { zone: 'all', category });
  };

  const startWearWizard = () => {
    setIsWearWizardSession(true);
    navigation.navigate('FitGen', { startWizard: true });
  };

  const startPacking = () => {
    setIsPackingSession(true);
    navigation.navigate('Closet');
  };

  // ── Category Supply & Battery Gauge Breakdown ───────────────────
  const SUPPLY_CATEGORIES: Category[] = [
    'underwear',
    'tops',
    'bottoms',
    'outerwear',
    'footwear',
    'accessories',
  ];

  const categoryStats = useMemo(() => {
    return SUPPLY_CATEGORIES.map((cat) => {
      const catItems = hereItems.filter((i) => i.category === cat);
      const cleanCount = catItems.filter((i) => !isDirtyStatus(i.status)).length;
      const dirtyCount = catItems.filter((i) => isDirtyStatus(i.status)).length;
      const totalCount = catItems.length;

      let healthColor = Colors.statusClean;
      let healthStatus: 'healthy' | 'low' | 'empty' = 'healthy';
      let statusText = `${cleanCount} clean`;

      if (totalCount === 0) {
        healthColor = Colors.textTertiary;
        statusText = 'None here';
      } else if (cleanCount === 0) {
        healthColor = '#DC2626'; // Alert Red
        healthStatus = 'empty';
        statusText = '0 clean left!';
      } else if (cleanCount <= 2) {
        healthColor = '#D97706'; // Warm Amber
        healthStatus = 'low';
        statusText = `${cleanCount} left · low`;
      } else {
        statusText = `${cleanCount} ready · ${dirtyCount} dirty`;
      }

      return {
        category: cat,
        label: CATEGORY_LABELS[cat],
        cleanCount,
        dirtyCount,
        totalCount,
        healthColor,
        healthStatus,
        statusText,
      };
    });
  }, [hereItems]);

  // Essential daily supply calculation (Underwear, Tops, Bottoms)
  const underwearClean = hereItems.filter(
    (i) => i.category === 'underwear' && !isDirtyStatus(i.status)
  ).length;
  const topsClean = hereItems.filter(
    (i) => i.category === 'tops' && !isDirtyStatus(i.status)
  ).length;
  const bottomsClean = hereItems.filter(
    (i) => i.category === 'bottoms' && !isDirtyStatus(i.status)
  ).length;

  const essentialBreakdown = useMemo(() => {
    return [
      {
        label: 'Underwear',
        count: underwearClean,
        exists: hereItems.some((i) => i.category === 'underwear'),
      },
      {
        label: 'Tops',
        count: topsClean,
        exists: hereItems.some((i) => i.category === 'tops'),
      },
      {
        label: 'Bottoms',
        count: bottomsClean,
        exists: hereItems.some((i) => i.category === 'bottoms'),
      },
    ].filter((e) => e.exists);
  }, [underwearClean, topsClean, bottomsClean, hereItems]);

  const minDaysLeft =
    essentialBreakdown.length > 0
      ? Math.min(...essentialBreakdown.map((e) => e.count))
      : 0;

  const bottleneck =
    essentialBreakdown.length > 0
      ? essentialBreakdown.reduce(
          (min, cur) => (cur.count < min.count ? cur : min),
          essentialBreakdown[0]
        )
      : null;

  // Minimized vs. Expanded state for supply category grid (shows top 2 essentials by default)
  const [isSupplyExpanded, setIsSupplyExpanded] = useState(false);
  const [extraCategoriesHeight, setExtraCategoriesHeight] = useState(244);
  const expandAnim = useRef(new Animated.Value(0)).current;

  const toggleSupplyExpanded = () => {
    const nextExpanded = !isSupplyExpanded;
    setIsSupplyExpanded(nextExpanded);
    Animated.timing(expandAnim, {
      toValue: nextExpanded ? 1 : 0,
      duration: 380,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();
  };

  const primaryCategories = categoryStats.slice(0, 2);
  const extraCategories = categoryStats.slice(2);

  // ── Directional content transition when switching location ───────
  const useNativeDriver = Platform.OS !== 'web';
  const contentTranslateX = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentScale = useRef(new Animated.Value(1)).current;
  const activeAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const prevLocRef = useRef(currentLocation);

  const handleSwitchLocation = (newLoc: Location) => {
    if (newLoc === currentLocation) return;
    setCurrentLocation(newLoc);
  };

  useEffect(() => {
    if (prevLocRef.current !== currentLocation) {
      const direction = currentLocation === 'calamba_home' ? 1 : -1;
      prevLocRef.current = currentLocation;

      activeAnimRef.current?.stop();

      // Phase 1: Soft, brief exit (fade down and subtle directional ease)
      const exitAnim = Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 0.25,
          duration: 90,
          easing: Easing.out(Easing.quad),
          useNativeDriver,
        }),
        Animated.timing(contentTranslateX, {
          toValue: -direction * 8,
          duration: 90,
          easing: Easing.out(Easing.quad),
          useNativeDriver,
        }),
      ]);

      activeAnimRef.current = exitAnim;
      exitAnim.start(({ finished }) => {
        if (finished) {
          // Swap displayed location numbers & cards while content is soft/dimmed
          setDisplayedLocation(currentLocation);
          contentTranslateX.setValue(direction * 12);
          contentScale.setValue(0.99);

          // Phase 2: Luxurious, graceful entrance with silky settling
          const enterAnim = Animated.parallel([
            Animated.timing(contentOpacity, {
              toValue: 1,
              duration: 280,
              easing: Easing.out(Easing.cubic),
              useNativeDriver,
            }),
            Animated.spring(contentTranslateX, {
              toValue: 0,
              tension: 190,
              friction: 22,
              useNativeDriver,
            }),
            Animated.spring(contentScale, {
              toValue: 1,
              tension: 200,
              friction: 22,
              useNativeDriver,
            }),
          ]);

          activeAnimRef.current = enterAnim;
          enterAnim.start();
        }
      });
    }
  }, [currentLocation, useNativeDriver]);

  const counters: {
    key: ClosetSubTab;
    label: string;
    value: number;
    color: string;
  }[] = [
    { key: 'clean', label: 'Clean & Ready', value: readyCount, color: Colors.statusClean },
    { key: 'laundry', label: 'Worn & Laundry', value: laundryCount, color: Colors.statusWorn },
    { key: 'bag', label: 'In Bag', value: bagItems.length, color: Colors.locInTransit },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Anchored Top Header — Native iOS app feel, anchored firmly at top */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.dateBadge}>{dateString}</Text>
            <Text style={styles.greeting}>{greeting}</Text>
          </View>
          <LiquidGlassLocationSwitch
            currentLocation={currentLocation}
            onChange={handleSwitchLocation}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          bounces={true}
          overScrollMode="never"
        >
          {/* Transit Bag or Empty State Welcome */}
          {items.length === 0 ? (
            <FadeSlideIn delay={40} fromY={8}>
              <PressableScale
                onPress={() => navigation.navigate('Add', { editItem: undefined, returnTo: 'Home' })}
                scaleTo={0.97}
              >
                <View style={[styles.packPrompt, { borderColor: Colors.borderGlassBright }]}>
                  <View style={[styles.packPromptIcon, { backgroundColor: Colors.accent }]}>
                    <Plus size={20} color="#FFFFFF" strokeWidth={2.4} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.packPromptTitle}>Welcome to DormDrobe!</Text>
                    <Text style={styles.packPromptSub}>Add your first clothes to unlock outfit rolling</Text>
                  </View>
                  <ChevronRight size={18} color={Colors.textTertiary} />
                </View>
              </PressableScale>
            </FadeSlideIn>
          ) : bagItems.length > 0 ? (
            <FadeSlideIn delay={40} fromY={8}>
              <View style={styles.bagBanner}>
                <View style={styles.bagIconBox}>
                  <Luggage size={22} color={Colors.locInTransit} strokeWidth={2.2} />
                </View>
                <TouchableOpacity
                  style={styles.bagBody}
                  activeOpacity={0.7}
                  onPress={() => openZone('bag')}
                >
                  <Text style={styles.bagTitle}>
                    {bagItems.length} item{bagItems.length > 1 ? 's' : ''} in your bag
                  </Text>
                  <Text style={styles.bagSub}>
                    {bagDirtyCount > 0
                      ? `${bagItems.length - bagDirtyCount} clean · ${bagDirtyCount} worn / dirty · View bag`
                      : 'All clean · View bag'}
                  </Text>
                </TouchableOpacity>
                <PressableScale onPress={requestUnpack} scaleTo={0.92} style={styles.bagBtn}>
                  <Text style={styles.bagBtnText}>Unpack here</Text>
                </PressableScale>
              </View>
            </FadeSlideIn>
          ) : (
            <FadeSlideIn delay={40} fromY={8}>
              <PressableScale onPress={startPacking} scaleTo={0.97}>
                <View style={styles.packPrompt}>
                  <View style={styles.packPromptIcon}>
                    <Luggage size={20} color={Colors.textPrimary} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.packPromptTitle}>Heading out?</Text>
                    <Text style={styles.packPromptSub}>Pack your Transit Bag in one checklist</Text>
                  </View>
                  <ChevronRight size={18} color={Colors.textTertiary} />
                </View>
              </PressableScale>
            </FadeSlideIn>
          )}

          <Animated.View
            style={{
              opacity: contentOpacity,
              transform: [{ translateX: contentTranslateX }, { scale: contentScale }],
            }}
          >
            {/* Closet status for where I am right now */}
            <FadeSlideIn delay={80} fromY={10}>
              <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                  <LocationIcon location={displayedLocation} size={18} color={placeColor} strokeWidth={2} />
                  <Text style={styles.statusTitle}>Right now at {place}</Text>
                  <TouchableOpacity
                    onPress={() => openZone('all')}
                    activeOpacity={0.7}
                    style={styles.viewAllTouch}
                  >
                    <Text style={styles.viewAllLink}>View All ({hereItems.length}) →</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.counterRow}>
                  {counters.map((c, idx) => (
                    <React.Fragment key={c.key}>
                      {idx > 0 && <View style={styles.counterDivider} />}
                      <PressableScale
                        onPress={() => openZone(c.key)}
                        scaleTo={0.94}
                        style={styles.counterPressable}
                      >
                        <View style={styles.counterCell}>
                          <Text style={[styles.counterNum, { color: c.color }]}>{c.value}</Text>
                          <Text style={styles.counterLabel}>{c.label}</Text>
                        </View>
                      </PressableScale>
                    </React.Fragment>
                  ))}
                </View>

                <Text style={styles.statusHint}>
                  {laundryCount > 0
                    ? `${laundryCount} piece${laundryCount > 1 ? 's' : ''} waiting to be washed — tap Worn & Laundry`
                    : 'Tap a number to jump straight to those clothes'}
                </Text>
              </View>
            </FadeSlideIn>

            {/* Category Supply & Battery Gauge Breakdown */}
            {hereItems.length > 0 && (
              <FadeSlideIn delay={100} fromY={10}>
                <View style={styles.supplyCard}>
                  <View style={styles.supplyHeader}>
                    <View style={styles.supplyTitleRow}>
                      <Text style={styles.supplyTitle}>WARDROBE SUPPLY</Text>
                      <Text style={styles.supplySub}>Clean readiness at {place}</Text>
                    </View>
                    <PressableScale
                      onPress={() => openZone('clean')}
                      scaleTo={0.94}
                      style={styles.viewCleanTouch}
                    >
                      <View style={styles.viewCleanBadge}>
                        <View style={styles.viewCleanDot} />
                        <Text style={styles.viewCleanLink}>Clean ({readyCount})</Text>
                        <ChevronRight size={12} color={Colors.statusClean} strokeWidth={2.4} />
                      </View>
                    </PressableScale>
                  </View>

                  {/* Days of Supply Banner */}
                  {essentialBreakdown.length > 0 && (
                    <View
                      style={[
                        styles.supplyBanner,
                        minDaysLeft === 0
                          ? styles.supplyBannerEmpty
                          : minDaysLeft <= 2
                          ? styles.supplyBannerLow
                          : styles.supplyBannerHealthy,
                      ]}
                    >
                      {minDaysLeft === 0 ? (
                        <AlertTriangle size={15} color="#DC2626" />
                      ) : minDaysLeft <= 2 ? (
                        <AlertTriangle size={15} color="#D97706" />
                      ) : (
                        <Check size={14} color="#16A34A" strokeWidth={2.5} />
                      )}
                      <Text
                        style={[
                          styles.supplyBannerText,
                          {
                            color:
                              minDaysLeft === 0
                                ? '#DC2626'
                                : minDaysLeft <= 2
                                ? '#D97706'
                                : '#16A34A',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {minDaysLeft === 0
                          ? `Out of clean ${bottleneck?.label.toLowerCase()}! Wash or unpack soon.`
                          : minDaysLeft <= 2
                          ? `~${minDaysLeft} ${minDaysLeft === 1 ? 'day' : 'days'} of supply left · Low on ${bottleneck?.label.toLowerCase()}`
                          : `~${minDaysLeft} days of clean essentials ready`}
                      </Text>
                    </View>
                  )}

                  {/* Category Grid (top 2 essentials always visible, remaining 4 smoothly collapsible) */}
                  {(() => {
                    const renderCategoryCard = (stat: (typeof categoryStats)[number]) => (
                      <PressableScale
                        key={stat.category}
                        onPress={() => openCategory(stat.category)}
                        scaleTo={0.96}
                        style={styles.categoryCardCol}
                      >
                        <View
                          style={[
                            styles.categoryCard,
                            stat.healthStatus === 'low' && styles.categoryCardLow,
                            stat.healthStatus === 'empty' && styles.categoryCardEmpty,
                          ]}
                        >
                          <View style={styles.catCardHeader}>
                            <View
                              style={[
                                styles.catIconWrap,
                                { backgroundColor: stat.healthColor + '14' },
                              ]}
                            >
                              <CategoryIcon
                                category={stat.category}
                                size={15}
                                color={stat.healthColor}
                              />
                            </View>
                            <View style={styles.catBadge}>
                              <Text
                                style={[
                                  styles.catBadgeRatio,
                                  { color: stat.healthColor },
                                ]}
                              >
                                {stat.cleanCount}
                                <Text style={styles.catBadgeTotal}>/{stat.totalCount}</Text>
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.catName} numberOfLines={1}>
                            {stat.label}
                          </Text>

                          {/* Segmented Fuel / Battery Gauge */}
                          <View style={styles.gaugeTrack}>
                            {Array.from({
                              length: Math.min(Math.max(stat.totalCount, 1), 6),
                            }).map((_, i) => {
                              const isFilled =
                                stat.totalCount <= 6
                                  ? i < stat.cleanCount
                                  : i < Math.round((stat.cleanCount / stat.totalCount) * 6);
                              return (
                                <View
                                  key={i}
                                  style={[
                                    styles.gaugeSegment,
                                    isFilled
                                      ? { backgroundColor: stat.healthColor }
                                      : styles.gaugeSegmentEmpty,
                                  ]}
                                />
                              );
                            })}
                          </View>

                          <View style={styles.catFooter}>
                            <Text
                              style={[
                                styles.catStatusText,
                                stat.healthStatus !== 'healthy' && {
                                  color: stat.healthColor,
                                  fontWeight: '600',
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {stat.statusText}
                            </Text>
                          </View>
                        </View>
                      </PressableScale>
                    );

                    return (
                      <>
                        <View style={styles.categoryGrid}>
                          {primaryCategories.map(renderCategoryCard)}
                        </View>

                        {extraCategories.length > 0 && (
                          <Animated.View
                            style={[
                              styles.extraCategoriesClip,
                              {
                                height: expandAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, extraCategoriesHeight],
                                  extrapolate: 'clamp',
                                }),
                                opacity: expandAnim.interpolate({
                                  inputRange: [0, 0.12, 1],
                                  outputRange: [0, 0, 1],
                                  extrapolate: 'clamp',
                                }),
                              },
                            ]}
                            pointerEvents={isSupplyExpanded ? 'auto' : 'none'}
                          >
                            <Animated.View
                              style={[
                                styles.extraCategoriesInner,
                                {
                                  transform: [
                                    {
                                      translateY: expandAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-10, 0],
                                        extrapolate: 'clamp',
                                      }),
                                    },
                                  ],
                                },
                              ]}
                            >
                              <View
                                onLayout={(e) => {
                                  const h = e.nativeEvent.layout.height;
                                  if (h > 0 && Math.abs(h + 10 - extraCategoriesHeight) > 1) {
                                    setExtraCategoriesHeight(h + 10);
                                  }
                                }}
                                style={styles.categoryGrid}
                              >
                                {extraCategories.map(renderCategoryCard)}
                              </View>
                            </Animated.View>
                          </Animated.View>
                        )}
                      </>
                    );
                  })()}

                  {/* Expand / Minimize Toggle */}
                  {categoryStats.length > 2 && (
                    <PressableScale
                      onPress={toggleSupplyExpanded}
                      scaleTo={0.97}
                      style={styles.expandSupplyTouch}
                    >
                      <View style={styles.expandSupplyBtn}>
                        <Text style={styles.expandSupplyText}>
                          {isSupplyExpanded
                            ? 'Show less'
                            : `Show all ${categoryStats.length} categories`}
                        </Text>
                        <Animated.View
                          style={{
                            transform: [
                              {
                                rotate: expandAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ['0deg', '180deg'],
                                }),
                              },
                            ],
                          }}
                        >
                          <CaretDown size={13} color={Colors.textSecondary} />
                        </Animated.View>
                      </View>
                    </PressableScale>
                  )}
                </View>
              </FadeSlideIn>
            )}
          </Animated.View>

          {/* Quick actions */}
          <FadeSlideIn delay={120} fromY={12}>
            <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
            <View style={styles.actionsGrid}>
              <PressableScale
                onPress={startWearWizard}
                scaleTo={0.96}
                style={styles.actionCol}
              >
                <View style={styles.actionCard}>
                  <View style={styles.actionIconBox}>
                    <Sparkles size={20} color={Colors.textPrimary} />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={styles.actionTitle} numberOfLines={1}>Get Dressed</Text>
                    <Text style={styles.actionSub} numberOfLines={1} ellipsizeMode="tail">Step-by-step fit</Text>
                  </View>
                </View>
              </PressableScale>

              <PressableScale onPress={startPacking} scaleTo={0.96} style={styles.actionCol}>
                <View style={styles.actionCard}>
                  <View style={styles.actionIconBox}>
                    <Luggage size={20} color={Colors.textPrimary} />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={styles.actionTitle} numberOfLines={1}>Pack Bag</Text>
                    <Text style={styles.actionSub} numberOfLines={1} ellipsizeMode="tail">Checklist & go</Text>
                  </View>
                </View>
              </PressableScale>

              <PressableScale
                onPress={() => navigation.navigate('Add', { editItem: undefined, returnTo: 'Home' })}
                scaleTo={0.96}
                style={styles.actionCol}
              >
                <View style={styles.actionCard}>
                  <View style={styles.actionIconBox}>
                    <Plus size={20} color={Colors.textPrimary} />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={styles.actionTitle} numberOfLines={1}>Add Clothes</Text>
                    <Text style={styles.actionSub} numberOfLines={1} ellipsizeMode="tail">Log a new piece</Text>
                  </View>
                </View>
              </PressableScale>
            </View>
          </FadeSlideIn>
        </ScrollView>

        {unpackModal}
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
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: Spacing.sm,
    paddingHorizontal: 24,
    backgroundColor: Colors.bgBase,
    zIndex: 10,
  },
  headerLeft: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  dateBadge: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  greeting: {
    color: Colors.textPrimary,
    ...Typography.title1,
    fontSize: 26,
  },

  // Transit bag banner
  bagBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(77, 107, 83, 0.35)',
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bagIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.locInTransitBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(77, 107, 83, 0.2)',
  },
  bagBody: {
    flex: 1,
  },
  bagTitle: {
    color: Colors.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  bagSub: {
    color: Colors.textTertiary,
    fontSize: 11,
  },
  bagBtn: {
    backgroundColor: Colors.locInTransit,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.pill,
  },
  bagBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  packPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  packPromptIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packPromptTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  packPromptSub: {
    color: Colors.textTertiary,
    fontSize: 12,
    marginTop: 1,
  },

  // Status card
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    padding: Spacing.lg,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  statusTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  viewAllTouch: {
    marginLeft: 'auto',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  viewAllLink: {
    color: Colors.accent,
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  counterPressable: {
    flex: 1,
  },
  counterCell: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  counterNum: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
  },
  counterLabel: {
    color: Colors.textTertiary,
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  counterDivider: {
    width: 1,
    backgroundColor: Colors.borderGlass,
    marginVertical: 8,
  },
  statusHint: {
    color: Colors.textTertiary,
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: Spacing.md,
  },

  // Category supply breakdown & segmented battery gauge
  supplyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  supplyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  supplyTitleRow: {
    flex: 1,
    paddingRight: 8,
  },
  supplyTitle: {
    color: Colors.textTertiary,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  supplySub: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  viewCleanTouch: {
    alignSelf: 'center',
  },
  viewCleanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.22)',
  },
  viewCleanDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.statusClean,
  },
  viewCleanLink: {
    color: Colors.statusClean,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  supplyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: Radii.md,
    marginBottom: 16,
    borderWidth: 1,
  },
  supplyBannerHealthy: {
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
    borderColor: 'rgba(22, 163, 74, 0.2)',
  },
  supplyBannerLow: {
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  supplyBannerEmpty: {
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderColor: 'rgba(220, 38, 38, 0.25)',
  },
  supplyBannerText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  extraCategoriesClip: {
    overflow: 'hidden',
  },
  extraCategoriesInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
  },
  categoryCardCol: {
    width: '48.5%',
  },
  categoryCard: {
    backgroundColor: Colors.bgBase,
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    gap: 8,
  },
  categoryCardLow: {
    borderColor: 'rgba(217, 119, 6, 0.35)',
    backgroundColor: 'rgba(217, 119, 6, 0.03)',
  },
  categoryCardEmpty: {
    borderColor: 'rgba(220, 38, 38, 0.35)',
    backgroundColor: 'rgba(220, 38, 38, 0.03)',
  },
  catCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  catBadgeRatio: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  catBadgeTotal: {
    color: Colors.textTertiary,
    fontSize: 10.5,
    fontWeight: '500',
  },
  catName: {
    color: Colors.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  gaugeTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    height: 5,
    marginVertical: 3,
  },
  gaugeSegment: {
    flex: 1,
    height: 5,
    borderRadius: 2.5,
  },
  gaugeSegmentEmpty: {
    backgroundColor: 'rgba(20, 20, 19, 0.08)',
  },
  catFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catStatusText: {
    color: Colors.textTertiary,
    fontSize: 11.5,
    fontWeight: '500',
  },
  expandSupplyTouch: {
    marginTop: 16,
  },
  expandSupplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radii.pill,
    backgroundColor: Colors.bgSubtle,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  expandSupplyText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },

  // Quick actions
  sectionTitle: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.sm,
  },
  actionCol: {
    flex: 1,
    minWidth: 0,
  },
  actionCard: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    paddingVertical: Spacing.md,
    paddingHorizontal: 10,
    minHeight: 114,
    justifyContent: 'space-between',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionTextWrap: {
    width: '100%',
  },
  actionTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  actionSub: {
    color: Colors.textTertiary,
    fontSize: 11,
    marginTop: 2,
  },
});
