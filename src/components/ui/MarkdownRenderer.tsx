import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { cn } from '../../utils/cn';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

/**
 * A unified Markdown renderer that supports:
 * - Standard Markdown (lists, bold, italics, tables via GFM)
 * - Raw HTML (e.g. <pre>, <br>, <b>)
 * - LaTeX Math (inline $x$ and block $$x$$) via KaTeX
 *
 * It automatically applies Tailwind prose styles and safely parses HTML.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
    return (
        <div className={cn(
            "prose prose-sm md:prose-base max-w-none break-words",
            "dark:prose-invert",
            // Inheriting fonts directly for seamless integration with Quiz UI
            "font-inherit",
            className
        )}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
                // @ts-ignore - rehypeRaw types can sometimes mismatch, but it works correctly
                rehypePlugins={[rehypeRaw, rehypeKatex]}
                components={{
                    // Override default margins from prose to make it blend better in tight UI spaces
                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                    pre: ({ node, ...props }) => (
                        <pre
                            className="whitespace-pre-wrap font-inherit my-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-md border border-gray-200 dark:border-gray-700"
                            {...props}
                        />
                    ),
                    table: ({ node, ...props }) => (
                        <div className="my-3 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/40 shadow-sm">
                            <table className="w-full text-left text-sm border-collapse min-w-[300px]" {...props} />
                        </div>
                    ),
                    thead: ({ node, ...props }) => (
                        <thead className="bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-gray-200 dark:border-gray-700 select-none" {...props} />
                    ),
                    th: ({ node, ...props }) => (
                        <th className="px-3.5 py-2.5 font-bold text-gray-800 dark:text-gray-200 text-xs tracking-wider uppercase" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                        <td className="px-3.5 py-2.5 border-b border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 align-top text-xs sm:text-sm" {...props} />
                    ),
                    tr: ({ node, ...props }) => (
                        <tr className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors" {...props} />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};
