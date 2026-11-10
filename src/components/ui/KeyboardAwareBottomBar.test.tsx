/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { KeyboardAwareBottomBar } from './KeyboardAwareBottomBar';

describe('KeyboardAwareBottomBar', () => {
  const originalVisualViewport = window.visualViewport;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: 800,
    });
  });

  afterEach(() => {
    cleanup();
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: originalInnerHeight,
    });
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      writable: true,
      value: originalVisualViewport,
    });
  });

  it('applies max-w-3xl by default and removes it when fullWidth is true', () => {
    const { container, rerender } = render(
      <KeyboardAwareBottomBar>
        <span>Actions</span>
      </KeyboardAwareBottomBar>
    );
    const barDefault = container.firstChild as HTMLElement;
    expect(barDefault.className).toContain('max-w-3xl');
    expect(barDefault.className).toContain('mx-auto');

    rerender(
      <KeyboardAwareBottomBar fullWidth>
        <span>Actions</span>
      </KeyboardAwareBottomBar>
    );
    const barFull = container.firstChild as HTMLElement;
    expect(barFull.className).not.toContain('max-w-3xl');
    expect(screen.getByText('Actions')).toBeTruthy();
  });

  it('lifts fixed bar above overlaid soft keyboard on visualViewport resize', () => {
    const listeners: Record<string, Set<EventListener>> = {
      resize: new Set(),
      scroll: new Set(),
    };
    const mockViewport = {
      height: 800,
      offsetTop: 0,
      addEventListener: (ev: string, fn: EventListener) => listeners[ev]?.add(fn),
      removeEventListener: (ev: string, fn: EventListener) => listeners[ev]?.delete(fn),
    };

    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      writable: true,
      value: mockViewport,
    });

    const { container } = render(
      <KeyboardAwareBottomBar hasGlobalFooter>
        <span>Composer</span>
      </KeyboardAwareBottomBar>
    );
    const bar = container.firstChild as HTMLElement;
    expect(bar.style.bottom).toBe('');

    // Simulate soft keyboard opening (~300px height)
    act(() => {
      mockViewport.height = 500;
      listeners.resize.forEach((fn) => fn(new Event('resize')));
    });

    expect(bar.style.bottom).toBe('300px');

    // Simulate soft keyboard closing
    act(() => {
      mockViewport.height = 800;
      listeners.resize.forEach((fn) => fn(new Event('resize')));
    });

    expect(bar.style.bottom).toBe('');
  });
});
