import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Universal storage adapter:
 * - On Web: uses window.localStorage directly (synchronous, 100% reliable, zero native module errors)
 * - On Native (iOS/Android): uses @react-native-async-storage/async-storage
 */
export const AppStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch {
        // storage quota or incognito fallback
      }
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn('[DormDrobe] Storage setItem error:', e);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch {
        // ignore
      }
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn('[DormDrobe] Storage removeItem error:', e);
    }
  },
};
