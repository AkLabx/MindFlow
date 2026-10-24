import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { triggerAppRecovery, _resetInternalRecoveryCall } from './RecoveryManager';
import { useRecoveryStore } from '../../stores/useRecoveryStore';
import { setRecoveryPromise, setRecoveringState } from './recoveryContext';
import { supabase } from '../supabase';

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null }))
    }))
  },
}));

describe('RecoveryManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useRecoveryStore.getState().resetStatus();
    setRecoveryPromise(null);
    setRecoveringState(false);
    _resetInternalRecoveryCall();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('single-flight: returns the same promise for concurrent calls', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: true } });

    // Fake online
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

    const p1 = triggerAppRecovery('test 1');
    const p2 = triggerAppRecovery('test 2');

    vi.runAllTimers();
    const res1 = await p1;
    const res2 = await p2;

    expect(res1).toBe(true);
    expect(res2).toBe(true);

    // getSession should only be called once despite two triggers
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
  });

  it('re-entrancy guard: prevents nested recoveries', async () => {
      // Simulate that an internal recovery call is active
      (supabase.auth.getSession as any).mockImplementation(async () => {
           // If something inside getSession hits the interceptor and tries to recover again:
           const reentrantPromise = triggerAppRecovery('nested');
           const reentrantResult = await reentrantPromise;
           expect(reentrantResult).toBe(false); // Guard blocked it
           return { data: { session: true } };
      });

      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      const p = triggerAppRecovery('outer');
      vi.runAllTimers();

      const res = await p;
      expect(res).toBe(true);
  });

  it('state machine transitions properly on success', async () => {
       (supabase.auth.getSession as any).mockResolvedValue({ data: { session: true } });
       Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

       const p = triggerAppRecovery();

       await Promise.resolve(); // Microtask tick for performRecovery invocation
       expect(['CHECKING', 'RECOVERING']).toContain(useRecoveryStore.getState().status);

       vi.runAllTimers();
       await p;

       expect(useRecoveryStore.getState().status).toBe('RECOVERED');
  });
});
