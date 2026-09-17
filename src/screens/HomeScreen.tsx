import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useWardrobe } from '../context/WardrobeContext';
import { Location } from '../types/wardrobe';
import FadeSlideIn from '../components/FadeSlideIn';
import PressableScale from '../components/PressableScale';
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

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { items, setLocationFilter, setStatusFilter } = useWardrobe();

  // Active user location for smart suggestions
  const [currentLoc, setCurrentLoc] = useState<Location>('batangas_dorm');

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
  const uniformTees = items.filter((i) => i.isUniformWhiteTee && i.status === 'clean').length;

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
    navigation.navigate('Closet');
  };

  const handleAllClothesPress = () => {
    setLocationFilter(null);
    setStatusFilter(null);
    navigation.navigate('Closet');
  };

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
              <View>
                <Text style={styles.dateBadge}>{dateString}</Text>
                <Text style={styles.greeting}>{greeting}</Text>
              </View>

              {/* Quick toggle for current dormer location */}
              <View style={styles.locToggle}>
                <TouchableOpacity
                  onPress={() => setCurrentLoc('batangas_dorm')}
                  style={[
                    styles.locToggleBtn,
                    currentLoc === 'batangas_dorm' && styles.locToggleBtnActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <LocationIcon
                    location="batangas_dorm"
                    size={12}
                    color={currentLoc === 'batangas_dorm' ? Colors.textPrimary : Colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.locToggleText,
                      currentLoc === 'batangas_dorm' && styles.locToggleTextActive,
                    ]}
                  >
                    Dorm
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setCurrentLoc('calamba_home')}
                  style={[
                    styles.locToggleBtn,
                    currentLoc === 'calamba_home' && styles.locToggleBtnActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <LocationIcon
                    location="calamba_home"
                    size={12}
                    color={currentLoc === 'calamba_home' ? Colors.textPrimary : Colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.locToggleText,
                      currentLoc === 'calamba_home' && styles.locToggleTextActive,
                    ]}
                  >
                    Home
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </FadeSlideIn>

          {/* Quick Laundry Alert Banner (if items need wash at current location) */}
          {(currentLoc === 'batangas_dorm' ? dormNeedsWash : homeNeedsWash) > 0 && (
            <FadeSlideIn delay={40} fromY={10}>
              <PressableScale
                onPress={() => navigation.navigate('Batch')}
                scaleTo={0.98}
              >
                <View style={styles.laundryAlert}>
                  <Waves size={20} color="#FFB340" strokeWidth={2.2} />
                  <View style={styles.laundryAlertBody}>
                    <Text style={styles.laundryAlertTitle}>
                      {currentLoc === 'batangas_dorm' ? dormNeedsWash : homeNeedsWash}{' '}
                      items need wash at{' '}
                      {currentLoc === 'batangas_dorm' ? 'Dorm' : 'Home'}
                    </Text>
                    <Text style={styles.laundryAlertSub}>
                      Tap to batch-move to laundry or wash basket →
                    </Text>
                  </View>
                </View>
              </PressableScale>
            </FadeSlideIn>
          )}

          {/* Location Glance: 3 Liquid Glass Cards */}
          <FadeSlideIn delay={80} fromY={12}>
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
                <View
                  style={[
                    styles.locationCard,
                    currentLoc === 'batangas_dorm' && styles.locationCardCurrent,
                  ]}
                >
                  <View style={styles.locCardTop}>
                    <LocationIcon location="batangas_dorm" size={24} color={Colors.textPrimary} strokeWidth={2} />
                    {currentLoc === 'batangas_dorm' && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>HERE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.locCardName}>Batangas Dorm</Text>
                  <Text style={styles.locCardCount}>{dormItems.length}</Text>
                  <Text style={styles.locCardSub}>
                    {dormClean} clean · {dormNeedsWash} worn
                  </Text>
                </View>
              </PressableScale>

              {/* Calamba Home Card */}
              <PressableScale
                onPress={() => handleLocationPress('calamba_home')}
                scaleTo={0.96}
                style={styles.locationCardCol}
              >
                <View
                  style={[
                    styles.locationCard,
                    currentLoc === 'calamba_home' && styles.locationCardCurrent,
                  ]}
                >
                  <View style={styles.locCardTop}>
                    <LocationIcon location="calamba_home" size={24} color={Colors.textPrimary} strokeWidth={2} />
                    {currentLoc === 'calamba_home' && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>HERE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.locCardName}>Calamba Home</Text>
                  <Text style={styles.locCardCount}>{homeItems.length}</Text>
                  <Text style={styles.locCardSub}>
                    {homeClean} clean · {homeNeedsWash} worn
                  </Text>
                </View>
              </PressableScale>
            </View>

            {/* In-Transit Bag Card */}
            <PressableScale
              onPress={() => handleLocationPress('in_transit_bag')}
              scaleTo={0.97}
            >
              <View style={styles.bagCard}>
                <View style={styles.bagCardLeft}>
                  <LocationIcon location="in_transit_bag" size={22} color={Colors.textPrimary} strokeWidth={2} />
                  <View>
                    <Text style={styles.bagCardTitle}>In-Transit Bag</Text>
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
          </FadeSlideIn>

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
                    <Sparkles size={20} color="#FFFFFF" strokeWidth={2} />
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
                    <Luggage size={20} color="#FFFFFF" strokeWidth={2} />
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
                    <Plus size={20} color="#FFFFFF" strokeWidth={2} />
                  </View>
                  <Text style={styles.actionTitle}>Add Clothes</Text>
                  <Text style={styles.actionSub}>Log a new piece</Text>
                </View>
              </PressableScale>
            </View>
          </FadeSlideIn>

          {/* Status Barometer Widget */}
          <FadeSlideIn delay={160} fromY={14}>
            <View style={styles.barometerCard}>
              <View style={styles.barometerHeader}>
                <Text style={styles.barometerTitle}>Wardrobe Health</Text>
                <Text style={styles.barometerCount}>{totalItems} Total Pieces</Text>
              </View>

              <View style={styles.barometerRow}>
                <View style={styles.barometerCell}>
                  <Text style={[styles.barometerNum, { color: Colors.statusClean }]}>
                    {totalClean}
                  </Text>
                  <Text style={styles.barometerLabel}>Clean & Ready</Text>
                </View>

                <View style={styles.barometerDivider} />

                <View style={styles.barometerCell}>
                  <Text style={[styles.barometerNum, { color: Colors.statusWorn }]}>
                    {totalNeedsWash}
                  </Text>
                  <Text style={styles.barometerLabel}>Needs Wash</Text>
                </View>

                <View style={styles.barometerDivider} />

                <View style={styles.barometerCell}>
                  <Text style={[styles.barometerNum, { color: Colors.accent }]}>
                    {uniformTees}
                  </Text>
                  <Text style={styles.barometerLabel}>Clean Uniforms</Text>
                </View>
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
                <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.2} />
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
    alignItems: 'flex-start',
    paddingTop: Spacing.sm,
    marginBottom: Spacing.md,
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radii.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  locToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  locToggleBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  locToggleText: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
  },
  locToggleTextActive: {
    color: Colors.textPrimary,
  },
  laundryAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,159,10,0.10)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,159,10,0.30)',
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
    color: '#FFB340',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 1,
  },
  laundryAlertSub: {
    color: 'rgba(255,179,64,0.75)',
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
    letterSpacing: 1.1,
  },
  sectionLink: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
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
    backgroundColor: Colors.glassMid,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  locationCardCurrent: {
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: Colors.glassBright,
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
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  currentBadgeText: {
    color: Colors.textPrimary,
    fontSize: 9,
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
    backgroundColor: Colors.glassLight,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    marginBottom: Spacing.sm,
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
    backgroundColor: Colors.glassLight,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
    backgroundColor: Colors.glassMid,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    marginBottom: Spacing.md,
  },
  barometerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  barometerTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  barometerCount: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '500',
  },
  barometerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barometerCell: {
    flex: 1,
    alignItems: 'center',
  },
  barometerNum: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  barometerLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  barometerDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  browseClosetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
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
