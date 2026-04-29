import { create } from 'zustand';
import { Idiom, OneWord, InitialFilters } from '../../../types/models';
import { SynonymWord } from '../types';

export type FlashcardType = 'idioms' | 'ows' | 'synonyms' | null;

interface FlashcardState {
  // Common state
  status: 'idle' | 'active' | 'complete';
  type: FlashcardType;
  currentIndex: number;
  filters: InitialFilters | null;
  mode?: 'basic' | 'review';

  // Domain specific data
  idioms: Idiom[];
  ows: OneWord[];
  synonyms: SynonymWord[];

  // Actions
  startIdioms: (data: Idiom[], filters?: InitialFilters) => void;
  startOWS: (data: OneWord[], filters?: InitialFilters, mode?: 'basic' | 'review') => void;
  startSynonyms: (data: SynonymWord[], filters?: InitialFilters) => void;

  // Navigation
  nextCard: () => void;
  prevCard: () => void;
  jumpToCard: (index: number) => void;

  // Lifecycle
  finishSession: () => void;
  resetSession: () => void;
}

export const useFlashcardStore = create<FlashcardState>((set, get) => ({
  status: 'idle',
  type: null,
  currentIndex: 0,
  filters: null,
  idioms: [],
  ows: [],
  synonyms: [],

  startIdioms: (data, filters) => set({
    status: 'active',
    type: 'idioms',
    idioms: data,
    filters: filters || null,
    currentIndex: 0
  }),

  startOWS: (data, filters, mode = 'review') => set({
    status: 'active',
    type: 'ows',
    ows: data,
    filters: filters || null,
    mode,
    currentIndex: 0
  }),

  startSynonyms: (data, filters) => set({
    status: 'active',
    type: 'synonyms',
    synonyms: data,
    filters: filters || null,
    currentIndex: 0
  }),

  nextCard: () => set((state) => {
    let maxIndex = 0;
    if (state.type === 'idioms') maxIndex = state.idioms.length;
    else if (state.type === 'ows') maxIndex = state.ows.length;
    else if (state.type === 'synonyms') maxIndex = state.synonyms.length;

    const nextIndex = state.currentIndex + 1;
    if (nextIndex >= maxIndex) {
      return state; // Stay on last card until explicitly finished
    }
    return { currentIndex: nextIndex };
  }),

  prevCard: () => set((state) => ({
    currentIndex: Math.max(0, state.currentIndex - 1)
  })),

  jumpToCard: (index) => set({
    currentIndex: index
  }),

  finishSession: () => set({
    status: 'complete'
  }),

  resetSession: () => set({
    status: 'idle',
    type: null,
    currentIndex: 0,
    filters: null,
    idioms: [],
    ows: [],
    synonyms: []
  })
}));
