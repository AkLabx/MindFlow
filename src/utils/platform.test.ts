import { Capacitor } from '@capacitor/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isNativeApp, getPlatform } from './platform';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
    getPlatform: vi.fn(),
  },
}));

describe('platform utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isNativeApp', () => {
    it('returns true when Capacitor.isNativePlatform returns true', () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      expect(isNativeApp()).toBe(true);
      expect(Capacitor.isNativePlatform).toHaveBeenCalledTimes(1);
    });

    it('returns false when Capacitor.isNativePlatform returns false', () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      expect(isNativeApp()).toBe(false);
      expect(Capacitor.isNativePlatform).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPlatform', () => {
    it('returns "web" when Capacitor reports "web"', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('web');
      expect(getPlatform()).toBe('web');
      expect(Capacitor.getPlatform).toHaveBeenCalledTimes(1);
    });

    it('returns "ios" when Capacitor reports "ios"', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('ios');
      expect(getPlatform()).toBe('ios');
      expect(Capacitor.getPlatform).toHaveBeenCalledTimes(1);
    });

    it('returns "android" when Capacitor reports "android"', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android');
      expect(getPlatform()).toBe('android');
      expect(Capacitor.getPlatform).toHaveBeenCalledTimes(1);
    });
  });
});
