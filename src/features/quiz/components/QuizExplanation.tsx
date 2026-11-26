import React from 'react';
import { Explanation } from '../types';
import { CheckCircle2, XCircle, Lightbulb, FileText } from 'lucide-react';
import { MarkdownRenderer } from '../../../components/ui/MarkdownRenderer';
import { AdminQuestionImage } from './AdminQuestionImage';
import {
    ExplanationLanguageMode,
    parseExplanationPayload,
    splitBilingualMarkdown,
} from '../utils/explanationParser';

/**
 * A resilient component to display detailed explanations for a question.
 * Supports structured Explanation objects (v3.0 5-key bilingual spec), stringified JSON, and raw Markdown strings.
 *
 * @param {object} props - Component props.
 * @param {Explanation | string | null} [props.explanation] - The explanation data.
 * @param {number} [props.zoomLevel] - Optional font size scaling.
 * @param {string} [props.questionId] - The ID of the question.
 * @param {string} [props.imageUrl] - Initial explanation image URL.
 * @param {ExplanationLanguageMode} [props.languageMode] - Display language filter ('bilingual' | 'english' | 'hindi').
 * @returns {JSX.Element} The rendered explanation blocks.
 */
export function QuizExplanation({
    explanation,
    zoomLevel,
    questionId,
    imageUrl,
    languageMode = 'bilingual',
}: {
    explanation?: Explanation | string | null;
    zoomLevel?: number;
    questionId?: string;
    imageUrl?: string;
    languageMode?: ExplanationLanguageMode;
}) {
    // --- Universal Explanation Adapter ---
    let parsedExplanation: Explanation = {};
    let isPlainString = false;
    let plainStringContent = '';

    if (typeof explanation === 'string') {
        const trimmed = explanation.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            const parsed = parseExplanationPayload(trimmed);
            if (Object.keys(parsed).length > 0) {
                parsedExplanation = parsed;
            } else {
                isPlainString = true;
                plainStringContent = trimmed;
            }
        } else if (trimmed) {
            isPlainString = true;
            plainStringContent = trimmed;
        }
    } else if (explanation && typeof explanation === 'object') {
        parsedExplanation = parseExplanationPayload(explanation);
    }

    /**
     * Cleans text by removing redundant top-level emojis and UI-duplicated headers.
     */
    const cleanText = (text?: string) => {
        if (!text) return "";

        const localized = splitBilingualMarkdown(text, languageMode);
        if (!localized) return "";

        // 1. Remove outer anchor emojis (keep sub-section emojis inside fact)
        const cleaned = localized.replace(/✅|❌|📝|💡/g, '');

        // 2. List of headers to strip from the content as they are already shown in UI
        const redundantHeaders = [
            "Why this is correct",
            "Why other options are incorrect",
            "Concluding Note",
            "Key Takeaway",
            "Interesting Fact",
            "Interesting Fact / रोचक तथ्य",
            "Did you know?",
            "यह सही क्यों है",
            "अन्य विकल्प गलत क्यों हैं",
            "निष्कर्ष",
            "रोचक तथ्य"
        ];

        // 3. Filter lines
        const lines = cleaned.split('\n');
        const filteredLines = lines.filter(line => {
            const plainLine = line.replace(/\*\*|__/g, '').replace(/^#+\s*/, '').trim();
            return !redundantHeaders.some(header => {
                const h = header.toLowerCase();
                const l = plainLine.toLowerCase();
                return l === h || l === `${h}:` || l === `${h} :`;
            });
        });

        return filteredLines.join('\n').trim();
    };

    const summaryContent = splitBilingualMarkdown(parsedExplanation.summary, languageMode);
    const analysisCorrectContent = cleanText(parsedExplanation.analysis_correct);
    const analysisIncorrectContent = cleanText(parsedExplanation.analysis_incorrect);
    const conclusionContent = cleanText(parsedExplanation.conclusion);
    const factContent = cleanText(parsedExplanation.fact);

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
                        <MarkdownRenderer content={splitBilingualMarkdown(plainStringContent, languageMode)} className="!text-current [&_p]:mb-1" />
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
            {analysisCorrectContent && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl p-4 flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="text-[0.95em] min-w-0 flex-1">
                        <h4 className="font-bold text-green-800 dark:text-green-300 mb-1.5">Why this is correct</h4>
                        <div className="text-gray-700 dark:text-gray-200 leading-relaxed">
                            <MarkdownRenderer content={analysisCorrectContent} className="!text-current" />
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Incorrect Options Analysis - Red Theme */}
            {analysisIncorrectContent && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl p-4 flex gap-3 items-start">
                    <XCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-[0.95em] min-w-0 flex-1">
                        <h4 className="font-bold text-red-800 dark:text-red-300 mb-1.5">Why other options are incorrect</h4>
                        <div className="text-gray-700 dark:text-gray-200 leading-relaxed">
                            <MarkdownRenderer content={analysisIncorrectContent} className="!text-current" />
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Concluding Note / Key Takeaway - Blue Theme */}
            {conclusionContent && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4 flex gap-3 items-start">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-[0.95em] min-w-0 flex-1">
                        <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-1.5">Key Takeaway</h4>
                        <div className="text-gray-700 dark:text-gray-200 leading-relaxed">
                            <MarkdownRenderer content={conclusionContent} className="!text-current" />
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Interesting Fact - Yellow Theme */}
            {factContent && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-4 flex gap-3 items-start">
                    <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-[0.95em] min-w-0 flex-1">
                        <h4 className="font-bold text-yellow-800 dark:text-yellow-300 mb-1.5">Did you know?</h4>
                        <div className="text-yellow-900 dark:text-gray-200 leading-relaxed">
                            <MarkdownRenderer content={factContent} className="!text-current" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
