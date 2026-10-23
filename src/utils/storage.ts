import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DB_NAME = 'DormDrobeDB';
const DB_VERSION = 1;
const STORE_NAME = 'wardrobe_store';

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Returns a cached IndexedDB database connection on Web.
 * IndexedDB provides gigabytes of storage, avoiding the strict 5MB quota
 * of browser localStorage (crucial for local cutout photos).
 */
function getIndexedDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    try {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported'));
      }
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
  return dbPromise;
}

async function idbGet(key: string): Promise<string | null> {
  const db = await getIndexedDB();
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await getIndexedDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
}

async function idbRemove(key: string): Promise<void> {
  const db = await getIndexedDB();
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Universal storage adapter:
 * - On Web: Prefers IndexedDB (unlimited, asynchronous, persists photos safely).
 *           Falls back to window.localStorage if IndexedDB is blocked.
 * - On Native (iOS/Android): uses @react-native-async-storage/async-storage.
 */
export const AppStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const idbVal = await idbGet(key);
        if (idbVal !== null) return idbVal;
      } catch {
        // Fall back to localStorage
      }
      try {
        if (window.localStorage) {
          return window.localStorage.getItem(key);
        }
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
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      let savedInIdb = false;
      try {
        await idbSet(key, value);
        savedInIdb = true;
      } catch {
        // Fall back to localStorage if IndexedDB fails
      }
      try {
        if (window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (err) {
        // If localStorage fails because of quota but IndexedDB succeeded, ignore the error
        if (!savedInIdb) {
          console.warn('[DormDrobe] Storage setItem failed across both IndexedDB and localStorage:', err);
        }
      }
      return;
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn('[DormDrobe] Storage setItem error:', e);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        await idbRemove(key);
      } catch {}
      try {
        if (window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch {}
      return;
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn('[DormDrobe] Storage removeItem error:', e);
    }
  },
};

/**
 * Tells Safari (iOS) and Chromium (Android) to mark storage as "persistent"
 * instead of "best-effort". When granted, iOS will not automatically purge
 * the PWA's cached data under storage pressure or periodic cleanups.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (
    Platform.OS === 'web' &&
    typeof navigator !== 'undefined' &&
    navigator.storage &&
    navigator.storage.persist
  ) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log('[DormDrobe] Storage persistence status:', isPersisted ? 'Persistent' : 'Best-effort');
      return isPersisted;
    } catch (e) {
      console.warn('[DormDrobe] Could not request storage persistence:', e);
    }
  }
  return false;
}

/**
 * Checks if persistent storage is already granted.
 */
export async function isStoragePersisted(): Promise<boolean> {
  if (
    Platform.OS === 'web' &&
    typeof navigator !== 'undefined' &&
    navigator.storage &&
    navigator.storage.persisted
  ) {
    try {
      return await navigator.storage.persisted();
    } catch {
      return false;
    }
  }
  return false;
}
