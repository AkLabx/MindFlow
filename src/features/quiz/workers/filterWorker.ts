import { Question, InitialFilters, filterKeys, getQuestionValue } from '../types';

// Web Worker for calculating filter counts asynchronously
// This offloads the heavy O(N * 9) calculation from the main thread.

let cachedAllQuestions: Question[] = [];

self.onmessage = (e: MessageEvent<{ type: 'INIT' | 'CALCULATE', allQuestions?: Question[]; selectedFilters?: InitialFilters }>) => {
  const { type, allQuestions, selectedFilters } = e.data;

  if (type === 'INIT' && allQuestions) {
      cachedAllQuestions = allQuestions;
      return;
  }

  if (type === 'CALCULATE' && selectedFilters && cachedAllQuestions.length > 0) {
      const allCounts: { [key: string]: { [key: string]: number } } = {};

      for (const keyToCount of filterKeys) {
          // Temporarily clear the filter for the category we are counting
          // This ensures we see counts for all options in this category, given the *other* selections.
          const contextualFilters = { ...selectedFilters, [keyToCount]: [] as string[] };

          // Filter questions based on all *other* active filters
          const tempFilteredQuestions = cachedAllQuestions.filter(q => {
              return filterKeys.every(key => {
                  // Skip the current category being counted
                  if (key === keyToCount) return true;

                  const selected = contextualFilters[key as keyof InitialFilters];
                  if (!selected || selected.length === 0) return true;

                  const value = getQuestionValue(q, key as keyof InitialFilters);
                  if (key === 'tags' && Array.isArray(value)) {
                      return selected.some(tag => value.includes(tag));
                  }
                  if (typeof value === 'string') {
                      return (selected as string[]).includes(value);
                  }
                  return false;
              });
          });

          // Count occurrences of each value for the current category in the filtered set
          const counts: { [key: string]: number } = {};
          for (let i = 0; i < tempFilteredQuestions.length; i++) {
              const value = getQuestionValue(tempFilteredQuestions[i], keyToCount as keyof InitialFilters);
              if (Array.isArray(value)) {
                  // Optimized: Standard for-loop avoids closure allocation in this tight hot loop
                  for (let j = 0; j < value.length; j++) {
                      const tag = value[j];
                      counts[tag] = (counts[tag] || 0) + 1;
                  }
              } else if (value) {
                  counts[value as string] = (counts[value as string] || 0) + 1;
              }
          }
          allCounts[keyToCount] = counts;
      }

      self.postMessage(allCounts);
  }
};
