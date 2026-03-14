import { Question, InitialFilters, QuizMode, SavedQuiz, QuizHistoryRecord } from '../features/quiz/types';
import { QuizState } from '../features/quiz/types/store';

import { supabase } from './supabase';
import { syncService } from './syncService';

export interface SynonymInteraction {
  wordId: string;
  wordString: string;
  masteryLevel: 'new' | 'familiar' | 'mastered';
  dailyChallengeScore?: number;
  gamificationScore?: number;
  viewedExplanation?: boolean;
  viewedWordFamily?: boolean;
  lastInteractedAt: string;
}



const DB_NAME = 'MindFlowDB';
const DB_VERSION = 5;
const STORE_NAME = 'saved_quizzes';
const HISTORY_STORE_NAME = 'quiz_history';
const BOOKMARKS_STORE_NAME = 'global_bookmarks';
const SYNONYM_STORE_NAME = 'synonym_interactions';
const CHAT_CONVERSATIONS_STORE = 'chat_conversations';
const CHAT_MESSAGES_STORE = 'chat_messages';
const ACTIVE_SESSION_STORE = 'active_test_session';

/**
 * Opens a connection to the IndexedDB database.
 *
 * This helper function handles the logic for opening the database and upgrading the schema
 * if necessary. It ensures the object store exists.
 *
 * @returns {Promise<IDBDatabase>} A promise that resolves to the opened IDBDatabase instance.
 */
