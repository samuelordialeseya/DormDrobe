import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured } from '../config/supabase';
import { useWardrobe } from '../context/WardrobeContext';
import BackgroundOrbs from '../components/BackgroundOrbs';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';

export default function SettingsScreen() {
  const { items } = useWardrobe();

  const handleClearData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your clothing items and reload mock data on next launch. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('@dormdrobe/clothing');
            Alert.alert('Done', 'Data cleared. Restart the app to reload mock data.');
          },
        },
      ],
    );
  };

  const stats = {
    total: items.length,
    clean: items.filter((i) => i.status === 'clean').length,
    worn: items.filter((i) => i.status === 'worn').length,
    calamba: items.filter((i) => i.location === 'calamba_home').length,
    batangas: items.filter((i) => i.location === 'batangas_dorm').length,
    bag: items.filter((i) => i.location === 'in_transit_bag').length,
  };

  const statItems = [
    { label: 'Total Items', value: stats.total, color: Colors.purple300, bg: 'rgba(139,92,246,0.12)' },
    { label: '✦ Clean', value: stats.clean, color: Colors.statusClean, bg: 'rgba(52,211,153,0.12)' },
    { label: '◆ Worn', value: stats.worn, color: Colors.statusWorn, bg: 'rgba(251,191,36,0.12)' },
    { label: '🏠 Calamba', value: stats.calamba, color: Colors.blue400, bg: 'rgba(96,165,250,0.12)' },
    { label: '🏫 Batangas', value: stats.batangas, color: Colors.purple400, bg: 'rgba(167,139,250,0.12)' },
    { label: '🎒 In Bag', value: stats.bag, color: Colors.textSecondary, bg: Colors.glassLight },
  ];

  return (
    <View style={styles.container}>
      <BackgroundOrbs variant="mixed" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appName}>DormDrobe</Text>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Configuration & wardrobe stats</Text>
          </View>

          {/* Supabase status card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBg, { backgroundColor: isSupabaseConfigured ? 'rgba(52,211,153,0.15)' : Colors.glassLight }]}>
                <Text style={styles.cardIcon}>☁️</Text>
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
              <View style={styles.hintBox}>
                <Text style={styles.hint}>
                  Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file to enable cloud sync.
                </Text>
              </View>
            )}
          </View>

          {/* Stats grid */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBg, { backgroundColor: 'rgba(139,92,246,0.15)' }]}>
                <Text style={styles.cardIcon}>📊</Text>
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Wardrobe Stats</Text>
                <Text style={styles.cardSubtitle}>All {items.length} items tracked</Text>
              </View>
            </View>
            <View style={styles.statsGrid}>
              {statItems.map((s) => (
                <View key={s.label} style={[styles.statCell, { backgroundColor: s.bg }]}>
                  <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Data management */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBg, { backgroundColor: 'rgba(248,113,113,0.12)' }]}>
                <Text style={styles.cardIcon}>🗄️</Text>
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Data Management</Text>
                <Text style={styles.cardSubtitle}>Reset or export your wardrobe</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.dangerBtn} onPress={handleClearData} activeOpacity={0.75}>
              <View style={styles.dangerBtnGlow} />
              <Text style={styles.dangerBtnText}>⚠  Reset All Data</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>
              Removes all items and reloads mock wardrobe data on next launch.
            </Text>
          </View>

          {/* About */}
          <View style={[styles.card, styles.aboutCard]}>
            <View style={styles.aboutLogo}>
              <Text style={styles.aboutLogoText}>👕</Text>
            </View>
            <Text style={styles.aboutAppName}>DormDrobe</Text>
            <Text style={styles.aboutTagline}>
              Your multi-location wardrobe companion
            </Text>
            <Text style={styles.aboutDesc}>
              Designed for students who split their wardrobe between home and dorm. Built with Expo + React Native.
            </Text>
            <Text style={styles.version}>v1.0.0</Text>
          </View>
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
    paddingHorizontal: Spacing.xs,
    paddingTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  appName: {
    color: Colors.purple300,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    color: Colors.textPrimary,
    ...Typography.title1,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textSecondary,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardIconBg: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  cardIcon: {
    fontSize: 22,
  },
  cardHeaderText: {
    flex: 1,
  },
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
  hintBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  hint: {
    color: Colors.textTertiary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
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
    backgroundColor: 'rgba(248,113,113,0.14)',
    borderRadius: Radii.lg,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.40)',
    marginBottom: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  dangerBtnGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(252,165,165,0.3)',
  },
  dangerBtnText: {
    color: '#FCA5A5',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  aboutCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  aboutLogo: {
    width: 72,
    height: 72,
    borderRadius: Radii.xl,
    backgroundColor: 'rgba(139,92,246,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(139,92,246,0.40)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Colors.purple500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  aboutLogoText: {
    fontSize: 34,
  },
  aboutAppName: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  aboutTagline: {
    color: Colors.purple300,
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
