import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { triggerHaptic } from './haptics';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

// Mock Capacitor core
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
  },
}));

// Mock Capacitor haptics
vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    impact: vi.fn(),
    notification: vi.fn(),
    vibrate: vi.fn(),
  },
  ImpactStyle: {
    Light: 'LIGHT',
    Medium: 'MEDIUM',
    Heavy: 'HEAVY',
  },
  NotificationType: {
    Success: 'SUCCESS',
    Warning: 'WARNING',
    Error: 'ERROR',
  },
}));

describe('triggerHaptic', () => {
  let mockVibrate: any;
  let consoleWarnSpy: any;
  let originalWindow: any;
  let originalNavigator: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockVibrate = vi.fn();

    // Set up window and navigator
    originalWindow = global.window;
    originalNavigator = global.navigator;

    // @ts-ignore
    global.window = {};

    Object.defineProperty(global, 'navigator', {
      value: { vibrate: mockVibrate },
      writable: true,
      configurable: true,
    });

    // Mock console.warn
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    global.window = originalWindow;

    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });

    consoleWarnSpy.mockRestore();
  });

  describe('Native Platform', () => {
    beforeEach(() => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    });

    it('should call Haptics.impact with Light style by default', async () => {
      await triggerHaptic();
      expect(Haptics.impact).toHaveBeenCalledWith({ style: ImpactStyle.Light });
    });

    it('should call Haptics.impact with Light style', async () => {
      await triggerHaptic('light');
      expect(Haptics.impact).toHaveBeenCalledWith({ style: ImpactStyle.Light });
    });

    it('should call Haptics.impact with Medium style', async () => {
      await triggerHaptic('medium');
      expect(Haptics.impact).toHaveBeenCalledWith({ style: ImpactStyle.Medium });
    });

    it('should call Haptics.impact with Heavy style', async () => {
      await triggerHaptic('heavy');
      expect(Haptics.impact).toHaveBeenCalledWith({ style: ImpactStyle.Heavy });
    });

    it('should call Haptics.notification with Success type', async () => {
      await triggerHaptic('success');
      expect(Haptics.notification).toHaveBeenCalledWith({ type: NotificationType.Success });
    });

    it('should call Haptics.notification with Warning type', async () => {
      await triggerHaptic('warning');
      expect(Haptics.notification).toHaveBeenCalledWith({ type: NotificationType.Warning });
    });

    it('should call Haptics.notification with Error type', async () => {
      await triggerHaptic('error');
      expect(Haptics.notification).toHaveBeenCalledWith({ type: NotificationType.Error });
    });

    it('should call Haptics.vibrate with duration for numeric pattern', async () => {
      await triggerHaptic(100);
      expect(Haptics.vibrate).toHaveBeenCalledWith({ duration: 100 });
    });

    it('should call Haptics.vibrate with first element of array pattern', async () => {
      await triggerHaptic([200, 100]);
      expect(Haptics.vibrate).toHaveBeenCalledWith({ duration: 200 });
    });
  });

  describe('Web Platform', () => {
    beforeEach(() => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    });

    it('should call navigator.vibrate with numeric pattern', async () => {
      await triggerHaptic(150);
      expect(mockVibrate).toHaveBeenCalledWith(150);
    });

    it('should call navigator.vibrate with array pattern', async () => {
      await triggerHaptic([150, 50, 150]);
      expect(mockVibrate).toHaveBeenCalledWith([150, 50, 150]);
    });

    it('should call navigator.vibrate with default 50 for string pattern', async () => {
      await triggerHaptic('success');
      expect(mockVibrate).toHaveBeenCalledWith(50);
    });

    it('should call navigator.vibrate with default 50 for default pattern', async () => {
      await triggerHaptic();
      expect(mockVibrate).toHaveBeenCalledWith(50);
    });

    it('should safely do nothing if navigator.vibrate is unsupported', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });
      await expect(triggerHaptic(100)).resolves.not.toThrow();
    });

    it('should safely do nothing if window is undefined', async () => {
      // @ts-ignore
      global.window = undefined;
      await expect(triggerHaptic(100)).resolves.not.toThrow();
      expect(mockVibrate).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should catch errors from Haptics API and log a warning', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      const testError = new Error('Test error');
      vi.mocked(Haptics.impact).mockRejectedValueOnce(testError);

      await expect(triggerHaptic('light')).resolves.not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Haptics failed:', testError);
    });
  });
});