const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(HISTORY_STORE_NAME)) {
                db.createObjectStore(HISTORY_STORE_NAME, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(BOOKMARKS_STORE_NAME)) {
                db.createObjectStore(BOOKMARKS_STORE_NAME, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(SYNONYM_STORE_NAME)) {
                db.createObjectStore(SYNONYM_STORE_NAME, { keyPath: 'wordId' });
            }
            if (!db.objectStoreNames.contains(CHAT_CONVERSATIONS_STORE)) {
                db.createObjectStore(CHAT_CONVERSATIONS_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(CHAT_MESSAGES_STORE)) {
                const messageStore = db.createObjectStore(CHAT_MESSAGES_STORE, { keyPath: 'id' });
                messageStore.createIndex('conversation_id', 'conversation_id', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            reject((event.target as IDBOpenDBRequest).error);
        };
    });
};

/**
 * Database abstraction layer for local storage using IndexedDB.
 *
 * Provides methods to CRUD (Create, Read, Update, Delete) quiz data locally
 * in the user's browser, allowing for offline persistence of quiz sessions.
 */
export const db = {
    /**
     * Clears all user-related data (Quizzes, History, Bookmarks, Synonyms) from IndexedDB.
     */
    clearAllUserData: async (): Promise<void> => {
        await Promise.all([
            db.clearQuizzes(),
            db.clearQuizHistory(),
            db.clearBookmarks(),
            db.clearSynonymInteractions()
        ]);
    },

    /**
     * Enterprise: Saves active test session state for offline resilience
     */
    saveActiveSession: async (sessionId: string, state: any): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(ACTIVE_SESSION_STORE, 'readwrite');
            const store = transaction.objectStore(ACTIVE_SESSION_STORE);
            const request = store.put({ sessionId, state, updatedAt: new Date().toISOString() });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Enterprise: Retrieves active test session
     */
    getActiveSession: async (sessionId: string): Promise<any> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(ACTIVE_SESSION_STORE, 'readonly');
            const store = transaction.objectStore(ACTIVE_SESSION_STORE);
            const request = store.get(sessionId);

            request.onsuccess = () => resolve(request.result?.state || null);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Enterprise: Clears active session upon successful submit
     */
    clearActiveSession: async (sessionId: string): Promise<void> => {
         const dbInstance = await openDB();
         return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(ACTIVE_SESSION_STORE, 'readwrite');
            const store = transaction.objectStore(ACTIVE_SESSION_STORE);
            const request = store.delete(sessionId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    /** Background push helper to sync to Supabase if logged in */
    _pushToSupabase: async (type: 'quiz' | 'history' | 'bookmark' | 'synonym_interaction', data: any) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;
            if (type === 'quiz') await syncService.pushSavedQuiz(session.user.id, data);
            else if (type === 'history') await syncService.pushQuizHistory(session.user.id, data);
            else if (type === 'bookmark') await syncService.pushBookmark(session.user.id, data);
            else if (type === 'synonym_interaction') await syncService.pushSynonymInteraction(session.user.id, data);
        } catch (e) {
            console.error('Background push error:', e);
        }
    },

    /** Background delete helper to sync deletion to Supabase if logged in */
    _deleteFromSupabase: async (type: 'quiz' | 'bookmark', id: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;
            if (type === 'quiz') await syncService.deleteSavedQuiz(session.user.id, id);
            else if (type === 'bookmark') await syncService.removeBookmark(session.user.id, id);
        } catch (e) {
            console.error('Background delete error:', e);
        }
    },

    /**
     * Saves a new quiz to the database.
     *
     * @param {SavedQuiz} quiz - The quiz object to save.
     * @returns {Promise<void>} A promise that resolves when the quiz is successfully saved.
     */
    saveQuiz: async (quiz: SavedQuiz): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(quiz);

            request.onsuccess = () => {
                db._pushToSupabase('quiz', quiz);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Retrieves all saved quizzes from the database.
     *
     * @returns {Promise<SavedQuiz[]>} A promise that resolves to an array of saved quizzes.
     */
    clearQuizzes: async (): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    getQuizzes: async (): Promise<SavedQuiz[]> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Retrieves a specific quiz by its ID.
     *
     * @param {string} id - The unique identifier of the quiz to retrieve.
     * @returns {Promise<SavedQuiz | undefined>} A promise that resolves to the quiz object if found, or undefined.
     */
    getQuiz: async (id: string): Promise<SavedQuiz | undefined> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Deletes a quiz from the database by its ID.
     *
     * @param {string} id - The unique identifier of the quiz to delete.
     * @returns {Promise<void>} A promise that resolves when the quiz is successfully deleted.
     */
    deleteQuiz: async (id: string): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => {
                db._deleteFromSupabase('quiz', id);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Updates the progress state of an existing quiz.
     *
     * @param {string} id - The unique identifier of the quiz to update.
     * @param {QuizState} state - The new state object to save.
     * @returns {Promise<void>} A promise that resolves when the update is complete.
     */
    updateQuizProgress: async (id: string, state: QuizState): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // First get the quiz
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const quiz = getRequest.result as SavedQuiz;
                if (quiz) {
                    // Update state
                    quiz.state = state;
                    const putRequest = store.put(quiz);
                    putRequest.onsuccess = () => {
                        db._pushToSupabase('quiz', quiz);
                        resolve();
                    };
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    reject(new Error(`Quiz with id ${id} not found`));
                }
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    },

    /**
     * Updates the name of an existing quiz.
     *
     * @param {string} id - The unique identifier of the quiz to rename.
     * @param {string} name - The new name for the quiz.
     * @returns {Promise<void>} A promise that resolves when the name is updated.
     */
    updateQuizName: async (id: string, name: string): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const quiz = getRequest.result as SavedQuiz;
                if (quiz) {
                    quiz.name = name;
                    const putRequest = store.put(quiz);
                    putRequest.onsuccess = () => {
                        db._pushToSupabase('quiz', quiz);
                        resolve();
                    };
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    reject(new Error(`Quiz with id ${id} not found`));
                }
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    },

    /**
     * Saves a quiz history record to the database.
     *
     * @param {QuizHistoryRecord} record - The history record to save.
     * @returns {Promise<void>}
     */
    saveQuizHistory: async (record: QuizHistoryRecord): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(HISTORY_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(HISTORY_STORE_NAME);
            const request = store.put(record);

            request.onsuccess = () => {
                db._pushToSupabase('history', record);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Retrieves all quiz history records.
     *
     * @returns {Promise<QuizHistoryRecord[]>}
     */



    /**
     * Retrieves all quiz history records.
     *
     * @returns {Promise<QuizHistoryRecord[]>}
     */
    /**
     * Clears all quiz history records.
     *
     * @returns {Promise<void>}
     */
    clearQuizHistory: async (): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(HISTORY_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(HISTORY_STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    getQuizHistory: async (): Promise<QuizHistoryRecord[]> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(HISTORY_STORE_NAME, 'readonly');
            const store = transaction.objectStore(HISTORY_STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Saves a global bookmark (entire question object).
     *
     * @param {Question} question - The question object to bookmark.
     * @returns {Promise<void>}
     */
    saveBookmark: async (question: Question): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(BOOKMARKS_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(BOOKMARKS_STORE_NAME);
            const request = store.put(question);

            request.onsuccess = () => {
                db._pushToSupabase('bookmark', question);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Removes a question from global bookmarks by its ID.
     *
     * @param {string} id - The ID of the question to remove.
     * @returns {Promise<void>}
     */
    removeBookmark: async (id: string): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(BOOKMARKS_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(BOOKMARKS_STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => {
                db._deleteFromSupabase('bookmark', id);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Retrieves all global bookmarks.
     *
     * @returns {Promise<Question[]>}
     */



    /**
     * Retrieves all global bookmarks.
     *
     * @returns {Promise<Question[]>}
     */
    /**
     * Clears all global bookmarks.
     *
     * @returns {Promise<void>}
     */
    clearBookmarks: async (): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(BOOKMARKS_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(BOOKMARKS_STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },


    /**
     * Saves a synonym interaction.
     */
    saveSynonymInteraction: async (interaction: SynonymInteraction): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(SYNONYM_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(SYNONYM_STORE_NAME);
            const request = store.put(interaction);

            request.onsuccess = () => {
                db._pushToSupabase('synonym_interaction', interaction);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Retrieves all synonym interactions.
     */
    getAllSynonymInteractions: async (): Promise<SynonymInteraction[]> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(SYNONYM_STORE_NAME, 'readonly');
            const store = transaction.objectStore(SYNONYM_STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Clears all synonym interactions.
     */
    clearSynonymInteractions: async (): Promise<void> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(SYNONYM_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(SYNONYM_STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    getAllBookmarks: async (): Promise<Question[]> => {
        const dbInstance = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction(BOOKMARKS_STORE_NAME, 'readonly');
            const store = transaction.objectStore(BOOKMARKS_STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
};

// --- AI Chat ---
export interface AIChatConversation {
  id: string; // UUID
  title: string;
  created_at: string; // ISO string
  updated_at: string;
}

export interface AIChatMessage {
  id: string; // UUID
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export const saveChatConversation = async (conversation: AIChatConversation): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CHAT_CONVERSATIONS_STORE], 'readwrite');
        const store = transaction.objectStore(CHAT_CONVERSATIONS_STORE);
        const request = store.put(conversation);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getChatConversations = async (): Promise<AIChatConversation[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CHAT_CONVERSATIONS_STORE], 'readonly');
        const store = transaction.objectStore(CHAT_CONVERSATIONS_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
             // Sort by updated_at descending
             const conversations = (request.result as AIChatConversation[]).sort((a, b) =>
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
             );
             resolve(conversations);
        };
        request.onerror = () => reject(request.error);
    });
};

export const deleteChatConversation = async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CHAT_CONVERSATIONS_STORE, CHAT_MESSAGES_STORE], 'readwrite');

        // Delete conversation
        const convStore = transaction.objectStore(CHAT_CONVERSATIONS_STORE);
        convStore.delete(id);

        // Delete associated messages using the index
        const msgStore = transaction.objectStore(CHAT_MESSAGES_STORE);
        const index = msgStore.index('conversation_id');
        const request = index.openCursor(IDBKeyRange.only(id));

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const saveChatMessage = async (message: AIChatMessage): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CHAT_MESSAGES_STORE], 'readwrite');
        const store = transaction.objectStore(CHAT_MESSAGES_STORE);
        const request = store.put(message);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getChatMessages = async (conversationId: string): Promise<AIChatMessage[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CHAT_MESSAGES_STORE], 'readonly');
        const store = transaction.objectStore(CHAT_MESSAGES_STORE);
        const index = store.index('conversation_id');
        const request = index.getAll(conversationId);

        request.onsuccess = () => {
             // Sort by created_at ascending
             const messages = (request.result as AIChatMessage[]).sort((a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
             );
             resolve(messages);
        };
        request.onerror = () => reject(request.error);
    });
};
