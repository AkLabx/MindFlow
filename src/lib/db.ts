import { Question, InitialFilters, QuizMode, SavedQuiz, QuizHistoryRecord } from '../features/quiz/types';
import { QuizState } from '../features/quiz/types/store';

const DB_NAME = 'MindFlowDB';
const DB_VERSION = 2;
const STORE_NAME = 'saved_quizzes';
const HISTORY_STORE_NAME = 'quiz_history';
const BOOKMARKS_STORE_NAME = 'global_bookmarks';

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
     * Saves a new quiz to the database.
     *
     * @param {SavedQuiz} quiz - The quiz object to save.
     * @returns {Promise<void>} A promise that resolves when the quiz is successfully saved.
     */
    saveQuiz: async (quiz: SavedQuiz): Promise<void> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(quiz);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Retrieves all saved quizzes from the database.
     *
     * @returns {Promise<SavedQuiz[]>} A promise that resolves to an array of saved quizzes.
     */
    getQuizzes: async (): Promise<SavedQuiz[]> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
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
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
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
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
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
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // First get the quiz
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const quiz = getRequest.result as SavedQuiz;
                if (quiz) {
                    // Update state
                    quiz.state = state;
                    const putRequest = store.put(quiz);
                    putRequest.onsuccess = () => resolve();
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
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const quiz = getRequest.result as SavedQuiz;
                if (quiz) {
                    quiz.name = name;
                    const putRequest = store.put(quiz);
                    putRequest.onsuccess = () => resolve();
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
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(HISTORY_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(HISTORY_STORE_NAME);
            const request = store.put(record);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Retrieves all quiz history records.
     *
     * @returns {Promise<QuizHistoryRecord[]>}
     */
    getQuizHistory: async (): Promise<QuizHistoryRecord[]> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(HISTORY_STORE_NAME, 'readonly');
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
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(BOOKMARKS_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(BOOKMARKS_STORE_NAME);
            const request = store.put(question);

            request.onsuccess = () => resolve();
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
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(BOOKMARKS_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(BOOKMARKS_STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Retrieves all global bookmarks.
     *
     * @returns {Promise<Question[]>}
     */
    getAllBookmarks: async (): Promise<Question[]> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(BOOKMARKS_STORE_NAME, 'readonly');
            const store = transaction.objectStore(BOOKMARKS_STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
};
