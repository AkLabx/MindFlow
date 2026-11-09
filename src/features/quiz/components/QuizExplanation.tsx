import React from 'react';
import { Explanation } from '../types';
import { CheckCircle2, XCircle, Lightbulb, FileText } from 'lucide-react';
import { MarkdownRenderer } from '../../../components/ui/MarkdownRenderer';
import { AdminQuestionImage } from './AdminQuestionImage';

/**
 * A resilient component to display detailed explanations for a question.
 * Supports structured Explanation objects, stringified JSON, and raw Markdown strings.
 *
 * @param {object} props - Component props.
 * @param {Explanation | string | null} [props.explanation] - The explanation data.
 * @param {number} [props.zoomLevel] - Optional font size scaling.
 * @param {string} [props.questionId] - The ID of the question.
 * @param {string} [props.imageUrl] - Initial explanation image URL.
 * @returns {JSX.Element} The rendered explanation blocks.
 */
export function QuizExplanation({
    explanation,
    zoomLevel,
    questionId,
    imageUrl
}: {
    explanation?: Explanation | string | null;
    zoomLevel?: number;
    questionId?: string;
    imageUrl?: string;
}) {
    // --- Universal Explanation Adapter ---
    let parsedExplanation: Explanation = {};
    let isPlainString = false;
    let plainStringContent = '';

    if (typeof explanation === 'string') {
        const trimmed = explanation.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                parsedExplanation = JSON.parse(trimmed);
            } catch {
                isPlainString = true;
                plainStringContent = trimmed;
            }
        } else if (trimmed) {
            isPlainString = true;
            plainStringContent = trimmed;
        }
    } else if (explanation && typeof explanation === 'object') {
        parsedExplanation = explanation;
    }

    /**
     * Cleans text by removing emojis and redundant headers found in source data.
     */
    const cleanText = (text?: string) => {
        if (!text) return "";

        // 1. Remove specific emojis used in source data
        const cleaned = text.replace(/✅|❌|📝|💡/g, '');

        // 2. List of headers to strip from the content as they are already shown in UI
        const redundantHeaders = [
            "Why this is correct",
            "Why other options are incorrect",
            "Concluding Note",
            "Key Takeaway",
            "Interesting Fact",
            "Did you know?",
            "यह सही क्यों है",
            "अन्य विकल्प गलत क्यों हैं",
            "निष्कर्ष",
            "रोचक तथ्य"
        ];

        // 3. Filter lines
        const lines = cleaned.split('\n');
        const filteredLines = lines.filter(line => {
            const plainLine = line.replace(/\*\*|__/g, '').trim();
            return !redundantHeaders.some(header => {
                const h = header.toLowerCase();
                const l = plainLine.toLowerCase();
                return l === h || l === `${h}:` || l === `${h} :`;
            });
        });

        return filteredLines.join('\n').trim();
    };

    /**
     * Extracts English text from mixed summaries, but safely falls back
     * to the original summary if English extraction leaves nothing (e.g. Hindi PYQs).
     */
    const getSummaryContent = (summary?: string) => {
        if (!summary) return null;
        const englishOnly = summary.split('\n')
            .filter(line => {
                const trimmed = line.trim();
                return !/[\u0900-\u097F]/.test(trimmed) && !trimmed.startsWith('सही उत्तर');
            })
            .join('\n')
            .trim();

        // If English-only lines exist, return them; otherwise fallback to full summary
        return englishOnly || summary.trim();
    };

    const summaryContent = getSummaryContent(parsedExplanation.summary);

    return (
        <div
            className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out font-poppins selectable-text"
            style={{ fontSize: zoomLevel ? `${zoomLevel}rem` : undefined }}
        >
            {/* Plain Markdown String Fallback */}
            {isPlainString && (
                <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm border-l-4 border-l-indigo-500">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Explanation</span>
                    </h3>
                    <div className="text-gray-800 dark:text-gray-100 text-[0.95em] leading-relaxed">
                        <MarkdownRenderer content={plainStringContent} className="!text-current [&_p]:mb-1" />
                    </div>
                </div>
            )}

            {/* Answer Summary Block */}
            {summaryContent && (
                <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm border-l-4 border-l-indigo-500">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Answer</h3>
                    <div className="font-bold text-indigo-700 dark:text-indigo-400 text-[1em] whitespace-pre-line">
                        <MarkdownRenderer content={summaryContent} className="!text-current [&_p]:mb-0" />
                    </div>
                </div>
            )}

            {/* Explanation Image Diagram Controller & Lightbox */}
            {questionId && (
                <AdminQuestionImage
                    questionId={questionId}
                    kind="explanation"
                    initialImageUrl={imageUrl}
                />
            )}

            {/* 1. Correct Answer Analysis - Green Theme */}
            {parsedExplanation.analysis_correct && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl p-4 flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="text-[0.95em]">
                        <h4 className="font-bold text-green-800 dark:text-green-300 mb-1.5">Why this is correct</h4>
                        <div className="text-gray-700 dark:text-gray-200 leading-relaxed">
                            <MarkdownRenderer content={cleanText(parsedExplanation.analysis_correct)} className="!text-current" />
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Incorrect Options Analysis - Red Theme */}
            {parsedExplanation.analysis_incorrect && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl p-4 flex gap-3 items-start">
                    <XCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-[0.95em]">
                        <h4 className="font-bold text-red-800 dark:text-red-300 mb-1.5">Why other options are incorrect</h4>
                        <div className="text-gray-700 dark:text-gray-200 leading-relaxed">
                            <MarkdownRenderer content={cleanText(parsedExplanation.analysis_incorrect)} className="!text-current" />
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Key Takeaway - Blue Theme */}
            {parsedExplanation.conclusion && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4 flex gap-3 items-start">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-[0.95em]">
                        <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-1.5">Key Takeaway</h4>
                        <div className="text-gray-700 dark:text-gray-200 leading-relaxed">
                            <MarkdownRenderer content={cleanText(parsedExplanation.conclusion)} className="!text-current" />
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Interesting Fact - Yellow Theme */}
            {parsedExplanation.fact && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-4 flex gap-3 items-start">
                    <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-[0.95em]">
                        <h4 className="font-bold text-yellow-800 dark:text-yellow-300 mb-1.5">Did you know?</h4>
                        <div className="text-yellow-900 dark:text-gray-200 leading-relaxed">
                            <MarkdownRenderer content={cleanText(parsedExplanation.fact)} className="!text-current" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
