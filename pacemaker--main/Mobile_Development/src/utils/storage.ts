/**
 * src/utils/storage.ts — Safe AsyncStorage wrapper
 *
 * Prevents "Native module is null" errors by falling back to 
 * memory storage if the native driver fails to initialize.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory fallback for environments where native AsyncStorage fails
const memoryStore: Record<string, string> = {};

export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn(`[Storage] AsyncStorage.getItem failed for ${key}, using memory:`, e);
      return memoryStore[key] || null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[Storage] AsyncStorage.setItem failed for ${key}, using memory:`, e);
      memoryStore[key] = value;
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn(`[Storage] AsyncStorage.removeItem failed for ${key}, using memory:`, e);
      delete memoryStore[key];
    }
  },

  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.warn('[Storage] AsyncStorage.clear failed, clearing memory:', e);
      Object.keys(memoryStore).forEach(k => delete memoryStore[k]);
    }
  }
};

export default storage;
