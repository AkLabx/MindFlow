import { QuizPlugin } from '../quizPlugin';
import { SynonymWord } from '../../types';
import { supabase } from '../../../../lib/supabase';

export const synonymPlugin: QuizPlugin<SynonymWord, string> = {
  type: 'synonym',

  async loadQuestions(): Promise<SynonymWord[]> {
    try {
      const { data, error } = await supabase
        .from('Synonyms')
        .select('*');

      if (error) throw error;

      // Safely map and parse JSON columns if they come back as strings or JSONB
      return (data || []).map(row => ({
        ...row,
        synonyms: typeof row.synonyms === 'string' ? JSON.parse(row.synonyms) : row.synonyms,
        antonyms: typeof row.antonyms === 'string' ? JSON.parse(row.antonyms) : row.antonyms,
        confusable_with: typeof row.confusable_with === 'string' ? JSON.parse(row.confusable_with) : row.confusable_with
      })) as SynonymWord[];
    } catch (e) {
      console.error("Failed to load synonym plugin data from Supabase", e);
      return [];
    }
  },

  validateAnswer(question: SynonymWord, answer: string): boolean {
    if (!question.synonyms) return false;
    return question.synonyms.some(s => s.text.toLowerCase() === answer.toLowerCase());
  },

  getNextQuestionIndex(questions: SynonymWord[], currentIndex: number): number {
    return currentIndex + 1;
  }
};
