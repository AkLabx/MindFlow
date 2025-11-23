
import { describe, it, expect } from 'vitest';
import { quizReducer, initialState } from './quizReducer';
import { QuizAction, QuizState } from '../types/store';
import { Question } from '../types/models';
import { APP_CONFIG } from '../../../constants/config';

// --- Mock Data ---
const mockQuestion: Question = {
  id: 'q1',
  sourceInfo: { examName: 'Test', examYear: 2024 },
  classification: { subject: 'Math', topic: 'Algebra' },
  tags: [],
  properties: { difficulty: 'Easy', questionType: 'MCQ' },
  question: '1 + 1 = ?',
  options: ['1', '2', '3', '4'],
  correct: '2',
  explanation: {}
};

const mockQuestion2: Question = {
  ...mockQuestion,
  id: 'q2',
  question: '2 + 2 = ?',
  correct: '4'
};

const mockFilters = {
  subject: [], topic: [], subTopic: [], difficulty: [],
  questionType: [], examName: [], examYear: [], examDateShift: [], tags: []
};

describe('quizReducer', () => {

  it('should handle initial state', () => {
    // We don't strictly test the reducer without action, but we can check initialState structure
    expect(initialState.status).toBe('intro');
    expect(initialState.score).toBe(0);
  });

  describe('START_QUIZ', () => {
    it('should initialize learning mode correctly', () => {
      const action: QuizAction = {
        type: 'START_QUIZ',
        payload: {
          questions: [mockQuestion],
          filters: mockFilters,
          mode: 'learning'
        }
      };
      const newState = quizReducer(initialState, action);

      expect(newState.status).toBe('quiz');
      expect(newState.mode).toBe('learning');
      expect(newState.activeQuestions).toHaveLength(1);
      expect(newState.remainingTimes['q1']).toBe(APP_CONFIG.TIMERS.LEARNING_MODE_DEFAULT);
      expect(newState.quizTimeRemaining).toBe(0);
    });

    it('should initialize mock mode correctly with global timer', () => {
      const action: QuizAction = {
        type: 'START_QUIZ',
        payload: {
          questions: [mockQuestion, mockQuestion2],
          filters: mockFilters,
          mode: 'mock'
        }
      };
      const newState = quizReducer(initialState, action);

      expect(newState.mode).toBe('mock');
      // Check global timer calculation (max of default or count * per_question)
      // Assuming default is small, it should be 2 * MOCK_MODE_DEFAULT_PER_QUESTION
      const expectedTime = Math.max(
        APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION,
        2 * APP_CONFIG.TIMERS.MOCK_MODE_DEFAULT_PER_QUESTION
      );
      expect(newState.quizTimeRemaining).toBe(expectedTime);
    });
  });

  describe('ANSWER_QUESTION', () => {
    const activeState: QuizState = {
      ...initialState,
      status: 'quiz',
      activeQuestions: [mockQuestion, mockQuestion2],
    };

    it('should increase score on correct answer', () => {
      const action: QuizAction = {
        type: 'ANSWER_QUESTION',
        payload: { questionId: 'q1', answer: '2', timeTaken: 5 }
      };
      const newState = quizReducer(activeState, action);

      expect(newState.answers['q1']).toBe('2');
      expect(newState.score).toBe(1);
      expect(newState.timeTaken['q1']).toBe(5);
    });

    it('should NOT increase score on incorrect answer', () => {
      const action: QuizAction = {
        type: 'ANSWER_QUESTION',
        payload: { questionId: 'q1', answer: '3', timeTaken: 5 }
      };
      const newState = quizReducer(activeState, action);

      expect(newState.answers['q1']).toBe('3');
      expect(newState.score).toBe(0);
    });

    it('should adjust score when changing from Incorrect to Correct', () => {
      // Start with incorrect answer
      const stateWithWrongAnswer = {
          ...activeState,
          answers: { 'q1': '3' },
          score: 0
      };

      const action: QuizAction = {
        type: 'ANSWER_QUESTION',
        payload: { questionId: 'q1', answer: '2', timeTaken: 2 }
      };
      const newState = quizReducer(stateWithWrongAnswer, action);

      expect(newState.answers['q1']).toBe('2');
      expect(newState.score).toBe(1); // 0 -> 1
    });

    it('should adjust score when changing from Correct to Incorrect', () => {
        // Start with correct answer
        const stateWithRightAnswer = {
            ...activeState,
            answers: { 'q1': '2' },
            score: 1
        };

        const action: QuizAction = {
          type: 'ANSWER_QUESTION',
          payload: { questionId: 'q1', answer: '3', timeTaken: 2 }
        };
        const newState = quizReducer(stateWithRightAnswer, action);

        expect(newState.answers['q1']).toBe('3');
        expect(newState.score).toBe(0); // 1 -> 0
      });
  });

  describe('Navigation', () => {
      const navigationState: QuizState = {
          ...initialState,
          status: 'quiz',
          activeQuestions: [mockQuestion, mockQuestion2],
          currentQuestionIndex: 0
      };

      it('should move to next question', () => {
          const newState = quizReducer(navigationState, { type: 'NEXT_QUESTION' });
          expect(newState.currentQuestionIndex).toBe(1);
      });

      it('should go to result when next is called on last question', () => {
        const lastQuestionState = { ...navigationState, currentQuestionIndex: 1 };
        const newState = quizReducer(lastQuestionState, { type: 'NEXT_QUESTION' });

        expect(newState.status).toBe('result');
    });

    it('should move to prev question', () => {
        const secondState = { ...navigationState, currentQuestionIndex: 1 };
        const newState = quizReducer(secondState, { type: 'PREV_QUESTION' });
        expect(newState.currentQuestionIndex).toBe(0);
    });

    it('should not move prev index below 0', () => {
        const newState = quizReducer(navigationState, { type: 'PREV_QUESTION' });
        expect(newState.currentQuestionIndex).toBe(0);
    });
  });

  describe('Flashcards', () => {
      it('should start flashcards flow', () => {
        const action: QuizAction = {
            type: 'START_FLASHCARDS',
            payload: { idioms: [], filters: mockFilters }
        };
        const newState = quizReducer(initialState, action);
        expect(newState.status).toBe('flashcards');
      });

      it('should finish flashcards flow', () => {
        const state: QuizState = { ...initialState, status: 'flashcards' };
        const newState = quizReducer(state, { type: 'FINISH_FLASHCARDS' });
        expect(newState.status).toBe('flashcards-complete');
      });
  });

  describe('Utilities', () => {
      it('should toggle bookmarks', () => {
          const action: QuizAction = { type: 'TOGGLE_BOOKMARK', payload: { questionId: 'q1' } };

          // Add bookmark
          const s1 = quizReducer(initialState, action);
          expect(s1.bookmarks).toContain('q1');

          // Remove bookmark
          const s2 = quizReducer(s1, action);
          expect(s2.bookmarks).not.toContain('q1');
      });

      it('should sync global timer', () => {
          const newState = quizReducer(initialState, { type: 'SYNC_GLOBAL_TIMER', payload: { time: 100 } });
          expect(newState.quizTimeRemaining).toBe(100);
      });
  });
});
