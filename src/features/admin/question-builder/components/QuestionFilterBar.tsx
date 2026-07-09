import React from 'react';
import { FilterOptions, QuestionFilterParams } from '../types/questionBuilder.types';
import { X } from 'lucide-react';

interface Props {
    options: FilterOptions;
    params: QuestionFilterParams;
    onChange: (params: QuestionFilterParams) => void;
    isLoading: boolean;
}

export const QuestionFilterBar: React.FC<Props> = ({ options, params, onChange, isLoading }) => {
    const handleChange = (key: keyof QuestionFilterParams, value: string | number | undefined) => {
        onChange({ ...params, [key]: value });
    };

    const removeFilter = (key: keyof QuestionFilterParams) => {
        onChange({ ...params, [key]: undefined });
    };

    const hasActiveFilters = Boolean(params.subject || params.topic || params.difficulty || params.examName || params.examYear);

    return (
        <div className="flex flex-col border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            {/* Active Filter Chips */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1">
                    {params.subject && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                            Subject: {params.subject}
                            <button onClick={() => removeFilter('subject')} className="hover:text-indigo-900 dark:hover:text-indigo-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}
                    {params.topic && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                            Topic: {params.topic}
                            <button onClick={() => removeFilter('topic')} className="hover:text-indigo-900 dark:hover:text-indigo-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}
                    {params.difficulty && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                            Diff: {params.difficulty}
                            <button onClick={() => removeFilter('difficulty')} className="hover:text-indigo-900 dark:hover:text-indigo-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}
                    {params.examName && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                            Exam: {params.examName}
                            <button onClick={() => removeFilter('examName')} className="hover:text-indigo-900 dark:hover:text-indigo-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}
                    {params.examYear && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                            Year: {params.examYear}
                            <button onClick={() => removeFilter('examYear')} className="hover:text-indigo-900 dark:hover:text-indigo-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => onChange({ search: params.search })}
                        className="px-2 py-1 text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                    >
                        Clear All
                    </button>
                </div>
            )}

            {/* Filter Selectors */}
            <div className="flex flex-wrap gap-2 p-4 pt-2">
                <select
                    className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    value={params.subject || ''}
                    onChange={e => handleChange('subject', e.target.value || undefined)}
                    disabled={isLoading}
                >
                    <option value="">Subject</option>
                    {options.subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                    ))}
                </select>

                <select
                    className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    value={params.topic || ''}
                    onChange={e => handleChange('topic', e.target.value || undefined)}
                    disabled={isLoading}
                >
                    <option value="">Topic</option>
                    {options.topics.map(topic => (
                        <option key={topic} value={topic}>{topic}</option>
                    ))}
                </select>

                <select
                    className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    value={params.difficulty || ''}
                    onChange={e => handleChange('difficulty', e.target.value || undefined)}
                    disabled={isLoading}
                >
                    <option value="">Difficulty</option>
                    {options.difficulties.map(diff => (
                        <option key={diff} value={diff}>{diff}</option>
                    ))}
                </select>

                <select
                    className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    value={params.examName || ''}
                    onChange={e => handleChange('examName', e.target.value || undefined)}
                    disabled={isLoading}
                >
                    <option value="">Exam</option>
                    {options.examNames.map(exam => (
                        <option key={exam} value={exam}>{exam}</option>
                    ))}
                </select>

                <select
                    className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    value={params.examYear || ''}
                    onChange={e => handleChange('examYear', e.target.value ? parseInt(e.target.value) : undefined)}
                    disabled={isLoading}
                >
                    <option value="">Year</option>
                    {options.examYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};
