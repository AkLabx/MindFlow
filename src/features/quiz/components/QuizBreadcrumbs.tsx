import React from 'react';
import { InitialFilters } from '../types';

/**
 * Breadcrumb navigation for the active quiz session.
 *
 * Displays the current path/context (Home / Subject / Topic) to help users keep track of where they are.
 * Allows quick navigation back to the Dashboard.
 *
 * @param {object} props - The component props.
 * @param {InitialFilters} props.filters - The active filters defining the current context.
 * @param {function} props.onGoHome - Callback to navigate home.
 * @returns {JSX.Element} The rendered breadcrumbs.
 */
export function QuizBreadcrumbs({ filters, onGoHome }: { filters: InitialFilters; onGoHome: () => void; }) {
    const activeSubjects = filters.subject.length > 0 ? filters.subject.join(', ') : 'All Subjects';
    const activeTopics = filters.topic.length > 0 ? filters.topic.join(', ') : null;

    return (
        <div className="flex items-center text-xs font-medium text-gray-400 mb-1 overflow-hidden whitespace-nowrap">
            <button 
                onClick={(e) => { e.preventDefault(); onGoHome(); }}
                className="hover:text-indigo-600 transition-colors mr-2"
            >
                Home
            </button>
            <span className="mr-2">/</span>
            <span className="text-gray-600 mr-2 truncate max-w-[100px]">{activeSubjects}</span>
            {activeTopics && (
                <>
                    <span className="mr-2">/</span>
                    <span className="text-indigo-600 truncate max-w-[150px]">{activeTopics}</span>
                </>
            )}
        </div>
    );
}
