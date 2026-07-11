/**
 * @vitest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useLocalStorageState } from './useLocalStorageState';

describe('useLocalStorageState', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  describe('Initialization', () => {
    it('returns the default value when nothing exists in localStorage', () => {
      const { result } = renderHook(() => useLocalStorageState('test-key', 'default'));
      expect(result.current[0]).toBe('default');
      // After mount, useEffect runs and saves the default value
      expect(window.localStorage.getItem('test-key')).toBe(JSON.stringify('default'));
    });

    it('initializes from a valid value already stored in localStorage', () => {
      window.localStorage.setItem('test-key', JSON.stringify('stored-value'));
      const { result } = renderHook(() => useLocalStorageState('test-key', 'default'));
      expect(result.current[0]).toBe('stored-value');
    });

    it('correctly deserializes complex JSON values', () => {
      const storedObj = { a: 1, b: 'two' };
      window.localStorage.setItem('complex-key', JSON.stringify(storedObj));
      const { result } = renderHook(() => useLocalStorageState('complex-key', { a: 0, b: '' }));
      expect(result.current[0]).toEqual(storedObj);
    });
  });

  describe('State updates', () => {
    it('updates both the hook state and localStorage when state changes', () => {
      const { result } = renderHook(() => useLocalStorageState('test-key', 'default'));

      act(() => {
        result.current[1]('new-value');
      });

      expect(result.current[0]).toBe('new-value');
      expect(window.localStorage.getItem('test-key')).toBe(JSON.stringify('new-value'));
    });

    it('handles functional state updates correctly', () => {
      const { result } = renderHook(() => useLocalStorageState('count-key', 0));

      act(() => {
        result.current[1]((prev) => prev + 1);
      });

      expect(result.current[0]).toBe(1);
      expect(window.localStorage.getItem('count-key')).toBe(JSON.stringify(1));
    });
  });

  describe('Error handling', () => {
    it('falls back to default value if invalid JSON is in localStorage', () => {
      window.localStorage.setItem('invalid-key', '{ invalid json ]');
      const { result } = renderHook(() => useLocalStorageState('invalid-key', 'default'));

      expect(result.current[0]).toBe('default');
    });

    it('gracefully handles exceptions from localStorage.getItem()', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Access denied');
      });

      const { result } = renderHook(() => useLocalStorageState('error-key', 'fallback'));
      expect(result.current[0]).toBe('fallback');

      getItemSpy.mockRestore();
    });

    it('does not crash the hook when localStorage.setItem() throws', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Quota exceeded');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useLocalStorageState('error-set-key', 'initial'));

      act(() => {
        result.current[1]('new-value');
      });

      expect(result.current[0]).toBe('new-value'); // State still updates
      expect(consoleErrorSpy).toHaveBeenCalled(); // Should log the error

      setItemSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
