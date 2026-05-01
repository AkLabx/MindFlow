import { create } from 'zustand';
import { Idiom, OneWord, InitialFilters } from '../../../types/models';
import { SynonymWord } from '../types';

export type FlashcardType = 'idioms' | 'ows' | 'synonyms' | null;

export interface SwipeStats {
  mastered: number;
  tricky: number;
  review: number;
  clueless: number;
  known: number;
  unknown: number;
}

interface FlashcardState {
  // Common state
  status: 'idle' | 'active' | 'complete';
  type: FlashcardType;
  currentIndex: number;
  filters: InitialFilters | null;
  mode?: 'basic' | 'review';
  swipeStats: SwipeStats;

  // Domain specific data
  idioms: Idiom[];
  ows: OneWord[];
  synonyms: SynonymWord[];

  // Actions
  startIdioms: (data: Idiom[], filters?: InitialFilters, mode?: 'basic' | 'review') => void;
  startOWS: (data: OneWord[], filters?: InitialFilters, mode?: 'basic' | 'review') => void;
  startSynonyms: (data: SynonymWord[], filters?: InitialFilters) => void;

  // Navigation
  nextCard: () => void;
  prevCard: () => void;
  jumpToCard: (index: number) => void;
  updateSwipeStats: (key: keyof SwipeStats, delta: number) => void;

  // Lifecycle
  finishSession: () => void;
  resetSession: () => void;
}

const defaultSwipeStats: SwipeStats = { mastered: 0, tricky: 0, review: 0, clueless: 0, known: 0, unknown: 0 };

export const useFlashcardStore = create<FlashcardState>((set, get) => ({
  status: 'idle',
  type: null,
  currentIndex: 0,
  filters: null,
  swipeStats: { ...defaultSwipeStats },
  idioms: [],
  ows: [],
  synonyms: [],

  startIdioms: (data, filters, mode = 'review') => set({
    status: 'active',
    type: 'idioms',
    idioms: data,
    filters: filters || null,
    mode,
    swipeStats: { ...defaultSwipeStats },
    currentIndex: 0
  }),

  startOWS: (data, filters, mode = 'review') => set({
    status: 'active',
    type: 'ows',
    ows: data,
    filters: filters || null,
    mode,
    swipeStats: { ...defaultSwipeStats },
    currentIndex: 0
  }),

  startSynonyms: (data, filters) => set({
    status: 'active',
    type: 'synonyms',
    synonyms: data,
    filters: filters || null,
    swipeStats: { ...defaultSwipeStats },
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

  updateSwipeStats: (key, delta) => set((state) => ({
    swipeStats: { ...state.swipeStats, [key]: Math.max(0, state.swipeStats[key] + delta) }
  })),

  finishSession: () => set({
    status: 'complete'
  }),

  resetSession: () => set({
    status: 'idle',
    type: null,
    currentIndex: 0,
    filters: null,
    swipeStats: { ...defaultSwipeStats },
    idioms: [],
    ows: [],
    synonyms: []
  })
}));
