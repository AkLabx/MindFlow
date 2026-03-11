import { QuizPlugin } from '../quizPlugin';
import { SynonymWord } from '../../types';

export const synonymPlugin: QuizPlugin<SynonymWord, string> = {
  type: 'synonym',

  async loadQuestions(): Promise<SynonymWord[]> {
    // Dynamic import of massive JSON to prevent main bundle bloat!
    try {
      const module = await import('../../data/processed_synonyms.json');
      const data = module.default as unknown as SynonymWord[];
      return data;
    } catch (e) {
      console.error("Failed to load synonym plugin data", e);
      return [];
    }
  },

  validateAnswer(question: SynonymWord, answer: string): boolean {
    // Flashcard validation usually isn't strict string matching,
    // but if they take a synonym quiz, we could check if answer is in synonyms array.
    if (!question.synonyms) return false;
    return question.synonyms.some(s => s.text.toLowerCase() === answer.toLowerCase());
  },

  getNextQuestionIndex(questions: SynonymWord[], currentIndex: number): number {
    return currentIndex + 1;
  }
};
