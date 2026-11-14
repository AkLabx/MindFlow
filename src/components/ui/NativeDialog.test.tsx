/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { NativeDialog } from './NativeDialog';

describe('NativeDialog', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('opens using showModal(), exposes alertdialog/label semantics, and never locks body overflow', () => {
    render(
      <NativeDialog
        isOpen
        onClose={vi.fn()}
        role="alertdialog"
        ariaLabelledBy="dlg-title"
        dataTestId="native-dlg"
      >
        <h2 id="dlg-title">Delete Item</h2>
        <button type="button">Confirm</button>
      </NativeDialog>
    );

    const dialog = screen.getByTestId('native-dlg') as HTMLDialogElement;
    expect(dialog.tagName).toBe('DIALOG');
    expect(dialog.getAttribute('role')).toBe('alertdialog');
    expect(dialog.getAttribute('aria-labelledby')).toBe('dlg-title');
    expect(dialog.getAttribute('closedby')).toBe('any');
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(1);
    expect(document.body.style.overflow).toBe('');
  });

  it('blocks cancel dismissal when dismissible={false}', () => {
    const onClose = vi.fn();
    render(
      <NativeDialog
        isOpen
        onClose={onClose}
        dismissible={false}
        ariaLabel="Blocking dialog"
        dataTestId="locked-dlg"
      >
        <p>Required action</p>
      </NativeDialog>
    );

    const dialog = screen.getByTestId('locked-dlg') as HTMLDialogElement;
    expect(dialog.getAttribute('closedby')).toBe('none');

    const cancelEvent = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancelEvent);
    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('prevents closing and triggers onDirtyCloseAttempt when isDirty={true}', () => {
    const onClose = vi.fn();
    const onDirtyCloseAttempt = vi.fn();

    render(
      <NativeDialog
        isOpen
        onClose={onClose}
        isDirty
        onDirtyCloseAttempt={onDirtyCloseAttempt}
        ariaLabel="Dirty form"
        dataTestId="dirty-dlg"
      >
        <p>Unsaved form</p>
      </NativeDialog>
    );

    const dialog = screen.getByTestId('dirty-dlg') as HTMLDialogElement;
    expect(dialog.getAttribute('closedby')).toBe('closerequest');

    const cancelEvent = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancelEvent);
    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(onDirtyCloseAttempt).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('dismisses on backdrop click outside dialog rect in browsers lacking closedBy', () => {
    const onClose = vi.fn();
    render(
      <NativeDialog
        isOpen
        onClose={onClose}
        ariaLabel="Backdrop test"
        dataTestId="backdrop-dlg"
      >
        <div>Body</div>
      </NativeDialog>
    );

    const dialog = screen.getByTestId('backdrop-dlg') as HTMLDialogElement;
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      right: 400,
      top: 100,
      bottom: 400,
      width: 300,
      height: 300,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(dialog, { clientX: 20, clientY: 20 });
    fireEvent.click(dialog, { clientX: 20, clientY: 20, detail: 1 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
