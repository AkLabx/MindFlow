import { queryClient } from '../../../lib/queryClient';
import { db } from '../../../lib/db';
import { create } from 'zustand';
import { Question } from '../types';
import { useSyncStore } from './useSyncStore';

interface BookmarkState {
  bookmarks: string[];

  // Actions
  toggleBookmark: (question: Question) => void;
  loadBookmarks: (bookmarks: string[]) => void;
  resetStore: () => void;
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: [],

  toggleBookmark: (question) => set((state) => {
    const isBookmarked = state.bookmarks.includes(question.id) || (Boolean(question.v1_id) && state.bookmarks.includes(question.v1_id!));

    if (isBookmarked) {
      // Remove from global bookmarks db
      db.removeBookmark(question.id);
      if (question.v1_id) {
        db.removeBookmark(question.v1_id);
      }
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-bookmark-count'] });
      useSyncStore.getState().addEvent({
        type: 'bookmark_toggled',
        payload: { questionId: question.id, v1Id: question.v1_id, isBookmarked: false }
      });

      return {
        bookmarks: state.bookmarks.filter(id => id !== question.id && id !== question.v1_id)
      };
    } else {
      // Add to global bookmarks db
      db.saveBookmark(question);
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-bookmark-count'] });
      useSyncStore.getState().addEvent({
        type: 'bookmark_toggled',
        payload: { questionId: question.id, question, isBookmarked: true }
      });

      return {
        bookmarks: [...state.bookmarks, question.id]
      };
    }
  }),

  loadBookmarks: (bookmarks) => set({
    bookmarks
  }),

  resetStore: () => set({ bookmarks: [] })
}));
