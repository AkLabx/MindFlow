import React from 'react';
import { FilterOptions, QuestionFilterParams } from '../types/questionBuilder.types';

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

    return (
        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <select
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                value={params.subject || ''}
                onChange={e => handleChange('subject', e.target.value || undefined)}
                disabled={isLoading}
            >
                <option value="">All Subjects</option>
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
                <option value="">All Topics</option>
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
                <option value="">All Difficulties</option>
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
                <option value="">All Exams</option>
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
                <option value="">All Years</option>
                {options.examYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                ))}
            </select>

            {(params.subject || params.topic || params.difficulty || params.examName || params.examYear) && (
                <button
                    type="button"
                    onClick={() => onChange({ search: params.search })}
                    className="px-3 py-1.5 text-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
                >
                    Clear Filters
                </button>
            )}
        </div>
    );
};
