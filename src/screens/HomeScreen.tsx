import React, { useState, useRef, useEffect } from 'react';
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
import { Location } from '../types/wardrobe';
import FadeSlideIn from '../components/FadeSlideIn';
import PressableScale from '../components/PressableScale';
import LiquidGlassLocationSwitch from '../components/LiquidGlassLocationSwitch';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';
import {
  LocationIcon,
  Sparkles,
  Luggage,
  Plus,
  Waves,
  ChevronRight,
  ArrowRight,
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
    unpackTransitBag,
    setLocationFilter,
    setStatusFilter,
    setUniformFilter,
    getLocationLabel,
  } = useWardrobe();

  const [barometerScope, setBarometerScope] = useState<'local' | 'all'>('local');

  // Stats calculation
  const totalItems = items.length;
  const dormItems = items.filter((i) => i.location === 'batangas_dorm');
  const homeItems = items.filter((i) => i.location === 'calamba_home');
  const bagItems = items.filter((i) => i.location === 'in_transit_bag');

  const dormClean = dormItems.filter((i) => i.status === 'clean').length;
  const dormNeedsWash = dormItems.filter((i) => i.status === 'worn' || i.status === 'in_laundry').length;

  const homeClean = homeItems.filter((i) => i.status === 'clean').length;
  const homeNeedsWash = homeItems.filter((i) => i.status === 'worn' || i.status === 'in_laundry').length;

  const totalClean = items.filter((i) => i.status === 'clean').length;
  const totalNeedsWash = items.filter((i) => i.status === 'worn' || i.status === 'in_laundry').length;
  const totalUniformTees = items.filter((i) => i.isUniformWhiteTee && i.status === 'clean').length;

  // Local current location metrics for Context-Aware Readiness
  const currentLocItems = items.filter((i) => i.location === currentLocation);
  const currentClean = currentLocItems.filter((i) => i.status === 'clean').length;
  const currentNeedsWash = currentLocItems.filter((i) => i.status === 'worn' || i.status === 'in_laundry').length;
  const currentUniformTees = currentLocItems.filter((i) => i.isUniformWhiteTee && i.status === 'clean').length;

  const isLocalScope = barometerScope === 'local';
  const displayClean = isLocalScope ? currentClean : totalClean;
  const displayNeedsWash = isLocalScope ? currentNeedsWash : totalNeedsWash;
  const displayUniforms = isLocalScope ? currentUniformTees : totalUniformTees;
  const displayScopeCount = isLocalScope ? currentLocItems.length : totalItems;

  const currentLocName = currentLocation === 'batangas_dorm' ? 'Batangas Dorm' : 'Calamba Home';
  const currentLocShort = currentLocation === 'batangas_dorm' ? 'Dorm' : 'Home';

  // Date & Greeting
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateString = now
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase();

  const handleLocationPress = (loc: Location) => {
    setLocationFilter(loc);
    setStatusFilter(null);
    setUniformFilter(false);
    navigation.navigate('Closet');
  };

  const handleAllClothesPress = () => {
    setLocationFilter(null);
    setStatusFilter(null);
    setUniformFilter(false);
    navigation.navigate('Closet');
  };

  const handleBarometerCleanPress = () => {
    setStatusFilter('clean');
    setLocationFilter(isLocalScope ? currentLocation : null);
    setUniformFilter(false);
    navigation.navigate('Closet');
  };

  const handleBarometerNeedsWashPress = () => {
    setStatusFilter('worn');
    setLocationFilter(isLocalScope ? currentLocation : null);
    setUniformFilter(false);
    navigation.navigate('Closet');
  };

  const handleBarometerUniformsPress = () => {
    setStatusFilter('clean');
    setLocationFilter(isLocalScope ? currentLocation : null);
    setUniformFilter(true);
    navigation.navigate('Closet');
  };

  const handleUnpackAll = () => {
    unpackTransitBag(currentLocation);
  };

  const isDorm = currentLocation === 'batangas_dorm';
  const isHome = currentLocation === 'calamba_home';
  const useNativeDriver = Platform.OS !== 'web';

  // Smooth directional content transition & card elevation on location switch
  const contentTranslateX = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const dormCardAnim = useRef(new Animated.Value(isDorm ? 1 : 0)).current;
  const homeCardAnim = useRef(new Animated.Value(isHome ? 1 : 0)).current;
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
      const movingToHome = currentLocation === 'calamba_home';
      const direction = movingToHome ? 1 : -1;

      // Nudge content subtly from the direction of the switch + soft crossfade
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
        Animated.spring(dormCardAnim, {
          toValue: isDorm ? 1 : 0,
          tension: 300,
          friction: 25,
          useNativeDriver,
        }),
        Animated.spring(homeCardAnim, {
          toValue: isHome ? 1 : 0,
          tension: 300,
          friction: 25,
          useNativeDriver,
        }),
      ]).start();

      prevLocRef.current = currentLocation;
    }
  }, [currentLocation, isDorm, isHome]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <FadeSlideIn delay={0} fromY={-8}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.dateBadge}>{dateString}</Text>
                <Text style={styles.greeting}>{greeting}</Text>
              </View>

              {/* Liquid Glass Dorm to Home location switch with smooth spring animation */}
              <LiquidGlassLocationSwitch
                currentLocation={currentLocation}
                onChange={handleSwitchLocation}
              />
            </View>
          </FadeSlideIn>

          {/* Location-Sensitive Dynamic Content (smooth directional slide + crossfade on switch) */}
          <Animated.View
            style={{
              opacity: contentOpacity,
              transform: [{ translateX: contentTranslateX }],
            }}
          >
            {/* Commuter Intelligence: 1-Tap Unpack Transit Bag Banner */}
            {bagItems.length > 0 && (
              <View style={styles.unpackBanner}>
                <View style={styles.unpackIconBox}>
                  <Luggage size={22} color={Colors.locInTransit} strokeWidth={2.2} />
                </View>
                <View style={styles.unpackBody}>
                  <Text style={styles.unpackTitle}>
                    {bagItems.length} items packed in Transit Bag
                  </Text>
                  <Text style={styles.unpackSub}>
                    Arrived at {getLocationLabel(currentLocation)}?
                  </Text>
                </View>
                <PressableScale onPress={handleUnpackAll} scaleTo={0.92} style={styles.unpackBtn}>
                  <Text style={styles.unpackBtnText}>Unpack All</Text>
                </PressableScale>
              </View>
            )}

            {/* Location Glance: 3 Liquid Glass Cards */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>WHERE'S MY WARDROBE?</Text>
              <TouchableOpacity onPress={handleAllClothesPress} activeOpacity={0.7}>
                <Text style={styles.sectionLink}>View All ({totalItems})</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.locationCardsRow}>
              {/* Batangas Dorm Card */}
              <PressableScale
                onPress={() => handleLocationPress('batangas_dorm')}
                scaleTo={0.96}
                style={styles.locationCardCol}
              >
                <Animated.View
                  style={[
                    styles.locationCard,
                    {
                      transform: [
                        {
                          scale: dormCardAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.985, 1.015],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.cardSpecular} />
                  <Animated.View
                    style={[
                      styles.cardActiveBorder,
                      {
                        borderColor: Colors.locBatangas,
                        opacity: dormCardAnim,
                      },
                    ]}
                    pointerEvents="none"
                  />
                  <View style={styles.locCardTop}>
                    <LocationIcon
                      location="batangas_dorm"
                      size={24}
                      color={isDorm ? Colors.locBatangas : Colors.textPrimary}
                      strokeWidth={2}
                    />
                    <Animated.View
                      style={[
                        styles.currentBadge,
                        {
                          opacity: dormCardAnim,
                          transform: [
                            {
                              scale: dormCardAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.65, 1],
                              }),
                            },
                          ],
                        },
                      ]}
                      pointerEvents={isDorm ? 'auto' : 'none'}
                    >
                      <View style={[styles.currentBadgeDot, { backgroundColor: Colors.locBatangas }]} />
                      <Text style={styles.currentBadgeText}>HERE</Text>
                    </Animated.View>
                  </View>
                  <Text style={styles.locCardName}>{getLocationLabel('batangas_dorm')}</Text>
                  <Text style={styles.locCardCount}>{dormItems.length}</Text>
                  <Text style={styles.locCardSub}>
                    {dormClean} clean · {dormNeedsWash} worn
                  </Text>
                </Animated.View>
              </PressableScale>

              {/* Calamba Home Card */}
              <PressableScale
                onPress={() => handleLocationPress('calamba_home')}
                scaleTo={0.96}
                style={styles.locationCardCol}
              >
                <Animated.View
                  style={[
                    styles.locationCard,
                    {
                      transform: [
                        {
                          scale: homeCardAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.985, 1.015],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.cardSpecular} />
                  <Animated.View
                    style={[
                      styles.cardActiveBorder,
                      {
                        borderColor: Colors.locCalamba,
                        opacity: homeCardAnim,
                      },
                    ]}
                    pointerEvents="none"
                  />
                  <View style={styles.locCardTop}>
                    <LocationIcon
                      location="calamba_home"
                      size={24}
                      color={isHome ? Colors.locCalamba : Colors.textPrimary}
                      strokeWidth={2}
                    />
                    <Animated.View
                      style={[
                        styles.currentBadge,
                        {
                          opacity: homeCardAnim,
                          transform: [
                            {
                              scale: homeCardAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.65, 1],
                              }),
                            },
                          ],
                        },
                      ]}
                      pointerEvents={isHome ? 'auto' : 'none'}
                    >
                      <View style={[styles.currentBadgeDot, { backgroundColor: Colors.locCalamba }]} />
                      <Text style={styles.currentBadgeText}>HERE</Text>
                    </Animated.View>
                  </View>
                  <Text style={styles.locCardName}>{getLocationLabel('calamba_home')}</Text>
                  <Text style={styles.locCardCount}>{homeItems.length}</Text>
                  <Text style={styles.locCardSub}>
                    {homeClean} clean · {homeNeedsWash} worn
                  </Text>
                </Animated.View>
              </PressableScale>
            </View>

            {/* In-Transit Bag Card */}
            <PressableScale
              onPress={() => handleLocationPress('in_transit_bag')}
              scaleTo={0.97}
            >
              <View style={styles.bagCard}>
                <View style={styles.cardSpecular} />
                <View style={styles.bagCardLeft}>
                  <LocationIcon location="in_transit_bag" size={22} color={Colors.textPrimary} strokeWidth={2} />
                  <View>
                    <Text style={styles.bagCardTitle}>{getLocationLabel('in_transit_bag')}</Text>
                    <Text style={styles.bagCardSub}>
                      {bagItems.length > 0
                        ? `${bagItems.length} items packed for travel`
                        : 'Bag is empty — ready for packing'}
                    </Text>
                  </View>
                </View>
                <View style={styles.bagCardRight}>
                  <Text style={styles.bagCardCount}>{bagItems.length}</Text>
                  <ChevronRight size={18} color={Colors.textTertiary} />
                </View>
              </View>
            </PressableScale>

            {/* Quick Laundry Alert Banner (below the In-Transit Bag card) */}
            {(currentLocation === 'batangas_dorm' ? dormNeedsWash : homeNeedsWash) > 0 && (
              <PressableScale
                onPress={() => navigation.navigate('Batch')}
                scaleTo={0.98}
                style={{ marginTop: Spacing.xs }}
              >
                <View style={styles.laundryAlert}>
                  <Waves size={20} color="#FFB340" strokeWidth={2.2} />
                  <View style={styles.laundryAlertBody}>
                    <Text style={styles.laundryAlertTitle}>
                      {currentLocation === 'batangas_dorm' ? dormNeedsWash : homeNeedsWash}{' '}
                      items need wash at {getLocationLabel(currentLocation)}
                    </Text>
                    <Text style={styles.laundryAlertSub}>
                      Tap to batch-move to laundry or wash basket →
                    </Text>
                  </View>
                </View>
              </PressableScale>
            )}
          </Animated.View>

          {/* Quick Actions (Apple-Style Widgets) */}
          <FadeSlideIn delay={120} fromY={12}>
            <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
              QUICK ACTIONS
            </Text>

            <View style={styles.actionsGrid}>
              {/* Generate Fit */}
              <PressableScale
                onPress={() => navigation.navigate('FitGen')}
                scaleTo={0.96}
                style={styles.actionCol}
              >
                <View style={styles.actionCard}>
                  <View style={styles.actionIconBox}>
                    <Sparkles size={20} color={Colors.textPrimary} />
                  </View>
                  <Text style={styles.actionTitle}>Generate Fit</Text>
                  <Text style={styles.actionSub}>Roll today's outfit</Text>
                </View>
              </PressableScale>

              {/* Pack & Move */}
              <PressableScale
                onPress={() => navigation.navigate('Batch')}
                scaleTo={0.96}
                style={styles.actionCol}
              >
                <View style={styles.actionCard}>
                  <View style={styles.actionIconBox}>
                    <Luggage size={20} color={Colors.textPrimary} />
                  </View>
                  <Text style={styles.actionTitle}>Pack & Move</Text>
                  <Text style={styles.actionSub}>Transfer luggage</Text>
                </View>
              </PressableScale>

              {/* Log New Clothes */}
              <PressableScale
                onPress={() => navigation.navigate('Add')}
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

          {/* Status Barometer Widget — Context-Aware & Interactive */}
          <FadeSlideIn delay={160} fromY={14}>
            <View style={styles.barometerCard}>
              <View style={styles.barometerHeader}>
                <View style={styles.barometerTitleWrap}>
                  <Text style={styles.barometerTitle}>
                    {isLocalScope ? `${currentLocShort} Readiness` : 'Wardrobe Health'}
                  </Text>
                  <View style={styles.barometerSubRow}>
                    <View
                      style={[
                        styles.barometerDot,
                        {
                          backgroundColor: isLocalScope
                            ? (currentLocation === 'batangas_dorm' ? Colors.locBatangas : Colors.locCalamba)
                            : Colors.accentSage,
                        },
                      ]}
                    />
                    <Text style={styles.barometerLocationText}>
                      {isLocalScope ? `Here at ${currentLocName}` : 'All Locations'} · {displayScopeCount} pcs
                    </Text>
                  </View>
                </View>

                {/* Scope Segmented Pill Switcher */}
                <View style={styles.scopeToggle}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setBarometerScope('local');
                    }}
                    style={[
                      styles.scopeBtn,
                      isLocalScope && styles.scopeBtnActive,
                    ]}
                  >
                    <Text style={[styles.scopeBtnText, isLocalScope && styles.scopeBtnTextActive]}>
                      {currentLocShort}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setBarometerScope('all');
                    }}
                    style={[
                      styles.scopeBtn,
                      !isLocalScope && styles.scopeBtnActive,
                    ]}
                  >
                    <Text style={[styles.scopeBtnText, !isLocalScope && styles.scopeBtnTextActive]}>
                      All
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.barometerRow}>
                {/* Clean & Ready Cell */}
                <PressableScale
                  onPress={handleBarometerCleanPress}
                  scaleTo={0.94}
                  style={styles.barometerCellPressable}
                >
                  <View style={styles.barometerCell}>
                    <View style={styles.barometerNumRow}>
                      <Text style={[styles.barometerNum, { color: Colors.statusClean }]}>
                        {displayClean}
                      </Text>
                      <ArrowRight size={11} color={Colors.statusClean} strokeWidth={2.5} style={{ opacity: 0.7 }} />
                    </View>
                    <Text style={styles.barometerLabel}>Clean & Ready</Text>
                    <Text style={styles.barometerTapHint}>Tap to view</Text>
                  </View>
                </PressableScale>

                <View style={styles.barometerDivider} />

                {/* Needs Wash Cell */}
                <PressableScale
                  onPress={handleBarometerNeedsWashPress}
                  scaleTo={0.94}
                  style={styles.barometerCellPressable}
                >
                  <View style={styles.barometerCell}>
                    <View style={styles.barometerNumRow}>
                      <Text style={[styles.barometerNum, { color: Colors.statusWorn }]}>
                        {displayNeedsWash}
                      </Text>
                      <ArrowRight size={11} color={Colors.statusWorn} strokeWidth={2.5} style={{ opacity: 0.7 }} />
                    </View>
                    <Text style={styles.barometerLabel}>Needs Wash</Text>
                    <Text style={styles.barometerTapHint}>Tap to view</Text>
                  </View>
                </PressableScale>

                <View style={styles.barometerDivider} />

                {/* Clean Uniforms Cell */}
                <PressableScale
                  onPress={handleBarometerUniformsPress}
                  scaleTo={0.94}
                  style={styles.barometerCellPressable}
                >
                  <View style={styles.barometerCell}>
                    <View style={styles.barometerNumRow}>
                      <Text style={[styles.barometerNum, { color: Colors.accent }]}>
                        {displayUniforms}
                      </Text>
                      <ArrowRight size={11} color={Colors.textTertiary} strokeWidth={2.5} style={{ opacity: 0.7 }} />
                    </View>
                    <Text style={styles.barometerLabel}>Uniform Tops</Text>
                    <Text style={styles.barometerTapHint}>Tap to view</Text>
                  </View>
                </PressableScale>
              </View>

              {/* Barometer Action Footer Note */}
              <View style={styles.barometerFooter}>
                <Text style={styles.barometerFooterText}>
                  {isLocalScope
                    ? `Tap any metric to view ${currentLocShort} garments in Closet →`
                    : 'Tap any metric to view all matching garments in Closet →'}
                </Text>
              </View>
            </View>
          </FadeSlideIn>

          {/* Calm CTA to browse full closet */}
          <FadeSlideIn delay={200} fromY={14}>
            <PressableScale onPress={handleAllClothesPress} scaleTo={0.97}>
              <View style={styles.browseClosetBanner}>
                <View>
                  <Text style={styles.browseClosetTitle}>Browse Full Closet</Text>
                  <Text style={styles.browseClosetSub}>
                    Search, filter, or manage all {totalItems} items
                  </Text>
                </View>
                <ArrowRight size={18} color={Colors.textPrimary} />
              </View>
            </PressableScale>
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
  locToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSubtle,
    borderRadius: Radii.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  locToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  locToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  locToggleText: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  locToggleTextActive: {
    color: Colors.textPrimary,
  },
  unpackBanner: {
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
  unpackIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.locInTransitBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(77, 107, 83, 0.2)',
  },
  unpackBody: {
    flex: 1,
  },
  unpackTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  unpackSub: {
    color: Colors.textTertiary,
    fontSize: 11,
  },
  unpackBtn: {
    backgroundColor: Colors.locInTransit,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  unpackBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  laundryAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.22)',
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  laundryAlertIcon: {
    fontSize: 22,
  },
  laundryAlertBody: {
    flex: 1,
  },
  laundryAlertTitle: {
    color: '#D97706',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  laundryAlertSub: {
    color: 'rgba(217, 119, 6, 0.85)',
    fontSize: 11,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  sectionLink: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  locationCardsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  locationCardCol: {
    flex: 1,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.borderGlass,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  cardActiveBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radii.xl,
    borderWidth: 1.5,
    zIndex: 2,
  },
  cardSpecular: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 5,
  },
  locationCardCurrent: {
    borderColor: Colors.accent,
    borderWidth: 1.5,
  },
  locCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  locCardEmoji: {
    fontSize: 24,
  },
  currentBadge: {
    backgroundColor: 'rgba(20, 20, 19, 0.05)',
    borderRadius: Radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderWidth: 1,
    borderColor: 'rgba(20, 20, 19, 0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
  },
  currentBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  currentBadgeText: {
    color: Colors.textPrimary,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  locCardName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  locCardCount: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  locCardSub: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  bagCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    marginBottom: Spacing.sm,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  bagCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  bagCardEmoji: {
    fontSize: 22,
  },
  bagCardTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  bagCardSub: {
    color: Colors.textTertiary,
    fontSize: 11,
    marginTop: 1,
  },
  bagCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bagCardCount: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  bagCardArrow: {
    color: Colors.textTertiary,
    fontSize: 18,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  actionCol: {
    flex: 1,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  actionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  actionTitle: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  actionSub: {
    color: Colors.textTertiary,
    fontSize: 9.5,
    textAlign: 'center',
  },
  barometerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    marginBottom: Spacing.md,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  barometerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  barometerTitleWrap: {
    flex: 1,
  },
  barometerTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  barometerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  barometerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  barometerLocationText: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '500',
  },
  scopeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSubtle,
    borderRadius: Radii.pill,
    padding: 2.5,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  scopeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: Radii.pill,
  },
  scopeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  scopeBtnText: {
    color: Colors.textTertiary,
    fontSize: 10.5,
    fontWeight: '600',
  },
  scopeBtnTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  barometerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgBase,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  barometerCellPressable: {
    flex: 1,
  },
  barometerCell: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  barometerNumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  barometerNum: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  barometerLabel: {
    color: Colors.textSecondary,
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },
  barometerTapHint: {
    color: Colors.textTertiary,
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.1,
  },
  barometerDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.borderGlassBright,
  },
  barometerFooter: {
    paddingTop: 8,
    alignItems: 'center',
  },
  barometerFooterText: {
    color: Colors.textTertiary,
    fontSize: 10,
    letterSpacing: -0.1,
  },
  browseClosetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  browseClosetTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  browseClosetSub: {
    color: Colors.textTertiary,
    fontSize: 11,
    marginTop: 2,
  },
  browseClosetArrow: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
});
