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
import { Colors, Radii, Spacing, Typography } from '../theme/theme';

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
            await AsyncStorage.removeItem('@dormdrobe/clothing');
            Alert.alert('Done', 'Data cleared. Restart the app to reload mock data.');
          },
        },
      ],
    );
  };

  const stats = [
    { label: 'Total Items', value: items.length, color: Colors.textPrimary },
    { label: 'Clean', value: items.filter((i) => i.status === 'clean').length, color: Colors.statusClean },
    { label: 'Worn', value: items.filter((i) => i.status === 'worn').length, color: Colors.statusWorn },
    { label: 'Calamba', value: items.filter((i) => i.location === 'calamba_home').length, color: Colors.textSecondary },
    { label: 'Batangas', value: items.filter((i) => i.location === 'batangas_dorm').length, color: Colors.textSecondary },
    { label: 'In Bag', value: items.filter((i) => i.location === 'in_transit_bag').length, color: Colors.textSecondary },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Configuration & wardrobe stats</Text>
          </View>

          {/* Supabase status card */}
          <View style={styles.card}>
            <View style={styles.specular} />
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>☁️</Text>
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

          {/* Stats */}
          <View style={styles.card}>
            <View style={styles.specular} />
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📊</Text>
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

          {/* Data management */}
          <View style={styles.card}>
            <View style={styles.specular} />
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>🗄️</Text>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Data Management</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.dangerBtn} onPress={handleClearData} activeOpacity={0.72}>
              <Text style={styles.dangerBtnText}>Reset All Data</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>
              Removes all items and reloads mock wardrobe data on next launch.
            </Text>
          </View>

          {/* About */}
          <View style={[styles.card, styles.aboutCard]}>
            <View style={styles.specular} />
            <View style={styles.aboutLogo}>
              <Text style={styles.aboutLogoText}>👕</Text>
            </View>
            <Text style={styles.aboutAppName}>DormDrobe</Text>
            <Text style={styles.aboutTagline}>Your multi-location wardrobe companion</Text>
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
  cardIcon: { fontSize: 22 },
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
