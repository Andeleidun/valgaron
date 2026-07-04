import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AsyncStringStorageAdapter } from '@valgaron/platform';

export const asyncStorageAdapter: AsyncStringStorageAdapter = {
  async read(key) {
    return AsyncStorage.getItem(key);
  },
  async write(key, value) {
    try {
      await AsyncStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
};
