// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useJSONDownloader } from './useJSONDownloader';

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
URL.createObjectURL = mockCreateObjectURL;
URL.revokeObjectURL = mockRevokeObjectURL;

// Mock document.createElement and body.appendChild/removeChild
const mockClick = vi.fn();
const mockAnchor = {
  click: mockClick,
  setAttribute: vi.fn(),
  style: {},
  href: '',
  download: '',
} as any;

describe('useJSONDownloader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('mock-url');
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useJSONDownloader());
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should download JSON and handle loading state', async () => {
    const { result } = renderHook(() => useJSONDownloader());
    const data = [{ id: 1, name: 'Test' }];
    const fileName = 'test.json';

    // Start download
    let promise: Promise<void>;
    act(() => {
      promise = result.current.downloadJSON(data, fileName);
    });

    // Should be generating immediately
    expect(result.current.isGenerating).toBe(true);
    expect(result.current.error).toBeNull();

    // Fast-forward time to simulate processing delay
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Wait for the promise to resolve
    await act(async () => {
      await promise!;
    });

    // Should be finished
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBeNull();

    // Verify DOM interactions
    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockAnchor.href).toBe('mock-url');
    expect(mockAnchor.download).toBe(fileName);
    expect(document.body.appendChild).toHaveBeenCalledWith(mockAnchor);
    expect(mockClick).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalledWith(mockAnchor);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-url');
  });

  it('should handle errors during download', async () => {
    const { result } = renderHook(() => useJSONDownloader());

    // Mock an error
    mockCreateObjectURL.mockImplementation(() => {
      throw new Error('Blob error');
    });

    let promise: Promise<void>;
    act(() => {
      promise = result.current.downloadJSON([], 'fail.json');
    });

    // Fast-forward time
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    await act(async () => {
      await promise!;
    });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toEqual(new Error('Blob error'));
  });
});
