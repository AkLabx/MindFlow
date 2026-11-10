/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseCreatedAtMs } from './syncService';
import { db } from './db';

describe('parseCreatedAtMs (Phase 7 Timestamp Normalization)', () => {
  it('returns finite numbers directly including epoch zero', () => {
    expect(parseCreatedAtMs(0)).toBe(0);
    expect(parseCreatedAtMs(1700000000000)).toBe(1700000000000);
  });

  it('parses numeric strings and ISO-8601 timestamps accurately', () => {
    expect(parseCreatedAtMs('1700000000123')).toBe(1700000000123);
    expect(parseCreatedAtMs('2026-11-10T05:30:00.000Z')).toBe(Date.parse('2026-11-10T05:30:00.000Z'));
  });

  it('falls back to current timestamp on invalid inputs', () => {
    const before = Date.now();
    const res = parseCreatedAtMs('not-a-date');
    const after = Date.now();
    expect(res).toBeGreaterThanOrEqual(before);
    expect(res).toBeLessThanOrEqual(after);
  });
});

describe('db.enforceStorageQuota (Phase 8 Storage Hygiene)', () => {
  const originalStorage = navigator.storage;
  const originalCaches = (window as any).caches;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: originalStorage,
    });
    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: originalCaches,
    });
  });

  it('skips eviction when storage usage is at or below 80% threshold', async () => {
    const estimateMock = vi.fn().mockResolvedValue({ usage: 400, quota: 1000 });
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: { estimate: estimateMock },
    });
    const keysSpy = vi.fn();
    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: { keys: keysSpy, delete: vi.fn() },
    });

    const res = await db.enforceStorageQuota();
    expect(res).toEqual({ checked: true, evicted: false, ratio: 0.4 });
    expect(keysSpy).not.toHaveBeenCalled();
  });

  it('evicts ephemeral audio/pdf caches when usage exceeds 80% while keeping workbox precache', async () => {
    const estimateMock = vi
      .fn()
      .mockResolvedValueOnce({ usage: 900, quota: 1000 })
      .mockResolvedValueOnce({ usage: 500, quota: 1000 });

    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: { estimate: estimateMock },
    });

    const deleteCacheMock = vi.fn().mockResolvedValue(true);
    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: {
        keys: vi.fn().mockResolvedValue(['voice-tts-cache-v1', 'pdf-export-temp', 'workbox-precache-v2']),
        delete: deleteCacheMock,
      },
    });

    vi.spyOn(db, 'pruneStaleActiveSessions').mockResolvedValue(2);

    const res = await db.enforceStorageQuota();
    expect(res.checked).toBe(true);
    expect(res.evicted).toBe(true);
    expect(deleteCacheMock).toHaveBeenCalledWith('voice-tts-cache-v1');
    expect(deleteCacheMock).toHaveBeenCalledWith('pdf-export-temp');
    expect(deleteCacheMock).not.toHaveBeenCalledWith('workbox-precache-v2');
  });
});
