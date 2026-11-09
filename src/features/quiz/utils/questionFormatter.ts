/**
 * Question Text Formatter & Sanitizer
 * 
 * Performs proactive cleanup of question strings to ensure perfect rendering in Quiz UI:
 * 1. Corrects OCR-generated Roman numeral artifacts (e.g., 'List 11' -> 'List II', 'List 111' -> 'List III').
 * 2. Cleans up common option OCR typos (e.g., 'D-l' -> 'D-1').
 * 3. Gracefully preserves linebreaks for structured matching lists.
 */

export function formatQuestionText(text?: string | null): string {
    if (!text) return '';

    let formatted = text;

    // 1. Correct OCR Roman numeral confusions for lists & columns
    formatted = formatted
        .replace(/\bList\s+11\b/gi, 'List II')
        .replace(/\bList\s+111\b/gi, 'List III')
        .replace(/\bList-11\b/gi, 'List-II')
        .replace(/\bList-111\b/gi, 'List-III')
        .replace(/\bColumn\s+11\b/gi, 'Column II')
        .replace(/\bColumn\s+111\b/gi, 'Column III')
        .replace(/\bसूची\s+11\b/gi, 'सूची II')
        .replace(/\bसूची\s+111\b/gi, 'सूची III')
        .replace(/\bसूची-11\b/gi, 'सूची-II')
        .replace(/\bसूची-111\b/gi, 'सूची-III');

    // 2. If the text contains matching sections squashed without newlines, inject formatting
    if (!formatted.includes('|') && !formatted.includes('\n')) {
        // Break List I / List II into clear sections if flattened
        formatted = formatted
            .replace(/\s+(List\s+[I|1|II|2|A|B])/gi, '\n\n$1')
            .replace(/\s+(Column\s+[I|1|II|2|A|B])/gi, '\n\n$1')
            .replace(/\s+(सूची\s+[I|1|II|2|A|B])/gi, '\n\n$1')
            .replace(/\s+(कॉलम\s+[I|1|II|2|A|B])/gi, '\n\n$1')
            .replace(/\s+([I|V|X]+\.\s+[A-Za-z0-9])/g, '\n- $1')
            .replace(/\s+([1-9]\.\s+[A-Za-z0-9])/g, '\n- $1');
    }

    return formatted;
}

/**
 * Sanitizes option text, fixing common OCR digit/letter mixups.
 */
export function formatOptionText(option?: string | null): string {
    if (!option) return '';

    return option
        .replace(/([A-Da-d])-l\b/g, '$1-1') // Replace letter l with digit 1 in code matching (e.g. D-l -> D-1)
        .replace(/(^|[\s,])11-([0-9a-zA-Z])/g, '$1II-$2')
        .replace(/(^|[\s,])111-([0-9a-zA-Z])/g, '$1III-$2')
        .replace(/(^|[\s,])1-([0-9a-zA-Z])/g, '$1I-$2')
        .trim();
}
