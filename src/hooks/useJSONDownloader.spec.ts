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
    let promise: Promise<any>;
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
    let downloadResult: any;
    await act(async () => {
      downloadResult = await promise!;
    });

    // Should be finished
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBeNull();

    // Verify DOM interactions (now removed in favor of returning info)
    expect(mockCreateObjectURL).toHaveBeenCalled();

    expect(downloadResult).toBeDefined();
    expect(downloadResult.url).toBe('mock-url');
    expect(downloadResult.fileName).toBe(fileName);
    expect(downloadResult.blob).toBeDefined();

    expect(document.createElement).not.toHaveBeenCalled();
    expect(document.body.appendChild).not.toHaveBeenCalled();
    expect(mockClick).not.toHaveBeenCalled();
    expect(document.body.removeChild).not.toHaveBeenCalled();
  });

  it('should handle errors during download', async () => {
    const { result } = renderHook(() => useJSONDownloader());

    // Mock an error
    mockCreateObjectURL.mockImplementation(() => {
      throw new Error('Blob error');
    });

    let promise: Promise<any>;
    act(() => {
      promise = result.current.downloadJSON([], 'fail.json');
    });

    // Fast-forward time
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    let downloadResult: any;
    await act(async () => {
      downloadResult = await promise!;
    });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toEqual(new Error('Blob error'));
    expect(downloadResult).toBeUndefined();
  });
});
