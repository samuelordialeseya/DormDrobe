import React, { useRef, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
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
    getLocationLabel,
  } = useWardrobe();
  const { requestUnpack, unpackModal } = useUnpackFlow();

  // ── Stats for the closet I'm at right now ────────────────────────
  const hereItems = items.filter((i) => i.location === currentLocation);
  const readyCount = hereItems.filter((i) => !isDirtyStatus(i.status)).length;
  const laundryCount = hereItems.filter((i) => isDirtyStatus(i.status)).length;
  const bagItems = items.filter((i) => i.location === 'in_transit_bag');
  const bagDirtyCount = bagItems.filter((i) => isDirtyStatus(i.status)).length;

  const place = getLocationLabel(currentLocation);
  const isDorm = currentLocation === 'batangas_dorm';
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

  const toggleSupplyExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSupplyExpanded((prev) => !prev);
  };

  const displayedCategories = isSupplyExpanded
    ? categoryStats
    : categoryStats.slice(0, 2);

  // ── Directional content transition when switching location ───────
  const useNativeDriver = Platform.OS !== 'web';
  const contentTranslateX = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const prevLocRef = useRef(currentLocation);

  const handleSwitchLocation = (newLoc: Location) => {
    if (newLoc === currentLocation) return;
    LayoutAnimation.configureNext({
      duration: 300,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.spring, springDamping: 0.84 },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });
    setCurrentLocation(newLoc);
  };

  useEffect(() => {
    if (prevLocRef.current !== currentLocation) {
      const direction = currentLocation === 'calamba_home' ? 1 : -1;
      contentTranslateX.setValue(direction * 14);
      contentOpacity.setValue(0.55);
      Animated.parallel([
        Animated.spring(contentTranslateX, {
          toValue: 0,
          tension: 290,
          friction: 24,
          useNativeDriver,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver,
        }),
      ]).start();
      prevLocRef.current = currentLocation;
    }
  }, [currentLocation]);

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
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <FadeSlideIn delay={0} fromY={-8}>
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
          </FadeSlideIn>

          <Animated.View
            style={{
              opacity: contentOpacity,
              transform: [{ translateX: contentTranslateX }],
            }}
          >
            {/* Transit Bag or Empty State Welcome */}
            {items.length === 0 ? (
              <FadeSlideIn delay={40} fromY={8}>
                <PressableScale
                  onPress={() => navigation.navigate('Add', { editItem: undefined })}
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

            {/* Closet status for where I am right now */}
            <FadeSlideIn delay={80} fromY={10}>
              <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                  <LocationIcon location={currentLocation} size={18} color={placeColor} strokeWidth={2} />
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
                    <TouchableOpacity
                      onPress={() => openZone('clean')}
                      activeOpacity={0.7}
                      style={styles.viewCleanTouch}
                    >
                      <Text style={styles.viewCleanLink}>Clean ({readyCount}) →</Text>
                    </TouchableOpacity>
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

                  {/* Category Grid (minimized to 2 by default, expandable to all) */}
                  <View style={styles.categoryGrid}>
                    {displayedCategories.map((stat) => (
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
                                size={14}
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
                    ))}
                  </View>

                  {/* Expand / Minimize Toggle */}
                  {categoryStats.length > 2 && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={toggleSupplyExpanded}
                      style={styles.expandSupplyBtn}
                    >
                      <Text style={styles.expandSupplyText}>
                        {isSupplyExpanded
                          ? 'Show less'
                          : `Show all ${categoryStats.length} categories`}
                      </Text>
                      <View style={{ transform: [{ rotate: isSupplyExpanded ? '180deg' : '0deg' }] }}>
                        <CaretDown size={13} color={Colors.textSecondary} />
                      </View>
                    </TouchableOpacity>
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
                onPress={() => navigation.navigate('FitGen')}
                scaleTo={0.96}
                style={styles.actionCol}
              >
                <View style={styles.actionCard}>
                  <View style={styles.actionIconBox}>
                    <Sparkles size={20} color={Colors.textPrimary} />
                  </View>
                  <Text style={styles.actionTitle}>Roll Outfit</Text>
                  <Text style={styles.actionSub}>Pick today's fit</Text>
                </View>
              </PressableScale>

              <PressableScale onPress={startPacking} scaleTo={0.96} style={styles.actionCol}>
                <View style={styles.actionCard}>
                  <View style={styles.actionIconBox}>
                    <Luggage size={20} color={Colors.textPrimary} />
                  </View>
                  <Text style={styles.actionTitle}>Pack Bag</Text>
                  <Text style={styles.actionSub}>Checklist & go</Text>
                </View>
              </PressableScale>

              <PressableScale
                onPress={() => navigation.navigate('Add', { editItem: undefined })}
                scaleTo={0.96}
                style={styles.actionCol}
              >
                <View style={styles.actionCard}>
                  <View style={styles.actionIconBox}>
                    <Plus size={20} color={Colors.textPrimary} />
                  </View>
                  <Text style={styles.actionTitle}>Add Clothes</Text>
                  <Text style={styles.actionSub}>Log a new piece</Text>
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
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    marginBottom: Spacing.md,
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
    borderRadius: Radii.xxl,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  supplyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  supplyTitleRow: {
    flex: 1,
  },
  supplyTitle: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  supplySub: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  viewCleanTouch: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewCleanLink: {
    color: Colors.statusClean,
    fontSize: 12,
    fontWeight: '600',
  },
  supplyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: Radii.lg,
    marginBottom: Spacing.md,
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
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCardCol: {
    width: '48.7%',
  },
  categoryCard: {
    backgroundColor: Colors.bgBase,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    gap: 7,
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
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  catBadgeRatio: {
    fontSize: 11,
    fontWeight: '700',
  },
  catBadgeTotal: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '500',
  },
  catName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  gaugeTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 6,
    marginVertical: 2,
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
    fontSize: 11,
    fontWeight: '500',
  },
  expandSupplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginTop: 4,
    borderRadius: Radii.pill,
    backgroundColor: Colors.bgSubtle,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  expandSupplyText: {
    color: Colors.textSecondary,
    fontSize: 11.5,
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
    gap: Spacing.sm,
  },
  actionCol: {
    flex: 1,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    padding: Spacing.md,
    minHeight: 112,
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
  actionTitle: {
    color: Colors.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  actionSub: {
    color: Colors.textTertiary,
    fontSize: 11.5,
    marginTop: 2,
  },
});
