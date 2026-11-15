import { Question, InitialFilters, filterKeys } from '../types';
import { buildQuestionIndex, QuestionIndex } from '../hooks/useQuestionIndex';

// Web Worker for calculating filter counts asynchronously using an inverted Set index.

let cachedAllQuestions: Question[] = [];
let cachedIndex: QuestionIndex = {};

self.onmessage = (e: MessageEvent<{ type: 'INIT' | 'CALCULATE'; allQuestions?: Question[]; selectedFilters?: InitialFilters }>) => {
  const { type, allQuestions, selectedFilters } = e.data;

  if (type === 'INIT' && allQuestions) {
    cachedAllQuestions = allQuestions;
    cachedIndex = buildQuestionIndex(allQuestions);
    return;
  }

  if (type === 'CALCULATE' && selectedFilters && cachedAllQuestions.length > 0) {
    const allCounts: { [key: string]: { [key: string]: number } } = {};

    for (const keyToCount of filterKeys) {
      let validIds: Set<string> | null = null;

      for (const otherKey of filterKeys) {
        if (otherKey === keyToCount) continue;

        const selected = selectedFilters[otherKey as keyof InitialFilters];
        if (!selected || selected.length === 0) continue;

        const categoryIds = new Set<string>();
        selected.forEach(val => {
          const ids = cachedIndex[otherKey]?.[val];
          if (ids) {
            ids.forEach(id => categoryIds.add(id));
          }
        });

        if (validIds === null) {
          validIds = new Set(categoryIds);
        } else {
          const intersected = new Set<string>();
          const [smaller, larger] = validIds.size <= categoryIds.size
            ? [validIds, categoryIds]
            : [categoryIds, validIds];
          smaller.forEach(id => {
            if (larger.has(id)) {
              intersected.add(id);
            }
          });
          validIds = intersected;
        }

        if (validIds.size === 0) break;
      }

      const counts: { [key: string]: number } = {};
      for (const [optionValue, questionIds] of Object.entries(cachedIndex[keyToCount] || {})) {
        let count = 0;
        if (validIds === null) {
          count = questionIds.size;
        } else {
          const [smaller, larger] = questionIds.size <= validIds.size
            ? [questionIds, validIds]
            : [validIds, questionIds];
          smaller.forEach(id => {
            if (larger.has(id)) {
              count++;
            }
          });
        }
        if (count > 0) {
          counts[optionValue] = count;
        }
      }
      allCounts[keyToCount] = counts;
    }

    self.postMessage(allCounts);
  }
};
