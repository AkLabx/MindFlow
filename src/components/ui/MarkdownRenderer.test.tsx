/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MarkdownRenderer } from './MarkdownRenderer';

describe('MarkdownRenderer XSS Sanitization', () => {
  afterEach(() => {
    cleanup();
  });

  it('strips malicious script tags and inline event handlers via DOMPurify', () => {
    const payload = `Safe **Explanation** <script>window.__xss=true</script><img src="x" onerror="window.__imgXss=true" alt="pic" />`;
    const { container } = render(<MarkdownRenderer content={payload} />);

    expect(screen.getByText('Explanation')).toBeTruthy();
    expect(container.querySelector('script')).toBeNull();
    const img = container.querySelector('img');
    if (img) {
      expect(img.getAttribute('onerror')).toBeNull();
    }
    expect((window as any).__xss).toBeUndefined();
    expect((window as any).__imgXss).toBeUndefined();
  });

  it('renders GFM tables and KaTeX expressions cleanly', () => {
    const md = `| Concept | Value |\n| --- | --- |\n| Speed | High |\n\nInline formula: $x^2 + y^2$`;
    const { container } = render(<MarkdownRenderer content={md} />);

    expect(screen.getByText('Concept')).toBeTruthy();
    expect(screen.getByText('Speed')).toBeTruthy();
    expect(container.querySelector('table')).toBeTruthy();
  });
});
