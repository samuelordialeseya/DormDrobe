import React, { useRef, useEffect } from 'react';
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
import { ClosetSubTab, Location, isDirtyStatus } from '../types/wardrobe';
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

  // ── Navigation shortcuts into the Closet zones ───────────────────
  const openZone = (zone: ClosetSubTab) => {
    setClosetTab(zone);
    navigation.navigate('Closet');
  };

  const startPacking = () => {
    setIsPackingSession(true);
    navigation.navigate('Closet');
  };

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
            {/* Transit Bag: unpack on arrival, or start packing */}
            {bagItems.length > 0 ? (
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
