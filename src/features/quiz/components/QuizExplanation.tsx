import React from 'react';
import { Explanation } from '../types';
import { CheckCircle2, XCircle, Lightbulb, FileText } from 'lucide-react';

/**
 * A component to display detailed explanations for a question.
 *
 * It parses the Explanation object and renders sections for:
 * - Answer Summary (English only)
 * - Correct Analysis (Green)
 * - Incorrect Analysis (Red)
 * - Key Takeaway (Blue)
 * - Fun Fact (Yellow)
 *
 * Includes text cleaning logic to strip redundant headers and symbols from the source data.
 *
 * @param {object} props - Component props.
 * @param {Explanation} props.explanation - The explanation data object.
 * @param {number} [props.zoomLevel] - Optional font size scaling.
 * @returns {JSX.Element} The rendered explanation blocks.
 */
export function QuizExplanation({ explanation, zoomLevel }: { explanation: Explanation, zoomLevel?: number }) {

    /**
     * Cleans text by removing emojis and redundant headers found in the source data.
     * @param {string} text - The raw text.
     * @returns {string} The cleaned text.
     */
    const cleanText = (text: string) => {
        if (!text) return "";

        // 1. Remove specific emojis used in source data
        let cleaned = text.replace(/✅|❌|📝|💡/g, '');

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
     * Extracts only English text from the summary, filtering out Hindi lines.
     * @param {string} summary - The mixed-language summary.
     * @returns {string} English-only summary.
     */
    const getEnglishSummary = (summary: string) => {
        if (!summary) return "";
        return summary.split('\n')
            .filter(line => {
                const trimmed = line.trim();
                // Regex range for Devanagari script
                return !/[\u0900-\u097F]/.test(trimmed) && !trimmed.startsWith('सही उत्तर');
            })
            .join('\n')
            .trim();
    };

    /**
     * Formats markdown-style bold text (**text**) into HTML strong tags.
     * @param {string} content - The text content.
     * @returns {React.ReactNode[]} Array of elements.
     */
    const formatContent = (content: string) => {
        return content.split('\n').map((line, i) => {
            if (!line.trim()) return <br key={i} />;

            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
                <p key={i} className="mb-2 last:mb-0">
                    {parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return (
                                <strong key={j} className="font-bold text-gray-900">
                                    {part.slice(2, -2)}
                                </strong>
                            );
                        }
                        return part;
                    })}
                </p>
            );
        });
    };

    const englishSummary = explanation.summary ? getEnglishSummary(explanation.summary) : null;

    return (
        <div
            className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out font-poppins selectable-text"
            style={{ fontSize: zoomLevel ? `${zoomLevel}rem` : undefined }}
        >
            {englishSummary && (
                <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm border-l-4 border-l-indigo-500">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Answer</h3>
                    <p className="font-bold text-indigo-700 text-[1em] whitespace-pre-line">
                        {englishSummary}
                    </p>
                </div>
            )}

            {/* 1. Correct Answer Analysis - Green Theme */}
            {explanation.analysis_correct && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-[0.95em]">
                        <h4 className="font-bold text-green-800 mb-1.5">Why this is correct</h4>
                        <div className="text-gray-700 leading-relaxed">{formatContent(cleanText(explanation.analysis_correct))}</div>
                    </div>
                </div>
            )}

            {/* 2. Incorrect Options Analysis - Red Theme */}
            {explanation.analysis_incorrect && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="text-[0.95em]">
                        <h4 className="font-bold text-red-800 mb-1.5">Why other options are incorrect</h4>
                        <div className="text-gray-700 leading-relaxed">{formatContent(cleanText(explanation.analysis_incorrect))}</div>
                    </div>
                </div>
            )}

            {/* 3. Key Takeaway - Blue Theme */}
            {explanation.conclusion && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 items-start">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-[0.95em]">
                        <h4 className="font-bold text-blue-800 mb-1.5">Key Takeaway</h4>
                        <div className="text-gray-700 leading-relaxed">{formatContent(cleanText(explanation.conclusion))}</div>
                    </div>
                </div>
            )}

            {/* 4. Interesting Fact - Yellow Theme */}
            {explanation.fact && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3 items-start">
                    <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-[0.95em]">
                        <h4 className="font-bold text-yellow-800 mb-1.5">Did you know?</h4>
                        <div className="text-yellow-900 leading-relaxed">{formatContent(cleanText(explanation.fact))}</div>
                    </div>
                </div>
            )}
        </div>
    );
}
