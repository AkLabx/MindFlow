
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizResult } from './QuizResult';
import { Question } from '../types';

// Mock Sub-components
vi.mock('./ui/DonutChart', () => ({
  DonutChart: () => <div data-testid="donut-chart">Chart</div>
}));

vi.mock('./ui/AnimatedCounter', () => ({
  AnimatedCounter: ({ value }: { value: number }) => <span>{value}</span>
}));

vi.mock('./QuizReview', () => ({
    QuizReview: ({ onBackToScore }: any) => (
        <div>
            <h1>Review Mode</h1>
            <button onClick={onBackToScore}>Back</button>
        </div>
    )
}));

// Mock UI Components
vi.mock('../../../components/ui/Card', () => ({
    Card: ({ children, onClick, className }: any) => (
        <div onClick={onClick} className={className} data-testid="card">
            {children}
        </div>
    )
}));

vi.mock('../../../components/Button/Button', () => ({
    Button: ({ children, onClick }: any) => (
        <button onClick={onClick}>{children}</button>
    )
}));

vi.mock('../../../components/ui/ProgressBar', () => ({
    ProgressBar: () => <div data-testid="progress-bar" />
}));

const mockQuestion: Question = {
  id: 'q1',
  sourceInfo: { examName: 'Test', examYear: 2024 },
  classification: { subject: 'Math', topic: 'Algebra' },
  tags: [],
  properties: { difficulty: 'Easy', questionType: 'MCQ' },
  question: '1+1?',
  options: ['1', '2'],
  correct: '2',
  explanation: {}
};

const mockQuestion2: Question = {
    ...mockQuestion,
    id: 'q2',
    classification: { subject: 'English', topic: 'Grammar' },
    question: 'A or B?',
    options: ['A', 'B'],
    correct: 'A',
};

describe('QuizResult', () => {
  const defaultProps = {
    score: 1,
    total: 2,
    questions: [mockQuestion, mockQuestion2],
    answers: { 'q1': '2', 'q2': 'B' }, // q1 Correct, q2 Incorrect
    timeTaken: { 'q1': 10, 'q2': 20 },
    bookmarks: [],
    onRestart: vi.fn(),
    onGoHome: vi.fn(),
  };

  it('renders summary correctly', () => {
    render(<QuizResult {...defaultProps} />);

    // Check Total Score
    expect(screen.getByText(/Result Summary/i)).toBeTruthy();
    expect(screen.getAllByText('1').length).toBeGreaterThan(0); // Score 1
  });

  it('calculates accuracy and displays grade', () => {
      render(<QuizResult {...defaultProps} />);

      // 1/2 = 50% -> Grade C "Keep Improving"
      expect(screen.getByText('50')).toBeTruthy();
      expect(screen.getByText(/Keep Improving/i)).toBeTruthy();
  });

  it('renders subject breakdown', () => {
      render(<QuizResult {...defaultProps} />);

      expect(screen.getByText('Math')).toBeTruthy();
      expect(screen.getByText('English')).toBeTruthy();
  });

  it('handles navigation to Review Mode', () => {
      render(<QuizResult {...defaultProps} />);

      // Click "All Questions"
      const reviewBtn = screen.getByText('All Questions');
      fireEvent.click(reviewBtn);

      expect(screen.getByText('Review Mode')).toBeTruthy();
  });

  it('handles navigation back from Review Mode', () => {
      render(<QuizResult {...defaultProps} />);

      // Go to review
      fireEvent.click(screen.getByText('All Questions'));

      // Go back
      fireEvent.click(screen.getByText('Back'));

      expect(screen.getByText(/Result Summary/i)).toBeTruthy();
  });

  it('calls onRestart and onGoHome', () => {
      render(<QuizResult {...defaultProps} />);

      fireEvent.click(screen.getByText('Retry'));
      expect(defaultProps.onRestart).toHaveBeenCalled();

      fireEvent.click(screen.getByText('Home'));
      expect(defaultProps.onGoHome).toHaveBeenCalled();
  });
});
