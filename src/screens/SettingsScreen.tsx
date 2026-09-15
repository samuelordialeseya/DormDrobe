import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured } from '../config/supabase';
import { useWardrobe } from '../context/WardrobeContext';

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

  const locationCounts = {
    calamba: items.filter((it) => it.location === 'calamba_home').length,
    batangas: items.filter((it) => it.location === 'batangas_dorm').length,
    bag: items.filter((it) => it.location === 'in_transit_bag').length,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>App configuration & stats</Text>

        {/* Supabase status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>☁️  Supabase Connection</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isSupabaseConfigured ? '#34D399' : '#6B7280' },
              ]}
            />
            <Text style={styles.statusText}>
              {isSupabaseConfigured ? 'Connected' : 'Not configured (using local storage)'}
            </Text>
          </View>
          {!isSupabaseConfigured && (
            <Text style={styles.hint}>
              Create a .env file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to
              enable cloud sync.
            </Text>
          )}
        </View>

        {/* Wardrobe stats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊  Wardrobe Stats</Text>
          <View style={styles.statGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{items.length}</Text>
              <Text style={styles.statLabel}>Total Items</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{locationCounts.calamba}</Text>
              <Text style={styles.statLabel}>🏠 Calamba</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{locationCounts.batangas}</Text>
              <Text style={styles.statLabel}>🏫 Batangas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{locationCounts.bag}</Text>
              <Text style={styles.statLabel}>🎒 In Bag</Text>
            </View>
          </View>
        </View>

        {/* Data management */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🗄️  Data Management</Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleClearData}>
            <Text style={styles.dangerBtnText}>Reset All Data</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>
            Removes all items and reloads mock wardrobe on next launch.
          </Text>
        </View>

        {/* About */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ℹ️  About DormDrobe</Text>
          <Text style={styles.aboutText}>
            Multi-location wardrobe manager for students who split their lives between
            home and dorm. Built with Expo + React Native.
          </Text>
          <Text style={styles.version}>v1.0.0 (Starter)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13131A',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  cardTitle: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    color: '#D1D5DB',
    fontSize: 13,
  },
  hint: {
    color: '#6B7280',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '45%',
    backgroundColor: '#13131A',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  statNumber: {
    color: '#C4B5FD',
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  dangerBtn: {
    backgroundColor: '#F8717122',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F87171',
    marginBottom: 8,
  },
  dangerBtnText: {
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '600',
  },
  aboutText: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 20,
  },
  version: {
    color: '#4B5563',
    fontSize: 11,
    marginTop: 8,
  },
});
