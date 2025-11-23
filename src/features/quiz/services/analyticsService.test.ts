
import { describe, it, expect, vi } from 'vitest';
import { logEvent } from './analyticsService';
import { supabase } from '../../../lib/supabase';

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(),
    })),
  },
}));

describe('analyticsService', () => {
  it('should insert event into supabase', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({ insert: insertMock });

    await logEvent('quiz_started', { mode: 'mock' });

    expect(supabase.from).toHaveBeenCalledWith('analytics_events');
    expect(insertMock).toHaveBeenCalledWith({
      event_name: 'quiz_started',
      event_data: { mode: 'mock' }
    });
  });

  it('should catch errors silently', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const insertMock = vi.fn().mockRejectedValue(new Error('Network Error'));
    (supabase.from as any).mockReturnValue({ insert: insertMock });

    await logEvent('app_installed');

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
