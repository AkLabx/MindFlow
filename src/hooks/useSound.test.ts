/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSound } from './useSound';
import { useSettingsStore } from '../stores/useSettingsStore';

// Mock the settings store
vi.mock('../stores/useSettingsStore', () => ({
  useSettingsStore: vi.fn(),
}));

const mockPlay = vi.fn().mockResolvedValue(undefined);
const mockLoad = vi.fn();
const mockCloneNode = vi.fn();

class MockAudio {
  src: string;
  preload: string;
  volume: number;

  constructor(url: string) {
    this.src = url;
    this.preload = '';
    this.volume = 1;
  }

  load() {
    mockLoad();
  }

  cloneNode() {
    mockCloneNode();
    const clone = new MockAudio(this.src);
    clone.play = mockPlay;
    return clone;
  }

  play() {
    return mockPlay();
  }
}

describe('useSound', () => {
  let originalAudio: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    originalAudio = global.Audio;
    global.Audio = MockAudio as any;

    // Default mock implementation: sound is enabled
    (useSettingsStore as any).mockImplementation((selector: any) => {
      return selector({ isSoundEnabled: true });
    });

    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    global.Audio = originalAudio;
    vi.clearAllMocks();
  });

  it('should initialize Audio with correct url and preload setting', () => {
    renderHook(() => useSound('test.mp3'));

    // Audio is instantiated in useMemo, so we can't easily assert on the constructor if we don't track instances,
    // but we can check if `load()` was called since useEffect calls it.
    expect(mockLoad).toHaveBeenCalledTimes(1);
  });

  it('should reuse the same Audio instance if URL does not change', () => {
    const { rerender } = renderHook(({ url }) => useSound(url), {
      initialProps: { url: 'test.mp3' }
    });

    expect(mockLoad).toHaveBeenCalledTimes(1);

    // Rerender with same URL
    rerender({ url: 'test.mp3' });

    // Should NOT have triggered useEffect to load again since audio element is the same
    // Wait, useEffect has `[audio]` dependency. If `audio` doesn't change, `load` shouldn't be called again.
    expect(mockLoad).toHaveBeenCalledTimes(1);
  });

  it('should create a new Audio instance if URL changes', () => {
    const { rerender } = renderHook(({ url }) => useSound(url), {
      initialProps: { url: 'test1.mp3' }
    });

    expect(mockLoad).toHaveBeenCalledTimes(1);

    // Rerender with different URL
    rerender({ url: 'test2.mp3' });

    // Should trigger useEffect again because audio element changed
    expect(mockLoad).toHaveBeenCalledTimes(2);
  });

  it('should play cloned audio when sound is enabled', () => {
    const { result } = renderHook(() => useSound('test.mp3'));

    act(() => {
      result.current();
    });

    expect(mockCloneNode).toHaveBeenCalledTimes(1);
    expect(mockPlay).toHaveBeenCalledTimes(1);
  });

  it('should not play audio when sound is disabled', () => {
    (useSettingsStore as any).mockImplementation((selector: any) => {
      return selector({ isSoundEnabled: false });
    });

    const { result } = renderHook(() => useSound('test.mp3'));

    act(() => {
      result.current();
    });

    expect(mockCloneNode).not.toHaveBeenCalled();
    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('should not throw and should log warning if play rejects (e.g. autoplay policy)', async () => {
    const error = new Error('Autoplay prevented');
    mockPlay.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useSound('test.mp3'));

    // We need to await act if the error is handled async, but the play is sync fire-and-forget.
    // The promise rejection is caught inside the hook.
    act(() => {
      expect(() => result.current()).not.toThrow();
    });

    // We must wait a tick for the rejected promise handler to run
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(consoleWarnSpy).toHaveBeenCalledWith("Sound play failed (likely autoplay policy):", error);
  });
});
