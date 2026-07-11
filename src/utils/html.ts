/**
 * Utility functions for safely handling HTML content.
 */

/**
 * Safely extracts plain text from an HTML string without executing scripts
 * or fetching resources (which can happen if assigned to `innerHTML`).
 * It uses the native DOMParser.
 *
 * @param html The HTML string to extract text from.
 * @returns The plain text content extracted from the HTML.
 */
export const stripHtml = (html: string | null | undefined): string => {
    if (!html) return '';

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        return doc.body.textContent || doc.body.innerText || '';
    } catch (e) {
        // Fallback for non-browser environments or parser errors
        // Note: Simple regex strip as a fallback; DOMParser is preferred.
        console.error('DOMParser failed in stripHtml', e);
        return html.replace(/<[^>]*>?/gm, '');
    }
};
