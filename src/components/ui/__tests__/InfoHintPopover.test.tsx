/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { InfoHintPopover } from '../InfoHintPopover';

describe('InfoHintPopover', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    delete (HTMLElement.prototype as { showPopover?: unknown }).showPopover;
    delete (HTMLElement.prototype as { hidePopover?: unknown }).hidePopover;
  });

  it('renders an accessible 44x44px ! trigger button', () => {
    render(
      <InfoHintPopover
        title="Target Exam Context"
        purpose="Controls which exam syllabus appears across your dashboard."
      />
    );

    const trigger = screen.getByRole('button', { name: 'Help: Target Exam Context' });
    expect(trigger.getAttribute('type')).toBe('button');
    expect(trigger.className).toContain('min-h-[44px]');
    expect(trigger.className).toContain('min-w-[44px]');
    expect(trigger.textContent).toContain('!');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('stops event propagation so parent card onClick does not fire when ! or Close is clicked', () => {
    const parentOnClick = vi.fn();

    render(
      <div onClick={parentOnClick}>
        <InfoHintPopover
          title="Mock Hub Filter"
          purpose="Filters mock series by your active exam."
        />
      </div>
    );

    const trigger = screen.getByRole('button', { name: 'Help: Mock Hub Filter' });
    fireEvent.click(trigger);
    expect(parentOnClick).not.toHaveBeenCalled();

    const closeBtn = screen.getByRole('button', { name: 'Close help' });
    fireEvent.click(closeBtn);
    expect(parentOnClick).not.toHaveBeenCalled();
  });

  it('opens and closes popover content (title, purpose, studentVisibility, example) in fallback mode', () => {
    render(
      <InfoHintPopover
        title="Pinned Exams"
        purpose="Quick-switch between your preferred competitive exams."
        studentVisibility="Shown at the top of the Student Home Dashboard and Profile Preferences."
        example="Pin UPSC CSE and BPSC to compare daily mocks."
      />
    );

    expect(screen.queryByRole('dialog')).toBeNull();

    const trigger = screen.getByRole('button', { name: 'Help: Pinned Exams' });
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('popover')).toBe('auto');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    expect(screen.getByRole('heading', { name: 'Pinned Exams' })).toBeTruthy();
    expect(screen.getByText('Purpose')).toBeTruthy();
    expect(screen.getByText('Quick-switch between your preferred competitive exams.')).toBeTruthy();
    expect(screen.getByText('Where students see this')).toBeTruthy();
    expect(
      screen.getByText('Shown at the top of the Student Home Dashboard and Profile Preferences.')
    ).toBeTruthy();
    expect(screen.getByText('Example / Tip')).toBeTruthy();
    expect(screen.getByText('Pin UPSC CSE and BPSC to compare daily mocks.')).toBeTruthy();

    const closeBtn = screen.getByRole('button', { name: 'Close help' });
    expect(closeBtn.getAttribute('type')).toBe('button');
    expect(closeBtn.className).toContain('min-h-[44px]');
    expect(closeBtn.className).toContain('min-w-[44px]');

    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('invokes native showPopover and hidePopover when Popover API is supported', () => {
    const showPopoverMock = vi.fn(function (this: HTMLElement) {
      this.setAttribute('data-popover-open', 'true');
    });
    const hidePopoverMock = vi.fn(function (this: HTMLElement) {
      this.removeAttribute('data-popover-open');
    });

    HTMLElement.prototype.showPopover = showPopoverMock;
    HTMLElement.prototype.hidePopover = hidePopoverMock;

    render(
      <InfoHintPopover
        title="Native Top Layer"
        purpose="Verifies native Popover API integration."
      />
    );

    const trigger = screen.getByRole('button', { name: 'Help: Native Top Layer' });
    fireEvent.click(trigger);
    expect(showPopoverMock).toHaveBeenCalledTimes(1);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    const closeBtn = screen.getByRole('button', { name: 'Close help' });
    fireEvent.click(closeBtn);
    expect(hidePopoverMock).toHaveBeenCalledTimes(1);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});
