
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchQuestionMetadata, fetchQuestionsByIds } from './questionService';
import { supabase } from '../../../lib/supabase';

// Mock Supabase Client
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(),
    })),
  },
}));

describe('questionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchQuestionMetadata', () => {
    it('should transform DB rows into Metadata objects', async () => {
      const mockData = [
        {
          v1_id: '1',
          examName: 'Test Exam',
          examYear: 2023,
          subject: 'Math',
          difficulty: 'Easy',
          tags: ['Algebra'],
        },
      ];

      // Mock Chain: from -> select -> range -> data
      const rangeMock = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const selectMock = vi.fn().mockReturnValue({ range: rangeMock });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });
      (supabase.from as any).mockImplementation(fromMock);

      // Mock Count query first
      const countSelectMock = vi.fn().mockResolvedValue({ count: 1, error: null });
      (supabase.from as any)
        .mockReturnValueOnce({ select: countSelectMock }) // First call for count
        .mockReturnValueOnce({ select: selectMock });     // Second call for data

      const result = await fetchQuestionMetadata();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].sourceInfo.examName).toBe('Test Exam');
      // Verify heavy fields are empty
      expect(result[0].question).toBe('');
      expect(result[0].options).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      const selectMock = vi.fn().mockRejectedValue(new Error('DB Error'));
      (supabase.from as any).mockReturnValue({ select: selectMock });

      await expect(fetchQuestionMetadata()).rejects.toThrow('DB Error');
    });
  });

  describe('fetchQuestionsByIds', () => {
    it('should return full question details', async () => {
      const mockData = [
        {
          v1_id: '1',
          question: '<p>Test?</p>',
          options: ['A', 'B'],
          correct: 'A',
          explanation: { summary: 'Because.' }
        }
      ];

      const inMock = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const selectMock = vi.fn().mockReturnValue({ in: inMock });
      (supabase.from as any).mockReturnValue({ select: selectMock });

      const result = await fetchQuestionsByIds(['1']);

      expect(result).toHaveLength(1);
      expect(result[0].question).toBe('<p>Test?</p>');
      expect(result[0].options).toEqual(['A', 'B']);
      expect(result[0].explanation.summary).toBe('Because.');
    });

    it('should return empty array if no IDs provided', async () => {
      const result = await fetchQuestionsByIds([]);
      expect(result).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });
});
