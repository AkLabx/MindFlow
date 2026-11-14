/**
 * @vitest-environment jsdom
 */
import React, { useRef, useState } from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { AnchoredPopover } from './AnchoredPopover';

const TestHarness: React.FC<{ initialOpen?: boolean; onCloseSpy?: () => void }> = ({
  initialOpen = false,
  onCloseSpy,
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleClose = () => {
    setIsOpen(false);
    onCloseSpy?.();
  };

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        Toggle Menu
      </button>
      <AnchoredPopover
        id="test-menu-popover"
        isOpen={isOpen}
        onClose={handleClose}
        triggerRef={triggerRef}
        anchorName="--test-menu-anchor"
      >
        <div role="menu">
          <button type="button" role="menuitem">
            Option 1
          </button>
        </div>
      </AnchoredPopover>
    </div>
  );
};

describe('AnchoredPopover', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    delete (HTMLElement.prototype as { popover?: unknown }).popover;
  });

  it('calls showPopover when Popover API is supported and renders children', () => {
    const showPopoverMock = vi.fn(function (this: HTMLElement) {
      this.setAttribute('data-popover-open', 'true');
    });
    const hidePopoverMock = vi.fn(function (this: HTMLElement) {
      this.removeAttribute('data-popover-open');
    });

    Object.defineProperty(HTMLElement.prototype, 'popover', {
      configurable: true,
      writable: true,
      value: '',
    });
    HTMLElement.prototype.showPopover = showPopoverMock;
    HTMLElement.prototype.hidePopover = hidePopoverMock;

    render(<TestHarness initialOpen />);

    expect(showPopoverMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Option 1')).toBeTruthy();
  });

  it('calls onClose and restores focus to triggerRef when Escape is pressed', async () => {
    const onCloseSpy = vi.fn();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });

    render(<TestHarness onCloseSpy={onCloseSpy} />);

    const trigger = screen.getByRole('button', { name: 'Toggle Menu' });
    fireEvent.click(trigger);

    const menuItem = screen.getByRole('menuitem', { name: 'Option 1' });
    menuItem.focus();
    expect(document.activeElement).toBe(menuItem);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onCloseSpy).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });
});
