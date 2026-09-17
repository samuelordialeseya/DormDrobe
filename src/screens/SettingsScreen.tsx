import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isSupabaseConfigured } from '../config/supabase';
import { useWardrobe } from '../context/WardrobeContext';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';
import FadeSlideIn from '../components/FadeSlideIn';
import PressableScale from '../components/PressableScale';
import { AppStorage } from '../utils/storage';
import {
  Cloud,
  BarChart3,
  Layers,
  Shirt,
} from '../components/AppIcons';

export default function SettingsScreen() {
  const { items } = useWardrobe();

  const handleClearData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your clothing items and reload mock data on next launch.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AppStorage.removeItem('@dormdrobe/clothing');
            Alert.alert('Reset Complete', 'Restart the app to reload fresh mock data.');
          },
        },
      ],
    );
  };

  const stats = [
    { label: 'Total Pieces', value: items.length, color: Colors.textPrimary },
    { label: 'Clean & Ready', value: items.filter((i) => i.status === 'clean').length, color: Colors.statusClean },
    { label: 'Needs Wash', value: items.filter((i) => i.status === 'worn' || i.status === 'in_laundry').length, color: Colors.statusWorn },
    { label: 'Batangas Dorm', value: items.filter((i) => i.location === 'batangas_dorm').length, color: Colors.accent },
    { label: 'Calamba Home', value: items.filter((i) => i.location === 'calamba_home').length, color: Colors.textSecondary },
    { label: 'In-Transit Bag', value: items.filter((i) => i.location === 'in_transit_bag').length, color: Colors.statusDrying },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <FadeSlideIn delay={0} fromY={12}>
            <View style={styles.header}>
              <Text style={styles.title}>Settings</Text>
              <Text style={styles.subtitle}>Configuration & wardrobe stats</Text>
            </View>
          </FadeSlideIn>

          {/* Supabase status card */}
          <FadeSlideIn delay={60} fromY={16}>
            <View style={styles.card}>
              <View style={styles.specular} />
              <View style={styles.cardHeader}>
                <View style={styles.cardIconBox}>
                  <Cloud size={20} color={Colors.textPrimary} strokeWidth={2} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Cloud Sync</Text>
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: isSupabaseConfigured ? Colors.statusClean : Colors.textInactive },
                      ]}
                    />
                    <Text style={[styles.statusText, { color: isSupabaseConfigured ? Colors.statusClean : Colors.textTertiary }]}>
                      {isSupabaseConfigured ? 'Connected to Supabase' : 'Local storage only'}
                    </Text>
                  </View>
                </View>
              </View>
              {!isSupabaseConfigured && (
                <Text style={styles.hint}>
                  Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.
                </Text>
              )}
            </View>
          </FadeSlideIn>

          {/* Stats */}
          <FadeSlideIn delay={120} fromY={16}>
            <View style={styles.card}>
              <View style={styles.specular} />
              <View style={styles.cardHeader}>
                <View style={styles.cardIconBox}>
                  <BarChart3 size={20} color={Colors.textPrimary} strokeWidth={2} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Wardrobe Stats</Text>
                  <Text style={styles.cardSubtitle}>{items.length} items tracked</Text>
                </View>
              </View>
              <View style={styles.statsGrid}>
                {stats.map((s) => (
                  <View key={s.label} style={styles.statCell}>
                    <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeSlideIn>

          {/* Data management */}
          <FadeSlideIn delay={180} fromY={16}>
            <View style={styles.card}>
              <View style={styles.specular} />
              <View style={styles.cardHeader}>
                <View style={styles.cardIconBox}>
                  <Layers size={20} color={Colors.textPrimary} strokeWidth={2} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Data Management</Text>
                </View>
              </View>
              <PressableScale onPress={handleClearData} scaleTo={0.96}>
                <View style={styles.dangerBtn}>
                  <Text style={styles.dangerBtnText}>Reset All Data</Text>
                </View>
              </PressableScale>
              <Text style={styles.hint}>
                Removes all items and reloads mock wardrobe data on next launch.
              </Text>
            </View>
          </FadeSlideIn>

          {/* About */}
          <FadeSlideIn delay={240} fromY={16}>
            <View style={[styles.card, styles.aboutCard]}>
              <View style={styles.specular} />
              <PressableScale scaleTo={0.92}>
                <View style={styles.aboutLogo}>
                  <Shirt size={32} color="#FFFFFF" strokeWidth={1.8} />
                </View>
              </PressableScale>
              <Text style={styles.aboutAppName}>DormDrobe</Text>
              <Text style={styles.aboutTagline}>Your multi-location wardrobe companion</Text>
              <Text style={styles.aboutDesc}>
                Designed for students who split their wardrobe between home and dorm. Built with Expo + React Native.
              </Text>
              <Text style={styles.version}>v1.0.0</Text>
            </View>
          </FadeSlideIn>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgBase },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: Spacing.xs,
    paddingTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  title: {
    color: Colors.textPrimary,
    ...Typography.title1,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textTertiary,
    fontSize: 14,
  },
  card: {
    backgroundColor: Colors.glassMid,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    position: 'relative',
    overflow: 'hidden',
  },
  specular: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: { flex: 1 },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  cardSubtitle: {
    color: Colors.textTertiary,
    fontSize: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  hint: {
    color: Colors.textTertiary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCell: {
    width: '30.5%',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.glassLight,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  statNum: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -1,
  },
  statLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 3,
    textAlign: 'center',
  },
  dangerBtn: {
    backgroundColor: 'rgba(255,69,58,0.10)',
    borderRadius: Radii.lg,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.30)',
    marginBottom: 4,
  },
  dangerBtnText: {
    color: '#FF6B6B',
    fontSize: 15,
    fontWeight: '600',
  },
  aboutCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  aboutLogo: {
    width: 68,
    height: 68,
    borderRadius: Radii.xl,
    backgroundColor: Colors.glassLight,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  aboutLogoText: { fontSize: 32 },
  aboutAppName: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  aboutTagline: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: Spacing.md,
  },
  aboutDesc: {
    color: Colors.textTertiary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  version: {
    color: Colors.textInactive,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
