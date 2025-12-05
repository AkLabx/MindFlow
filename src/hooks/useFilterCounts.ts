import { useMemo } from 'react';
import { Question, InitialFilters, filterKeys, getQuestionValue } from '../features/quiz/types';

/**
 * Custom hook to calculate the count of available questions for each filter option.
 *
 * This hook computes the number of questions that match the current filter criteria,
 * allowing the UI to display counts next to filter options (e.g., "History (50)").
 * It intelligently calculates counts contextually, meaning selecting a Subject will update
 * the counts for Topics, but not for the Subject list itself (to show what else is available).
 *
 * @param {object} props - The hook properties.
 * @param {Question[]} props.allQuestions - The complete list of available questions.
 * @param {InitialFilters} props.selectedFilters - The currently selected filters.
 * @returns {{ [key: string]: { [key: string]: number } }} An object where keys are filter categories (e.g., 'subject') and values are objects mapping option names to counts.
 */
export function useFilterCounts({ allQuestions, selectedFilters }: {
  allQuestions: Question[];
  selectedFilters: InitialFilters;
}) {
  return useMemo(() => {
    const allCounts: { [key: string]: { [key: string]: number } } = {};

    for (const keyToCount of filterKeys) {
        // Temporarily clear the filter for the category we are counting
        // This ensures we see counts for all options in this category, given the *other* selections.
        const contextualFilters = { ...selectedFilters, [keyToCount]: [] as string[] };
        
        // Filter questions based on all *other* active filters
        const tempFilteredQuestions = allQuestions.filter(q => {
            return filterKeys.every(key => {
                // Skip the current category being counted
                if (key === keyToCount) return true;

                const selected = contextualFilters[key as keyof InitialFilters];
                if (selected.length === 0) return true;

                const value = getQuestionValue(q, key as keyof InitialFilters);
                if (key === 'tags' && Array.isArray(value)) {
                    return selected.some(tag => value.includes(tag));
                }
                if (typeof value === 'string') {
                    return selected.includes(value);
                }
                return false;
            });
        });

        // Count occurrences of each value for the current category in the filtered set
        const counts: { [key: string]: number } = {};
        for (const question of tempFilteredQuestions) {
            const value = getQuestionValue(question, keyToCount as keyof InitialFilters);
            if (Array.isArray(value)) {
                value.forEach(tag => {
                    counts[tag] = (counts[tag] || 0) + 1;
                });
            } else if (value) {
                counts[value] = (counts[value] || 0) + 1;
            }
        }
        allCounts[keyToCount] = counts;
    }
    return allCounts;
  }, [selectedFilters, allQuestions]);
}
