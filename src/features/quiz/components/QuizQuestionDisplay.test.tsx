
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizQuestionDisplay } from './QuizQuestionDisplay';
import { Question } from '../types';

const mockQuestion: Question = {
  id: 'q1',
  sourceInfo: { examName: 'SSC CGL', examYear: 2022 },
  classification: { subject: 'English', topic: 'Grammar' },
  tags: [],
  properties: { difficulty: 'Medium', questionType: 'MCQ' },
  question: '<p>What is the capital of France?</p>',
  options: ['London', 'Berlin', 'Paris', 'Madrid'],
  correct: 'Paris',
  explanation: {}
};

const mockQuestionHi: Question = {
    ...mockQuestion,
    question_hi: '<p>Hindi Question</p>',
    options_hi: ['L', 'B', 'P', 'M']
};

describe('QuizQuestionDisplay', () => {
  const onAnswerSelect = vi.fn();

  it('renders question text correctly', () => {
    render(
      <QuizQuestionDisplay
        question={mockQuestion}
        onAnswerSelect={onAnswerSelect}
        zoomLevel={1}
      />
    );
    expect(screen.getByText('What is the capital of France?')).toBeTruthy();
  });

  it('renders all options', () => {
    render(
      <QuizQuestionDisplay
        question={mockQuestion}
        onAnswerSelect={onAnswerSelect}
        zoomLevel={1}
      />
    );
    expect(screen.getByText('London')).toBeTruthy();
    expect(screen.getByText('Paris')).toBeTruthy();
  });

  it('renders Hindi question if available', () => {
      render(
          <QuizQuestionDisplay
            question={mockQuestionHi}
            onAnswerSelect={onAnswerSelect}
            zoomLevel={1}
          />
      );
      expect(screen.getByText('Hindi Question')).toBeTruthy();
  });

  it('calls onAnswerSelect when option is clicked', () => {
    render(
      <QuizQuestionDisplay
        question={mockQuestion}
        onAnswerSelect={onAnswerSelect}
        zoomLevel={1}
      />
    );

    fireEvent.click(screen.getByText('Paris'));
    expect(onAnswerSelect).toHaveBeenCalledWith('Paris');
  });

  it('sanitizes dangerous HTML', () => {
    const dangerousQuestion = {
        ...mockQuestion,
        question: '<img src=x onerror=alert(1) />Safe Text'
    };

    const { container } = render(
        <QuizQuestionDisplay
          question={dangerousQuestion}
          onAnswerSelect={onAnswerSelect}
          zoomLevel={1}
        />
    );

    // The onerror attribute should be stripped
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('onerror')).toBeNull();
    expect(screen.getByText('Safe Text')).toBeTruthy();
  });

  it('displays user time in review mode', () => {
      render(
        <QuizQuestionDisplay
            question={mockQuestion}
            onAnswerSelect={onAnswerSelect}
            zoomLevel={1}
            userTime={45}
        />
      );
      expect(screen.getByText('45s')).toBeTruthy();
  });
});
