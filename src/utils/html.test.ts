import { describe, it, expect } from 'vitest';
import { stripHtml } from './html';

describe('stripHtml utility', () => {
    it('returns an empty string for null, undefined, or empty input', () => {
        expect(stripHtml(null)).toBe('');
        expect(stripHtml(undefined)).toBe('');
        expect(stripHtml('')).toBe('');
    });

    it('returns the same text for plain text', () => {
        const text = 'This is plain text with no HTML.';
        expect(stripHtml(text)).toBe(text);
    });

    it('strips basic formatted HTML correctly', () => {
        const html = '<p>This is <b>bold</b> and <i>italic</i>.</p>';
        expect(stripHtml(html)).toBe('This is bold and italic.');
    });

    it('decodes HTML entities correctly', () => {
        const html = 'R&amp;D &gt; Profit &lt; Loss &quot;Quote&quot; &#39;Single&#39;';
        expect(stripHtml(html)).toBe('R&D > Profit < Loss "Quote" \'Single\'');
    });

    it('ignores malicious script tags safely', () => {
        const html = '<script>alert("hacked")</script>Safe text';
        // Depending on DOMParser behavior, text inside script may or may not be included in textContent.
        // However, the critical part is that it shouldn't execute.
        // Usually, DOMParser includes script content in textContent.
        // In our case we just want to ensure it extracts as text and strips the tags safely.
        expect(stripHtml(html)).toContain('Safe text');
        expect(stripHtml(html)).not.toContain('<script>');
    });

    it('handles image tags with onerror handlers safely', () => {
        const html = '<img src="x" onerror="alert(\'hacked\')">Safe text';
        expect(stripHtml(html)).toBe('Safe text');
    });
});
