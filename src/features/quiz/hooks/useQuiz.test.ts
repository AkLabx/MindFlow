
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuiz } from './useQuiz';
import { APP_CONFIG } from '../../../constants/config';
import * as analyticsService from '../services/analyticsService';

// Mock Analytics
vi.mock('../services/analyticsService', () => ({
  logEvent: vi.fn(),
}));

// Mock LocalStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useQuiz Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useQuiz());
    expect(result.current.state.status).toBe('intro');
    expect(result.current.state.score).toBe(0);
  });

  it('should start quiz and log analytics', () => {
    const { result } = renderHook(() => useQuiz());
    const questions = [{ id: 'q1', correct: 'A' } as any];
    const filters = { subject: ['Math'] } as any;

    act(() => {
      result.current.startQuiz(questions, filters, 'learning');
    });

    expect(result.current.state.status).toBe('quiz');
    expect(result.current.state.mode).toBe('learning');
    expect(analyticsService.logEvent).toHaveBeenCalledWith('quiz_started', expect.any(Object));
  });

  it('should persist session to localStorage when quiz is active', () => {
    const { result } = renderHook(() => useQuiz());
    const questions = [{ id: 'q1' } as any];
    const filters = {} as any;

    act(() => {
      result.current.startQuiz(questions, filters, 'learning');
    });

    // Check if it was saved
    const saved = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.QUIZ_SESSION);
    expect(saved).not.toBeNull();
    expect(JSON.parse(saved!).status).toBe('quiz');
  });

  it('should clear session when going home', () => {
    // Pre-fill storage to simulate active session
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.QUIZ_SESSION, JSON.stringify({ status: 'quiz' }));

    const { result } = renderHook(() => useQuiz());

    act(() => {
      result.current.goHome();
    });

    expect(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.QUIZ_SESSION)).toBeNull();
  });

  it('should derive progress correctly', () => {
    const { result } = renderHook(() => useQuiz());
    const questions = [{ id: 'q1' }, { id: 'q2' }] as any;
    const filters = {} as any;

    act(() => {
      result.current.startQuiz(questions, filters);
    });

    // Q1 (Index 0) of 2 -> 50%
    expect(result.current.progress).toBe(50);

    act(() => {
      result.current.nextQuestion();
    });

    // Q2 (Index 1) of 2 -> 100%
    expect(result.current.progress).toBe(100);
  });
});
