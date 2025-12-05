import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AiExplanationButton } from './AiExplanationButton';
import { Question } from '../types';

// Unit tests for AI Explanation Button
// Mock fetch
global.fetch = vi.fn();

const mockQuestion: Question = {
    id: '1',
    question: 'What is 2+2?',
    options: ['3', '4', '5'],
    correct: '4',
    explanation: { summary: 'Math' },
    sourceInfo: { examName: 'Test', examYear: 2024 },
    classification: { subject: 'Math', topic: 'Arithmetic' },
    tags: [],
    properties: { difficulty: 'Easy', questionType: 'MCQ' }
};

describe('AiExplanationButton', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        // Mock environment variable
        process.env.GOOGLE_AI_KEY = 'mock-key';
    });

    afterEach(() => {
        cleanup();
    });

    it('renders the button', () => {
        render(<AiExplanationButton question={mockQuestion} />);
        expect(screen.getByText(/Ask AI Tutor/i)).toBeTruthy();
    });

    it('opens modal and calls API on click', async () => {
        const mockResponse = {
            candidates: [{
                content: {
                    parts: [{
                        text: JSON.stringify({
                            explanation: "Four is correct.",
                            correct_answer: "4",
                            interesting_facts: ["Fact 1"],
                            fun_fact: "Fun"
                        })
                    }]
                }
            }]
        };

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        render(<AiExplanationButton question={mockQuestion} />);

        const button = screen.getByText(/Ask AI Tutor/i);
        fireEvent.click(button);

        expect(screen.getByText(/Consulting the AI Tutor/i)).toBeTruthy();

        await waitFor(() => {
            expect(screen.getByText(/AI Explanation/i)).toBeTruthy();
            expect(screen.getByText(/Four is correct/i)).toBeTruthy();
        });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('generativelanguage.googleapis.com'),
            expect.objectContaining({
                method: 'POST'
            })
        );
    });

    it('displays error when API key is missing', async () => {
        const originalEnv = process.env.GOOGLE_AI_KEY;
        delete process.env.GOOGLE_AI_KEY;

        render(<AiExplanationButton question={mockQuestion} />);

        fireEvent.click(screen.getByText(/Ask AI Tutor/i));

        await waitFor(() => {
            expect(screen.getByText(/AI API Key is missing/i)).toBeTruthy();
        });

        process.env.GOOGLE_AI_KEY = originalEnv;
    });
});
