/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { InfoTooltip } from './InfoTooltip';

describe('InfoTooltip', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders a 44x44px accessible button trigger and toggles help text in fallback mode', () => {
    render(<InfoTooltip label="Topics" text="Filter questions by syllabus topic." />);

    const trigger = screen.getByRole('button', { name: 'More about Topics' });
    expect(trigger.className).toContain('min-w-[44px]');
    expect(trigger.className).toContain('min-h-[44px]');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Filter questions by syllabus topic.')).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('Filter questions by syllabus topic.')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
