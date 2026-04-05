import { useMemo } from 'react';
import { InitialFilters } from '../../../types/models';

export type OwsMetadata = {
    id: string;
    alphabet: string;
    examName: string;
    examYear: string;
    difficulty: string;
};

type FilterKeys = 'alphabet' | 'examName' | 'examYear' | 'difficulty';
const filterKeys: FilterKeys[] = ['alphabet', 'examName', 'examYear', 'difficulty'];

export function useOwsQuestionIndex(metadata: OwsMetadata[]) {
    return useMemo(() => {
        const index: Record<string, Record<string, Set<string>>> = {};

        filterKeys.forEach(key => {
            index[key] = {};
        });

        metadata.forEach(item => {
            filterKeys.forEach(key => {
                const value = item[key];
                if (!value) return;

                if (!index[key][value]) {
                    index[key][value] = new Set();
                }
                index[key][value].add(item.id);
            });
        });

        return index;
    }, [metadata]);
}

export function useOwsFilterCounts({
  metadata,
  selectedFilters,
  selectedAlphabet,
  index
}: {
  metadata: OwsMetadata[];
  selectedFilters: InitialFilters;
  selectedAlphabet: string | null;
  index: Record<string, Record<string, Set<string>>>;
}) {
  return useMemo(() => {
    const allCounts: Record<string, Record<string, number>> = {};

    for (const keyToCount of filterKeys) {
        let validIds: Set<string> | null = null;

        for (const otherKey of filterKeys) {
            if (otherKey === keyToCount) continue;

            const selected = otherKey === 'alphabet'
                ? (selectedAlphabet ? [selectedAlphabet] : [])
                : (selectedFilters[otherKey as keyof InitialFilters] as string[]);

            if (!selected || selected.length === 0) continue;

            const categoryIds = new Set<string>();
            selected.forEach(val => {
                const ids = index[otherKey]?.[val];
                if (ids) {
                    ids.forEach(id => categoryIds.add(id));
                }
            });

            if (validIds === null) {
                validIds = new Set(categoryIds);
            } else {
                const intersected = new Set<string>();
                validIds.forEach(id => {
                    if (categoryIds.has(id)) {
                        intersected.add(id);
                    }
                });
                validIds = intersected;
            }
            if (validIds && validIds.size === 0) break; // Optimization
        }

        const validQuestionIds = validIds;
        const counts: Record<string, number> = {};

        for (const [optionValue, questionIds] of Object.entries(index[keyToCount] || {})) {
            let count = 0;
            if (validQuestionIds === null) {
                count = questionIds.size;
            } else {
                questionIds.forEach(id => {
                    if (validQuestionIds.has(id)) {
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

    // Also calculate the total overall matched valid subset
    let finalValidIds: Set<string> | null = null;
    for (const otherKey of filterKeys) {
        const selected = otherKey === 'alphabet'
            ? (selectedAlphabet ? [selectedAlphabet] : [])
            : (selectedFilters[otherKey as keyof InitialFilters] as string[]);

        if (!selected || selected.length === 0) continue;

        const categoryIds = new Set<string>();
        selected.forEach(val => {
            const ids = index[otherKey]?.[val];
            if (ids) {
                ids.forEach(id => categoryIds.add(id));
            }
        });

        if (finalValidIds === null) {
            finalValidIds = new Set(categoryIds);
        } else {
            const intersected = new Set<string>();
            finalValidIds.forEach(id => {
                if (categoryIds.has(id)) {
                    intersected.add(id);
                }
            });
            finalValidIds = intersected;
        }
        if (finalValidIds && finalValidIds.size === 0) break;
    }

    const totalMatchingCount = finalValidIds === null ? metadata.length : finalValidIds.size;
    const finalMatchingIds = finalValidIds === null ? metadata.map(m => m.id) : Array.from(finalValidIds);

    return { counts: allCounts, totalMatchingCount, finalMatchingIds };
  }, [metadata, selectedFilters, selectedAlphabet, index]);
}
