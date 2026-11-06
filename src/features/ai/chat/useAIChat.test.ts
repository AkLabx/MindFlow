import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAIChat } from './useAIChat';
import { useExamContextStore } from '../../../stores/useExamContextStore';

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-token' } },
        error: null,
      }),
    },
  },
  SUPABASE_URL: 'https://mock.supabase.co',
}));

vi.mock('../../../lib/db', () => ({
  getChatConversations: vi.fn().mockResolvedValue([]),
  getChatMessages: vi.fn().mockResolvedValue([]),
  saveChatConversation: vi.fn().mockResolvedValue(undefined),
  saveChatMessage: vi.fn().mockResolvedValue(undefined),
  deleteChatConversation: vi.fn().mockResolvedValue(undefined),
  deleteChatMessagesAfter: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../auth/hooks/useProfileStats', () => ({
  useProfileStats: () => ({
    stats: {
      quizzesCompleted: 10,
      correctAnswers: 85,
      averageScore: 85,
      weakTopics: ['Trigonometry'],
      totalTimeSpentFormatted: '1h 20m',
    },
  }),
}));

describe('useAIChat Context Consumption Invariant (Constitution Section 10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useExamContextStore.setState({ activeExamId: 'ssc_cgl' });
  });

  it('automatically binds activeExam from useExamContextStore to SSC CGL by default', () => {
    const { result } = renderHook(() => useAIChat());

    expect(result.current.activeExam).toBeDefined();
    expect(result.current.activeExam.id).toBe('ssc_cgl');
    expect(result.current.activeExam.shortCode).toBe('SSC CGL');
    expect(result.current.activeExam.displayName).toBe('SSC CGL');
  });

  it('dynamically adapts activeExam when the user switches exams in the store', () => {
    const { result } = renderHook(() => useAIChat());

    expect(result.current.activeExam.id).toBe('ssc_cgl');

    act(() => {
      useExamContextStore.setState({ activeExamId: 'bpsc' });
    });

    expect(result.current.activeExam.id).toBe('bpsc');
    expect(result.current.activeExam.shortCode).toBe('BPSC');
    expect(result.current.activeExam.displayName).toBe('BPSC');
  });
});
