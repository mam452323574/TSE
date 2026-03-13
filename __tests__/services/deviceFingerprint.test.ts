import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getDeviceFingerprint,
  getDeviceName,
  clearDeviceFingerprint,
} from '@/services/deviceFingerprint';

// Mock expo-device
jest.mock('expo-device', () => ({
  brand: 'Samsung',
  modelName: 'Galaxy S21',
  osName: 'Android',
  osVersion: '12',
  isDevice: true,
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    version: '1.0.0',
  },
}));

describe('deviceFingerprint', () => {
  const FINGERPRINT_STORAGE_KEY = '@healthscan_device_fingerprint';
  const originalPlatform = Platform.OS;

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    Object.defineProperty(Platform, 'Version', { value: '12', configurable: true });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalPlatform, configurable: true });
  });

  describe('getDeviceFingerprint', () => {
    it('returns stored fingerprint if exists', async () => {
      const storedFingerprint = 'android-abc123-12345678';
      await AsyncStorage.setItem(FINGERPRINT_STORAGE_KEY, storedFingerprint);

      const result = await getDeviceFingerprint();

      expect(result).toBe(storedFingerprint);
    });

    it('generates and stores new fingerprint if none exists', async () => {
      const result = await getDeviceFingerprint();

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^android-/);

      const storedValue = await AsyncStorage.getItem(FINGERPRINT_STORAGE_KEY);
      expect(storedValue).toBe(result);
    });

    it('generates fingerprint with correct format', async () => {
      const result = await getDeviceFingerprint();

      // Format: platform-hash-uuid8chars
      const parts = result.split('-');
      expect(parts.length).toBeGreaterThanOrEqual(3);
      expect(parts[0]).toBe('android');
    });

    it('generates different fingerprints on multiple calls without storage', async () => {
      // Clear any stored fingerprint after first call
      const first = await getDeviceFingerprint();
      await AsyncStorage.removeItem(FINGERPRINT_STORAGE_KEY);
      const second = await getDeviceFingerprint();

      // They should be different because UUID is regenerated
      expect(first).not.toBe(second);
    });

    it('generates new fingerprint on AsyncStorage read error', async () => {
      // Mock AsyncStorage.getItem to throw an error
      const getItemSpy = jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('Read failed'));

      const result = await getDeviceFingerprint();

      expect(result).toBeTruthy();
      expect(result).toMatch(/^android-/);
      
      getItemSpy.mockRestore();
    });

    it('still returns fingerprint on AsyncStorage write error', async () => {
      // Mock AsyncStorage.setItem to throw an error
      const setItemSpy = jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Write failed'));

      const result = await getDeviceFingerprint();

      // Should still return a fingerprint even if storage fails
      expect(result).toBeTruthy();
      expect(result).toMatch(/^android-/);
      
      setItemSpy.mockRestore();
    });

    it('handles both read and write errors gracefully', async () => {
      const getItemSpy = jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('Read failed'));
      const setItemSpy = jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Write failed'));

      // Should not throw, just generate a new fingerprint
      const result = await getDeviceFingerprint();

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      
      getItemSpy.mockRestore();
      setItemSpy.mockRestore();
    });
  });

  describe('getDeviceName', () => {
    it('returns device info on Android', () => {
      Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });

      const result = getDeviceName();

      expect(result).toContain('Samsung');
      expect(result).toContain('Galaxy S21');
    });

    it('returns device info on iOS', () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });

      const result = getDeviceName();

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('returns browser info on web', () => {
      Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
      
      // Mock navigator
      const originalNavigator = global.navigator;
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 Chrome/100.0' },
        configurable: true,
      });

      const result = getDeviceName();

      expect(result).toBe('Chrome Browser');

      // Restore navigator
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        configurable: true,
      });
    });

    it('returns Web Browser for unknown browser on web', () => {
      Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
      
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Unknown Browser/1.0' },
        configurable: true,
      });

      const result = getDeviceName();

      expect(result).toBe('Web Browser');
    });
  });

  describe('clearDeviceFingerprint', () => {
    it('removes stored fingerprint', async () => {
      await AsyncStorage.setItem(FINGERPRINT_STORAGE_KEY, 'test-fingerprint');

      await clearDeviceFingerprint();

      const storedValue = await AsyncStorage.getItem(FINGERPRINT_STORAGE_KEY);
      // AsyncStorage mock may return undefined instead of null after removal
      expect(storedValue == null).toBe(true);
    });

    it('does not throw if no fingerprint stored', async () => {
      await expect(clearDeviceFingerprint()).resolves.not.toThrow();
    });
  });
});
